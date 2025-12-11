import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { cardApi } from "../api/cardApi";
import { CardService } from "../services/cardService";
import type { CardListParams, PaginatedCards } from "../types";
import { cardKeys } from "./cardKeys";
import { toCard, isOnline } from "./utils";

/**
 * Hook to fetch paginated cards with search, sort, and pagination
 * Requirements: 1.1, 1.5, 1.6, 1.7
 * - Online: fetch from json-server, sync to IndexedDB
 * - Offline: fetch from IndexedDB
 */
export function useCards(
  params: CardListParams,
  options?: Omit<UseQueryOptions<PaginatedCards>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: cardKeys.list(params),
    queryFn: async () => {
      // Try json-server first if online
      if (isOnline()) {
        try {
          const { cards: apiCards, total } = await cardApi.getPaginated({
            search: params.search,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
            page: params.page,
            pageSize: params.pageSize,
          });

          // Convert ApiCards to Cards with imageUrl from OPFS
          const cards = await Promise.all(apiCards.map(toCard));
          const totalPages = Math.max(1, Math.ceil(total / params.pageSize));

          return {
            cards,
            total,
            page: params.page,
            pageSize: params.pageSize,
            totalPages,
          };
        } catch (error) {
          // Log the error but don't throw - fallback to IndexedDB
          console.warn(
            "[useCards] API fetch failed, falling back to IndexedDB:",
            error instanceof Error ? error.message : error
          );
        }
      }

      // Fallback to IndexedDB (offline mode or API failure)
      try {
        return await CardService.getPaginated(params);
      } catch (dbError) {
        console.error("[useCards] IndexedDB fetch failed:", dbError);
        // Return empty result as last resort
        return {
          cards: [],
          total: 0,
          page: params.page,
          pageSize: params.pageSize,
          totalPages: 1,
        };
      }
    },
    ...options,
  });
}
