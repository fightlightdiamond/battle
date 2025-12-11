# Implementation Plan

- [x] 1. Set up dependencies and project structure

  - Install react-router-dom, zustand, idb (IndexedDB wrapper), and fast-check for testing
  - Create folder structure: `src/features/cards/` with subfolders for components, hooks, services, store, types, pages
  - _Requirements: 5.1, 5.2_

- [x] 2. Implement Card types and validation schemas

  - [x] 2.1 Create Card types and interfaces
    - Define Card, CardFormInput, CardUIState interfaces in `src/features/cards/types.ts`
    - _Requirements: 1.1, 2.1_
  - [x] 2.2 Create Zod validation schemas
    - Implement cardSchema and cardFormSchema with all validation rules (name, ATK, HP, image)
    - _Requirements: 2.3, 2.4, 2.5, 2.7, 2.8_
  - [x] 2.3 Write property test for validation
    - **Property 3: Invalid card validation rejection**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.7, 2.8**

- [x] 3. Implement IndexedDB service layer

  - [x] 3.1 Create IndexedDB database setup
    - Initialize database with `card-game-db` name and `cards` object store
    - Handle database versioning and migrations
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 3.2 Implement CardService CRUD operations
    - Create `getAll`, `getById`, `create`, `update`, `delete` methods
    - Implement `getPaginated` with search, sort, pagination support
    - Handle Blob storage for images
    - _Requirements: 1.5, 1.6, 1.7, 1.8, 1.9, 2.2, 3.2, 4.2, 5.1_
  - [x] 3.3 Write property test for serialization round-trip
    - **Property 1: Card serialization round-trip**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Zustand UI state store

  - [x] 5.1 Create card UI store
    - Implement `useCardUIStore` for delete dialog state management only
    - Add actions: openDeleteDialog, closeDeleteDialog
    - _Requirements: 4.1_

- [x] 6. Implement TanStack Query hooks

  - [x] 6.1 Create query hooks for card operations
    - Implement `useCards` query hook with search, sort, pagination params
    - Implement `useCard` query hook for fetching single card by id
    - Implement `useCreateCard`, `useUpdateCard`, `useDeleteCard` mutation hooks
    - Handle query invalidation on mutations
    - _Requirements: 1.1, 1.5, 1.6, 1.7, 2.2, 3.2, 4.2_
  - [x] 6.2 Write property test for card creation
    - **Property 2: Valid card creation adds to list**
    - **Validates: Requirements 2.2**
  - [x] 6.3 Write property test for card update
    - **Property 4: Card update preserves identity**
    - **Validates: Requirements 3.2**
  - [x] 6.4 Write property test for card deletion
    - **Property 5: Card deletion removes from list**
    - **Validates: Requirements 4.2**

- [x] 7. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement UI components and pages

  - [x] 8.1 Create SearchBar component
    - Debounced search input
    - Updates URL search param via useSearchParams
    - _Requirements: 1.5_
  - [x] 8.2 Create SortControls component
    - Dropdown/buttons for sortBy (name, ATK, HP) and sortOrder (asc, desc)
    - Updates URL params
    - _Requirements: 1.6_
  - [x] 8.3 Create Pagination component
    - Previous/Next buttons, page numbers
    - Updates URL page param
    - _Requirements: 1.7, 1.8, 1.9_
  - [x] 8.4 Create CardList component
    - Display cards in a grid with image, name, ATK, HP
    - Show placeholder image for cards without image
    - Implement empty state and loading state
    - Edit button links to `/cards/:id/edit`
    - Delete button opens confirmation dialog
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 8.5 Create CardForm component
    - Build form with React Hook Form and Zod resolver
    - Add fields: name, ATK, HP, image upload with drag-and-drop
    - Show image preview
    - Display validation errors inline
    - Handle create and edit modes via props
    - Cancel button navigates back to `/cards`
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.3, 3.4, 3.5_
  - [x] 8.6 Create DeleteConfirmDialog component
    - Show confirmation message with card name
    - Implement confirm and cancel actions
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 8.7 Create CardListPage
    - Render SearchBar, SortControls, CardList, Pagination, DeleteConfirmDialog
    - Read/write URL query params for search, sort, page
    - Add "Add Card" button linking to `/cards/new`
    - _Requirements: 1.1, 1.5, 1.6, 1.7, 2.1_
  - [x] 8.8 Create CardCreatePage
    - Render CardForm in create mode
    - On success navigate to `/cards`
    - _Requirements: 2.1, 2.6_
  - [x] 8.9 Create CardEditPage
    - Fetch card by id from URL params
    - Render CardForm in edit mode with pre-filled data
    - On success navigate to `/cards`
    - _Requirements: 3.1, 3.4_

- [x] 9. Set up routing and integrate into App

  - [x] 9.1 Configure React Router
    - Set up BrowserRouter in main.tsx
    - Define routes: `/cards`, `/cards/new`, `/cards/:id/edit`
    - Add redirect from `/` to `/cards`
    - _Requirements: 1.1_
  - [x] 9.2 Update App.tsx
    - Set up QueryClientProvider
    - Render router outlet
    - _Requirements: 1.1_

- [x] 10. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Write remaining property tests

  - [ ] 11.1 Write property test for persistence round-trip
    - **Property 6: Persistence round-trip**
    - **Validates: Requirements 5.1, 5.2**
  - [ ] 11.2 Write property test for rendering completeness
    - **Property 7: Card list rendering completeness**
    - **Validates: Requirements 1.1, 1.4**
  - [ ] 11.3 Write property test for image update
    - **Property 8: Image update replaces existing**
    - **Validates: Requirements 3.5**
  - [ ] 11.4 Write property test for search filtering
    - **Property 9: Search filters by name**
    - **Validates: Requirements 1.5**
  - [ ] 11.5 Write property test for sort ordering
    - **Property 10: Sort ordering correctness**
    - **Validates: Requirements 1.6**
  - [ ] 11.6 Write property test for pagination
    - **Property 11: Pagination correctness**
    - **Validates: Requirements 1.7, 1.8, 1.9**

- [ ] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
