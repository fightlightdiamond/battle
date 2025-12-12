# Design Document: AFK Battle Engine

## Overview

AFK Battle Engine là core game engine cho card battle game. Engine xử lý combat tự động 1v1 giữa 2 cards, với khả năng mở rộng thêm skills và buffs trong tương lai. Kiến trúc sử dụng immutable state, event-driven design, và tách biệt hoàn toàn khỏi UI framework.

### Core Principles

1. **Immutability**: Mọi state change tạo ra state mới, không mutate
2. **Pure Functions**: Combat calculations là pure functions, dễ test
3. **Event-Driven**: Mọi action emit events cho UI sync
4. **Framework Agnostic**: Engine không phụ thuộc React/Vue/etc
5. **Extensible**: Dễ dàng thêm skills, buffs trong tương lai

## Architecture

```
src/features/battle/engine/
├── core/
│   ├── BattleState.ts         # Immutable state management
│   ├── BattleEngine.ts        # Main engine orchestrator
│   ├── EventBus.ts            # Pub/sub event system
│   └── types.ts               # Core type definitions
├── systems/
│   ├── CombatSystem.ts        # Combat logic (damage, attacks)
│   ├── TurnSystem.ts          # Turn management
│   ├── SkillSystem.ts         # Skill activation (future)
│   ├── BuffSystem.ts          # Buff/debuff management (future)
│   └── VictorySystem.ts       # Win/lose determination
├── entities/
│   ├── Combatant.ts           # Card entity in battle
│   └── Skill.ts               # Skill definitions (future)
├── calculations/
│   ├── DamageCalculator.ts    # Damage formulas
│   └── StageScaling.ts        # Stage difficulty scaling
├── utils/
│   ├── CombatLogger.ts        # Battle logging
│   └── Serializer.ts          # State serialization
└── adapters/
    ├── useBattleEngine.ts     # React hook adapter
    └── battleStoreAdapter.ts  # Zustand sync adapter
```

## Components and Interfaces

### Core Types

```typescript
// ============================================================================
// ENTITY TYPES
// ============================================================================

interface Combatant {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string | null;
  readonly baseStats: CombatantStats;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly buffs: readonly ActiveBuff[]; // Future: buff system
  readonly isDefeated: boolean;
}

interface CombatantStats {
  readonly atk: number;
  readonly def: number;
  readonly critRate: number; // Future: crit system
  readonly critDamage: number; // Future: crit system
}

// ============================================================================
// SKILL TYPES (Future Extension)
// ============================================================================

interface Skill {
  readonly id: string;
  readonly name: string;
  readonly cooldown: number;
  readonly currentCooldown: number;
  readonly effects: readonly SkillEffect[];
}

interface SkillEffect {
  readonly type: "damage" | "heal" | "buff" | "debuff";
  readonly value: number;
  readonly multiplier: number;
  readonly duration?: number;
}

// ============================================================================
// BUFF TYPES (Future Extension)
// ============================================================================

interface ActiveBuff {
  readonly id: string;
  readonly name: string;
  readonly type: "buff" | "debuff";
  readonly stat: keyof CombatantStats;
  readonly value: number;
  readonly isPercentage: boolean;
  readonly remainingDuration: number;
  readonly stackRule: "replace" | "add" | "max";
  readonly stacks: number;
}

// ============================================================================
// STATE TYPES
// ============================================================================

interface BattleState {
  readonly phase: BattlePhase;
  readonly turn: number;
  readonly challenger: Combatant;
  readonly opponent: Combatant;
  readonly currentAttacker: "challenger" | "opponent";
  readonly battleLog: readonly BattleLogEntry[];
  readonly result: BattleResult | null;
  readonly isAutoBattle: boolean;
}

type BattlePhase = "setup" | "ready" | "fighting" | "finished";

interface BattleResult {
  readonly winner: "challenger" | "opponent";
  readonly winnerName: string;
  readonly totalTurns: number;
}

interface BattleLogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly type: "attack" | "damage" | "skill" | "buff" | "victory";
  readonly message: string;
  readonly data?: AttackLogData | SkillLogData;
}

interface AttackLogData {
  readonly attackerId: string;
  readonly defenderId: string;
  readonly damage: number;
  readonly isCritical: boolean;
  readonly defenderRemainingHp: number;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

type GameEventType =
  | "battle_start"
  | "turn_start"
  | "turn_end"
  | "attack"
  | "damage_dealt"
  | "combatant_defeated"
  | "battle_end"
  | "state_changed";

interface GameEvent<T = unknown> {
  readonly type: GameEventType;
  readonly timestamp: number;
  readonly payload: T;
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

interface AttackResult {
  readonly attacker: Combatant;
  readonly defender: Combatant;
  readonly damage: number;
  readonly defenderNewHp: number;
  readonly isCritical: boolean;
  readonly isKnockout: boolean;
}

interface DamageCalculationInput {
  readonly attackerAtk: number;
  readonly defenderDef: number;
  readonly skillMultiplier?: number;
  readonly critRate?: number;
  readonly critDamage?: number;
}
```

### System Interfaces

```typescript
// ============================================================================
// ENGINE INTERFACE
// ============================================================================

interface BattleEngine {
  // State management
  getState(): BattleState;

  // Battle lifecycle
  initBattle(challenger: Combatant, opponent: Combatant): BattleState;
  startBattle(): BattleState;
  executeAttack(): AttackResult | null;
  resetBattle(): BattleState;

  // Auto battle
  toggleAutoBattle(): BattleState;

  // Event system
  subscribe(
    eventType: GameEventType,
    handler: (event: GameEvent) => void
  ): () => void;
  emit(event: GameEvent): void;

  // Serialization
  serialize(): string;
  deserialize(json: string): BattleState;
}

// ============================================================================
// SYSTEM INTERFACES
// ============================================================================

interface CombatSystem {
  calculateAttack(attacker: Combatant, defender: Combatant): AttackResult;
  applyDamage(combatant: Combatant, damage: number): Combatant;
}

interface TurnSystem {
  getNextAttacker(
    currentAttacker: "challenger" | "opponent"
  ): "challenger" | "opponent";
  advanceTurn(state: BattleState): BattleState;
}

interface VictorySystem {
  checkVictory(state: BattleState): BattleResult | null;
  isDefeated(combatant: Combatant): boolean;
}

interface BuffSystem {
  applyBuff(combatant: Combatant, buff: ActiveBuff): Combatant;
  removeBuff(combatant: Combatant, buffId: string): Combatant;
  tickBuffDurations(combatant: Combatant): Combatant;
  calculateEffectiveStats(combatant: Combatant): CombatantStats;
}

// ============================================================================
// CALCULATOR INTERFACES
// ============================================================================

interface DamageCalculator {
  calculate(input: DamageCalculationInput): number;
  calculateWithDef(atk: number, def: number): number;
  rollCritical(critRate: number): boolean;
  applyCritical(damage: number, critDamage: number): number;
}

interface StageScaling {
  scaleStats(baseStats: CombatantStats, stageNumber: number): CombatantStats;
}

// ============================================================================
// EVENT BUS INTERFACE
// ============================================================================

interface EventBus {
  subscribe<T>(
    eventType: GameEventType,
    handler: (event: GameEvent<T>) => void
  ): () => void;
  emit<T>(event: GameEvent<T>): void;
  clear(): void;
}
```

## Data Models

### State Flow

```
setup → ready → fighting → finished
  │       │        │          │
  │       │        │          └── result: challenger_wins | opponent_wins
  │       │        └── executeAttack() loop until victory
  │       └── startBattle() when both cards selected
  └── initBattle(challenger, opponent)
```

### Damage Formula

**Current (Simple):**

```
damage = ATK
```

**Future (With DEF):**

```
damage = ATK × (1 - DEF/(DEF + 100))
```

**Future (With Crit):**

```
damage = baseDamage × critMultiplier (if critical)
critMultiplier = critDamage (e.g., 1.5 = 150% damage)
```

### HP Bar Color Thresholds (Preserved from current)

| HP Percentage | Color  |
| ------------- | ------ |
| > 50%         | Green  |
| 25% - 50%     | Yellow |
| < 25%         | Red    |

### Critical Damage Threshold (Preserved from current)

```
isCritical = damage > (defender.maxHp × 0.3)
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: State Serialization Round-Trip

_For any_ valid BattleState, serializing to JSON and then deserializing SHALL produce an equivalent state object.
**Validates: Requirements 1.3, 1.4**

### Property 2: State Immutability

_For any_ combat action executed on a state S, the original state S SHALL remain unchanged and a new state S' SHALL be returned.
**Validates: Requirements 1.2**

### Property 3: Attack Damage Equals ATK

_For any_ attack where attacker has ATK value A, the damage dealt SHALL equal A.
**Validates: Requirements 2.3**

### Property 4: Turn Alternation

_For any_ sequence of N attacks, the attacker SHALL alternate between challenger and opponent. If attack N is by challenger, attack N+1 SHALL be by opponent.
**Validates: Requirements 2.3 (turn management)**

### Property 5: Defeated Combatant Detection

_For any_ combatant with currentHp <= 0, isDefeated SHALL be true.
**Validates: Requirements 2.4**

### Property 6: Victory Determination

_For any_ battle state where challenger.currentHp <= 0, result SHALL be opponent_wins. For opponent.currentHp <= 0, result SHALL be challenger_wins.
**Validates: Requirements 2.5**

### Property 7: HP Reduction Correctness

_For any_ attack dealing damage D to a combatant with HP H, the new HP SHALL equal max(0, H - D).
**Validates: Requirements 2.3**

### Property 8: Battle End Disables Attacks

_For any_ battle in 'finished' phase, executeAttack() SHALL return null and state SHALL remain unchanged.
**Validates: Requirements 2.5**

### Property 9: Combat Log Contains Attack Data

_For any_ attack action, the battle log SHALL contain an entry with attacker ID, defender ID, damage amount, and defender's remaining HP.
**Validates: Requirements 9.2**

### Property 10: Stage Scaling Formula

_For any_ base stat value B and stage number N, the scaled stat SHALL equal B × (1 + N × 0.1).
**Validates: Requirements 6.1**

### Property 11: Critical Damage Threshold

_For any_ attack where damage D > defender.maxHp × 0.3, the attack SHALL be marked as critical.
**Validates: Requirements 2.3 (critical detection)**

### Property 12: Buff Stat Calculation (Future)

_For any_ combatant with active buffs, effective stats SHALL equal base stats with all buff modifiers applied.
**Validates: Requirements 5.2**

### Property 13: Buff Duration Expiry (Future)

_For any_ buff with remainingDuration = 0, that buff SHALL be removed from active buffs list.
**Validates: Requirements 5.3**

## Error Handling

| Error Scenario                  | Handling Strategy                  |
| ------------------------------- | ---------------------------------- |
| Invalid state deserialization   | Throw error with details           |
| Attack when phase != 'fighting' | Return null, no state change       |
| Negative HP after damage        | Clamp to 0                         |
| Same card selected twice        | Reject selection                   |
| Invalid combatant data          | Validate on init, throw if invalid |

## Testing Strategy

### Property-Based Testing Library

- **fast-check** for TypeScript
- Minimum 100 iterations per property test
- Each property test tagged with: `**Feature: battle-engine-refactor, Property {number}: {property_text}**`

### Unit Tests

- Test individual system methods
- Test edge cases: 0 HP, max ATK, equal stats
- Test state transitions

### Property-Based Tests

1. **Serializer** - Property 1 (round-trip)
2. **BattleEngine** - Property 2 (immutability)
3. **CombatSystem** - Properties 3, 7, 11
4. **TurnSystem** - Property 4
5. **VictorySystem** - Properties 5, 6, 8
6. **CombatLogger** - Property 9
7. **StageScaling** - Property 10
8. **BuffSystem** - Properties 12, 13 (future)

### Test File Structure

```
src/features/battle/engine/
├── core/
│   ├── BattleState.ts
│   ├── BattleState.test.ts         # Properties 1, 2
│   ├── BattleEngine.ts
│   └── BattleEngine.test.ts        # Integration tests
├── systems/
│   ├── CombatSystem.ts
│   ├── CombatSystem.test.ts        # Properties 3, 7, 11
│   ├── TurnSystem.ts
│   ├── TurnSystem.test.ts          # Property 4
│   ├── VictorySystem.ts
│   ├── VictorySystem.test.ts       # Properties 5, 6, 8
│   ├── BuffSystem.ts
│   └── BuffSystem.test.ts          # Properties 12, 13 (future)
├── calculations/
│   ├── DamageCalculator.ts
│   ├── DamageCalculator.test.ts    # Property 3
│   ├── StageScaling.ts
│   └── StageScaling.test.ts        # Property 10
└── utils/
    ├── CombatLogger.ts
    ├── CombatLogger.test.ts        # Property 9
    ├── Serializer.ts
    └── Serializer.test.ts          # Property 1
```

## Migration Strategy

### Phase 1: Create Engine (Non-Breaking)

- Build engine alongside existing code
- Engine uses same interfaces as current battleService

### Phase 2: Adapter Integration

- Create adapters to connect engine with existing battleStore
- UI components continue using battleStore (no changes)

### Phase 3: Gradual Migration

- Replace battleService calls with engine calls via adapter
- Verify all tests pass

### Phase 4: Cleanup

- Remove old battleService code
- Update imports to use engine directly
