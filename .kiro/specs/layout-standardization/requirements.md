# Requirements Document

## Introduction

Chuẩn hóa việc sử dụng layout components (GameLayout và MenuLayout) trên toàn bộ ứng dụng game. Hiện tại có sự không đồng nhất: một số pages tự build layout riêng thay vì sử dụng shared layout components, dẫn đến code duplication và UI không nhất quán.

## Glossary

- **GameLayout**: Full-screen immersive layout cho battle/arena pages với dark gradient background
- **MenuLayout**: Standard layout cho menu/list/form pages với container-based design
- **Page**: React component đại diện cho một route trong ứng dụng
- **Layout Component**: Shared component cung cấp structure và styling chung cho pages

## Requirements

### Requirement 1

**User Story:** As a developer, I want all game-related pages to use GameLayout consistently, so that the battle experience has a unified immersive look.

#### Acceptance Criteria

1. WHEN BattleArenaPage renders THEN the Layout_System SHALL wrap content with GameLayout component
2. WHEN BattleReplayPage renders THEN the Layout_System SHALL wrap content with GameLayout component
3. WHEN BattleSetupPage renders THEN the Layout_System SHALL continue using GameLayout component
4. WHEN any GameLayout page displays THEN the Layout_System SHALL show consistent header styling with back button and title

### Requirement 2

**User Story:** As a developer, I want all menu/list pages to use MenuLayout consistently, so that navigation and content structure is uniform.

#### Acceptance Criteria

1. WHEN CardListPage renders THEN the Layout_System SHALL wrap content with MenuLayout component
2. WHEN CardEditPage renders THEN the Layout_System SHALL wrap content with MenuLayout component with narrow variant
3. WHEN BattleHistoryListPage renders THEN the Layout_System SHALL wrap content with MenuLayout component
4. WHEN MatchupAdminListPage renders THEN the Layout_System SHALL wrap content with MenuLayout component
5. WHEN MatchupAdminPage renders THEN the Layout_System SHALL wrap content with MenuLayout component with narrow variant

### Requirement 3

**User Story:** As a user, I want consistent navigation patterns across all pages, so that I can easily move between different sections of the app.

#### Acceptance Criteria

1. WHEN a page has a back button THEN the Layout_System SHALL use the layout's built-in backTo prop
2. WHEN a page has header actions THEN the Layout_System SHALL use the layout's headerRight prop
3. IF a page implements custom header navigation THEN the Layout_System SHALL refactor to use layout props instead

### Requirement 4

**User Story:** As a developer, I want to fix the broken BattleReplayPage, so that users can view battle replays without errors.

#### Acceptance Criteria

1. WHEN BattleReplayPage code is reviewed THEN the Layout_System SHALL fix syntax errors in the component
2. WHEN BattleReplayPage renders THEN the Layout_System SHALL display complete UI without JavaScript errors
3. WHEN BattleReplayPage uses GameLayout THEN the Layout_System SHALL pass correct props for title, backTo, and headerRight
