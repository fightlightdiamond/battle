/**
 * useBattleDetail Hook
 *
 * Fetches and caches a single battle record by ID.
 *
 * Requirements: 4.1, 4.2, 4.4
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { battleHistoryService } from "../services/battleHistoryService";
import { battleHistoryKeys } from "./battleHistoryKeys";
import type { BattleRecord } from "../types/battleHistoryTypes";

/**
 * Hook to fetch a single battle record by ID
 *
 * @param id - Battle record ID
 * @param options - Additional react-query options
 * @returns Query result with battle record
 *
 * Requirements: 4.1, 4.2, 4.4
 */
export function useBattleDetail(
  id: string | undefined,
  options?: Omit<UseQueryOptions<BattleRecord | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: battleHistoryKeys.detail(id ?? ""),
    queryFn: () => (id ? battleHistoryService.getBattleById(id) : null),
    enabled: !!id,
    ...options,
  });
}
