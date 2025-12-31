# Implementation Plan: Low-Code Builder MVP

## Overview

Triển khai hệ thống Low-Code Builder MVP cho phép tạo entity definitions, sinh TypeScript/Zod code, và preview form động. Sử dụng React, TypeScript, Zod, và shadcn/ui components có sẵn trong project.

## Tasks

- [x] 1. Set up feature structure and core types
  - [x] 1.1 Create feature folder structure `src/features/lowcode/`
    - Create folders: `types/`, `components/`, `services/`, `pages/`, `store/`
    - _Requirements: 1.1_
  - [x] 1.2 Define core TypeScript types
    - Create `types/entityDefinition.ts` with FieldType, FieldDefinition, EntityDefinition interfaces
    - _Requirements: 1.1, 1.5_
  - [x] 1.3 Write unit tests for type validation helpers
    - Test isValidFieldKey, isValidEntityName functions
    - _Requirements: 1.3_

- [x] 2. Implement Code Generator
  - [x] 2.1 Create interface generator
    - Create `services/codeGenerator.ts` with `generateInterface()` function
    - Map field types to TypeScript types
    - _Requirements: 2.1_
  - [x] 2.2 Create Zod schema generator
    - Add `generateZodSchema()` function to generate schema string
    - Add `createRuntimeSchema()` function to create actual Zod schema object
    - _Requirements: 2.2, 2.3_
  - [x] 2.3 Write property test for schema round-trip
    - **Property 6: Schema Round-Trip Validation**
    - Generate random EntityDefinitions, create runtime schema, validate test data
    - **Validates: Requirements 2.3**

- [x] 3. Checkpoint - Ensure code generator tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Entity Definition Store
  - [x] 4.1 Create Zustand store for entity definition
    - Create `store/entityStore.ts` with state: currentEntity, savedEntities
    - Actions: setEntityName, addField, updateField, removeField, saveEntity, loadEntity, deleteEntity
    - _Requirements: 1.2, 1.3, 1.4, 4.1, 4.3, 4.4_
  - [x] 4.2 Create localStorage persistence service
    - Create `services/entityStorage.ts` with save, load, delete, list functions
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 4.3 Write property test for persistence round-trip
    - **Property 8: Persistence Round-Trip**
    - Save random EntityDefinitions, load back, verify equality
    - **Validates: Requirements 4.1, 4.3**

- [x] 5. Implement UI Components
  - [x] 5.1 Create FieldEditor component
    - Create `components/FieldEditor.tsx`
    - Inputs for key, label, type selector, required toggle
    - Type-specific options (min/max for number, choices for select)
    - Remove button
    - _Requirements: 1.3, 1.4, 1.5_
  - [x] 5.2 Create CodePreview component
    - Create `components/CodePreview.tsx`
    - Tabs for Interface and Schema code
    - Syntax highlighting with code block
    - Copy to clipboard button
    - _Requirements: 2.1, 2.2, 2.4_
  - [x] 5.3 Create DynamicForm component
    - Create `components/DynamicForm.tsx`
    - Render form fields based on EntityDefinition
    - Use react-hook-form with runtime Zod schema
    - Display validation errors and submitted data
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 5.4 Write property test for dynamic form rendering
    - **Property 7: Dynamic Form Renders and Validates**
    - Generate random EntityDefinitions, verify form renders correct number of fields
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 6. Checkpoint - Ensure UI component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement EntityBuilderPage
  - [x] 7.1 Create EntityBuilderPage layout
    - Create `pages/EntityBuilderPage.tsx`
    - Two-column layout: Editor (left) | Preview (right)
    - Entity name input, field list, add field button
    - _Requirements: 1.1, 1.2_
  - [x] 7.2 Create SavedEntitiesList component
    - Create `components/SavedEntitiesList.tsx`
    - List saved entities with load and delete buttons
    - _Requirements: 4.2, 4.3, 4.4_
  - [x] 7.3 Wire up page with store and components
    - Connect EntityBuilderPage to entityStore
    - Integrate FieldEditor, CodePreview, DynamicForm, SavedEntitiesList
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 4.1, 4.2_

- [x] 8. Add routing and navigation
  - [x] 8.1 Add route to main.tsx
    - Add `/lowcode` route pointing to EntityBuilderPage
    - _Requirements: 1.1_
  - [x] 8.2 Add navigation link (optional)
    - Add link to low-code builder in app navigation if exists
    - _Requirements: 1.1_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests are required
- Project already has `fast-check` for property testing
- Use existing shadcn/ui components: Input, Select, Switch, Button, Tabs, Card
- Follow existing patterns from `src/features/cards/` for consistency
