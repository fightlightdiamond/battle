# Requirements Document

## Introduction

Hệ thống sàn đấu 1D (1D Arena) là một chế độ battle mới cho phép card di chuyển trên một dải 8 ô theo chiều ngang. Hai card bắt đầu ở 2 vị trí biên (ô 0 và ô 7), mỗi turn di chuyển 1 ô về phía đối thủ. Khi 2 card ở vị trí liền kề nhau, chúng sẽ dừng di chuyển và bắt đầu combat. Feature này tập trung vào việc xây dựng component UI và Storybook cho hệ thống sàn đấu trước khi tích hợp logic battle.

## Glossary

- **Arena**: Sàn đấu 1D gồm 8 ô liên tiếp theo chiều ngang
- **Cell**: Một ô trên sàn đấu, được đánh số từ 0-7
- **Boundary Cell**: Ô biên - ô đầu tiên (index 0) và ô cuối cùng (index 7), nơi card bắt đầu trận đấu
- **Card Position**: Vị trí hiện tại của card trên sàn đấu (0-7)
- **Movement Phase**: Giai đoạn di chuyển - mỗi turn card di chuyển 1 ô về phía đối thủ
- **Combat Phase**: Giai đoạn chiến đấu - khi 2 card ở vị trí liền kề nhau
- **Adjacent**: Hai card được coi là liền kề khi khoảng cách giữa chúng là 1 ô
- **Occupancy**: Trạng thái chiếm giữ của một ô (trống hoặc có card)

## Requirements

### Requirement 1

**User Story:** As a player, I want to see a visual representation of the 1D arena with 8 cells, so that I can understand the battlefield layout.

#### Acceptance Criteria

1. WHEN the Arena1D component renders THEN the system SHALL display exactly 8 cells arranged horizontally
2. WHEN displaying cells THEN the system SHALL visually distinguish boundary cells (index 0 and 7) from middle cells
3. WHEN displaying cells THEN the system SHALL show cell index numbers for player reference
4. WHEN the arena is empty THEN the system SHALL display all cells in an unoccupied state

### Requirement 2

**User Story:** As a player, I want to see cards positioned on specific cells, so that I can track card locations during battle.

#### Acceptance Criteria

1. WHEN a card occupies a cell THEN the system SHALL display the card within that cell's boundaries
2. WHEN multiple cards exist on the arena THEN the system SHALL display each card in its respective cell position
3. WHEN a cell is unoccupied THEN the system SHALL display the cell as empty with appropriate visual styling
4. WHEN displaying a card THEN the system SHALL show card name and essential stats (HP, ATK)

### Requirement 3

**User Story:** As a player, I want cards to start at boundary positions, so that the battle begins with proper setup.

#### Acceptance Criteria

1. WHEN a battle starts THEN the system SHALL place the left card at cell index 0 (left boundary)
2. WHEN a battle starts THEN the system SHALL place the right card at cell index 7 (right boundary)
3. WHEN displaying initial positions THEN the system SHALL visually indicate each card's starting boundary

### Requirement 4

**User Story:** As a player, I want to see visual feedback when a card moves between cells, so that I can follow the action.

#### Acceptance Criteria

1. WHEN a card moves to an adjacent cell THEN the system SHALL animate the movement transition
2. WHEN movement animation completes THEN the system SHALL update the card's visual position to the new cell
3. WHEN a card moves THEN the system SHALL move exactly 1 cell toward the opponent per turn

### Requirement 5

**User Story:** As a player, I want to see when cards enter combat phase, so that I know fighting will begin.

#### Acceptance Criteria

1. WHEN two cards are in adjacent cells THEN the system SHALL indicate combat phase has begun
2. WHEN cards are adjacent THEN the system SHALL stop movement and display combat-ready state
3. WHEN in combat phase THEN the system SHALL visually highlight both cards as engaged in battle

### Requirement 6

**User Story:** As a developer, I want Storybook stories for the Arena1D component, so that I can test and document component states.

#### Acceptance Criteria

1. WHEN viewing Storybook THEN the system SHALL provide a story showing an empty arena with 8 cells
2. WHEN viewing Storybook THEN the system SHALL provide a story showing initial battle setup (cards at boundaries)
3. WHEN viewing Storybook THEN the system SHALL provide a story showing cards at various mid-arena positions
4. WHEN viewing Storybook THEN the system SHALL provide a story demonstrating card movement animation
5. WHEN viewing Storybook THEN the system SHALL provide a story showing combat phase (adjacent cards)
