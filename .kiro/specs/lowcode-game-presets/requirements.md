# Requirements Document

## Introduction

Thêm tính năng **Game Entity Presets** vào Low-Code Builder để tạo nhanh các entity phù hợp với game hiện tại. Thay vì định nghĩa từng field thủ công, user có thể chọn preset (Card, Gem, Weapon) và hệ thống sẽ tự động tạo các fields tương ứng với cấu trúc entity trong game.

## Glossary

- **Preset**: Template định nghĩa sẵn các fields cho một loại entity cụ thể
- **Card_Preset**: Preset cho entity giống Card (hp, atk, def, spd, critChance, critDamage, armorPen, lifesteal, image)
- **Gem_Preset**: Preset cho entity giống Gem (skillType, trigger, cooldown, activationChance, effectParams)
- **Weapon_Preset**: Preset cho entity giống Weapon (atk, critChance, critDamage, armorPen, lifesteal, attackRange)

## Requirements

### Requirement 1: Preset Selection UI

**User Story:** As a developer, I want to select a preset when creating a new entity, so that I can quickly set up fields matching existing game entities.

#### Acceptance Criteria

1. WHEN user opens EntityBuilderPage THEN THE System SHALL display a "Use Preset" dropdown/button
2. THE Preset selector SHALL show options: "None", "Card-like", "Gem-like", "Weapon-like"
3. WHEN user selects a preset THEN THE System SHALL populate fields matching that entity type
4. WHEN preset is applied THEN THE System SHALL allow user to modify/add/remove fields

### Requirement 2: Card-like Preset

**User Story:** As a developer, I want a Card-like preset, so that I can create entities with combat stats similar to Card.

#### Acceptance Criteria

1. THE Card_Preset SHALL include fields: name (text, required), hp (number), atk (number), def (number), spd (number)
2. THE Card_Preset SHALL include fields: critChance (number, 0-100), critDamage (number, 0-500), armorPen (number, 0-100), lifesteal (number, 0-100)
3. THE Card_Preset SHALL include field: imagePath (text, optional)
4. THE Card_Preset number fields SHALL have appropriate min/max constraints matching existing Card type

### Requirement 3: Gem-like Preset

**User Story:** As a developer, I want a Gem-like preset, so that I can create entities with skill-based properties.

#### Acceptance Criteria

1. THE Gem_Preset SHALL include fields: name (text, required), description (text)
2. THE Gem_Preset SHALL include field: skillType (select) with choices matching SkillType enum
3. THE Gem_Preset SHALL include field: trigger (select) with choices: "movement", "combat"
4. THE Gem_Preset SHALL include fields: activationChance (number, 0-100), cooldown (number, min 0)
5. THE Gem_Preset SHALL include field: tier (select) with choices: "basic", "advanced", "master", "legendary"

### Requirement 4: Weapon-like Preset

**User Story:** As a developer, I want a Weapon-like preset, so that I can create entities with offensive equipment stats.

#### Acceptance Criteria

1. THE Weapon_Preset SHALL include fields: name (text, required)
2. THE Weapon_Preset SHALL include fields: atk (number), critChance (number, 0-100), critDamage (number, 0-500)
3. THE Weapon_Preset SHALL include fields: armorPen (number, 0-100), lifesteal (number, 0-100), attackRange (number, 0-6)
4. THE Weapon_Preset number fields SHALL have appropriate min/max constraints matching existing Weapon type

### Requirement 5: Preset Integration with Code Generation

**User Story:** As a developer, I want generated code from presets to follow existing game patterns, so that it integrates seamlessly.

#### Acceptance Criteria

1. WHEN generating code from Card_Preset THEN THE Generated code SHALL follow patterns from `src/features/cards/`
2. WHEN generating code from Gem_Preset THEN THE Generated code SHALL follow patterns from `src/features/gems/`
3. WHEN generating code from Weapon_Preset THEN THE Generated code SHALL follow patterns from `src/features/weapons/`
4. THE Generated service code SHALL use localStorage pattern consistent with existing services

### Requirement 6: Preset Customization

**User Story:** As a developer, I want to customize preset fields after applying, so that I can adapt the entity to my specific needs.

#### Acceptance Criteria

1. WHEN preset is applied THEN THE User SHALL be able to add new fields
2. WHEN preset is applied THEN THE User SHALL be able to remove preset fields
3. WHEN preset is applied THEN THE User SHALL be able to modify field properties (label, constraints)
4. THE System SHALL NOT lock any fields after preset application
