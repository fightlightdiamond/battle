import { useMemo, useCallback } from "react";
import { useCardUIStore } from "./cardUIStore";

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
