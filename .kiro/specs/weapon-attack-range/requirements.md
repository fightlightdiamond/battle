# Requirements Document

## Introduction

Tính năng Weapon Attack Range mở rộng hệ thống vũ khí hiện tại bằng cách thêm thuộc tính "tầm đánh" (attack range) cho vũ khí. Khi card được trang bị vũ khí, card có thể tấn công đối thủ trong phạm vi tầm đánh mà không cần di chuyển đến ô liền kề. Khi đối thủ nằm trong tầm đánh, card không được phép di chuyển và phải thực hiện tấn công. Mặc định, tầm đánh của card là 1 (chỉ tấn công ô liền kề như hiện tại).

## Glossary

- **Attack_Range**: Khoảng cách tối đa (tính bằng số ô) mà card có thể tấn công đối thủ
- **Weapon_System**: Hệ thống quản lý vũ khí và trang bị
- **Arena_System**: Hệ thống quản lý arena 1D battle
- **Combat_System**: Hệ thống xử lý chiến đấu
- **Card**: Entity nhân vật trong game có thể trang bị vũ khí
- **Weapon**: Entity vũ khí có thể được trang bị cho card
- **Effective_Range**: Tầm đánh hiệu dụng của card (base range + weapon range bonus)
- **In_Range**: Trạng thái khi khoảng cách giữa hai card nhỏ hơn hoặc bằng tầm đánh
- **Default_Range**: Tầm đánh mặc định của card khi không có vũ khí (giá trị 1)

## Requirements

### Requirement 1

**User Story:** As a user, I want weapons to have an attack range stat, so that different weapons provide different combat reach.

#### Acceptance Criteria

1. WHEN a user creates a weapon THEN the Weapon_System SHALL include an attack range field with a default value of 0
2. WHEN a user edits a weapon THEN the Weapon_System SHALL allow modification of the attack range value between 0 and 6
3. WHEN a weapon is displayed THEN the Weapon_System SHALL show the attack range stat alongside other weapon stats
4. WHEN serializing then deserializing a weapon with attack range THEN the Weapon_System SHALL produce an equivalent weapon object (round-trip consistency)

### Requirement 2

**User Story:** As a user, I want my card's effective attack range to include weapon bonus, so that equipped weapons extend my attack reach.

#### Acceptance Criteria

1. WHEN a card has no equipped weapon THEN the Combat_System SHALL use the default attack range of 1
2. WHEN a card has an equipped weapon THEN the Combat_System SHALL calculate effective range as default range (1) plus weapon attack range bonus
3. WHEN displaying card stats THEN the Weapon_System SHALL show the effective attack range (base + weapon bonus)

### Requirement 3

**User Story:** As a user, I want my card to attack enemies within range without moving, so that ranged weapons provide tactical advantage.

#### Acceptance Criteria

1. WHEN the distance between two cards is less than or equal to the attacker's effective range THEN the Arena_System SHALL consider the target as in-range
2. WHEN a target is in-range THEN the Combat_System SHALL allow the attacker to perform an attack action
3. WHEN calculating if target is in-range THEN the Arena_System SHALL use absolute distance between card positions

### Requirement 4

**User Story:** As a user, I want my card to be unable to move when an enemy is in attack range, so that combat is forced when enemies are close enough.

#### Acceptance Criteria

1. WHEN an enemy card is within the card's effective attack range THEN the Arena_System SHALL prevent the card from moving
2. WHEN an enemy card is outside the card's effective attack range THEN the Arena_System SHALL allow the card to move normally
3. WHEN determining valid moves THEN the Arena_System SHALL check the effective attack range of the moving card
4. WHEN a card cannot move due to enemy in range THEN the Arena_System SHALL indicate that combat is required

### Requirement 5

**User Story:** As a user, I want the battle system to correctly handle ranged combat, so that attacks work at the weapon's range.

#### Acceptance Criteria

1. WHEN a card attacks a target within effective range THEN the Combat_System SHALL execute the attack normally
2. WHEN processing a turn THEN the Combat_System SHALL check if target is in effective range before allowing attack
3. WHEN both cards are in each other's range THEN the Combat_System SHALL allow mutual combat based on turn order
