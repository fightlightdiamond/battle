# Requirements Document

## Introduction

Mở rộng hệ thống stat cho AFK Battle Engine với cấu trúc phân cấp (Tier-Based). Hệ thống chia stats thành 2 tier: Core Stats (nền tảng) và Combat Stats (chiến đấu nâng cao). Bao gồm cập nhật Card CRUD để hỗ trợ các stat mới với giá trị default hợp lý. Mục tiêu là tạo ra battle hấp dẫn, đầy bất ngờ với nhiều yếu tố chiến thuật hơn.

## Glossary

- **Core_Stats**: Chỉ số nền tảng cơ bản của mọi combatant (HP, ATK, DEF, SPD)
- **Combat_Stats**: Chỉ số chiến đấu nâng cao ảnh hưởng đến cơ chế đặc biệt
- **Critical_Chance**: Tỷ lệ phần trăm kích hoạt đòn chí mạng (0-100%)
- **Critical_Damage**: Hệ số nhân sát thương khi chí mạng (mặc định 150%)
- **Armor_Penetration**: Phần trăm bỏ qua phòng thủ của đối thủ
- **Lifesteal**: Phần trăm sát thương gây ra được hồi lại thành HP
- **Speed**: Quyết định thứ tự hành động trong battle
- **Skill_Multiplier**: Hệ số nhân damage của skill (default 1.0 cho basic attack, future extension)

## Requirements

### Requirement 1: Core Stats (Tier 1)

**User Story:** As a developer, I want a clear set of core stats for all combatants, so that every character has fundamental attributes for battle.

#### Acceptance Criteria

1. WHEN creating a combatant THEN the Stat_System SHALL require health, attack, defense, and speed values
2. WHEN health reaches zero or below THEN the Stat_System SHALL mark the combatant as defeated
3. WHEN calculating base damage THEN the Stat_System SHALL use attack value as the primary damage source
4. WHEN calculating damage reduction THEN the Stat_System SHALL use defense in formula: reduction = DEF/(DEF + 100)
5. WHEN determining turn order THEN the Stat_System SHALL use speed to decide which combatant acts first

### Requirement 2: Combat Stats (Tier 2)

**User Story:** As a player, I want advanced combat stats, so that battles have more depth and strategic variety.

#### Acceptance Criteria

1. WHEN a combatant has criticalChance > 0 THEN the Combat_System SHALL roll for critical hit on each attack
2. WHEN a critical hit occurs THEN the Combat_System SHALL multiply damage by criticalDamage value
3. WHEN a combatant has armorPenetration > 0 THEN the Combat_System SHALL reduce effective defense by that percentage
4. WHEN a combatant has lifesteal > 0 THEN the Combat_System SHALL heal attacker by percentage of damage dealt

### Requirement 3: Speed-Based Turn Order

**User Story:** As a player, I want speed to determine who attacks first, so that fast characters have an advantage.

#### Acceptance Criteria

1. WHEN battle starts THEN the Turn_System SHALL compare both combatants' speed values
2. WHEN one combatant has higher speed THEN the Turn_System SHALL grant them the first attack
3. WHEN both combatants have equal speed THEN the Turn_System SHALL randomly select first attacker
4. WHEN speed changes during battle (via buffs) THEN the Turn_System SHALL recalculate turn order

### Requirement 4: Damage Formula Integration

**User Story:** As a developer, I want a comprehensive damage formula, so that all stats interact correctly.

#### Acceptance Criteria

1. WHEN calculating damage THEN the Damage_Calculator SHALL apply formula: baseDamage = ATK × skillMultiplier (default skillMultiplier = 1)
2. WHEN applying armor penetration THEN the Damage_Calculator SHALL use: effectiveDef = DEF × (1 - armorPenetration/100)
3. WHEN applying defense THEN the Damage_Calculator SHALL use: damage = baseDamage × (1 - effectiveDef/(effectiveDef + 100))
4. WHEN critical hit occurs THEN the Damage_Calculator SHALL multiply by criticalDamage/100
5. WHEN calculating final damage THEN the Damage_Calculator SHALL ensure minimum damage of 1

### Requirement 5: Lifesteal Mechanic

**User Story:** As a player, I want lifesteal to heal my character, so that sustain builds are viable.

#### Acceptance Criteria

1. WHEN attack deals damage AND attacker has lifesteal > 0 THEN the Combat_System SHALL heal attacker
2. WHEN calculating lifesteal heal THEN the Combat_System SHALL use: heal = finalDamage × lifesteal/100
3. WHEN lifesteal heal would exceed maxHp THEN the Combat_System SHALL cap healing at maxHp

### Requirement 6: Default Stat Values

**User Story:** As a developer, I want sensible default values for all stats, so that basic combatants work without full configuration.

#### Acceptance Criteria

1. WHEN creating combatant without combat stats THEN the Stat_System SHALL use default values
2. WHEN using defaults THEN the Stat_System SHALL set criticalChance to 5%
3. WHEN using defaults THEN the Stat_System SHALL set criticalDamage to 150% (1.5 multiplier)
4. WHEN using defaults THEN the Stat_System SHALL set armorPenetration and lifesteal to 0

### Requirement 8: Stat Serialization

**User Story:** As a developer, I want stats to serialize correctly, so that battle state can be saved and loaded.

#### Acceptance Criteria

1. WHEN serializing combatant THEN the Serializer SHALL include all core and combat stats
2. WHEN deserializing combatant THEN the Serializer SHALL restore all stat values exactly
3. WHEN deserializing old format (without new stats) THEN the Serializer SHALL apply default values for missing stats

### Requirement 7: Card Entity Update

**User Story:** As a developer, I want the Card entity to include all new stats, so that cards can be configured with full combat capabilities.

#### Acceptance Criteria

1. WHEN defining Card interface THEN the Card_Entity SHALL include def (defense) field with default 50
2. WHEN defining Card interface THEN the Card_Entity SHALL include spd (speed) field with default 100
3. WHEN defining Card interface THEN the Card_Entity SHALL include critChance field with default 5 (percent)
4. WHEN defining Card interface THEN the Card_Entity SHALL include critDamage field with default 150 (percent, meaning 1.5x)
5. WHEN defining Card interface THEN the Card_Entity SHALL include armorPen field with default 0 (percent)
6. WHEN defining Card interface THEN the Card_Entity SHALL include lifesteal field with default 0 (percent)

### Requirement 8: Card Form Update

**User Story:** As a user, I want to configure all stats when creating/editing cards, so that I can customize my heroes fully.

#### Acceptance Criteria

1. WHEN displaying card form THEN the Card_Form SHALL show Core Stats section with HP, ATK, DEF, SPD fields
2. WHEN displaying card form THEN the Card_Form SHALL show Combat Stats section with critChance, critDamage, armorPen, lifesteal fields
3. WHEN creating new card THEN the Card_Form SHALL pre-fill default values for all stats
4. WHEN editing existing card THEN the Card_Form SHALL display current stat values
5. WHEN submitting form THEN the Card_Form SHALL validate all stat values are within valid ranges
6. WHEN stat field is left empty THEN the Card_Form SHALL use default value for that stat

### Requirement 9: Card Schema Validation

**User Story:** As a developer, I want proper validation for all stat fields, so that invalid data cannot be saved.

#### Acceptance Criteria

1. WHEN validating def THEN the Schema SHALL accept integers >= 0
2. WHEN validating spd THEN the Schema SHALL accept integers >= 1
3. WHEN validating critChance THEN the Schema SHALL accept numbers between 0 and 100
4. WHEN validating critDamage THEN the Schema SHALL accept numbers >= 100 (100% = no bonus)
5. WHEN validating armorPen THEN the Schema SHALL accept numbers between 0 and 100
6. WHEN validating lifesteal THEN the Schema SHALL accept numbers between 0 and 100

### Requirement 10: Database Migration

**User Story:** As a developer, I want existing cards to work with new stats, so that users don't lose their data.

#### Acceptance Criteria

1. WHEN loading card without new stat fields THEN the Card_Service SHALL apply default values
2. WHEN saving card THEN the Card_Service SHALL persist all stat fields to database
3. WHEN migrating THEN the Card_Service SHALL NOT modify existing HP and ATK values
