# Requirements Document

## Introduction

Tính năng Arena Battle Mode mở rộng hệ thống battle hiện tại bằng cách thêm tùy chọn chiến đấu trên sàn 1D (Arena Mode). Người chơi có thể chọn giữa chế độ battle truyền thống (Classic Mode - combat ngay lập tức) hoặc Arena Mode (card di chuyển trên sàn 8 ô, chỉ combat khi ở vị trí liền kề). Tính năng này tích hợp Arena1D component đã có vào flow battle thực tế với logic di chuyển và combat đầy đủ.

## Glossary

- **Battle Mode**: Chế độ chiến đấu - Classic (truyền thống) hoặc Arena (sàn 1D)
- **Classic Mode**: Chế độ battle truyền thống - 2 card combat ngay lập tức không có di chuyển
- **Arena Mode**: Chế độ battle trên sàn 1D - card di chuyển và chỉ combat khi liền kề
- **Arena1D**: Component hiển thị sàn đấu 8 ô theo chiều ngang
- **Movement Phase**: Giai đoạn di chuyển - card di chuyển 1 ô về phía đối thủ mỗi turn
- **Combat Phase**: Giai đoạn chiến đấu - khi 2 card ở vị trí liền kề (khoảng cách = 1)
- **Adjacent Position**: Vị trí liền kề - 2 card cách nhau đúng 1 ô
- **Turn**: Một lượt trong battle - có thể là di chuyển hoặc tấn công tùy vào phase

## Requirements

### Requirement 1

**User Story:** As a player, I want to choose between Classic and Arena battle modes on the setup page, so that I can experience different battle styles.

#### Acceptance Criteria

1. WHEN the BattleSetupPage loads THEN the system SHALL display a battle mode selector with Classic and Arena options
2. WHEN Classic mode is selected THEN the system SHALL show the mode as active with appropriate visual feedback
3. WHEN Arena mode is selected THEN the system SHALL show the mode as active with appropriate visual feedback
4. WHEN the user clicks Start Battle THEN the system SHALL navigate to the appropriate arena page based on selected mode

### Requirement 2

**User Story:** As a player, I want a dedicated Arena Battle page that shows the 1D arena, so that I can see cards positioned on the battlefield.

#### Acceptance Criteria

1. WHEN navigating to Arena Battle page THEN the system SHALL display the Arena1D component with 8 cells
2. WHEN the battle starts THEN the system SHALL place the challenger card at cell 0 (left boundary)
3. WHEN the battle starts THEN the system SHALL place the opponent card at cell 7 (right boundary)
4. WHEN displaying the arena THEN the system SHALL show card images within their respective cells

### Requirement 3

**User Story:** As a player, I want cards to move toward each other when they are far apart, so that the battle progresses toward combat.

#### Acceptance Criteria

1. WHEN cards are not adjacent (distance > 1) THEN the system SHALL execute movement phase instead of combat
2. WHEN in movement phase THEN the system SHALL move the current turn's card 1 cell toward the opponent
3. WHEN a card moves THEN the system SHALL animate the movement transition smoothly
4. WHEN movement completes THEN the system SHALL switch turn to the other card

### Requirement 4

**User Story:** As a player, I want combat to begin only when cards are adjacent, so that the arena positioning matters.

#### Acceptance Criteria

1. WHEN cards become adjacent (distance = 1) THEN the system SHALL transition to combat phase
2. WHEN in combat phase THEN the system SHALL execute attacks using the existing battle engine
3. WHEN in combat phase THEN the system SHALL display damage numbers and HP changes on cards
4. WHEN a card's HP reaches 0 THEN the system SHALL end the battle and show victory overlay

### Requirement 5

**User Story:** As a player, I want to see battle controls appropriate for the current phase, so that I can interact with the battle correctly.

#### Acceptance Criteria

1. WHEN in movement phase THEN the system SHALL show a Move button instead of Attack button
2. WHEN in combat phase THEN the system SHALL show the Attack button for manual combat
3. WHEN auto-battle is enabled THEN the system SHALL automatically execute moves or attacks based on current phase
4. WHEN battle ends THEN the system SHALL show New Battle button to return to setup

### Requirement 6

**User Story:** As a player, I want to see HP bars and card stats during arena battle, so that I can track the battle state.

#### Acceptance Criteria

1. WHEN displaying cards in arena THEN the system SHALL show HP bar with current/max HP
2. WHEN a card takes damage THEN the system SHALL update the HP bar immediately
3. WHEN a card's HP is low (below 25%) THEN the system SHALL indicate danger state visually
4. WHEN displaying cards THEN the system SHALL show essential combat stats (ATK, DEF)
