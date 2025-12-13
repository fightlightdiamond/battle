# Requirements Document

## Introduction

Hệ thống battle hiện tại đã có DamageCalculator hỗ trợ crit và lifesteal, nhưng Battle Log và UI chưa hiển thị đầy đủ thông tin này. Feature này sẽ nâng cấp Battle Log để hiển thị chi tiết crit damage và lifesteal, đồng thời thêm floating combat numbers trên màn hình battle như các game thường làm. Tất cả sẽ được implement theo hướng config-driven để dễ dàng customize.

## Glossary

- **Crit (Critical Hit)**: Đòn đánh chí mạng với damage được nhân với critDamage multiplier
- **Lifesteal**: Hồi HP dựa trên % damage gây ra
- **Floating Combat Numbers**: Số damage/heal hiển thị trên card và bay lên rồi biến mất
- **Battle Log**: Danh sách các action trong trận đấu
- **DamageResult**: Object chứa thông tin chi tiết về damage (baseDamage, isCrit, critBonus, lifestealAmount)
- **Combat Visual Config**: Config file định nghĩa styling, colors, animations cho combat visuals
- **Config-Driven**: Kiến trúc nơi behavior và UI được điều khiển bởi configuration thay vì hardcode

## Requirements

### Requirement 1

**User Story:** As a developer, I want combat visual settings defined in a central config file, so that I can easily customize colors, animations, and text formats without changing component code.

#### Acceptance Criteria

1. THE Combat Visual Config SHALL define all damage type styles (normal, crit, heal) including colors, font sizes, and labels
2. THE Combat Visual Config SHALL define animation settings (duration, easing, direction)
3. THE Combat Visual Config SHALL define Battle Log message templates for each action type
4. WHEN config values are changed THEN all combat visual components SHALL reflect the changes without code modification

### Requirement 2

**User Story:** As a player, I want to see detailed damage information in the Battle Log, so that I can understand what happened in each attack.

#### Acceptance Criteria

1. WHEN an attack occurs THEN the Battle Log SHALL display the base damage amount using message template from config
2. WHEN a critical hit occurs THEN the Battle Log SHALL display crit indicator and bonus damage using config-defined format
3. WHEN lifesteal triggers THEN the Battle Log SHALL display the HP healed amount using config-defined format
4. THE Battle Log SHALL use message templates from Combat Visual Config for consistent formatting

### Requirement 3

**User Story:** As a player, I want to see floating damage numbers on the battlefield, so that I can visually track combat in real-time.

#### Acceptance Criteria

1. WHEN damage is dealt THEN the system SHALL display a floating number on the defender card with config-defined styling
2. WHEN a critical hit occurs THEN the floating number SHALL use crit styling from config (color, size, label)
3. WHEN lifesteal heals the attacker THEN the system SHALL display a heal number with config-defined heal styling
4. THE floating numbers SHALL animate using duration and easing from config

### Requirement 4

**User Story:** As a developer, I want the DamageCalculator to return detailed damage breakdown, so that UI components can display accurate information.

#### Acceptance Criteria

1. THE DamageCalculator SHALL return a DamageResult object containing: finalDamage, baseDamage, isCrit, critBonus, lifestealAmount
2. WHEN calculating damage THEN the system SHALL track whether crit was rolled and applied
3. WHEN lifesteal stat is present THEN the system SHALL calculate heal amount as (finalDamage × lifesteal / 100)
4. THE DamageResult interface SHALL be exported for use by other components

### Requirement 5

**User Story:** As a player, I want different visual styles for different damage types, so that I can quickly distinguish between normal hits, crits, and heals.

#### Acceptance Criteria

1. THE system SHALL read damage type styles from Combat Visual Config
2. THE system SHALL apply config-defined colors for each damage type (normal, crit, heal)
3. THE system SHALL apply config-defined font sizes and labels for each damage type
4. WHEN new damage types are added to config THEN the system SHALL render them correctly without code changes
