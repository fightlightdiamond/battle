/**
 * Sync Queue Service
 * Queues offline changes and syncs them when online
 *
 * Queue is stored in IndexedDB to persist across sessions
 */

import { getDB } from "./db";
import { cardApi } from "../api/cardApi";
import type { ApiCard } from "../api/types";

// Types of operations that can be queued
export type SyncOperationType = "create" | "update" | "delete";

// A queued sync operation
export interface SyncQueueItem {
  id: string; // Unique ID for the queue item
  cardId: string; // ID of the card being operated on
  operation: SyncOperationType;
  data: ApiCard | null; // Card data for create/update, null for delete
  timestamp: number; // When the operation was queued
  retryCount: number; // Number of sync attempts
  lastError: string | null; // Last error message if sync failed
}

// Result of processing a single queue item
export interface SyncItemResult {
  item: SyncQueueItem;
  success: boolean;
  error?: string;
}

// Result of processing the entire queue
export interface SyncQueueResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: SyncItemResult[];
}

// ============================================
// Conflict resolution constants
// ============================================

/** Conflict resolution strategies */
export const CONFLICT_STRATEGIES = {
  LOCAL_WINS: "local-wins",
  SERVER_WINS: "server-wins",
  NEWEST_WINS: "newest-wins",
} as const;

export type ConflictStrategy =
  (typeof CONFLICT_STRATEGIES)[keyof typeof CONFLICT_STRATEGIES];

// ============================================
// Queue constants
// ============================================

/** IndexedDB store name for sync queue */
export const QUEUE_STORE = "syncQueue";

/** Maximum number of retry attempts for failed sync operations */
export const MAX_RETRIES = 3;

/**
 * Check if we're online
 */
function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

/**
 * Generate a unique ID for queue items
 */
function generateQueueId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * SyncQueue - Manages offline operation queue
 */
export const SyncQueue = {
  /**
   * Add a create operation to the queue
   */
  async queueCreate(cardData: ApiCard): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      id: generateQueueId(),
      cardId: cardData.id,
      operation: "create",
      data: cardData,
      timestamp: Date.now(),
      retryCount: 0,
      lastError: null,
    };
    await this.addToQueue(item);
    console.log("[SyncQueue] Queued create:", cardData.id, cardData.name);
    return item;
  },

  /**
   * Add an update operation to the queue
   */
  async queueUpdate(cardData: ApiCard): Promise<SyncQueueItem> {
    // Check if there's already a pending operation for this card
    const existingItems = await this.getQueueItemsForCard(cardData.id);

    // If there's a pending create, just update the data
    const pendingCreate = existingItems.find((i) => i.operation === "create");
    if (pendingCreate) {
      pendingCreate.data = cardData;
      pendingCreate.timestamp = Date.now();
      await this.updateQueueItem(pendingCreate);
      console.log("[SyncQueue] Updated pending create:", cardData.id);
      return pendingCreate;
    }

    // If there's a pending update, replace it
    const pendingUpdate = existingItems.find((i) => i.operation === "update");
    if (pendingUpdate) {
      pendingUpdate.data = cardData;
      pendingUpdate.timestamp = Date.now();
      await this.updateQueueItem(pendingUpdate);
      console.log("[SyncQueue] Updated pending update:", cardData.id);
      return pendingUpdate;
    }

    // Otherwise, add a new update operation
    const item: SyncQueueItem = {
      id: generateQueueId(),
      cardId: cardData.id,
      operation: "update",
      data: cardData,
      timestamp: Date.now(),
      retryCount: 0,
      lastError: null,
    };
    await this.addToQueue(item);
    console.log("[SyncQueue] Queued update:", cardData.id, cardData.name);
    return item;
  },

  /**
   * Add a delete operation to the queue
   */
  async queueDelete(cardId: string): Promise<SyncQueueItem> {
    // Remove any pending create/update operations for this card
    const existingItems = await this.getQueueItemsForCard(cardId);
    for (const item of existingItems) {
      await this.removeFromQueue(item.id);
      console.log(
        "[SyncQueue] Removed pending",
        item.operation,
        "for deleted card:",
        cardId
      );
    }

    // If there was a pending create, we don't need to sync the delete
    // (the card was never synced to the server)
    const hadPendingCreate = existingItems.some(
      (i) => i.operation === "create"
    );
    if (hadPendingCreate) {
      console.log(
        "[SyncQueue] Card was never synced, no delete needed:",
        cardId
      );
      return {
        id: generateQueueId(),
        cardId,
        operation: "delete",
        data: null,
        timestamp: Date.now(),
        retryCount: 0,
        lastError: null,
      };
    }

    // Add delete operation
    const item: SyncQueueItem = {
      id: generateQueueId(),
      cardId,
      operation: "delete",
      data: null,
      timestamp: Date.now(),
      retryCount: 0,
      lastError: null,
    };
    await this.addToQueue(item);
    console.log("[SyncQueue] Queued delete:", cardId);
    return item;
  },

  /**
   * Get all items in the queue
   */
  async getQueue(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    try {
      const items = await db.getAll(QUEUE_STORE);
      // Sort by timestamp (oldest first)
      return items.sort((a, b) => a.timestamp - b.timestamp);
    } catch {
      // Store might not exist yet
      return [];
    }
  },

  /**
   * Get queue items for a specific card
   */
  async getQueueItemsForCard(cardId: string): Promise<SyncQueueItem[]> {
    const queue = await this.getQueue();
    return queue.filter((item) => item.cardId === cardId);
  },

  /**
   * Get the number of pending items in the queue
   */
  async getQueueLength(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  },

  /**
   * Add an item to the queue
   */
  async addToQueue(item: SyncQueueItem): Promise<void> {
    const db = await getDB();
    await db.put(QUEUE_STORE, item);
  },

  /**
   * Update an existing queue item
   */
  async updateQueueItem(item: SyncQueueItem): Promise<void> {
    const db = await getDB();
    await db.put(QUEUE_STORE, item);
  },

  /**
   * Remove an item from the queue
   */
  async removeFromQueue(itemId: string): Promise<void> {
    const db = await getDB();
    await db.delete(QUEUE_STORE, itemId);
  },

  /**
   * Clear the entire queue
   */
  async clearQueue(): Promise<void> {
    const db = await getDB();
    await db.clear(QUEUE_STORE);
  },

  /**
   * Process a single queue item
   */
  async processItem(
    item: SyncQueueItem,
    conflictStrategy: ConflictStrategy = CONFLICT_STRATEGIES.NEWEST_WINS
  ): Promise<SyncItemResult> {
    try {
      switch (item.operation) {
        case "create":
          if (!item.data) {
            throw new Error("Create operation missing card data");
          }
          // Check if card already exists on server (conflict)
          const existingCreate = await cardApi.getById(item.cardId);
          if (existingCreate) {
            // Card already exists - handle conflict by resolving and updating
            const resolved = await this.resolveConflict(
              item.data,
              existingCreate,
              conflictStrategy
            );
            // Always update to ensure we have the resolved version with all stats
            await cardApi.update(item.cardId, {
              name: resolved.name,
              hp: resolved.hp,
              atk: resolved.atk,
              def: resolved.def,
              spd: resolved.spd,
              critChance: resolved.critChance,
              critDamage: resolved.critDamage,
              armorPen: resolved.armorPen,
              lifesteal: resolved.lifesteal,
              imagePath: resolved.imagePath,
            });
          } else {
            // Use upsert to avoid duplicate key errors
            await cardApi.upsert(item.data);
          }
          break;

        case "update":
          if (!item.data) {
            throw new Error("Update operation missing card data");
          }
          // Check if card exists on server
          const existingUpdate = await cardApi.getById(item.cardId);
          if (existingUpdate) {
            // Resolve conflict if server version is different
            const resolved = await this.resolveConflict(
              item.data,
              existingUpdate,
              conflictStrategy
            );
            // Update with all stats
            await cardApi.update(item.cardId, {
              name: resolved.name,
              hp: resolved.hp,
              atk: resolved.atk,
              def: resolved.def,
              spd: resolved.spd,
              critChance: resolved.critChance,
              critDamage: resolved.critDamage,
              armorPen: resolved.armorPen,
              lifesteal: resolved.lifesteal,
              imagePath: resolved.imagePath,
            });
          } else {
            // Card doesn't exist on server - use upsert to create it safely
            await cardApi.upsert(item.data);
          }
          break;

        case "delete":
          // Try to delete - ignore 404 errors (already deleted)
          try {
            await cardApi.delete(item.cardId);
          } catch (error) {
            // Ignore if card doesn't exist
            if (!(error instanceof Error && error.message.includes("404"))) {
              throw error;
            }
          }
          break;
      }

      return { item, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { item, success: false, error: errorMessage };
    }
  },

  /**
   * Resolve a conflict between local and server versions
   */
  async resolveConflict(
    local: ApiCard,
    server: ApiCard,
    strategy: ConflictStrategy
  ): Promise<ApiCard> {
    switch (strategy) {
      case CONFLICT_STRATEGIES.LOCAL_WINS:
        return local;
      case CONFLICT_STRATEGIES.SERVER_WINS:
        return server;
      case CONFLICT_STRATEGIES.NEWEST_WINS:
      default:
        return local.updatedAt >= server.updatedAt ? local : server;
    }
  },

  /**
   * Process all items in the queue
   * Returns results for each item processed
   */
  async processQueue(
    conflictStrategy: ConflictStrategy = CONFLICT_STRATEGIES.NEWEST_WINS
  ): Promise<SyncQueueResult> {
    if (!isOnline()) {
      console.log("[SyncQueue] Offline, skipping queue processing");
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        results: [],
      };
    }

    const queue = await this.getQueue();
    const results: SyncItemResult[] = [];
    let succeeded = 0;
    let failed = 0;

    console.log(`[SyncQueue] Processing ${queue.length} queued operations`);

    for (const item of queue) {
      const result = await this.processItem(item, conflictStrategy);
      results.push(result);

      if (result.success) {
        // Remove from queue on success
        await this.removeFromQueue(item.id);
        succeeded++;
        console.log(`[SyncQueue] ✓ ${item.operation} ${item.cardId}`);
      } else {
        // Update retry count and error
        item.retryCount++;
        item.lastError = result.error || "Unknown error";

        if (item.retryCount >= MAX_RETRIES) {
          // Max retries reached - remove from queue
          await this.removeFromQueue(item.id);
          console.error(
            `[SyncQueue] ✗ ${item.operation} ${item.cardId} - Max retries reached:`,
            result.error
          );
        } else {
          // Update item with new retry count
          await this.updateQueueItem(item);
          console.warn(
            `[SyncQueue] ✗ ${item.operation} ${item.cardId} - Retry ${item.retryCount}/${MAX_RETRIES}:`,
            result.error
          );
        }
        failed++;
      }
    }

    console.log(
      `[SyncQueue] Complete: ${succeeded} succeeded, ${failed} failed`
    );

    return {
      processed: queue.length,
      succeeded,
      failed,
      results,
    };
  },

  /**
   * Check if there are pending operations for a card
   */
  async hasPendingOperations(cardId: string): Promise<boolean> {
    const items = await this.getQueueItemsForCard(cardId);
    return items.length > 0;
  },

  /**
   * Get pending operation type for a card (if any)
   */
  async getPendingOperation(cardId: string): Promise<SyncOperationType | null> {
    const items = await this.getQueueItemsForCard(cardId);
    if (items.length === 0) return null;
    // Return the most recent operation
    return items[items.length - 1].operation;
  },
};
