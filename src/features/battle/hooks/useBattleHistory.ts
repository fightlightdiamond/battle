/**
 * useBattleHistory Hook
 *
 * Fetches and caches battle history with pagination support.
 *
 * Requirements: 3.1, 3.5
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  battleHistoryService,
  type PaginatedBattleResponse,
} from "../services/battleHistoryService";
import {
  battleHistoryKeys,
  type BattleHistoryListParams,
} from "./battleHistoryKeys";

const DEFAULT_LIMIT = 10;

/**
 * Hook to fetch paginated battle history
 *
 * @param page - Page number (1-based)
 * @param limit - Number of records per page (default: 10)
 * @param options - Additional react-query options
 * @returns Query result with paginated battle records
 *
 * Requirements: 3.1, 3.5
 */
export function useBattleHistory(
  page: number = 1,
  limit: number = DEFAULT_LIMIT,
  options?: Omit<
    UseQueryOptions<PaginatedBattleResponse>,
    "queryKey" | "queryFn"
  >
) {
  const params: BattleHistoryListParams = { page, limit };

  return useQuery({
    queryKey: battleHistoryKeys.list(params),
    queryFn: () => battleHistoryService.getBattles(page, limit),
    ...options,
  });
}
