# Design Document: Arena 1D Battle System

## Overview

Hệ thống sàn đấu 1D (Arena1D) là một component UI hiển thị sàn đấu gồm 8 ô theo chiều ngang. Hai card bắt đầu ở 2 vị trí biên (ô 0 và ô 7), mỗi turn di chuyển 1 ô về phía đối thủ cho đến khi liền kề nhau và bắt đầu combat. Feature này tập trung vào việc xây dựng component UI và Storybook trước khi tích hợp logic battle engine.

## Architecture

```
src/features/arena1d/
├── components/
│   ├── Arena1D.tsx           # Main arena component
│   ├── ArenaCell.tsx         # Individual cell component
│   ├── ArenaCard.tsx         # Card display within arena
│   └── index.ts              # Component exports
├── types/
│   ├── arena.ts              # Arena type definitions
│   └── index.ts              # Type exports
├── stories/
│   └── Arena1D.stories.tsx   # Storybook stories
└── index.ts                  # Feature exports
```

## Components and Interfaces

### Arena1D Component

Main component hiển thị toàn bộ sàn đấu 8 ô.

```typescript
interface Arena1DProps {
  /** Card ở vị trí bên trái (bắt đầu từ ô 0) */
  leftCard: ArenaCardData | null;
  /** Card ở vị trí bên phải (bắt đầu từ ô 7) */
  rightCard: ArenaCardData | null;
  /** Vị trí hiện tại của left card (0-7) */
  leftPosition: CellIndex;
  /** Vị trí hiện tại của right card (0-7) */
  rightPosition: CellIndex;
  /** Trạng thái phase hiện tại */
  phase: ArenaPhase;
  /** Callback khi animation di chuyển hoàn tất */
  onMoveComplete?: () => void;
}
```

### ArenaCell Component

Component hiển thị một ô đơn lẻ trên sàn đấu.

```typescript
interface ArenaCellProps {
  /** Index của ô (0-7) */
  index: CellIndex;
  /** Có phải ô biên không */
  isBoundary: boolean;
  /** Card đang chiếm ô này (nếu có) */
  card: ArenaCardData | null;
  /** Card side nếu có card */
  cardSide?: "left" | "right";
  /** Trạng thái highlight */
  highlight?: CellHighlight;
  /** Có đang trong combat phase không */
  isInCombat?: boolean;
}
```

### ArenaCard Component

Component hiển thị card thu gọn trong ô arena.

```typescript
interface ArenaCardProps {
  /** Dữ liệu card */
  card: ArenaCardData;
  /** Bên của card (left/right) */
  side: "left" | "right";
  /** Có đang di chuyển không */
  isMoving?: boolean;
  /** Có đang trong combat không */
  isInCombat?: boolean;
  /** Hướng di chuyển */
  moveDirection?: "left" | "right";
}
```

## Data Models

### ArenaCardData

Dữ liệu card cần thiết cho arena display.

```typescript
interface ArenaCardData {
  id: string;
  name: string;
  imageUrl: string | null;
  currentHp: number;
  maxHp: number;
  atk: number;
}
```

### CellIndex

Type cho index của ô (0-7).

```typescript
type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
```

### ArenaPhase

Các phase của arena battle.

```typescript
type ArenaPhase = "setup" | "moving" | "combat" | "finished";
```

### CellHighlight

Trạng thái highlight của ô.

```typescript
type CellHighlight = "none" | "valid-move" | "combat-zone";
```

### ArenaState

State tổng hợp của arena.

```typescript
interface ArenaState {
  leftCard: ArenaCardData | null;
  rightCard: ArenaCardData | null;
  leftPosition: CellIndex;
  rightPosition: CellIndex;
  phase: ArenaPhase;
  turn: number;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Arena always has exactly 8 cells

_For any_ Arena1D component render, the number of ArenaCell components rendered SHALL equal exactly 8.
**Validates: Requirements 1.1**

### Property 2: Boundary cells are correctly identified

_For any_ CellIndex value, cells at index 0 and 7 SHALL be marked as boundary cells, and cells at index 1-6 SHALL NOT be marked as boundary cells.
**Validates: Requirements 1.2**

### Property 3: Initial positions are at boundaries

_For any_ arena in 'setup' phase, leftPosition SHALL equal 0 AND rightPosition SHALL equal 7.
**Validates: Requirements 3.1, 3.2**

### Property 4: Cards never occupy same cell

_For any_ valid ArenaState, leftPosition SHALL NOT equal rightPosition.
**Validates: Requirements 2.1, 2.2**

### Property 5: Combat phase triggers when adjacent

_For any_ ArenaState where |leftPosition - rightPosition| equals 1, the phase SHALL be 'combat'.
**Validates: Requirements 5.1, 5.2**

### Property 6: Position bounds are respected

_For any_ ArenaState, both leftPosition and rightPosition SHALL be in range [0, 7]. Both cards can move to any position on the arena.
**Validates: Requirements 4.3**

## Error Handling

| Error Scenario         | Handling Strategy           |
| ---------------------- | --------------------------- |
| Invalid cell index     | Clamp to valid range [0-7]  |
| Cards at same position | Prevent move, log warning   |
| Missing card data      | Render empty cell           |
| Animation interrupted  | Complete to target position |

## Testing Strategy

### Unit Testing

Sử dụng Vitest với React Testing Library:

- Test Arena1D renders 8 cells
- Test boundary cell styling
- Test card positioning
- Test phase transitions
- Test combat detection

### Property-Based Testing

Sử dụng fast-check library:

- **Property 1**: Generate random renders, verify cell count = 8
- **Property 2**: Generate all CellIndex values, verify boundary logic
- **Property 3**: Generate setup states, verify initial positions
- **Property 4**: Generate valid states, verify no position collision
- **Property 5**: Generate adjacent positions, verify combat phase
- **Property 6**: Generate positions, verify bounds

Mỗi property test sẽ chạy tối thiểu 100 iterations.

Format annotation cho property tests:

```typescript
// **Feature: arena-1d-battle, Property {number}: {property_text}**
```
