import { useMemo } from "react";
import { useCardStore } from "./cardStore";
import { useCardUIStore } from "./cardUIStore";

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
