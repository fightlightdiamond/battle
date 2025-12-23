# Requirements Document

## Introduction

Hệ thống Gem/Rune (Đá Khảm) cho phép người chơi gắn các viên đá có skill đặc biệt vào card. Mỗi card có thể gắn tối đa 3 gem. Các skill được chia thành 2 loại: skill kích hoạt khi di chuyển (Movement Trigger) và skill kích hoạt khi combat (Combat Trigger). Một số skill có cooldown, một số không có. Các skill bao gồm: đẩy lùi đối phương, lùi về sau, di chuyển 2 ô, tấn công 2 lần, kết liễu khi HP thấp, và nhảy + đẩy lùi.

## Glossary

- **Gem**: Viên đá khảm có thể gắn vào card, chứa một skill đặc biệt
- **Skill**: Khả năng đặc biệt được kích hoạt bởi gem trong battle
- **Trigger Type**: Loại sự kiện kích hoạt skill (movement hoặc combat)
- **Cooldown**: Số lượt phải chờ trước khi skill có thể kích hoạt lại
- **Activation Chance**: Xác suất kích hoạt skill (0-100%)
- **Card**: Thực thể chiến đấu có thể gắn gem
- **Arena Position**: Vị trí của card trên arena 1D (0-7)
- **Knockback**: Hiệu ứng đẩy lùi đối phương ra xa
- **Execute**: Hiệu ứng kết liễu ngay lập tức khi HP đối phương dưới ngưỡng

## Requirements

### Requirement 1

**User Story:** As a player, I want to create and manage gems with different skills, so that I can customize my cards' abilities.

#### Acceptance Criteria

1. WHEN a user creates a gem THEN the Gem_System SHALL store the gem with unique id, name, description, skill type, trigger type, activation chance, cooldown, and effect parameters
2. WHEN a user views gem list THEN the Gem_System SHALL display all available gems with their properties
3. WHEN a user edits a gem THEN the Gem_System SHALL update the gem properties and persist changes
4. WHEN a user deletes a gem THEN the Gem_System SHALL remove the gem and unequip it from all cards

### Requirement 2

**User Story:** As a player, I want to equip gems to my cards, so that my cards gain special abilities in battle.

#### Acceptance Criteria

1. WHEN a user equips a gem to a card THEN the Equipment_System SHALL add the gem to the card's gem slots if fewer than 3 gems are equipped
2. WHEN a user attempts to equip a 4th gem THEN the Equipment_System SHALL reject the action and display an error message
3. WHEN a user unequips a gem from a card THEN the Equipment_System SHALL remove the gem from the card's gem slots
4. WHEN a card has equipped gems THEN the Card_Display SHALL show the equipped gems visually

### Requirement 3

**User Story:** As a player, I want gems with knockback skill, so that I can push enemies away after attacking.

#### Acceptance Criteria

1. WHEN a card with Knockback gem attacks and the skill activates THEN the Combat_System SHALL push the defender 1 cell away from the attacker
2. WHEN knockback would push defender beyond arena boundary THEN the Combat_System SHALL keep defender at boundary position
3. WHEN knockback skill is on cooldown THEN the Combat_System SHALL skip the knockback effect
4. WHEN knockback activates THEN the Combat_System SHALL display knockback animation and log the event

### Requirement 4

**User Story:** As a player, I want gems with retreat skill, so that my card can move backward after attacking.

#### Acceptance Criteria

1. WHEN a card with Retreat gem attacks and the skill activates THEN the Combat_System SHALL move the attacker 1 cell backward
2. WHEN retreat would move attacker beyond arena boundary THEN the Combat_System SHALL keep attacker at boundary position
3. WHEN retreat skill is on cooldown THEN the Combat_System SHALL skip the retreat effect
4. WHEN retreat activates THEN the Combat_System SHALL display retreat animation and log the event

### Requirement 5

**User Story:** As a player, I want gems with double move skill, so that my card can move 2 cells instead of 1.

#### Acceptance Criteria

1. WHEN a card with Double_Move gem moves and the skill activates THEN the Movement_System SHALL move the card 2 cells instead of 1
2. WHEN double move would exceed arena boundary THEN the Movement_System SHALL stop at boundary position
3. WHEN double move skill is on cooldown THEN the Movement_System SHALL use normal 1-cell movement
4. WHEN double move activates THEN the Movement_System SHALL display double move animation and log the event

### Requirement 6

**User Story:** As a player, I want gems with double attack skill, so that my card can attack twice in one turn.

#### Acceptance Criteria

1. WHEN a card with Double_Attack gem attacks and the skill activates THEN the Combat_System SHALL perform a second attack immediately
2. WHEN the first attack defeats the defender THEN the Combat_System SHALL skip the second attack
3. WHEN double attack skill is on cooldown THEN the Combat_System SHALL perform only one attack
4. WHEN double attack activates THEN the Combat_System SHALL display double attack animation and log both attacks

### Requirement 7

**User Story:** As a player, I want gems with execute skill, so that my card can instantly kill low HP enemies.

#### Acceptance Criteria

1. WHEN a card with Execute gem attacks and defender HP percentage is below threshold after damage THEN the Combat_System SHALL reduce defender HP to 0
2. WHEN defender HP percentage is above threshold THEN the Combat_System SHALL apply normal damage only
3. WHEN execute skill is on cooldown THEN the Combat_System SHALL skip the execute check
4. WHEN execute activates THEN the Combat_System SHALL display execute animation and log the event
5. WHEN configuring execute gem THEN the Gem_System SHALL allow setting HP threshold percentage (default 15%)

### Requirement 8

**User Story:** As a player, I want gems with leap strike skill, so that my card can jump to enemies within 2 cells and knock them back.

#### Acceptance Criteria

1. WHEN a card with Leap_Strike gem moves and enemy is within 2 cells THEN the Movement_System SHALL move card to adjacent position of enemy
2. WHEN leap strike activates THEN the Combat_System SHALL push enemy 2 cells away after the leap
3. WHEN leap strike would push enemy beyond boundary THEN the Combat_System SHALL keep enemy at boundary position
4. WHEN enemy is not within 2 cells THEN the Movement_System SHALL use normal movement
5. WHEN leap strike skill is on cooldown THEN the Movement_System SHALL use normal movement
6. WHEN leap strike activates THEN the Movement_System SHALL display leap animation and log the event

### Requirement 9

**User Story:** As a player, I want the skill system to handle cooldowns properly, so that powerful skills are balanced.

#### Acceptance Criteria

1. WHEN a skill with cooldown activates THEN the Skill_System SHALL set remaining cooldown to the skill's cooldown value
2. WHEN a turn ends THEN the Skill_System SHALL decrement all active cooldowns by 1
3. WHEN cooldown reaches 0 THEN the Skill_System SHALL allow the skill to activate again
4. WHEN displaying card status THEN the UI SHALL show remaining cooldown for each equipped gem

### Requirement 10

**User Story:** As a player, I want skill activation to be probability-based, so that battles have strategic uncertainty.

#### Acceptance Criteria

1. WHEN a skill trigger condition is met THEN the Skill_System SHALL roll against the skill's activation chance
2. WHEN roll succeeds THEN the Skill_System SHALL execute the skill effect
3. WHEN roll fails THEN the Skill_System SHALL skip the skill effect and not trigger cooldown
4. WHEN displaying skill info THEN the UI SHALL show activation chance percentage

### Requirement 11

**User Story:** As a player, I want to see skill activations clearly in battle, so that I understand what happened.

#### Acceptance Criteria

1. WHEN a skill activates THEN the Battle_Log SHALL record the skill name, card name, and effect
2. WHEN a skill activates THEN the Battle_UI SHALL display a visual indicator on the card
3. WHEN a skill fails to activate due to chance THEN the Battle_Log SHALL not record the attempt
4. WHEN viewing battle replay THEN the Replay_System SHALL show skill activations at correct timestamps
