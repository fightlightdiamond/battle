// Card entity stored in IndexedDB
export interface Card {
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
export interface CardFormInput {
  name: string;
  atk: number;
  hp: number;
  image: File | null;
}

// Zustand UI state (for delete dialog only)
export interface CardUIState {
  isDeleteDialogOpen: boolean;
  deletingCard: Card | null;
  openDeleteDialog: (card: Card) => void;
  closeDeleteDialog: () => void;
}

// Query params for card list
export interface CardListParams {
  search: string;
  sortBy: "name" | "atk" | "hp";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}

// Paginated response
export interface PaginatedCards {
  cards: Card[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Re-export schemas
export * from "./schemas";
