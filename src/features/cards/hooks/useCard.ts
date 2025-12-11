import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { cardApi } from "../api/cardApi";
import { CardService } from "../services/cardService";
import type { Card } from "../types";
import { cardKeys } from "./cardKeys";
import { toCard, isOnline } from "./utils";

/**
 * Hook to fetch a single card by ID
 * Requirements: 1.1
 * - Online: fetch from json-server
 * - Offline: fetch from IndexedDB
 */
export function useCard(
  id: string,
  options?: Omit<UseQueryOptions<Card | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: cardKeys.detail(id),
    queryFn: async () => {
      // Try json-server first if online
      if (isOnline()) {
        try {
          const apiCard = await cardApi.getById(id);
          return apiCard ? toCard(apiCard) : null;
        } catch (error) {
          // Log the error but don't throw - fallback to IndexedDB
          console.warn(
            "[useCard] API fetch failed, falling back to IndexedDB:",
            error instanceof Error ? error.message : error
          );
        }
      }

      // Fallback to IndexedDB (offline mode or API failure)
      try {
        return await CardService.getById(id);
      } catch (dbError) {
        console.error("[useCard] IndexedDB fetch failed:", dbError);
        return null;
      }
    },
    enabled: !!id,
    ...options,
  });
}
