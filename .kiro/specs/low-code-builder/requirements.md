# Requirements Document

## Introduction

Hệ thống Low-Code Builder MVP cho phép người dùng tạo entity definitions thông qua giao diện đơn giản, tự động sinh TypeScript types, Zod schemas và React forms. MVP tập trung vào core functionality với UI tối giản.

## Glossary

- **Entity_Builder**: Giao diện cho phép người dùng định nghĩa cấu trúc entity
- **Entity_Definition**: Cấu hình JSON mô tả cấu trúc của một entity (tên, fields)
- **Field_Definition**: Cấu hình của một field (key, label, type, validation)
- **Code_Generator**: Module sinh TypeScript code từ Entity_Definition
- **Dynamic_Form**: Form component render động từ Entity_Definition

## Requirements

### Requirement 1: Entity Definition UI

**User Story:** As a developer, I want to define entity structure through a simple form, so that I can create new data types quickly.

#### Acceptance Criteria

1. WHEN a user opens the Entity Builder page THEN THE Entity_Builder SHALL display a form to enter entity name
2. WHEN a user clicks "Add Field" THEN THE Entity_Builder SHALL add a new field row with type selector
3. WHEN a user fills field details (key, label, type) THEN THE Entity_Builder SHALL update Entity_Definition
4. WHEN a user clicks remove on a field THEN THE Entity_Builder SHALL remove that field from Entity_Definition
5. THE Entity_Builder SHALL support field types: text, number, select, boolean

### Requirement 2: Code Generation

**User Story:** As a developer, I want the system to generate TypeScript code, so that I can copy and use it in my project.

#### Acceptance Criteria

1. WHEN Entity_Definition changes THEN THE Code_Generator SHALL produce TypeScript interface code
2. WHEN Entity_Definition changes THEN THE Code_Generator SHALL produce Zod schema code
3. FOR ALL valid Entity_Definitions, parsing then printing the schema SHALL produce equivalent validation (round-trip)
4. WHEN a user clicks "Copy Code" THEN THE System SHALL copy generated code to clipboard

### Requirement 3: Dynamic Form Preview

**User Story:** As a developer, I want to preview the generated form, so that I can verify my entity design works.

#### Acceptance Criteria

1. WHEN Entity_Definition exists THEN THE Dynamic_Form SHALL render a working form
2. WHEN form is submitted with valid data THEN THE Dynamic_Form SHALL display the submitted values
3. WHEN form is submitted with invalid data THEN THE Dynamic_Form SHALL show validation errors
4. THE Dynamic_Form SHALL use existing shadcn/ui components

### Requirement 4: Entity Persistence

**User Story:** As a developer, I want to save entity definitions, so that I can reuse them later.

#### Acceptance Criteria

1. WHEN a user clicks "Save" THEN THE System SHALL persist Entity_Definition to localStorage
2. WHEN Entity Builder loads THEN THE System SHALL show list of saved entities
3. WHEN a user selects a saved entity THEN THE Entity_Builder SHALL load it for editing
4. WHEN a user clicks "Delete" on saved entity THEN THE System SHALL remove it from storage
