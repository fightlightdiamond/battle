import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { SyncQueue } from "./syncQueue";
import { deleteDB } from "./db";
import type { ApiCard } from "../api/types";

// Mock the cardApi module
vi.mock("../api/cardApi", () => ({
  cardApi: {
    getById: vi.fn(),
    createWithId: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { cardApi } from "../api/cardApi";

const mockCardApi = vi.mocked(cardApi);

// Helper to create a test card
function createTestCard(overrides: Partial<ApiCard> = {}): ApiCard {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: "Test Card",
    atk: 100,
    hp: 200,
    imagePath: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("SyncQueue", () => {
  beforeEach(async () => {
    // Clear the database before each test
    await deleteDB();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await SyncQueue.clearQueue();
  });

  describe("queueCreate", () => {
    it("should add a create operation to the queue", async () => {
      const card = createTestCard();
      const item = await SyncQueue.queueCreate(card);

      expect(item.operation).toBe("create");
      expect(item.cardId).toBe(card.id);
      expect(item.data).toEqual(card);
      expect(item.retryCount).toBe(0);

      const queue = await SyncQueue.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].cardId).toBe(card.id);
    });
  });

  describe("queueUpdate", () => {
    it("should add an update operation to the queue", async () => {
      const card = createTestCard();
      const item = await SyncQueue.queueUpdate(card);

      expect(item.operation).toBe("update");
      expect(item.cardId).toBe(card.id);
      expect(item.data).toEqual(card);

      const queue = await SyncQueue.getQueue();
      expect(queue).toHaveLength(1);
    });

    it("should update existing pending create instead of adding new update", async () => {
      const card = createTestCard();
      await SyncQueue.queueCreate(card);

      const updatedCard = {
        ...card,
        name: "Updated Name",
        updatedAt: Date.now(),
      };
      await SyncQueue.queueUpdate(updatedCard);

      const queue = await SyncQueue.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].operation).toBe("create");
      expect(queue[0].data?.name).toBe("Updated Name");
    });

    it("should replace existing pending update", async () => {
      const card = createTestCard();
      await SyncQueue.queueUpdate(card);

      const updatedCard = {
        ...card,
        name: "Updated Again",
        updatedAt: Date.now(),
      };
      await SyncQueue.queueUpdate(updatedCard);

      const queue = await SyncQueue.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].data?.name).toBe("Updated Again");
    });
  });

  describe("queueDelete", () => {
    it("should add a delete operation to the queue", async () => {
      const cardId = crypto.randomUUID();
      const item = await SyncQueue.queueDelete(cardId);

      expect(item.operation).toBe("delete");
      expect(item.cardId).toBe(cardId);
      expect(item.data).toBeNull();

      const queue = await SyncQueue.getQueue();
      expect(queue).toHaveLength(1);
    });

    it("should remove pending create and not queue delete", async () => {
      const card = createTestCard();
      await SyncQueue.queueCreate(card);

      await SyncQueue.queueDelete(card.id);

      // Queue should be empty - card was never synced
      const queue = await SyncQueue.getQueue();
      expect(queue).toHaveLength(0);
    });

    it("should remove pending update and queue delete", async () => {
      const card = createTestCard();
      // Simulate a card that was already synced (no pending create)
      await SyncQueue.queueUpdate(card);

      await SyncQueue.queueDelete(card.id);

      const queue = await SyncQueue.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].operation).toBe("delete");
    });
  });

  describe("processQueue", () => {
    beforeEach(() => {
      // Mock navigator.onLine to be true
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });
    });

    it("should process create operations", async () => {
      const card = createTestCard();
      mockCardApi.getById.mockResolvedValue(null);
      mockCardApi.upsert.mockResolvedValue(card);

      await SyncQueue.queueCreate(card);
      const result = await SyncQueue.processQueue();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockCardApi.upsert).toHaveBeenCalledWith(card);

      // Queue should be empty after processing
      const queue = await SyncQueue.getQueue();
      expect(queue).toHaveLength(0);
    });

    it("should process update operations", async () => {
      const card = createTestCard();
      mockCardApi.getById.mockResolvedValue(card);
      mockCardApi.update.mockResolvedValue(card);

      await SyncQueue.queueUpdate(card);
      const result = await SyncQueue.processQueue();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(mockCardApi.update).toHaveBeenCalled();
    });

    it("should process delete operations", async () => {
      const cardId = crypto.randomUUID();
      mockCardApi.delete.mockResolvedValue(undefined);

      await SyncQueue.queueDelete(cardId);
      const result = await SyncQueue.processQueue();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(mockCardApi.delete).toHaveBeenCalledWith(cardId);
    });

    it("should handle API errors and retry", async () => {
      const card = createTestCard();
      mockCardApi.getById.mockResolvedValue(null);
      mockCardApi.upsert.mockRejectedValue(new Error("Network error"));

      await SyncQueue.queueCreate(card);
      const result = await SyncQueue.processQueue();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);

      // Item should still be in queue with incremented retry count
      const queue = await SyncQueue.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].retryCount).toBe(1);
      expect(queue[0].lastError).toBe("Network error");
    });

    it("should remove item after max retries", async () => {
      const card = createTestCard();
      mockCardApi.getById.mockResolvedValue(null);
      mockCardApi.upsert.mockRejectedValue(new Error("Network error"));

      await SyncQueue.queueCreate(card);

      // Process 3 times (max retries)
      await SyncQueue.processQueue();
      await SyncQueue.processQueue();
      await SyncQueue.processQueue();

      // Item should be removed after max retries
      const queue = await SyncQueue.getQueue();
      expect(queue).toHaveLength(0);
    });

    it("should skip processing when offline", async () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
        configurable: true,
      });

      const card = createTestCard();
      await SyncQueue.queueCreate(card);
      const result = await SyncQueue.processQueue();

      expect(result.processed).toBe(0);
      expect(mockCardApi.upsert).not.toHaveBeenCalled();

      // Item should still be in queue
      const queue = await SyncQueue.getQueue();
      expect(queue).toHaveLength(1);
    });
  });

  describe("conflict resolution", () => {
    beforeEach(() => {
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });
    });

    it("should use local-wins strategy", async () => {
      const localCard = createTestCard({ name: "Local", updatedAt: 1000 });
      const serverCard = createTestCard({
        id: localCard.id,
        name: "Server",
        updatedAt: 2000,
      });

      mockCardApi.getById.mockResolvedValue(serverCard);
      mockCardApi.update.mockResolvedValue(localCard);

      await SyncQueue.queueCreate(localCard);
      await SyncQueue.processQueue("local-wins");

      // Should update server with local data
      expect(mockCardApi.update).toHaveBeenCalledWith(
        localCard.id,
        expect.objectContaining({ name: "Local" })
      );
    });

    it("should use newest-wins strategy (default)", async () => {
      const olderCard = createTestCard({ name: "Older", updatedAt: 1000 });
      const newerCard = createTestCard({
        id: olderCard.id,
        name: "Newer",
        updatedAt: 2000,
      });

      // Local is older, server is newer
      mockCardApi.getById.mockResolvedValue(newerCard);
      mockCardApi.update.mockResolvedValue(newerCard);

      await SyncQueue.queueCreate(olderCard);
      await SyncQueue.processQueue("newest-wins");

      // Server is newer, so update should be called with server data (newest wins)
      expect(mockCardApi.update).toHaveBeenCalledWith(
        newerCard.id,
        expect.objectContaining({ name: "Newer" })
      );
    });
  });

  describe("utility methods", () => {
    it("should get queue length", async () => {
      expect(await SyncQueue.getQueueLength()).toBe(0);

      await SyncQueue.queueCreate(createTestCard());
      expect(await SyncQueue.getQueueLength()).toBe(1);

      await SyncQueue.queueCreate(createTestCard());
      expect(await SyncQueue.getQueueLength()).toBe(2);
    });

    it("should check for pending operations", async () => {
      const card = createTestCard();

      expect(await SyncQueue.hasPendingOperations(card.id)).toBe(false);

      await SyncQueue.queueCreate(card);
      expect(await SyncQueue.hasPendingOperations(card.id)).toBe(true);
    });

    it("should get pending operation type", async () => {
      const card = createTestCard();

      expect(await SyncQueue.getPendingOperation(card.id)).toBeNull();

      await SyncQueue.queueCreate(card);
      expect(await SyncQueue.getPendingOperation(card.id)).toBe("create");
    });

    it("should clear the queue", async () => {
      await SyncQueue.queueCreate(createTestCard());
      await SyncQueue.queueCreate(createTestCard());

      expect(await SyncQueue.getQueueLength()).toBe(2);

      await SyncQueue.clearQueue();
      expect(await SyncQueue.getQueueLength()).toBe(0);
    });
  });
});
