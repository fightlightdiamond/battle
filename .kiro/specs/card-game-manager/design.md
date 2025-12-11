# Design Document: Card Game Manager

## Overview

Card Game Manager là một ứng dụng React đơn giản cho phép quản lý thẻ bài với các thao tác CRUD. Ứng dụng sử dụng:

- **React** với TypeScript
- **React Router** cho client-side routing
- **TanStack Query** cho server state management và caching
- **React Hook Form** + **Zod** cho form handling và validation
- **Zustand** cho UI state management (delete confirmation dialog)
- **IndexedDB** (via idb library) cho persistent storage
- **shadcn/ui** cho UI components

## Architecture

```mermaid
graph TB
    subgraph Router
        ListPage[/cards - Card List Page]
        CreatePage[/cards/new - Create Card Page]
        EditPage[/cards/:id/edit - Edit Card Page]
    end

    subgraph UI Layer
        CardList[Card List Component]
        CardForm[Card Form Component]
        DeleteDialog[Delete Confirmation Dialog]
    end

    subgraph State Management
        Zustand[Zustand Store<br/>Delete Dialog State]
        TanStack[TanStack Query<br/>Data Cache]
    end

    subgraph Data Layer
        CardService[Card Service]
        IndexedDB[(IndexedDB)]
    end

    ListPage --> CardList
    CreatePage --> CardForm
    EditPage --> CardForm
    CardList --> TanStack
    CardList --> DeleteDialog
    CardForm --> TanStack
    DeleteDialog --> Zustand
    TanStack --> CardService
    CardService --> IndexedDB
```

## Routes

| Path              | Page           | Description                                           |
| ----------------- | -------------- | ----------------------------------------------------- |
| `/cards`          | CardListPage   | Hiển thị danh sách cards với search, sort, pagination |
| `/cards/new`      | CardCreatePage | Form tạo card mới                                     |
| `/cards/:id/edit` | CardEditPage   | Form chỉnh sửa card                                   |

## Query Parameters (CardListPage)

| Param       | Type                    | Default | Description            |
| ----------- | ----------------------- | ------- | ---------------------- |
| `search`    | string                  | ""      | Tìm kiếm theo tên card |
| `sortBy`    | "name" \| "atk" \| "hp" | "name"  | Field để sort          |
| `sortOrder` | "asc" \| "desc"         | "asc"   | Thứ tự sort            |
| `page`      | number                  | 1       | Trang hiện tại         |

## Components and Interfaces

### Pages

1. **CardListPage** - `/cards`

   - Renders SearchBar, SortControls, CardList, Pagination, DeleteConfirmDialog
   - "Add Card" button navigates to `/cards/new`
   - Manages URL query params for search, sort, pagination

2. **CardCreatePage** - `/cards/new`

   - Renders CardForm in create mode
   - On success, navigates back to `/cards`

3. **CardEditPage** - `/cards/:id/edit`
   - Fetches card by id from URL params
   - Renders CardForm in edit mode with pre-filled data
   - On success, navigates back to `/cards`

### UI Components

1. **SearchBar** - Search input component

   - Debounced search input
   - Updates URL search param

2. **SortControls** - Sort dropdown/buttons

   - Sort by: name, ATK, HP
   - Sort order: ascending, descending
   - Updates URL sortBy and sortOrder params

3. **CardList** - Displays cards in a grid/table

   - Shows card image, name, ATK, HP
   - Edit button navigates to `/cards/:id/edit`
   - Delete button opens confirmation dialog
   - Empty state when no cards
   - Loading state
   - Placeholder image for cards without image

4. **Pagination** - Pagination controls

   - Previous/Next buttons
   - Page numbers
   - Current page indicator
   - Updates URL page param

5. **CardForm** - Form component for create/edit

   - Fields: name, ATK, HP, image upload
   - Image preview with drag-and-drop support
   - Accepts PNG, JPG, WEBP (max 2MB)
   - Validation feedback
   - Submit and Cancel buttons
   - Cancel navigates back to `/cards`

6. **DeleteConfirmDialog** - Confirmation modal
   - Confirm and Cancel buttons
   - Managed by Zustand store

### Interfaces

```typescript
// Card entity
interface Card {
  id: string;
  name: string;
  atk: number;
  hp: number;
  imageBlob: Blob | null; // Stored as Blob in IndexedDB
  imageUrl: string | null; // Object URL for display (generated at runtime)
  createdAt: number;
  updatedAt: number;
}

// Form input (without id and timestamps)
interface CardFormInput {
  name: string;
  atk: number;
  hp: number;
  image: File | null;
}

// Zustand UI state (for delete dialog only, form uses router)
interface CardUIState {
  isDeleteDialogOpen: boolean;
  deletingCard: Card | null;
  openDeleteDialog: (card: Card) => void;
  closeDeleteDialog: () => void;
}

// Query params for card list
interface CardListParams {
  search: string;
  sortBy: "name" | "atk" | "hp";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}

// Paginated response
interface PaginatedCards {
  cards: Card[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

## Data Models

### Card Schema (Zod)

```typescript
import { z } from "zod";

const cardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(100),
  atk: z.number().int().min(0, "ATK must be non-negative"),
  hp: z.number().int().min(1, "HP must be at least 1"),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const cardFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  atk: z.number().int().min(0, "ATK must be non-negative"),
  hp: z.number().int().min(1, "HP must be at least 1"),
  image: z
    .instanceof(File)
    .refine(
      (file) => ["image/png", "image/jpeg", "image/webp"].includes(file.type),
      "Only PNG, JPG, WEBP allowed"
    )
    .refine(
      (file) => file.size <= 2 * 1024 * 1024,
      "Image must be less than 2MB"
    )
    .nullable(),
});
```

### IndexedDB Schema

- Database name: `card-game-db`
- Object store: `cards`
- Key path: `id`
- Indexes: `name`, `createdAt`

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Card serialization round-trip

_For any_ valid Card object, serializing to IndexedDB and then deserializing back SHALL produce an equivalent Card object with all properties preserved exactly.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 2: Valid card creation adds to list

_For any_ valid CardFormInput (non-empty name, ATK >= 0, HP >= 1), creating a card SHALL result in the card list containing a card with those exact values.

**Validates: Requirements 2.2**

### Property 3: Invalid card validation rejection

_For any_ CardFormInput with invalid values (empty/whitespace name, negative ATK, HP < 1, invalid image type, or image > 2MB), the validation SHALL reject the input and return appropriate error messages.

**Validates: Requirements 2.3, 2.4, 2.5, 2.7, 2.8**

### Property 4: Card update preserves identity

_For any_ existing Card and valid CardFormInput, updating the card SHALL preserve the card's id while updating name, ATK, and HP to the new values.

**Validates: Requirements 3.2**

### Property 5: Card deletion removes from list

_For any_ existing Card, deleting it SHALL result in the card list no longer containing that card's id.

**Validates: Requirements 4.2**

### Property 6: Persistence round-trip

_For any_ sequence of CRUD operations, reloading the application SHALL restore the exact same card list state from IndexedDB.

**Validates: Requirements 5.1, 5.2**

### Property 7: Card list rendering completeness

_For any_ list of Cards, the rendered card list SHALL display all cards with their correct image (or placeholder), name, ATK, and HP values.

**Validates: Requirements 1.1, 1.4**

### Property 8: Image update replaces existing

_For any_ existing Card with an image, uploading a new image during edit SHALL replace the existing image with the new one.

**Validates: Requirements 3.5**

### Property 9: Search filters by name

_For any_ search term and list of Cards, the filtered result SHALL contain only cards whose name includes the search term (case-insensitive).

**Validates: Requirements 1.5**

### Property 10: Sort ordering correctness

_For any_ list of Cards and sort configuration (sortBy, sortOrder), the sorted result SHALL be correctly ordered by the specified field in the specified direction.

**Validates: Requirements 1.6**

### Property 11: Pagination correctness

_For any_ list of Cards and page parameters, the paginated result SHALL return the correct subset of cards for the requested page.

**Validates: Requirements 1.7, 1.8, 1.9**

## Error Handling

1. **Validation Errors**

   - Display inline error messages under form fields
   - Prevent form submission until errors are resolved
   - Use Zod validation with React Hook Form resolver

2. **IndexedDB Errors**

   - Catch and display user-friendly error messages via toast
   - Log detailed errors to console for debugging
   - Gracefully degrade to empty state if DB unavailable

3. **Query Errors**
   - TanStack Query handles retry logic
   - Display error state in UI with retry option

## Testing Strategy

### Property-Based Testing Library

Use **fast-check** for property-based testing in TypeScript/JavaScript.

### Unit Tests

- Test Zod schema validation with specific examples
- Test CardService CRUD operations
- Test Zustand store actions

### Property-Based Tests

Each correctness property will be implemented as a property-based test using fast-check:

1. **Property 1 (Round-trip)**: Generate random Card objects, serialize/deserialize, assert equality
2. **Property 2 (Creation)**: Generate valid CardFormInput, create card, assert list contains it
3. **Property 3 (Validation)**: Generate invalid inputs, assert validation fails with correct errors
4. **Property 4 (Update)**: Generate Card + valid updates, assert id preserved and values updated
5. **Property 5 (Deletion)**: Generate Card, delete, assert not in list
6. **Property 6 (Persistence)**: Generate CRUD sequence, reload, assert state matches
7. **Property 7 (Rendering)**: Generate Card list, render, assert all data displayed
8. **Property 8 (Image Update)**: Generate Card with image, update with new image, assert old image replaced
9. **Property 9 (Search)**: Generate cards and search term, filter, assert all results contain search term
10. **Property 10 (Sort)**: Generate cards and sort config, sort, assert correct ordering
11. **Property 11 (Pagination)**: Generate cards and page params, paginate, assert correct subset

Configuration:

- Minimum 100 iterations per property test
- Each test tagged with: `**Feature: card-game-manager, Property {number}: {property_text}**`
