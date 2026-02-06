import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { cardApi } from "../api/cardApi";
import { CardService } from "../services/cardService";
import { SyncQueue } from "../services/syncQueue";
import type { Card } from "../types";
import { cardKeys } from "./cardKeys";
import { isOnline } from "./utils";
import { cardLogger } from "@/lib/logger";

/**
 * Hook to delete a card
 * Requirements: 4.2
 * Flow: Delete from API (if online) or queue → Delete from IndexedDB (includes OPFS image)
 */
export function useDeleteCard(
  options?: Omit<UseMutationOptions<boolean, Error, string>, "mutationFn">,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete from json-server if online, otherwise queue for later
      if (isOnline()) {
        try {
          await cardApi.delete(id);
        } catch (apiError) {
          // API failed - queue for later sync
          console.warn(
            "[useDeleteCard] API delete failed, queuing for later:",
            apiError instanceof Error ? apiError.message : apiError,
          );
          await SyncQueue.queueDelete(id);
        }
      } else {
        // Offline - queue for later sync
        await SyncQueue.queueDelete(id);
        cardLogger.info(" Offline, queued delete for sync");
      }

      // Get existing card from IndexedDB to check for image cleanup
      let existing: Card | null = null;
      try {
        existing = await CardService.getById(id);
      } catch (dbError) {
        cardLogger.error(" Failed to get existing card:", dbError);
      }

      // Delete from IndexedDB if exists (this also deletes the image from OPFS)
      if (existing) {
        try {
          await CardService.delete(id);
        } catch (dbError) {
          cardLogger.error(" IndexedDB delete failed:", dbError);
          throw new Error("Failed to delete card from local storage");
        }
      }

      return true;
    },
    onSuccess: (_, id) => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
      // Remove the specific card from cache
      queryClient.removeQueries({ queryKey: cardKeys.detail(id) });
    },
    ...options,
  });
}
