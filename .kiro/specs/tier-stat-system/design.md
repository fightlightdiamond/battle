# Design Document: Tier-Based Stat System

## Overview

Mở rộng hệ thống stat cho AFK Battle Engine với cấu trúc 2 tier. Tier 1 (Core Stats) bao gồm các chỉ số nền tảng: HP, ATK, DEF, SPD. Tier 2 (Combat Stats) bao gồm các chỉ số chiến đấu nâng cao tạo ra yếu tố bất ngờ: Critical, Armor Penetration, Lifesteal.

### Design Goals

1. **Backward Compatible**: Cards cũ vẫn hoạt động với default values
2. **Balanced**: Các stat có counterplay (armor vs armor pen)
3. **Extensible**: Dễ thêm stat mới trong tương lai (dodge, accuracy, skills)
4. **Testable**: Mọi formula đều có thể test bằng property-based testing

## Architecture

```
src/features/
├── cards/
│   ├── types/
│   │   ├── card.ts              # Updated Card interface
│   │   └── schemas.ts           # Updated Zod schemas
│   ├── components/
│   │   └── CardForm.tsx         # Updated form with new fields
│   └── services/
│       └── cardService.ts       # Migration logic
└── battle/
    └── engine/
        ├── core/
        │   └── types.ts         # Updated CombatantStats
        ├── calculations/
        │   └── DamageCalculator.ts  # Updated damage formula
        └── systems/
            ├── CombatSystem.ts  # Lifesteal logic
            └── TurnSystem.ts    # Speed-based turn order
```

## Components and Interfaces

### Updated Type Definitions

```typescript
// ============================================================================
// STAT CONSTANTS
// ============================================================================

export const DEFAULT_STATS = {
  // Core Stats (Tier 1)
  hp: 1000,
  atk: 100,
  def: 50,
  spd: 100,

  // Combat Stats (Tier 2)
  critChance: 5, // 5%
  critDamage: 150, // 150% = 1.5x multiplier
  armorPen: 0, // 0%
  lifesteal: 0, // 0%
} as const;

export const STAT_RANGES = {
  hp: { min: 1, max: Infinity },
  atk: { min: 0, max: Infinity },
  def: { min: 0, max: Infinity },
  spd: { min: 1, max: Infinity },
  critChance: { min: 0, max: 100 },
  critDamage: { min: 100, max: Infinity },
  armorPen: { min: 0, max: 100 },
  lifesteal: { min: 0, max: 100 },
} as const;

// ============================================================================
// CARD TYPES (Updated)
// ============================================================================

export interface Card {
  id: string;
  name: string;

  // Core Stats (Tier 1)
  hp: number;
  atk: number;
  def: number;
  spd: number;

  // Combat Stats (Tier 2)
  critChance: number;
  critDamage: number;
  armorPen: number;
  lifesteal: number;

  // Metadata
  imagePath: string | null;
  imageUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CardFormInput {
  name: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  critChance: number;
  critDamage: number;
  armorPen: number;
  lifesteal: number;
  image: File | null;
}

// ============================================================================
// COMBATANT STATS (Updated)
// ============================================================================

export interface CombatantStats {
  // Core Stats (Tier 1)
  readonly atk: number;
  readonly def: number;
  readonly spd: number;

  // Combat Stats (Tier 2)
  readonly critChance: number; // 0-100
  readonly critDamage: number; // 100+ (150 = 1.5x)
  readonly armorPen: number; // 0-100
  readonly lifesteal: number; // 0-100
}

// ============================================================================
// ATTACK RESULT (Updated)
// ============================================================================

export interface AttackResult {
  readonly attacker: Combatant;
  readonly defender: Combatant;
  readonly damage: number;
  readonly defenderNewHp: number;
  readonly attackerNewHp: number; // NEW: for lifesteal
  readonly isCritical: boolean;
  readonly isKnockout: boolean;
  readonly lifestealHeal: number; // NEW: amount healed
}
```

## Data Models

### Damage Calculation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DAMAGE CALCULATION FLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. BASE DAMAGE                                                         │
│     baseDamage = attacker.atk × skillMultiplier (default = 1)           │
│                                                                         │
│  2. ARMOR PENETRATION                                                   │
│     effectiveDef = defender.def × (1 - attacker.armorPen/100)           │
│                                                                         │
│  3. DEFENSE REDUCTION                                                   │
│     damage = baseDamage × (1 - effectiveDef/(effectiveDef + 100))       │
│                                                                         │
│  4. CRITICAL HIT                                                        │
│     if (random() < attacker.critChance/100)                             │
│       damage = damage × (attacker.critDamage/100)                       │
│       isCritical = true                                                 │
│                                                                         │
│  5. MINIMUM DAMAGE                                                      │
│     damage = max(1, floor(damage))                                      │
│                                                                         │
│  6. LIFESTEAL                                                           │
│     heal = damage × (attacker.lifesteal/100)                            │
│     attacker.hp = min(attacker.maxHp, attacker.hp + heal)               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Speed-Based Turn Order

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TURN ORDER DETERMINATION                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  AT BATTLE START:                                                       │
│    if (challenger.spd > opponent.spd)                                   │
│      firstAttacker = challenger                                         │
│    else if (opponent.spd > challenger.spd)                              │
│      firstAttacker = opponent                                           │
│    else                                                                 │
│      firstAttacker = random(challenger, opponent)                       │
│                                                                         │
│  SUBSEQUENT TURNS:                                                      │
│    Alternate between challenger and opponent                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Card Form Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CARD FORM                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  [Image Upload Area]                                                    │
│                                                                         │
│  Name: [________________]                                               │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════    │
│  CORE STATS (Tier 1)                                                    │
│  ───────────────────────────────────────────────────────────────────    │
│  HP:  [1000]     ATK: [100]     DEF: [50]      SPD: [100]               │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════    │
│  COMBAT STATS (Tier 2)                                                  │
│  ───────────────────────────────────────────────────────────────────    │
│  Crit Chance: [5]%      Crit Damage: [150]%                             │
│  Armor Pen:   [0]%      Lifesteal:   [0]%                               │
│                                                                         │
│  [Create Card]  [Cancel]                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Defense Reduction Formula

_For any_ attacker ATK value A and defender DEF value D, the damage after defense reduction SHALL equal A × (1 - D/(D + 100)).
**Validates: Requirements 1.4, 4.3**

### Property 2: Armor Penetration Reduces Effective Defense

_For any_ defender DEF value D and attacker armorPen value P, the effective defense SHALL equal D × (1 - P/100).
**Validates: Requirements 2.3, 4.2**

### Property 3: Critical Damage Multiplier

_For any_ base damage B and critDamage value C, when a critical hit occurs, the damage SHALL equal B × (C/100).
**Validates: Requirements 2.2, 4.4**

### Property 4: Lifesteal Healing

_For any_ final damage D and lifesteal value L, the heal amount SHALL equal D × (L/100), capped at maxHp.
**Validates: Requirements 2.4, 5.1, 5.2, 5.3**

### Property 5: Speed Determines First Attacker

_For any_ two combatants where challenger.spd > opponent.spd, the challenger SHALL be the first attacker.
**Validates: Requirements 3.2**

### Property 6: Minimum Damage Guarantee

_For any_ attack, the final damage SHALL be at least 1.
**Validates: Requirements 4.5**

### Property 7: Default Stats Applied

_For any_ Card created without explicit stat values, the Card SHALL have default values as defined in DEFAULT_STATS.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 7.1-7.6**

### Property 8: Stat Validation Ranges

_For any_ stat value, the validation SHALL reject values outside the defined STAT_RANGES.
**Validates: Requirements 9.1-9.6**

### Property 9: Card Serialization Round-Trip (Extended)

_For any_ valid Card with all stat fields, serializing to JSON and deserializing SHALL produce an equivalent Card.
**Validates: Requirements 8.1, 8.2 (from battle-engine-refactor)**

### Property 10: Migration Preserves Existing Data

_For any_ Card loaded from database without new stat fields, the Card SHALL have default values for missing fields while preserving existing HP and ATK.
**Validates: Requirements 10.1, 10.2, 10.3**

## Error Handling

| Error Scenario                               | Handling Strategy                        |
| -------------------------------------------- | ---------------------------------------- |
| Negative stat value                          | Clamp to minimum (0 or 1)                |
| Stat exceeds max (e.g., critChance > 100)    | Clamp to maximum                         |
| Missing stat in old card data                | Apply default value                      |
| Invalid stat type (string instead of number) | Validation error, reject save            |
| Division by zero in formulas                 | Use safe formula (DEF + 100 prevents /0) |

## Testing Strategy

### Property-Based Testing Library

- **fast-check** for TypeScript
- Minimum 100 iterations per property test
- Each property test tagged with: `**Feature: tier-stat-system, Property {number}: {property_text}**`

### Unit Tests

- Test individual stat calculations
- Test edge cases: 0 DEF, 100% crit chance, max lifesteal
- Test form validation

### Property-Based Tests

1. **DamageCalculator** - Properties 1, 2, 3, 6
2. **CombatSystem** - Property 4
3. **TurnSystem** - Property 5
4. **Card/Schema** - Properties 7, 8, 9, 10

### Test File Structure

```
src/features/
├── cards/
│   └── types/
│       └── schemas.test.ts      # Properties 7, 8, 9
├── battle/
│   └── engine/
│       ├── calculations/
│       │   └── DamageCalculator.test.ts  # Properties 1, 2, 3, 6
│       └── systems/
│           ├── CombatSystem.test.ts      # Property 4
│           └── TurnSystem.test.ts        # Property 5
```

## Migration Strategy

### Phase 1: Update Types (Non-Breaking)

1. Add new fields to Card interface with optional modifier
2. Add DEFAULT_STATS constant
3. Update Zod schemas with .default() for new fields

### Phase 2: Update Card Service

1. Add migration function to apply defaults to old cards
2. Update save/load to handle new fields

### Phase 3: Update Card Form

1. Add new form fields organized in sections
2. Pre-fill with default values

### Phase 4: Update Battle Engine

1. Update DamageCalculator with new formula
2. Update CombatSystem with lifesteal
3. Update TurnSystem with speed-based order

### Phase 5: Testing & Cleanup

1. Run all property tests
2. Verify backward compatibility
3. Update existing tests
