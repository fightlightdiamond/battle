import { useState, useEffect, useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { cardApi } from "../api/cardApi";
import { CardService } from "../services/cardService";
import {
  SyncQueue,
  type SyncQueueResult,
  type ConflictStrategy,
} from "../services/syncQueue";
import type { ApiCard } from "../api/types";
import { saveImage, deleteImage, getImageUrl } from "../services/imageStorage";
import type {
  Card,
  CardFormInput,
  CardListParams,
  PaginatedCards,
} from "../types";

// Query keys for cache management
export const cardKeys = {
  all: ["cards"] as const,
  lists: () => [...cardKeys.all, "list"] as const,
  list: (params: CardListParams) => [...cardKeys.lists(), params] as const,
  details: () => [...cardKeys.all, "detail"] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
};

/**
 * Convert ApiCard to Card by loading image URL from OPFS
 */
async function toCard(apiCard: ApiCard): Promise<Card> {
  const imageUrl = apiCard.imagePath
    ? await getImageUrl(apiCard.imagePath)
    : null;
  return {
    ...apiCard,
    imageUrl,
  };
}

/**
 * Check if we're online
 */
function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

/**
 * Hook to track online/offline status with real-time updates
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(isOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

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

/**
 * Hook to create a new card
 * Requirements: 2.2
 * Flow: Save image to OPFS → Save to IndexedDB → POST to API (if online) or queue for sync
 * Both IndexedDB and API use the same ID for consistency
 */
export function useCreateCard(
  options?: Omit<UseMutationOptions<Card, Error, CardFormInput>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CardFormInput) => {
      // Generate ID upfront to ensure consistency between IndexedDB and API
      const id = crypto.randomUUID();
      const now = Date.now();

      // Save image to OPFS if provided
      let imagePath: string | null = null;
      if (input.image) {
        try {
          imagePath = await saveImage(id, input.image);
        } catch (imageError) {
          console.error("[useCreateCard] Failed to save image:", imageError);
          // Continue without image
        }
      }

      // Create card object
      const cardData = {
        id,
        name: input.name,
        atk: input.atk,
        hp: input.hp,
        imagePath,
        createdAt: now,
        updatedAt: now,
      };

      // Always save to IndexedDB first
      try {
        await CardService.createWithId(cardData);
      } catch (dbError) {
        console.error("[useCreateCard] IndexedDB save failed:", dbError);
        throw new Error("Failed to save card to local storage");
      }

      // Sync to json-server if online, otherwise queue for later
      if (isOnline()) {
        try {
          await cardApi.createWithId(cardData);
        } catch (apiError) {
          // API failed - queue for later sync
          console.warn(
            "[useCreateCard] API sync failed, queuing for later:",
            apiError instanceof Error ? apiError.message : apiError
          );
          await SyncQueue.queueCreate(cardData);
        }
      } else {
        // Offline - queue for later sync
        await SyncQueue.queueCreate(cardData);
        console.log("[useCreateCard] Offline, queued create for sync");
      }

      // Return card with imageUrl
      const imageUrl = imagePath ? await getImageUrl(imagePath) : null;
      return { ...cardData, imageUrl };
    },
    onSuccess: () => {
      // Invalidate all list queries to refetch with new card
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
    ...options,
  });
}

/**
 * Hook to update an existing card
 * Requirements: 3.2
 * Flow: Get card (sync from API if needed) → Update OPFS if new image → Update IndexedDB → PUT to API (if online) or queue for sync
 */
export function useUpdateCard(
  options?: Omit<
    UseMutationOptions<
      Card | null,
      Error,
      { id: string; input: CardFormInput }
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CardFormInput }) => {
      // Get existing card from IndexedDB first
      let existing: Card | null = null;
      try {
        existing = await CardService.getById(id);
      } catch (dbError) {
        console.error(
          "[useUpdateCard] Failed to get existing card from IndexedDB:",
          dbError
        );
      }

      // If not in IndexedDB but online, try to fetch from API and sync
      if (!existing && isOnline()) {
        try {
          const apiCard = await cardApi.getById(id);
          if (apiCard) {
            // Sync card from API to IndexedDB
            await CardService.createWithId(apiCard);
            existing = await toCard(apiCard);
            console.log(
              "[useUpdateCard] Synced card from API to IndexedDB:",
              id
            );
          }
        } catch (apiError) {
          console.error(
            "[useUpdateCard] Failed to fetch card from API:",
            apiError
          );
        }
      }

      if (!existing) {
        throw new Error(`Card with id ${id} not found`);
      }

      let imagePath = existing.imagePath;

      // Handle image update
      if (input.image) {
        try {
          // Delete old image from OPFS if exists
          if (existing.imagePath) {
            await deleteImage(existing.imagePath);
          }
          // Save new image to OPFS
          imagePath = await saveImage(id, input.image);
        } catch (imageError) {
          console.error("[useUpdateCard] Image update failed:", imageError);
          // Continue with existing image path
        }
      }

      // Always update IndexedDB first
      let updatedCard: Card | null = null;
      try {
        updatedCard = await CardService.update(id, input);
      } catch (dbError) {
        console.error("[useUpdateCard] IndexedDB update failed:", dbError);
        throw new Error("Failed to update card in local storage");
      }

      // Prepare card data for API/queue
      const cardDataForSync = {
        id,
        name: input.name,
        atk: input.atk,
        hp: input.hp,
        imagePath,
        createdAt: existing.createdAt,
        updatedAt: updatedCard?.updatedAt || Date.now(),
      };

      // Update in json-server if online, otherwise queue for later
      if (isOnline()) {
        try {
          await cardApi.update(id, {
            name: input.name,
            atk: input.atk,
            hp: input.hp,
            imagePath,
          });
        } catch (apiError) {
          // API failed - queue for later sync
          console.warn(
            "[useUpdateCard] API sync failed, queuing for later:",
            apiError instanceof Error ? apiError.message : apiError
          );
          await SyncQueue.queueUpdate(cardDataForSync);
        }
      } else {
        // Offline - queue for later sync
        await SyncQueue.queueUpdate(cardDataForSync);
        console.log("[useUpdateCard] Offline, queued update for sync");
      }

      return updatedCard;
    },
    onSuccess: (_, variables) => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
      // Invalidate the specific card detail query
      queryClient.invalidateQueries({
        queryKey: cardKeys.detail(variables.id),
      });
    },
    ...options,
  });
}

/**
 * Hook to delete a card
 * Requirements: 4.2
 * Flow: Delete from API (if online) or queue → Delete from IndexedDB (includes OPFS image)
 */
export function useDeleteCard(
  options?: Omit<UseMutationOptions<boolean, Error, string>, "mutationFn">
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
            apiError instanceof Error ? apiError.message : apiError
          );
          await SyncQueue.queueDelete(id);
        }
      } else {
        // Offline - queue for later sync
        await SyncQueue.queueDelete(id);
        console.log("[useDeleteCard] Offline, queued delete for sync");
      }

      // Get existing card from IndexedDB to check for image cleanup
      let existing: Card | null = null;
      try {
        existing = await CardService.getById(id);
      } catch (dbError) {
        console.error("[useDeleteCard] Failed to get existing card:", dbError);
      }

      // Delete from IndexedDB if exists (this also deletes the image from OPFS)
      if (existing) {
        try {
          await CardService.delete(id);
        } catch (dbError) {
          console.error("[useDeleteCard] IndexedDB delete failed:", dbError);
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

// OPFS hooks
export { useOPFSSupport, useOPFSImage, useOPFSOperations } from "./useOPFS";
