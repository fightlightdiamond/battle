import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { GemService } from "../services/gemService";
import type { Gem } from "../types/gem";
import { gemKeys } from "./gemKeys";

/**
 * Hook to fetch all gems
 * Requirements: 1.2 - Display all available gems with their properties
 */
export function useGems(
  options?: Omit<UseQueryOptions<Gem[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: gemKeys.list(),
    queryFn: async () => {
      try {
        return await GemService.getAll();
      } catch (error) {
        console.error("[useGems] Failed to fetch gems:", error);
        return [];
      }
    },
    ...options,
  });
}
