# Design Document: Layout Standardization

## Overview

Chuẩn hóa việc sử dụng layout components trên toàn bộ ứng dụng game. Mục tiêu là đảm bảo tất cả pages sử dụng đúng layout component (GameLayout hoặc MenuLayout) thay vì tự build layout riêng, giảm code duplication và tạo UI nhất quán.

## Architecture

### Layout Selection Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Page Types                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │    GameLayout       │    │       MenuLayout            │ │
│  │  (Immersive/Battle) │    │    (Standard/Menu)          │ │
│  ├─────────────────────┤    ├─────────────────────────────┤ │
│  │ • BattleArenaPage   │    │ • CardListPage              │ │
│  │ • BattleReplayPage  │    │ • CardEditPage (narrow)     │ │
│  │ • BattleSetupPage   │    │ • BattleHistoryListPage     │ │
│  │                     │    │ • MatchupAdminListPage      │ │
│  │                     │    │ • MatchupAdminPage (narrow) │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Current State vs Target State

| Page                  | Current       | Target     | Action         |
| --------------------- | ------------- | ---------- | -------------- |
| BattleArenaPage       | Custom layout | GameLayout | Refactor       |
| BattleReplayPage      | Broken code   | GameLayout | Fix & Refactor |
| BattleSetupPage       | GameLayout ✅ | GameLayout | None           |
| CardListPage          | MenuLayout ✅ | MenuLayout | None           |
| CardEditPage          | MenuLayout ✅ | MenuLayout | None           |
| BattleHistoryListPage | MenuLayout ✅ | MenuLayout | None           |
| MatchupAdminListPage  | MenuLayout ✅ | MenuLayout | None           |
| MatchupAdminPage      | MenuLayout ✅ | MenuLayout | None           |

## Components and Interfaces

### GameLayout Props (Existing)

```typescript
interface GameLayoutProps {
  children: ReactNode;
  title?: string;
  backTo?: string;
  backLabel?: string;
  headerRight?: ReactNode;
  className?: string;
  showBackground?: boolean;
}
```

### MenuLayout Props (Existing)

```typescript
type MenuLayoutVariant = "default" | "narrow" | "wide";

interface MenuLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  backTo?: string;
  headerRight?: ReactNode;
  variant?: MenuLayoutVariant;
  className?: string;
}
```

## Data Models

Không có data model mới - chỉ refactor cách sử dụng existing components.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: GameLayout header consistency

_For any_ page using GameLayout with backTo and title props provided, the rendered output should contain a header with back button linking to backTo and displaying the title text.
**Validates: Requirements 1.4**

### Property 2: Layout prop delegation

_For any_ page that needs navigation (back button or header actions), the page should delegate to layout props (backTo, headerRight) rather than implementing custom header elements inside children.
**Validates: Requirements 3.1, 3.2**

## Error Handling

### BattleReplayPage Fix Strategy

File hiện tại bị lỗi syntax nghiêm trọng:

- Code bị cắt ngang tại `className="bg-gra`
- JSX structure không hoàn chỉnh
- Có duplicate code blocks

**Fix approach:**

1. Rewrite component hoàn chỉnh sử dụng GameLayout
2. Đảm bảo tất cả loading/error/success states được handle
3. Sử dụng layout props thay vì custom header

### BattleArenaPage Refactor Strategy

Page hiện tại tự build layout với:

- Custom gradient background
- Custom header với back button
- Custom sidebar cho battle log

**Refactor approach:**

1. Wrap với GameLayout, sử dụng `showBackground={true}`
2. Di chuyển back button logic vào `backTo` prop
3. Giữ nguyên battle-specific UI (cards, controls, log sidebar) trong children

## Testing Strategy

### Unit Tests

- Test BattleReplayPage renders without errors after fix
- Test BattleArenaPage renders correctly with GameLayout

### Property-Based Tests

Sử dụng **Vitest** với **fast-check** cho property-based testing.

**Property 1: GameLayout header consistency**

- Generate random title và backTo values
- Render GameLayout với các props
- Assert header contains back link và title

**Property 2: Layout prop delegation**

- Không thể test tự động - đây là code review/lint rule
- Có thể tạo ESLint rule để detect custom headers trong layout children

### Integration Tests

- Verify BattleArenaPage navigation works correctly
- Verify BattleReplayPage loads and displays battle data
