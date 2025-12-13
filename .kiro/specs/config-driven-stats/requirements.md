# Requirements Document

## Introduction

Hệ thống hiện tại yêu cầu sửa nhiều file khi thêm stat mới cho card (types, form, list, schemas...). Feature này sẽ refactor sang kiến trúc config-driven, nơi tất cả stat definitions được quản lý tập trung trong một config file duy nhất. Các component sẽ tự động render dựa trên config này, giúp việc thêm/sửa/xóa stats trở nên đơn giản và không cần sửa code component.

## Glossary

- **Stat**: Một thuộc tính số của card (ví dụ: HP, ATK, DEF, critChance...)
- **Stat Config**: Object định nghĩa metadata của một stat (tên, label, range, format, icon...)
- **Stat Tier**: Nhóm phân loại stats (Core Stats, Combat Stats...)
- **Config-Driven**: Kiến trúc nơi behavior và UI được điều khiển bởi configuration thay vì hardcode
- **Stat Registry**: Central config file chứa tất cả stat definitions

## Requirements

### Requirement 1

**User Story:** As a developer, I want to define all card stats in a single configuration file, so that I can add or modify stats without changing multiple component files.

#### Acceptance Criteria

1. THE Stat Registry SHALL contain all stat definitions including: key, label, tier, default value, min/max range, format type, and display icon
2. WHEN a new stat is added to the Stat Registry THEN the Card type interface SHALL automatically include the new stat field
3. WHEN a stat definition is modified in the Stat Registry THEN all components using that stat SHALL reflect the changes without code modification
4. THE Stat Registry SHALL group stats by tier (Core Stats, Combat Stats) for organized display

### Requirement 2

**User Story:** As a developer, I want the CardForm component to automatically generate form fields based on stat config, so that new stats appear in the form without manual coding.

#### Acceptance Criteria

1. WHEN the CardForm renders THEN the component SHALL iterate over Stat Registry to generate form fields dynamically
2. THE CardForm SHALL apply correct input formatting based on stat config (number format, suffix like %, decimal places)
3. THE CardForm SHALL use default values from Stat Registry for each stat field
4. THE CardForm SHALL validate input ranges based on min/max from Stat Registry
5. THE CardForm SHALL group and display stats by their tier with appropriate section headers

### Requirement 3

**User Story:** As a developer, I want the CardList component to display stats dynamically based on config, so that new stats appear in card display without manual coding.

#### Acceptance Criteria

1. WHEN the CardList renders a card THEN the component SHALL display stats based on Stat Registry configuration
2. THE CardList SHALL show appropriate icons for each stat as defined in Stat Registry
3. THE CardList SHALL format stat values according to their format type (number, percentage)
4. THE CardList SHALL support configurable display priority to control which stats show in compact view

### Requirement 4

**User Story:** As a developer, I want the Zod validation schema to be generated from stat config, so that validation rules stay in sync with stat definitions.

#### Acceptance Criteria

1. THE schema generator SHALL create Zod schema fields for each stat in Stat Registry
2. THE generated schema SHALL apply min/max validation from Stat Registry
3. THE generated schema SHALL use default values from Stat Registry
4. WHEN Stat Registry changes THEN the generated schema SHALL reflect those changes automatically

### Requirement 5

**User Story:** As a developer, I want TypeScript types to be derived from stat config, so that type safety is maintained automatically.

#### Acceptance Criteria

1. THE Card interface SHALL be derived from Stat Registry keys
2. THE CardFormInput interface SHALL be derived from Stat Registry with optional fields
3. WHEN a stat is added to Stat Registry THEN TypeScript SHALL recognize the new field without manual type updates
4. THE StatName type SHALL be automatically generated from Stat Registry keys
