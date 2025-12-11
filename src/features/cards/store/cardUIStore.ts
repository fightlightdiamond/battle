import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Card, CardListParams } from "../types";
import type { CardUIStore, CardUIState } from "./types";
import { DEFAULT_PARAMS } from "./types";

const initialState: CardUIState = {
  params: DEFAULT_PARAMS,
  isDeleteDialogOpen: false,
  deletingCard: null,
  isEditDialogOpen: false,
  editingCard: null,
};

/**
 * Zustand store for Card UI state management
 * Manages filter, sort, search, pagination, and dialog states
 * Persists params to localStorage for better UX
 */
export const useCardUIStore = create<CardUIStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // Params
        setSearch: (search: string) =>
          set(
            (state) => ({
              params: { ...state.params, search, page: 1 }, // Reset to page 1 on search
            }),
            false,
            "setSearch"
          ),

        setSortBy: (sortBy: CardListParams["sortBy"]) =>
          set(
            (state) => ({
              params: { ...state.params, sortBy },
            }),
            false,
            "setSortBy"
          ),

        setSortOrder: (sortOrder: CardListParams["sortOrder"]) =>
          set(
            (state) => ({
              params: { ...state.params, sortOrder },
            }),
            false,
            "setSortOrder"
          ),

        setPage: (page: number) =>
          set(
            (state) => ({
              params: { ...state.params, page },
            }),
            false,
            "setPage"
          ),

        setPageSize: (pageSize: number) =>
          set(
            (state) => ({
              params: { ...state.params, pageSize, page: 1 }, // Reset to page 1 on pageSize change
            }),
            false,
            "setPageSize"
          ),

        setParams: (params: Partial<CardListParams>) =>
          set(
            (state) => ({
              params: { ...state.params, ...params },
            }),
            false,
            "setParams"
          ),

        resetParams: () =>
          set({ params: DEFAULT_PARAMS }, false, "resetParams"),

        // Delete dialog
        openDeleteDialog: (card: Card) =>
          set(
            { isDeleteDialogOpen: true, deletingCard: card },
            false,
            "openDeleteDialog"
          ),

        closeDeleteDialog: () =>
          set(
            { isDeleteDialogOpen: false, deletingCard: null },
            false,
            "closeDeleteDialog"
          ),

        // Edit dialog
        openEditDialog: (card: Card) =>
          set(
            { isEditDialogOpen: true, editingCard: card },
            false,
            "openEditDialog"
          ),

        closeEditDialog: () =>
          set(
            { isEditDialogOpen: false, editingCard: null },
            false,
            "closeEditDialog"
          ),
      }),
      {
        name: "card-ui-store",
        // Only persist params, not dialog states
        partialize: (state) => ({ params: state.params }),
      }
    ),
    { name: "card-ui-store" }
  )
);

// Selectors
export const selectParams = (state: CardUIStore) => state.params;
export const selectSearch = (state: CardUIStore) => state.params.search;
export const selectSortBy = (state: CardUIStore) => state.params.sortBy;
export const selectSortOrder = (state: CardUIStore) => state.params.sortOrder;
export const selectPage = (state: CardUIStore) => state.params.page;
export const selectPageSize = (state: CardUIStore) => state.params.pageSize;
export const selectDeleteDialog = (state: CardUIStore) => ({
  isOpen: state.isDeleteDialogOpen,
  card: state.deletingCard,
});
export const selectEditDialog = (state: CardUIStore) => ({
  isOpen: state.isEditDialogOpen,
  card: state.editingCard,
});
