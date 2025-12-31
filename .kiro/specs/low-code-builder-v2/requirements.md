# Requirements Document

## Introduction

Nâng cấp Low-Code Builder để có thể sinh code thật ra file và sinh thêm React Component UI/UX. Hệ thống sẽ tạo ra một feature folder hoàn chỉnh với types, components, pages có thể chạy được ngay trong project.

## Glossary

- **Code_Exporter**: Module xuất code ra file thật trong project
- **Component_Generator**: Module sinh React component từ EntityDefinition
- **Feature_Generator**: Module sinh toàn bộ feature folder structure
- **Generated_Feature**: Folder chứa code được sinh ra (types, components, pages, services)

## Requirements

### Requirement 1: Component Code Generation

**User Story:** As a developer, I want the system to generate React component code, so that I can have a complete UI for my entity.

#### Acceptance Criteria

1. WHEN Entity_Definition exists THEN THE Component_Generator SHALL produce a Form component code
2. WHEN Entity_Definition exists THEN THE Component_Generator SHALL produce a List component code
3. WHEN Entity_Definition exists THEN THE Component_Generator SHALL produce a Card component code
4. THE Component_Generator SHALL use existing shadcn/ui components (Input, Select, Switch, Button, Card)
5. THE Component_Generator SHALL generate components that follow project patterns from `src/features/cards/`

### Requirement 2: Page Code Generation

**User Story:** As a developer, I want the system to generate page components, so that I can have complete CRUD pages.

#### Acceptance Criteria

1. WHEN Entity_Definition exists THEN THE Component_Generator SHALL produce a ListPage component
2. WHEN Entity_Definition exists THEN THE Component_Generator SHALL produce a CreatePage component
3. WHEN Entity_Definition exists THEN THE Component_Generator SHALL produce an EditPage component
4. THE Generated pages SHALL use AppLayout component for consistent layout
5. THE Generated pages SHALL include proper routing integration code

### Requirement 3: Service Code Generation

**User Story:** As a developer, I want the system to generate service layer code, so that I can have data persistence.

#### Acceptance Criteria

1. WHEN Entity_Definition exists THEN THE Code_Generator SHALL produce a service file with CRUD operations
2. THE Generated service SHALL use localStorage for data persistence (similar to existing patterns)
3. THE Generated service SHALL include proper TypeScript types

### Requirement 4: Export to File System

**User Story:** As a developer, I want to export generated code to actual files, so that I can use them in my project.

#### Acceptance Criteria

1. WHEN user clicks "Export Feature" THEN THE Code_Exporter SHALL create feature folder structure
2. THE Code_Exporter SHALL create files: types/[entity].ts, components/[Entity]Form.tsx, components/[Entity]Card.tsx, components/[Entity]List.tsx
3. THE Code_Exporter SHALL create page files: pages/[Entity]ListPage.tsx, pages/[Entity]CreatePage.tsx, pages/[Entity]EditPage.tsx
4. THE Code_Exporter SHALL create service file: services/[entity]Service.ts
5. THE Code_Exporter SHALL create index.ts files for proper exports
6. WHEN export completes THEN THE System SHALL show success message with file paths
7. IF export fails THEN THE System SHALL show error message with details

### Requirement 5: Preview All Generated Code

**User Story:** As a developer, I want to preview all generated code before exporting, so that I can verify it meets my needs.

#### Acceptance Criteria

1. THE CodePreview SHALL have tabs for: Interface, Schema, Form, Card, List, ListPage, Service
2. WHEN user switches tabs THEN THE CodePreview SHALL display corresponding generated code
3. THE CodePreview SHALL allow copying individual code sections

### Requirement 6: Route Generation

**User Story:** As a developer, I want the system to generate route configuration, so that I can easily integrate the new feature.

#### Acceptance Criteria

1. WHEN export completes THEN THE System SHALL display route configuration code to add to main.tsx
2. THE Generated routes SHALL follow existing project routing patterns
