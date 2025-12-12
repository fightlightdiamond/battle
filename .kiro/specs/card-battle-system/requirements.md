# Requirements Document

## Introduction

Hệ thống Card Battle cho phép admin thiết lập trận đấu giữa 2 card và thực hiện combat với hiệu ứng trực quan ấn tượng. Hệ thống bao gồm thanh HP động, animation tấn công, hiệu ứng damage, và phân định thắng thua rõ ràng. Mục tiêu là tạo trải nghiệm combat hấp dẫn và kịch tính cho người xem.

## Glossary

- **Battle_System**: Hệ thống quản lý và thực hiện trận đấu giữa 2 card
- **Combat_Arena**: Giao diện hiển thị trận đấu với 2 card đối mặt nhau
- **HP_Bar**: Thanh máu hiển thị HP hiện tại của card, giảm dần khi nhận damage
- **Damage**: Lượng sát thương gây ra, bằng ATK của card tấn công
- **Turn**: Lượt đánh, mỗi turn một card tấn công card còn lại
- **Battle_Log**: Nhật ký ghi lại các hành động trong trận đấu
- **Match_Setup**: Giao diện admin chọn 2 card để đấu
- **Combat_Animation**: Hiệu ứng động khi card tấn công và nhận damage
- **Victory_Screen**: Màn hình hiển thị kết quả thắng/thua

## Requirements

### Requirement 1: Match Setup

**User Story:** As an admin, I want to select two cards for a battle match, so that I can set up combat between them.

#### Acceptance Criteria

1. WHEN an admin opens the battle setup page THEN the Battle_System SHALL display a list of available cards for selection
2. WHEN an admin selects the first card THEN the Battle_System SHALL highlight the selected card and enable selection for the second card
3. WHEN an admin selects the second card THEN the Battle_System SHALL display both selected cards side by side with their stats (ATK, HP)
4. WHEN an admin attempts to select the same card twice THEN the Battle_System SHALL prevent the selection and display a warning message
5. WHEN both cards are selected THEN the Battle_System SHALL enable the "Start Battle" button

### Requirement 2: Combat Arena Display

**User Story:** As a viewer, I want to see both cards displayed in an impressive arena layout, so that I can follow the battle visually.

#### Acceptance Criteria

1. WHEN a battle starts THEN the Combat_Arena SHALL display both cards facing each other with their images, names, and stats visible
2. WHEN the Combat_Arena loads THEN the Battle_System SHALL display HP_Bar for each card showing current HP out of maximum HP
3. WHEN the Combat_Arena loads THEN the Battle_System SHALL display the HP_Bar with a gradient color (green > yellow > red) based on HP percentage
4. WHEN a card's HP changes THEN the HP_Bar SHALL animate smoothly to reflect the new HP value within 500 milliseconds

### Requirement 3: Turn-Based Combat Execution

**User Story:** As an admin, I want to execute combat turns, so that cards can attack each other until one wins.

#### Acceptance Criteria

1. WHEN an admin clicks "Attack" THEN the Battle_System SHALL execute one turn where the attacking card deals damage equal to its ATK to the defending card
2. WHEN a turn executes THEN the Battle_System SHALL subtract the attacker's ATK from the defender's current HP
3. WHEN a turn executes THEN the Battle_System SHALL alternate the attacking card for the next turn
4. WHEN a card receives damage THEN the Combat_Arena SHALL display the damage number with a floating animation near the damaged card
5. WHEN a card attacks THEN the Combat_Arena SHALL play an attack animation (card shake or lunge effect) lasting 300-500 milliseconds

### Requirement 4: HP Bar Visualization

**User Story:** As a viewer, I want to see HP bars that visually represent each card's remaining health, so that I can understand the battle progress.

#### Acceptance Criteria

1. WHEN a card has HP above 50% THEN the HP_Bar SHALL display in green color
2. WHEN a card has HP between 25% and 50% THEN the HP_Bar SHALL display in yellow color
3. WHEN a card has HP below 25% THEN the HP_Bar SHALL display in red color
4. WHEN a card's HP changes THEN the HP_Bar SHALL show both current HP number and maximum HP number (format: "current / max")
5. WHEN a card receives damage THEN the HP_Bar SHALL flash briefly to indicate damage received

### Requirement 5: Victory Determination

**User Story:** As a viewer, I want to see a clear winner when a card's HP reaches zero, so that I know the battle outcome.

#### Acceptance Criteria

1. WHEN a card's HP reaches zero or below THEN the Battle_System SHALL declare the opposing card as the winner
2. WHEN a winner is determined THEN the Victory_Screen SHALL display the winning card with a victory animation (glow effect or confetti)
3. WHEN a winner is determined THEN the Victory_Screen SHALL display "VICTORY" text for the winning card and "DEFEATED" for the losing card
4. WHEN the battle ends THEN the Battle_System SHALL disable further attack actions
5. WHEN the battle ends THEN the Battle_System SHALL display a "New Battle" button to start a new match

### Requirement 6: Battle Log

**User Story:** As a viewer, I want to see a log of all combat actions, so that I can review what happened during the battle.

#### Acceptance Criteria

1. WHEN a turn executes THEN the Battle_Log SHALL record the action with format "[Attacker] attacks [Defender] for [Damage] damage"
2. WHEN a card's HP changes THEN the Battle_Log SHALL display the defender's remaining HP
3. WHEN the battle ends THEN the Battle_Log SHALL record the final result with the winner's name
4. WHEN the Battle_Log updates THEN the Battle_System SHALL auto-scroll to show the latest entry

### Requirement 7: Auto-Battle Mode

**User Story:** As an admin, I want an auto-battle option, so that the combat can play out automatically with dramatic pacing.

#### Acceptance Criteria

1. WHEN an admin enables auto-battle mode THEN the Battle_System SHALL execute turns automatically with a 1.5 second delay between each turn
2. WHEN auto-battle is running THEN the Battle_System SHALL display a "Pause" button to stop automatic execution
3. WHEN auto-battle is paused THEN the Battle_System SHALL display a "Resume" button to continue automatic execution
4. WHEN a winner is determined during auto-battle THEN the Battle_System SHALL stop automatic execution and display the Victory_Screen

### Requirement 8: Visual Effects and Impressiveness

**User Story:** As a viewer, I want impressive visual effects during combat, so that the battle feels exciting and engaging.

#### Acceptance Criteria

1. WHEN a card attacks THEN the Combat_Arena SHALL display a visual attack effect (slash, impact, or energy burst) at the defender's position
2. WHEN a card receives critical damage (more than 30% of max HP) THEN the Combat_Arena SHALL display an enhanced damage effect with screen shake
3. WHEN a card's HP drops below 25% THEN the Combat_Arena SHALL display a "danger" visual indicator (pulsing red border or warning icon)
4. WHEN the battle starts THEN the Combat_Arena SHALL play an entrance animation for both cards (fade in with scale effect)
5. WHEN a winner is declared THEN the Combat_Arena SHALL play a victory celebration effect (particle burst or spotlight effect)
