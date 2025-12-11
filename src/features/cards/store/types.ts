import type { Card, CardListParams } from "../types";

// ============================================
// Card CRUD Store Types
// ============================================

export interface CardState {
  // Data
  cards: Card[];
  selectedCard: Card | null;
  total: number;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error state
  error: string | null;
}

export interface CardActions {
  // CRUD operations
  setCards: (cards: Card[], total: number) => void;
  addCard: (card: Card) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  removeCard: (id: string) => void;

  // Selection
  selectCard: (card: Card | null) => void;

  // Loading states
  setLoading: (isLoading: boolean) => void;
  setCreating: (isCreating: boolean) => void;
  setUpdating: (isUpdating: boolean) => void;
  setDeleting: (isDeleting: boolean) => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Reset
  reset: () => void;
}

export type CardStore = CardState & CardActions;

// ============================================
// Card UI Store Types (filter/sort/search/dialogs)
// ============================================

export interface CardUIState {
  // Filter/Sort/Search params
  params: CardListParams;

  // Delete dialog
  isDeleteDialogOpen: boolean;
  deletingCard: Card | null;

  // Edit dialog (optional, for inline editing)
  isEditDialogOpen: boolean;
  editingCard: Card | null;
}

export interface CardUIActions {
  // Params
  setSearch: (search: string) => void;
  setSortBy: (sortBy: CardListParams["sortBy"]) => void;
  setSortOrder: (sortOrder: CardListParams["sortOrder"]) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setParams: (params: Partial<CardListParams>) => void;
  resetParams: () => void;

  // Delete dialog
  openDeleteDialog: (card: Card) => void;
  closeDeleteDialog: () => void;

  // Edit dialog
  openEditDialog: (card: Card) => void;
  closeEditDialog: () => void;
}

export type CardUIStore = CardUIState & CardUIActions;

// ============================================
// Default values
// ============================================

export const DEFAULT_PARAMS: CardListParams = {
  search: "",
  sortBy: "name",
  sortOrder: "asc",
  page: 1,
  pageSize: 10,
};
