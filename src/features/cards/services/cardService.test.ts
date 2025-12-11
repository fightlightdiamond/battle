import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { CardService } from "./cardService";
import { deleteDB } from "./db";
import type { CardFormInput } from "../types";

// Mock OPFS since it's not available in Node.js
vi.mock("./imageStorage", () => ({
  saveImage: vi.fn().mockResolvedValue("test-image.png"),
  deleteImage: vi.fn().mockResolvedValue(true),
  getImageUrl: vi.fn().mockResolvedValue("blob:test-url"),
}));

/**
 * Integration tests for CardService with IndexedDB
 * Tests CRUD operations and data persistence
 */
describe("CardService - IndexedDB Integration", () => {
  beforeEach(async () => {
    // Clear the database before each test
    await deleteDB();
  });

  afterEach(async () => {
    // Clean up after each test
    await deleteDB();
  });

  describe("create", () => {
    it("should create a new card in IndexedDB", async () => {
      const input: CardFormInput = {
        name: "Test Card",
        atk: 100,
        hp: 200,
        image: null,
      };

      const card = await CardService.create(input);

      expect(card.id).toBeDefined();
      expect(card.name).toBe("Test Card");
      expect(card.atk).toBe(100);
      expect(card.hp).toBe(200);
      expect(card.createdAt).toBeDefined();
      expect(card.updatedAt).toBeDefined();
    });

    it("should persist card to IndexedDB", async () => {
      const input: CardFormInput = {
        name: "Persistent Card",
        atk: 150,
        hp: 250,
        image: null,
      };

      const created = await CardService.create(input);
      const retrieved = await CardService.getById(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe("Persistent Card");
      expect(retrieved?.atk).toBe(150);
      expect(retrieved?.hp).toBe(250);
    });
  });

  describe("getAll", () => {
    it("should return empty array when no cards exist", async () => {
      const cards = await CardService.getAll();
      expect(cards).toEqual([]);
    });

    it("should return all cards", async () => {
      await CardService.create({
        name: "Card 1",
        atk: 100,
        hp: 100,
        image: null,
      });
      await CardService.create({
        name: "Card 2",
        atk: 200,
        hp: 200,
        image: null,
      });
      await CardService.create({
        name: "Card 3",
        atk: 300,
        hp: 300,
        image: null,
      });

      const cards = await CardService.getAll();
      expect(cards).toHaveLength(3);
    });
  });

  describe("getById", () => {
    it("should return null for non-existent card", async () => {
      const card = await CardService.getById("non-existent-id");
      expect(card).toBeNull();
    });

    it("should return card by ID", async () => {
      const created = await CardService.create({
        name: "Find Me",
        atk: 100,
        hp: 100,
        image: null,
      });

      const found = await CardService.getById(created.id);
      expect(found).not.toBeNull();
      expect(found?.name).toBe("Find Me");
    });
  });

  describe("update", () => {
    it("should update an existing card", async () => {
      const created = await CardService.create({
        name: "Original Name",
        atk: 100,
        hp: 100,
        image: null,
      });

      const updated = await CardService.update(created.id, {
        name: "Updated Name",
        atk: 200,
        hp: 300,
        image: null,
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("Updated Name");
      expect(updated?.atk).toBe(200);
      expect(updated?.hp).toBe(300);
      expect(updated?.id).toBe(created.id); // ID should be preserved
    });

    it("should return null for non-existent card", async () => {
      const result = await CardService.update("non-existent", {
        name: "Test",
        atk: 100,
        hp: 100,
        image: null,
      });
      expect(result).toBeNull();
    });

    it("should update updatedAt timestamp", async () => {
      const created = await CardService.create({
        name: "Test",
        atk: 100,
        hp: 100,
        image: null,
      });

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await CardService.update(created.id, {
        name: "Updated",
        atk: 100,
        hp: 100,
        image: null,
      });

      expect(updated?.updatedAt).toBeGreaterThan(created.updatedAt);
      expect(updated?.createdAt).toBe(created.createdAt); // createdAt should be preserved
    });
  });

  describe("delete", () => {
    it("should delete an existing card", async () => {
      const created = await CardService.create({
        name: "To Delete",
        atk: 100,
        hp: 100,
        image: null,
      });

      const deleted = await CardService.delete(created.id);
      expect(deleted).toBe(true);

      const found = await CardService.getById(created.id);
      expect(found).toBeNull();
    });

    it("should return false for non-existent card", async () => {
      const result = await CardService.delete("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("getPaginated", () => {
    beforeEach(async () => {
      // Create test cards
      await CardService.create({
        name: "Alpha",
        atk: 100,
        hp: 500,
        image: null,
      });
      await CardService.create({
        name: "Beta",
        atk: 300,
        hp: 300,
        image: null,
      });
      await CardService.create({
        name: "Gamma",
        atk: 200,
        hp: 100,
        image: null,
      });
      await CardService.create({
        name: "Delta",
        atk: 400,
        hp: 200,
        image: null,
      });
      await CardService.create({
        name: "Epsilon",
        atk: 500,
        hp: 400,
        image: null,
      });
    });

    it("should return paginated results", async () => {
      const result = await CardService.getPaginated({
        search: "",
        sortBy: "name",
        sortOrder: "asc",
        page: 1,
        pageSize: 2,
      });

      expect(result.cards).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it("should filter by search term", async () => {
      const result = await CardService.getPaginated({
        search: "Alpha",
        sortBy: "name",
        sortOrder: "asc",
        page: 1,
        pageSize: 10,
      });

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].name).toBe("Alpha");
    });

    it("should sort by name ascending", async () => {
      const result = await CardService.getPaginated({
        search: "",
        sortBy: "name",
        sortOrder: "asc",
        page: 1,
        pageSize: 10,
      });

      // Verify cards are sorted alphabetically
      const names = result.cards.map((c) => c.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
      expect(result.cards[0].name).toBe("Alpha");
    });

    it("should sort by atk descending", async () => {
      const result = await CardService.getPaginated({
        search: "",
        sortBy: "atk",
        sortOrder: "desc",
        page: 1,
        pageSize: 10,
      });

      expect(result.cards[0].atk).toBe(500);
      expect(result.cards[4].atk).toBe(100);
    });

    it("should sort by hp ascending", async () => {
      const result = await CardService.getPaginated({
        search: "",
        sortBy: "hp",
        sortOrder: "asc",
        page: 1,
        pageSize: 10,
      });

      expect(result.cards[0].hp).toBe(100);
      expect(result.cards[4].hp).toBe(500);
    });
  });

  describe("clear", () => {
    it("should remove all cards", async () => {
      await CardService.create({
        name: "Card 1",
        atk: 100,
        hp: 100,
        image: null,
      });
      await CardService.create({
        name: "Card 2",
        atk: 200,
        hp: 200,
        image: null,
      });

      await CardService.clear();

      const cards = await CardService.getAll();
      expect(cards).toHaveLength(0);
    });
  });

  describe("createWithId", () => {
    it("should create a card with a pre-generated ID", async () => {
      const cardData = {
        id: "custom-id-123",
        name: "Custom ID Card",
        atk: 100,
        hp: 200,
        imagePath: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const card = await CardService.createWithId(cardData);

      expect(card.id).toBe("custom-id-123");
      expect(card.name).toBe("Custom ID Card");

      const retrieved = await CardService.getById("custom-id-123");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe("custom-id-123");
    });
  });

  describe("upsert", () => {
    it("should create a new card if it does not exist", async () => {
      const cardData = {
        id: "upsert-new-123",
        name: "New Upsert Card",
        atk: 100,
        hp: 200,
        imagePath: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const card = await CardService.upsert(cardData);

      expect(card.id).toBe("upsert-new-123");
      expect(card.name).toBe("New Upsert Card");

      const retrieved = await CardService.getById("upsert-new-123");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe("New Upsert Card");
    });

    it("should update an existing card if it already exists", async () => {
      const cardData = {
        id: "upsert-existing-123",
        name: "Original Name",
        atk: 100,
        hp: 200,
        imagePath: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Create the card first
      await CardService.upsert(cardData);

      // Update with upsert
      const updatedData = {
        ...cardData,
        name: "Updated Name",
        atk: 300,
        updatedAt: Date.now() + 1000,
      };

      const card = await CardService.upsert(updatedData);

      expect(card.id).toBe("upsert-existing-123");
      expect(card.name).toBe("Updated Name");
      expect(card.atk).toBe(300);

      const retrieved = await CardService.getById("upsert-existing-123");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe("Updated Name");
      expect(retrieved?.atk).toBe(300);
    });

    it("should not throw error when upserting duplicate key", async () => {
      const cardData = {
        id: "upsert-duplicate-123",
        name: "First Version",
        atk: 100,
        hp: 200,
        imagePath: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Create with createWithId first
      await CardService.createWithId(cardData);

      // Upsert should not throw
      const updatedData = {
        ...cardData,
        name: "Second Version",
      };

      await expect(CardService.upsert(updatedData)).resolves.not.toThrow();

      const retrieved = await CardService.getById("upsert-duplicate-123");
      expect(retrieved?.name).toBe("Second Version");
    });
  });
});
