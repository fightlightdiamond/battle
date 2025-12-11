import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cardApi } from "./cardApi";
import type { ApiCard, CreateCardInput } from "./types";

/**
 * Integration tests for Card API layer
 * Tests CRUD operations against json-server
 *
 * Note: These tests require json-server to be running on port 3001
 * Run: npm run dev:server
 */

// Mock fetch for unit testing (when json-server is not available)
const originalFetch = global.fetch;

describe("Card API - Unit Tests (mocked)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("getAll", () => {
    it("should fetch all cards from API", async () => {
      const mockCards: ApiCard[] = [
        {
          id: "test-1",
          name: "Test Card 1",
          atk: 100,
          hp: 200,
          imagePath: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCards),
      });

      const result = await cardApi.getAll();
      expect(result).toEqual(mockCards);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/cards"));
    });

    it("should throw error on API failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      await expect(cardApi.getAll()).rejects.toThrow("API Error: 500");
    });
  });

  describe("getById", () => {
    it("should fetch a single card by ID", async () => {
      const mockCard: ApiCard = {
        id: "test-1",
        name: "Test Card",
        atk: 100,
        hp: 200,
        imagePath: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCard),
      });

      const result = await cardApi.getById("test-1");
      expect(result).toEqual(mockCard);
    });

    it("should return null for non-existent card", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await cardApi.getById("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("getPaginated", () => {
    it("should fetch paginated cards with correct query params", async () => {
      const mockCards: ApiCard[] = [
        {
          id: "test-1",
          name: "Test Card",
          atk: 100,
          hp: 200,
          imagePath: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "X-Total-Count": "1" }),
        json: () => Promise.resolve(mockCards),
      });

      const result = await cardApi.getPaginated({
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortOrder: "asc",
        search: "Test",
      });

      expect(result.cards).toEqual(mockCards);
      expect(result.total).toBe(1);

      // Verify query params
      const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchCall).toContain("_page=1");
      expect(fetchCall).toContain("_limit=10");
      expect(fetchCall).toContain("_sort=name");
      expect(fetchCall).toContain("_order=asc");
      expect(fetchCall).toContain("name_like=Test");
    });
  });

  describe("create", () => {
    it("should create a new card", async () => {
      const input: CreateCardInput = {
        name: "New Card",
        atk: 150,
        hp: 250,
        imagePath: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "new-id",
            ...input,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }),
      });

      const result = await cardApi.create(input);
      expect(result.name).toBe("New Card");
      expect(result.atk).toBe(150);
      expect(result.hp).toBe(250);
      expect(result.id).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update an existing card", async () => {
      const existingCard: ApiCard = {
        id: "test-1",
        name: "Old Name",
        atk: 100,
        hp: 200,
        imagePath: null,
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      };

      // First call: getById
      // Second call: PUT
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(existingCard),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              ...existingCard,
              name: "New Name",
              updatedAt: Date.now(),
            }),
        });

      const result = await cardApi.update("test-1", {
        name: "New Name",
        atk: 100,
        hp: 200,
        imagePath: null,
      });

      expect(result.name).toBe("New Name");
      expect(result.id).toBe("test-1");
    });

    it("should throw error if card not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(
        cardApi.update("non-existent", {
          name: "Test",
          atk: 100,
          hp: 200,
          imagePath: null,
        })
      ).rejects.toThrow("Card with id non-existent not found");
    });
  });

  describe("delete", () => {
    it("should delete a card", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      await expect(cardApi.delete("test-1")).resolves.not.toThrow();
    });

    it("should not throw for non-existent card (404)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(cardApi.delete("non-existent")).resolves.not.toThrow();
    });
  });
});
