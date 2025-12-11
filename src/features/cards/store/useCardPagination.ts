import { useMemo, useCallback } from "react";
import { useCardStore } from "./cardStore";
import { useCardUIStore } from "./cardUIStore";

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
