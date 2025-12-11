// Store exports
export {
  useCardStore,
  selectCards,
  selectSelectedCard,
  selectTotal,
  selectIsLoading,
  selectIsCreating,
  selectIsUpdating,
  selectIsDeleting,
  selectError,
  selectIsAnyLoading,
} from "./cardStore";
export {
  useCardUIStore,
  selectParams,
  selectSearch,
  selectSortBy,
  selectSortOrder,
  selectPage,
  selectPageSize,
  selectDeleteDialog,
  selectEditDialog,
} from "./cardUIStore";

// Type exports
export type {
  CardStore,
  CardState,
  CardActions,
  CardUIStore,
  CardUIState,
  CardUIActions,
} from "./types";
export { DEFAULT_PARAMS } from "./types";

// ============================================
// Custom Hooks for Derived State & Operations
// ============================================

import { useMemo, useCallback } from "react";
import { useCardStore } from "./cardStore";
import { useCardUIStore } from "./cardUIStore";
import type { Card } from "../types";

/**
 * Hook for card list with derived state
 * Combines data store with UI store for complete list state
 */
export function useCardListState() {
  const cards = useCardStore((s) => s.cards);
  const total = useCardStore((s) => s.total);
  const isLoading = useCardStore((s) => s.isLoading);
  const error = useCardStore((s) => s.error);
  const params = useCardUIStore((s) => s.params);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / params.pageSize)),
    [total, params.pageSize]
  );

  const isEmpty = useMemo(
    () => !isLoading && cards.length === 0,
    [isLoading, cards.length]
  );

  const hasNextPage = useMemo(
    () => params.page < totalPages,
    [params.page, totalPages]
  );

  const hasPrevPage = useMemo(() => params.page > 1, [params.page]);

  return {
    cards,
    total,
    totalPages,
    isLoading,
    error,
    params,
    isEmpty,
    hasNextPage,
    hasPrevPage,
  };
}

/**
 * Hook for delete dialog operations
 * Combines UI state with actions
 */
export function useDeleteDialog() {
  const isOpen = useCardUIStore((s) => s.isDeleteDialogOpen);
  const card = useCardUIStore((s) => s.deletingCard);
  const openDialog = useCardUIStore((s) => s.openDeleteDialog);
  const closeDialog = useCardUIStore((s) => s.closeDeleteDialog);
  const isDeleting = useCardStore((s) => s.isDeleting);

  return {
    isOpen,
    card,
    isDeleting,
    open: openDialog,
    close: closeDialog,
  };
}

/**
 * Hook for edit dialog operations
 */
export function useEditDialog() {
  const isOpen = useCardUIStore((s) => s.isEditDialogOpen);
  const card = useCardUIStore((s) => s.editingCard);
  const openDialog = useCardUIStore((s) => s.openEditDialog);
  const closeDialog = useCardUIStore((s) => s.closeEditDialog);
  const isUpdating = useCardStore((s) => s.isUpdating);

  return {
    isOpen,
    card,
    isUpdating,
    open: openDialog,
    close: closeDialog,
  };
}

/**
 * Hook for search/filter/sort operations
 */
export function useCardFilters() {
  const params = useCardUIStore((s) => s.params);
  const setSearch = useCardUIStore((s) => s.setSearch);
  const setSortBy = useCardUIStore((s) => s.setSortBy);
  const setSortOrder = useCardUIStore((s) => s.setSortOrder);
  const resetParams = useCardUIStore((s) => s.resetParams);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(params.sortOrder === "asc" ? "desc" : "asc");
  }, [params.sortOrder, setSortOrder]);

  const hasActiveFilters = useMemo(
    () =>
      params.search !== "" ||
      params.sortBy !== "name" ||
      params.sortOrder !== "asc",
    [params.search, params.sortBy, params.sortOrder]
  );

  return {
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    setSearch,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    resetParams,
    hasActiveFilters,
  };
}

/**
 * Hook for pagination operations
 */
export function useCardPagination() {
  const params = useCardUIStore((s) => s.params);
  const total = useCardStore((s) => s.total);
  const setPage = useCardUIStore((s) => s.setPage);
  const setPageSize = useCardUIStore((s) => s.setPageSize);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / params.pageSize)),
    [total, params.pageSize]
  );

  const goToNextPage = useCallback(() => {
    if (params.page < totalPages) {
      setPage(params.page + 1);
    }
  }, [params.page, totalPages, setPage]);

  const goToPrevPage = useCallback(() => {
    if (params.page > 1) {
      setPage(params.page - 1);
    }
  }, [params.page, setPage]);

  const goToFirstPage = useCallback(() => setPage(1), [setPage]);

  const goToLastPage = useCallback(
    () => setPage(totalPages),
    [setPage, totalPages]
  );

  return {
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPrevPage: params.page > 1,
    setPage,
    setPageSize,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
  };
}

/**
 * Hook for card CRUD loading states
 */
export function useCardLoadingStates() {
  const isLoading = useCardStore((s) => s.isLoading);
  const isCreating = useCardStore((s) => s.isCreating);
  const isUpdating = useCardStore((s) => s.isUpdating);
  const isDeleting = useCardStore((s) => s.isDeleting);

  const isAnyLoading = isLoading || isCreating || isUpdating || isDeleting;

  return {
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isAnyLoading,
  };
}

/**
 * Hook to get a card by ID from store
 */
export function useCardById(id: string): Card | undefined {
  return useCardStore((s) => s.cards.find((card) => card.id === id));
}
