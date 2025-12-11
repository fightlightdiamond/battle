import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cardApi } from "../api/cardApi";
import { CardService } from "../services/cardService";
import { SyncQueue, type SyncQueueResult } from "../services/syncQueue";
import { cardKeys } from "./cardKeys";
import { useOnlineStatus } from "./useOnlineStatus";
import { isOnline } from "./utils";

/**
 * Sync Strategy:
 * 1. Cards only in API → Create in IndexedDB
 * 2. Cards only in IndexedDB → Create in API (when online)
 * 3. Cards in both → Compare updatedAt, keep the newer version
 */
export interface SyncResult {
  syncedToLocal: number;
  syncedToApi: number;
  updated: number;
  conflicts: string[];
}

export async function syncCards(): Promise<SyncResult> {
  const result: SyncResult = {
    syncedToLocal: 0,
    syncedToApi: 0,
    updated: 0,
    conflicts: [],
  };

  if (!isOnline()) {
    console.log("[syncCards] Offline, skipping sync");
    return result;
  }

  try {
    // Fetch all cards from both sources
    const apiCards = await cardApi.getAll();
    const localCards = await CardService.getAll();

    // Create maps for easy lookup
    const apiCardMap = new Map(apiCards.map((c) => [c.id, c]));
    const localCardMap = new Map(localCards.map((c) => [c.id, c]));

    // 1. Process API cards
    for (const apiCard of apiCards) {
      const localCard = localCardMap.get(apiCard.id);

      if (!localCard) {
        // Card only in API → Create in IndexedDB (use upsert to avoid duplicate key errors)
        try {
          await CardService.upsert(apiCard);
          result.syncedToLocal++;
          console.log("[syncCards] API → Local:", apiCard.id, apiCard.name);
        } catch (err) {
          console.error(
            "[syncCards] Failed to sync to local:",
            apiCard.id,
            err
          );
          result.conflicts.push(apiCard.id);
        }
      } else {
        // Card in both → Compare updatedAt
        if (apiCard.updatedAt > localCard.updatedAt) {
          // API is newer → Update IndexedDB (preserve local image)
          try {
            const updatedData = {
              ...apiCard,
              imagePath: localCard.imagePath, // Keep local image
            };
            await CardService.upsert(updatedData);
            result.updated++;
            console.log("[syncCards] Updated local (API newer):", apiCard.id);
          } catch (err) {
            console.error(
              "[syncCards] Failed to update local:",
              apiCard.id,
              err
            );
            result.conflicts.push(apiCard.id);
          }
        } else if (localCard.updatedAt > apiCard.updatedAt) {
          // Local is newer → Update API
          try {
            await cardApi.update(localCard.id, {
              name: localCard.name,
              atk: localCard.atk,
              hp: localCard.hp,
              imagePath: localCard.imagePath,
            });
            result.updated++;
            console.log("[syncCards] Updated API (local newer):", localCard.id);
          } catch (err) {
            console.error(
              "[syncCards] Failed to update API:",
              localCard.id,
              err
            );
            result.conflicts.push(localCard.id);
          }
        }
        // If updatedAt is equal, no action needed
      }
    }

    // 2. Process local-only cards (not in API)
    for (const localCard of localCards) {
      if (!apiCardMap.has(localCard.id)) {
        // Card only in IndexedDB → Create in API
        try {
          // Check if card exists on API (might have been created by another client)
          const existingOnApi = await cardApi.getById(localCard.id);
          if (existingOnApi) {
            // Card exists on API - compare timestamps and update if local is newer
            if (localCard.updatedAt > existingOnApi.updatedAt) {
              await cardApi.update(localCard.id, {
                name: localCard.name,
                atk: localCard.atk,
                hp: localCard.hp,
                imagePath: localCard.imagePath,
              });
              result.updated++;
              console.log(
                "[syncCards] Updated API (local newer):",
                localCard.id
              );
            }
          } else {
            await cardApi.createWithId({
              id: localCard.id,
              name: localCard.name,
              atk: localCard.atk,
              hp: localCard.hp,
              imagePath: localCard.imagePath,
              createdAt: localCard.createdAt,
              updatedAt: localCard.updatedAt,
            });
            result.syncedToApi++;
            console.log(
              "[syncCards] Local → API:",
              localCard.id,
              localCard.name
            );
          }
        } catch (err) {
          console.error(
            "[syncCards] Failed to sync to API:",
            localCard.id,
            err
          );
          result.conflicts.push(localCard.id);
        }
      }
    }

    console.log(
      `[syncCards] Complete: ${result.syncedToLocal} to local, ${result.syncedToApi} to API, ${result.updated} updated, ${result.conflicts.length} conflicts`
    );
    return result;
  } catch (error) {
    console.error("[syncCards] Sync failed:", error);
    throw error;
  }
}

/**
 * Hook to sync cards between API and IndexedDB on mount
 * Also processes the sync queue when coming back online
 * Call this in your app's root component to ensure data is synced
 */
export function useSyncCards() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [queueResult, setQueueResult] = useState<SyncQueueResult | null>(null);
  const queryClient = useQueryClient();
  const online = useOnlineStatus();

  const doSync = useCallback(async () => {
    if (!isOnline()) {
      setIsSynced(true);
      return;
    }

    setIsSyncing(true);
    try {
      // First, process any queued offline operations
      const queueProcessResult = await SyncQueue.processQueue();
      setQueueResult(queueProcessResult);

      // Then sync cards between API and IndexedDB
      const result = await syncCards();
      setSyncResult(result);
      setIsSynced(true);

      // Invalidate queries to refresh data after sync
      if (
        result.syncedToLocal > 0 ||
        result.updated > 0 ||
        queueProcessResult.succeeded > 0
      ) {
        queryClient.invalidateQueries({ queryKey: cardKeys.all });
      }
    } catch (error) {
      console.error("[useSyncCards] Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient]);

  // Initial sync on mount
  useEffect(() => {
    doSync();
  }, [doSync]);

  // Re-sync when coming back online
  useEffect(() => {
    if (online) {
      doSync();
    }
  }, [online, doSync]);

  return { isSyncing, isSynced, syncResult, queueResult, triggerSync: doSync };
}
