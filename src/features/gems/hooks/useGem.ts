import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { GemService } from "../services/gemService";
import type { Gem } from "../types/gem";
import { gemKeys } from "./gemKeys";

/**
 * Hook to fetch a single gem by ID
 * Requirements: 1.3 - Display gem form pre-filled with current values
 */
export function useGem(
  id: string,
  options?: Omit<UseQueryOptions<Gem | null>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: gemKeys.detail(id),
    queryFn: async () => {
      try {
        return await GemService.getById(id);
      } catch (error) {
        console.error("[useGem] Failed to fetch gem:", error);
        return null;
      }
    },
    enabled: !!id,
    ...options,
  });
}
