/**
 * useBetHistory Hook
 *
 * Fetches and caches bet history with pagination support.
 *
 * Requirements: 5.4
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { bettingService } from "../services/bettingService";
import type { PaginatedBetResponse } from "../types/betting";
import { betHistoryKeys, type BetHistoryListParams } from "./betHistoryKeys";

const DEFAULT_LIMIT = 10;

/**
 * Hook to fetch paginated bet history
 *
 * @param page - Page number (1-based)
 * @param limit - Number of records per page (default: 10)
 * @param options - Additional react-query options
 * @returns Query result with paginated bet records
 *
 * Requirements: 5.4
 */
export function useBetHistory(
  page: number = 1,
  limit: number = DEFAULT_LIMIT,
  options?: Omit<UseQueryOptions<PaginatedBetResponse>, "queryKey" | "queryFn">
) {
  const params: BetHistoryListParams = { page, limit };

  return useQuery({
    queryKey: betHistoryKeys.list(params),
    queryFn: () => bettingService.getBetHistory(page, limit),
    ...options,
  });
}
