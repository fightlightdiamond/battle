# Requirements Document

## Introduction

Cải thiện UI/UX của hệ thống bằng cách thêm thanh trạng thái (status bar) nhỏ phía trên để hiển thị thông tin tài khoản (gold balance) và tối ưu hóa các icon trong menu bằng cách loại bỏ text, chỉ sử dụng tooltip khi hover cho các icon khó hiểu.

## Glossary

- **Status_Bar**: Thanh trạng thái nhỏ cố định phía trên màn hình hiển thị thông tin tài khoản
- **Gold_Balance**: Số dư vàng của người chơi trong hệ thống betting
- **Floating_Menu**: Menu nổi chứa các nút điều hướng chính của ứng dụng
- **Tooltip**: Hộp thông tin nhỏ xuất hiện khi hover chuột lên một element
- **Icon_Button**: Nút chỉ chứa icon, không có text kèm theo

## Requirements

### Requirement 1

**User Story:** As a user, I want to see my gold balance in a dedicated status bar at the top of the screen, so that it doesn't overlap with other UI elements.

#### Acceptance Criteria

1. WHEN the application loads THEN the Status_Bar SHALL display at the top of the viewport with fixed positioning
2. WHEN the Gold_Balance changes THEN the Status_Bar SHALL update the displayed value in real-time
3. WHEN the Status_Bar is rendered THEN the Status_Bar SHALL have a compact height (32-40px) to minimize screen space usage
4. WHEN the user scrolls the page THEN the Status_Bar SHALL remain fixed at the top of the viewport
5. WHEN the user is on any page THEN the Status_Bar SHALL be visible except during battle arena and replay modes

### Requirement 2

**User Story:** As a user, I want menu icons without text labels, so that the interface is cleaner and less cluttered.

#### Acceptance Criteria

1. WHEN the Floating_Menu is expanded THEN the menu items SHALL display only icons without text labels
2. WHEN a user hovers over a menu icon THEN the Floating_Menu SHALL display a Tooltip showing the action name
3. WHEN the Tooltip is displayed THEN the Tooltip SHALL appear within 200ms of hover start
4. WHEN the user moves the cursor away from the icon THEN the Tooltip SHALL disappear within 100ms
5. WHEN the menu is rendered THEN the Icon_Button elements SHALL maintain consistent sizing (40-48px)

### Requirement 3

**User Story:** As a user, I want tooltips on icons that are not immediately obvious, so that I can understand their function without cluttering the UI.

#### Acceptance Criteria

1. WHEN a user hovers over any Icon_Button THEN the system SHALL display a Tooltip with the action description
2. WHEN the Tooltip is displayed THEN the Tooltip SHALL be positioned to avoid viewport overflow
3. WHEN multiple tooltips could be shown THEN the system SHALL display only one Tooltip at a time
4. WHEN the Tooltip content is rendered THEN the Tooltip SHALL use consistent styling across all components

### Requirement 4

**User Story:** As a developer, I want the status bar to be a reusable component, so that it can be easily integrated into the existing layout system.

#### Acceptance Criteria

1. WHEN the Status_Bar component is created THEN the Status_Bar SHALL accept configurable content slots
2. WHEN the Status_Bar is integrated THEN the Status_Bar SHALL work with both AppLayout and GameLayout components
3. WHEN the layout renders THEN the main content area SHALL account for the Status_Bar height to prevent overlap
