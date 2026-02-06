# Implementation Plan: Low-Code Builder V2

## Overview

Nâng cấp Low-Code Builder để sinh code thật ra file và tạo React components hoàn chỉnh. Implement các code generators mới và export functionality.

## Tasks

- [x] 1. Implement Component Generator
  - [x] 1.1 Create componentGenerator.ts with generateFormComponent()
    - Generate Form component with react-hook-form + zod
    - Map field types to appropriate form inputs
    - _Requirements: 1.1, 1.4_
  - [x] 1.2 Add generateCardComponent() function
    - Generate Card component displaying all fields
    - Use shadcn Card component
    - _Requirements: 1.3, 1.4_
  - [x] 1.3 Add generateListComponent() function
    - Generate List component with mapping over items
    - Include delete button per item
    - _Requirements: 1.2, 1.4_
  - [x] 1.4 Write property test for component generation
    - **Property 1: All Component Types Generated**
    - **Property 2: Components Use shadcn/ui**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 2. Implement Page Generator
  - [x] 2.1 Create pageGenerator.ts with generateListPage()
    - Generate ListPage with list component and create button
    - Use AppLayout
    - _Requirements: 2.1, 2.4_
  - [x] 2.2 Add generateCreatePage() function
    - Generate CreatePage with form component
    - Include navigation back to list
    - _Requirements: 2.2, 2.4_
  - [x] 2.3 Add generateEditPage() function
    - Generate EditPage with form component and id param
    - Include loading state handling
    - _Requirements: 2.3, 2.4_
  - [x] 2.4 Write property test for page generation
    - **Property 3: All Page Types Generated**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 3. Implement Service Generator
  - [x] 3.1 Create serviceGenerator.ts with generateService()
    - Generate CRUD functions: getAll, getById, create, update, delete
    - Use localStorage for persistence
    - Include proper TypeScript types
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 3.2 Write property test for service generation
    - **Property 4: Service Has Complete CRUD**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 4. Checkpoint - Ensure generator tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Feature Exporter
  - [x] 5.1 Create featureExporter.ts with generateFeatureFiles()
    - Generate all files with correct paths
    - Include types, components, pages, services, index files
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 5.2 Add generateRouteConfig() function
    - Generate route configuration code for main.tsx
    - Include list, create, edit routes
    - _Requirements: 6.1, 6.2_
  - [x] 5.3 Write property test for feature export
    - **Property 5: Export Generates All Required Files**
    - **Property 6: Route Configuration Generated**
    - **Validates: Requirements 4.1-4.5, 6.1, 6.2**

- [x] 6. Update UI Components
  - [x] 6.1 Extend CodePreview with new tabs
    - Add tabs: Form, Card, List, ListPage, Service
    - Wire up to new generators
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 6.2 Create ExportPanel component
    - Show file structure preview
    - Export button with download/copy functionality
    - Show route config to copy
    - _Requirements: 4.6, 4.7, 6.1_
  - [x] 6.3 Update EntityBuilderPage
    - Add ExportPanel to layout
    - Wire up export functionality
    - _Requirements: 4.1_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests are required
- Use existing `fast-check` for property testing
- Follow patterns from existing lowcode feature
- Generated code should use existing shadcn/ui components
- Export will use browser download API (zip file) or copy to clipboard
