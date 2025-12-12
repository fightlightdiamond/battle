# Design Document: Card Battle System

## Overview

Card Battle System là module cho phép 2 card đấu với nhau theo cơ chế turn-based. Hệ thống tập trung vào trải nghiệm trực quan ấn tượng với HP bar động, animation tấn công, hiệu ứng damage, và màn hình victory hoành tráng.

### Core Flow

1. Admin chọn 2 card từ danh sách
2. Hệ thống hiển thị Combat Arena với 2 card đối mặt
3. Mỗi turn, card tấn công gây damage = ATK vào HP đối thủ
4. HP bar animate giảm dần, đổi màu theo %
5. Card nào HP <= 0 trước sẽ thua
6. Hiển thị Victory Screen với hiệu ứng

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Battle Feature                          │
├─────────────────────────────────────────────────────────────┤
│  Pages                                                       │
│  ├── BattleSetupPage (chọn card)                            │
│  └── BattleArenaPage (combat)                               │
├─────────────────────────────────────────────────────────────┤
│  Components                                                  │
│  ├── CardSelector (chọn card từ list)                       │
│  ├── BattleCard (hiển thị card trong arena)                 │
│  ├── HPBar (thanh máu với animation)                        │
│  ├── DamageNumber (số damage bay)                           │
│  ├── BattleLog (nhật ký trận đấu)                           │
│  ├── BattleControls (nút Attack, Auto, Pause)               │
│  └── VictoryOverlay (màn hình thắng/thua)                   │
├─────────────────────────────────────────────────────────────┤
│  Store (Zustand)                                             │
│  └── battleStore (state trận đấu)                           │
├─────────────────────────────────────────────────────────────┤
│  Services                                                    │
│  └── battleService (combat logic)                           │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Battle Store Interface

```typescript
interface BattleCard {
  id: string;
  name: string;
  atk: number;
  maxHp: number;
  currentHp: number;
  imageUrl: string | null;
}

interface BattleLogEntry {
  id: string;
  timestamp: number;
  type: "attack" | "damage" | "victory";
  message: string;
}

type BattlePhase = "setup" | "ready" | "fighting" | "finished";
type BattleResult = "card1_wins" | "card2_wins" | null;

interface BattleState {
  // State
  phase: BattlePhase;
  card1: BattleCard | null;
  card2: BattleCard | null;
  currentAttacker: "card1" | "card2";
  battleLog: BattleLogEntry[];
  result: BattleResult;
  isAutoBattle: boolean;

  // Actions
  selectCard1: (card: Card) => void;
  selectCard2: (card: Card) => void;
  startBattle: () => void;
  executeAttack: () => AttackResult;
  toggleAutoBattle: () => void;
  resetBattle: () => void;
}
```

### Battle Service Interface

```typescript
interface AttackResult {
  attacker: BattleCard;
  defender: BattleCard;
  damage: number;
  defenderNewHp: number;
  isCritical: boolean; // damage > 30% of defender's maxHp
  isKnockout: boolean; // defender HP <= 0
}

interface BattleService {
  // Tính toán damage và cập nhật HP
  calculateAttack(attacker: BattleCard, defender: BattleCard): AttackResult;

  // Kiểm tra kết thúc trận đấu
  checkBattleEnd(card1: BattleCard, card2: BattleCard): BattleResult;

  // Tính % HP để đổi màu HP bar
  calculateHpPercentage(currentHp: number, maxHp: number): number;

  // Xác định màu HP bar dựa trên %
  getHpBarColor(percentage: number): "green" | "yellow" | "red";
}
```

### Component Props

```typescript
// HPBar Component
interface HPBarProps {
  currentHp: number;
  maxHp: number;
  showFlash?: boolean;
  animationDuration?: number; // default 500ms
}

// BattleCard Component
interface BattleCardProps {
  card: BattleCard;
  position: "left" | "right";
  isAttacking?: boolean;
  isReceivingDamage?: boolean;
  isDanger?: boolean; // HP < 25%
  isWinner?: boolean;
  isLoser?: boolean;
}

// DamageNumber Component
interface DamageNumberProps {
  damage: number;
  isCritical: boolean;
  position: "left" | "right";
  onAnimationEnd: () => void;
}

// BattleControls Component
interface BattleControlsProps {
  phase: BattlePhase;
  isAutoBattle: boolean;
  onAttack: () => void;
  onToggleAuto: () => void;
  onNewBattle: () => void;
}

// VictoryOverlay Component
interface VictoryOverlayProps {
  winner: BattleCard;
  loser: BattleCard;
  onNewBattle: () => void;
}
```

## Data Models

### Battle State Flow

```
setup → ready → fighting → finished
  │       │        │          │
  │       │        │          └── result: card1_wins | card2_wins
  │       │        └── executeAttack() loop
  │       └── startBattle()
  └── selectCard1(), selectCard2()
```

### HP Bar Color Thresholds

| HP Percentage | Color  | CSS Class     |
| ------------- | ------ | ------------- |
| > 50%         | Green  | bg-green-500  |
| 25% - 50%     | Yellow | bg-yellow-500 |
| < 25%         | Red    | bg-red-500    |

### Animation Timings

| Animation         | Duration | Trigger              |
| ----------------- | -------- | -------------------- |
| HP Bar transition | 500ms    | HP changes           |
| Attack animation  | 400ms    | Card attacks         |
| Damage flash      | 200ms    | Card receives damage |
| Damage number fly | 800ms    | After attack         |
| Victory entrance  | 600ms    | Battle ends          |
| Auto-battle delay | 1500ms   | Between auto turns   |

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Card Selection Prevents Duplicates

_For any_ card in the system, if that card is already selected as card1, attempting to select it as card2 SHALL be rejected and the selection state SHALL remain unchanged.
**Validates: Requirements 1.4**

### Property 2: Battle Phase Transitions

_For any_ battle state, the phase SHALL be:

- 'setup' when no cards or only one card is selected
- 'ready' when both card1 and card2 are selected and different
- 'fighting' after startBattle() is called from 'ready' phase
- 'finished' when either card's HP reaches zero or below
  **Validates: Requirements 1.2, 1.3, 1.5**

### Property 3: Attack Damage Equals ATK

_For any_ attack action where attacker has ATK value A and defender has current HP value H, after the attack the defender's new HP SHALL equal max(0, H - A).
**Validates: Requirements 3.1, 3.2**

### Property 4: Turn Alternation

_For any_ sequence of N attacks in a battle, the attacker SHALL alternate between card1 and card2. If attack N is by card1, attack N+1 SHALL be by card2, and vice versa.
**Validates: Requirements 3.3**

### Property 5: HP Bar Color Thresholds

_For any_ HP percentage P calculated as (currentHp / maxHp \* 100):

- P > 50 → color SHALL be 'green'
- 25 ≤ P ≤ 50 → color SHALL be 'yellow'
- P < 25 → color SHALL be 'red'
  **Validates: Requirements 2.3, 4.1, 4.2, 4.3, 8.3**

### Property 6: HP Display Format

_For any_ card with currentHp C and maxHp M, the HP display string SHALL be formatted as "C / M" where both values are shown as integers.
**Validates: Requirements 4.4**

### Property 7: Victory Determination

_For any_ battle state where card1.currentHp <= 0, the result SHALL be 'card2_wins'. For any battle state where card2.currentHp <= 0, the result SHALL be 'card1_wins'.
**Validates: Requirements 5.1**

### Property 8: Battle End Disables Attacks

_For any_ battle in 'finished' phase, calling executeAttack() SHALL have no effect on the battle state (HP values, turn order, and log remain unchanged).
**Validates: Requirements 5.4**

### Property 9: Battle Log Format

_For any_ attack where attacker name is A, defender name is D, damage is X, and defender's remaining HP is R, the log entry SHALL contain the string "[A] attacks [D] for [X] damage" and "[D] has [R] HP remaining".
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 10: Auto-Battle Stops on Victory

_For any_ battle in auto-battle mode, when the phase transitions to 'finished', the isAutoBattle flag SHALL be set to false.
**Validates: Requirements 7.4**

### Property 11: Critical Damage Threshold

_For any_ attack where damage D and defender's maxHp is M, the attack SHALL be marked as critical if and only if D > (M \* 0.3).
**Validates: Requirements 8.2**

## Error Handling

| Error Scenario                     | Handling Strategy                           |
| ---------------------------------- | ------------------------------------------- |
| Same card selected twice           | Reject selection, show toast warning        |
| Attack when phase != 'fighting'    | Ignore action, no state change              |
| Invalid card data (missing ATK/HP) | Validate on selection, reject invalid cards |
| Auto-battle with no cards          | Disable auto-battle button until ready      |

## Testing Strategy

### Property-Based Testing Library

- **fast-check** (already installed in project)
- Minimum 100 iterations per property test
- Each property test tagged with: `**Feature: card-battle-system, Property {number}: {property_text}**`

### Unit Tests

- Test individual component rendering
- Test store actions in isolation
- Test edge cases: HP exactly at thresholds (25%, 50%), HP = 0, HP = 1

### Property-Based Tests

1. **battleService.calculateAttack()** - Property 3, 11
2. **battleService.getHpBarColor()** - Property 5
3. **battleService.checkBattleEnd()** - Property 7
4. **battleStore.selectCard()** - Property 1, 2
5. **battleStore.executeAttack()** - Property 4, 8
6. **formatHpDisplay()** - Property 6
7. **formatBattleLog()** - Property 9
8. **Auto-battle behavior** - Property 10

### Test File Structure

```
src/features/battle/
├── services/
│   ├── battleService.ts
│   └── battleService.test.ts  # Property tests for combat logic
├── store/
│   ├── battleStore.ts
│   └── battleStore.test.ts    # Property tests for state management
└── utils/
    ├── formatters.ts
    └── formatters.test.ts     # Property tests for formatting
```
