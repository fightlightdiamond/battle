# Design Document: UI Status Bar & Icon Tooltips

## Overview

Feature này cải thiện UI/UX bằng cách:

1. Thêm thanh trạng thái (Status Bar) nhỏ cố định phía trên màn hình để hiển thị gold balance
2. Chuyển đổi menu items từ icon+text sang icon-only với tooltip khi hover
3. Sử dụng Radix UI Tooltip component đã có sẵn trong project

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Status Bar (fixed top)                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [Logo/Home]                              [🪙 1,000 Gold] ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Main Content Area                        │
│                  (with top padding for status bar)          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Floating Menu (icon-only with tooltips)              │  │
│  │  [📚] [⚔️] [🏆] [📜] [🪙] [📋] [➕]                    │  │
│  │   ↑                                                   │  │
│  │  Tooltip: "Cards"                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. StatusBar Component

```typescript
// src/components/StatusBar.tsx
interface StatusBarProps {
  /** Additional CSS classes */
  className?: string;
  /** Left side content slot */
  leftContent?: ReactNode;
  /** Right side content slot (default: GoldBalanceDisplay) */
  rightContent?: ReactNode;
  /** Whether to show on current page */
  visible?: boolean;
}
```

### 2. Updated FloatingMenu Component

```typescript
// src/components/FloatingMenu.tsx (updated)
interface MenuItem {
  path: string;
  label: string; // Used for tooltip
  icon: React.ReactNode;
  color: string;
}

// Menu items will render as icon-only buttons with Tooltip wrapper
```

### 3. IconButton Component (optional helper)

```typescript
// src/components/IconButton.tsx
interface IconButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  className?: string;
  active?: boolean;
}
```

## Data Models

Không có data model mới. Feature này sử dụng:

- `useBettingStore` để lấy gold balance (đã có)
- `useLocation` từ react-router để xác định route hiện tại

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After reviewing the prework analysis:

- Properties 1.2 and 1.5 are the main testable properties
- Most other criteria are UI examples or handled by external libraries (Radix UI)
- Timing-related criteria (2.3, 2.4) are not reliably testable
- Tooltip positioning (3.2) is handled by Radix UI

### Properties

**Property 1: Gold balance display consistency**
_For any_ gold balance value in the betting store, the Status_Bar SHALL display the same formatted value as returned by the formatGold function.
**Validates: Requirements 1.2**

**Property 2: Status bar visibility based on route**
_For any_ route path, the Status_Bar SHALL be visible if and only if the path does not match `/battle/arena`, `/bet-battle/arena`, or contain `/replay`.
**Validates: Requirements 1.5**

## Error Handling

| Scenario               | Handling                   |
| ---------------------- | -------------------------- |
| Gold balance undefined | Display 0 as default       |
| Tooltip content empty  | Don't render tooltip       |
| Route undefined        | Show status bar by default |

## Testing Strategy

### Unit Tests

- StatusBar renders with correct structure
- StatusBar visibility logic based on routes
- FloatingMenu renders icon-only buttons
- Tooltip appears on hover

### Property-Based Tests

Using `fast-check` library (already in project or add if needed):

1. **Gold Balance Display Property**: Generate random gold values, verify display matches formatted value
2. **Route Visibility Property**: Generate random route strings, verify visibility logic

### Integration Tests

- StatusBar integrates with AppLayout
- StatusBar integrates with GameLayout
- FloatingMenu tooltips work correctly
