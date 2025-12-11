import { useState, useEffect } from "react";
import { SyncQueue } from "../services/syncQueue";
import { useOnlineStatus } from "./useOnlineStatus";

/**
 * Hook to get sync queue status
 */
export function useSyncQueueStatus() {
  const [queueLength, setQueueLength] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const online = useOnlineStatus();

  useEffect(() => {
    const checkQueue = async () => {
      setIsLoading(true);
      try {
        const length = await SyncQueue.getQueueLength();
        setQueueLength(length);
      } catch (error) {
        console.error(
          "[useSyncQueueStatus] Failed to get queue length:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkQueue();
    // Re-check when online status changes
  }, [online]);

  return { queueLength, isLoading, hasPendingChanges: queueLength > 0 };
}
