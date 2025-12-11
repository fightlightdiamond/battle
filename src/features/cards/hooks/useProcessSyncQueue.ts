import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SyncQueue, type ConflictStrategy } from "../services/syncQueue";
import { cardKeys } from "./cardKeys";
import { isOnline } from "./utils";

/**
 * Hook to manually process the sync queue
 */
export function useProcessSyncQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conflictStrategy: ConflictStrategy = "newest-wins") => {
      if (!isOnline()) {
        throw new Error("Cannot process sync queue while offline");
      }
      return SyncQueue.processQueue(conflictStrategy);
    },
    onSuccess: (result) => {
      if (result.succeeded > 0) {
        queryClient.invalidateQueries({ queryKey: cardKeys.all });
      }
    },
  });
}
