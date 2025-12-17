# Requirements Document

## Introduction

Tính năng Weapon Equipment cho phép người dùng tạo, quản lý và trang bị vũ khí cho các card. Vũ khí sẽ cung cấp các chỉ số tấn công bổ sung (ATK, Crit Chance, Crit Damage, Armor Penetration, Lifesteal) cho card khi được trang bị. Khi card tham gia battle, các chỉ số từ vũ khí sẽ được cộng thêm vào chỉ số cơ bản của card.

## Glossary

- **Weapon**: Một entity vũ khí có thể được trang bị cho card, chứa các chỉ số tấn công bổ sung
- **Card**: Entity nhân vật trong game có thể trang bị vũ khí
- **Offensive Stats**: Các chỉ số liên quan đến tấn công bao gồm ATK, Crit Chance, Crit Damage, Armor Penetration, Lifesteal
- **Equipment Slot**: Vị trí trang bị vũ khí trên card (mỗi card có 1 slot vũ khí)
- **Effective Stats**: Chỉ số hiệu dụng của card sau khi cộng thêm chỉ số từ vũ khí
- **Weapon_System**: Hệ thống quản lý vũ khí và trang bị

## Requirements

### Requirement 1

**User Story:** As a user, I want to create weapons with offensive stats, so that I can enhance my cards' attack capabilities.

#### Acceptance Criteria

1. WHEN a user submits a valid weapon form with name and stats THEN the Weapon_System SHALL create a new weapon and persist it to storage
2. WHEN a user attempts to create a weapon with an empty name THEN the Weapon_System SHALL reject the creation and display a validation error
3. WHEN a user creates a weapon without specifying stats THEN the Weapon_System SHALL apply default values of 0 for all offensive stats
4. WHEN a weapon is created THEN the Weapon_System SHALL assign a unique identifier and timestamp to the weapon

### Requirement 2

**User Story:** As a user, I want to view and manage my weapons collection, so that I can organize my equipment inventory.

#### Acceptance Criteria

1. WHEN a user navigates to the weapons list page THEN the Weapon_System SHALL display all weapons with their names and stats
2. WHEN a user selects a weapon to edit THEN the Weapon_System SHALL display the weapon form pre-filled with current values
3. WHEN a user updates a weapon THEN the Weapon_System SHALL persist the changes and update the timestamp
4. WHEN a user deletes a weapon that is equipped to a card THEN the Weapon_System SHALL unequip the weapon from the card before deletion

### Requirement 3

**User Story:** As a user, I want to view card details and equip weapons, so that I can customize my cards' combat capabilities.

#### Acceptance Criteria

1. WHEN a user navigates to a card detail page THEN the Weapon_System SHALL display the card's base stats and equipped weapon information
2. WHEN a user selects a weapon to equip THEN the Weapon_System SHALL associate the weapon with the card and persist the relationship
3. WHEN a user equips a weapon to a card THEN the Weapon_System SHALL display the effective stats (base + weapon bonus)
4. WHEN a user unequips a weapon from a card THEN the Weapon_System SHALL remove the association and revert to base stats display
5. WHEN a weapon is already equipped to another card THEN the Weapon_System SHALL unequip it from the previous card before equipping to the new card

### Requirement 4

**User Story:** As a user, I want weapon bonuses to apply in battles, so that my equipped weapons provide actual combat advantages.

#### Acceptance Criteria

1. WHEN a card with an equipped weapon enters battle THEN the Weapon_System SHALL calculate effective stats by adding weapon stats to card base stats
2. WHEN calculating battle damage THEN the Weapon_System SHALL use the effective ATK value (card ATK + weapon ATK)
3. WHEN calculating critical hit chance THEN the Weapon_System SHALL use the effective Crit Chance (card Crit Chance + weapon Crit Chance)
4. WHEN calculating critical damage THEN the Weapon_System SHALL use the effective Crit Damage (card Crit Damage + weapon Crit Damage)
5. WHEN calculating armor penetration THEN the Weapon_System SHALL use the effective Armor Pen (card Armor Pen + weapon Armor Pen)
6. WHEN calculating lifesteal THEN the Weapon_System SHALL use the effective Lifesteal (card Lifesteal + weapon Lifesteal)

### Requirement 5

**User Story:** As a user, I want to serialize and deserialize weapon data, so that weapon information persists correctly across sessions.

#### Acceptance Criteria

1. WHEN storing a weapon THEN the Weapon_System SHALL serialize the weapon to JSON format
2. WHEN loading a weapon THEN the Weapon_System SHALL deserialize the JSON and reconstruct the weapon object
3. WHEN serializing then deserializing a weapon THEN the Weapon_System SHALL produce an equivalent weapon object (round-trip consistency)

### Requirement 6

**User Story:** As a user, I want to serialize and deserialize card-weapon equipment relationships, so that equipment state persists correctly.

#### Acceptance Criteria

1. WHEN storing a card's equipment state THEN the Weapon_System SHALL serialize the weapon ID reference
2. WHEN loading a card's equipment state THEN the Weapon_System SHALL resolve the weapon reference and restore the relationship
3. WHEN serializing then deserializing equipment state THEN the Weapon_System SHALL produce equivalent equipment relationships (round-trip consistency)
