import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GemService } from "./gemService";
import type { Gem, GemFormInput } from "../types/gem";

/**
 * Unit tests for GemService
 * Tests CRUD operations against json-server REST API
 *
 * Requirements:
 * - 1.1: Create gems with unique id, name, description, skill type, trigger type,
 *        activation chance, cooldown, and effect parameters
 * - 1.2: View all available gems with their properties
 * - 1.3: Edit gem properties and persist changes
 * - 1.4: Delete gems
 */

// Store original fetch
const originalFetch = global.fetch;

// Helper to create a valid gem form input
function createValidGemInput(
  overrides: Partial<GemFormInput> = {},
): GemFormInput {
  return {
    name: "Test Gem",
    description: "A test gem for unit testing",
    skillType: "knockback",
    trigger: "combat",
    activationChance: 30,
    cooldown: 0,
    effectParams: { knockbackDistance: 1 },
    ...overrides,
  };
}

// Helper to create a mock gem response
function createMockGem(overrides: Partial<Gem> = {}): Gem {
  return {
    id: "test-gem-id",
    name: "Test Gem",
    description: "A test gem",
    skillType: "knockback",
    trigger: "combat",
    activationChance: 30,
    cooldown: 0,
    effectParams: { knockbackDistance: 1 },
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("GemService - Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("getAll", () => {
    it("should fetch all gems from API", async () => {
      const mockGems: Gem[] = [
        createMockGem({ id: "gem-1", name: "Knockback Stone" }),
        createMockGem({
          id: "gem-2",
          name: "Retreat Crystal",
          skillType: "retreat",
        }),
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGems),
      });

      const result = await GemService.getAll();

      expect(result).toEqual(mockGems);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/gems"));
    });

    it("should return empty array when no gems exist", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await GemService.getAll();

      expect(result).toEqual([]);
    });

    it("should throw error on API failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      await expect(GemService.getAll()).rejects.toThrow("API Error: 500");
    });
  });

  describe("getById", () => {
    it("should fetch a single gem by ID", async () => {
      const mockGem = createMockGem({ id: "gem-1" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockGem),
      });

      const result = await GemService.getById("gem-1");

      expect(result).toEqual(mockGem);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/gems/gem-1"),
      );
    });

    it("should return null for non-existent gem", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await GemService.getById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new gem with all required fields (Requirement 1.1)", async () => {
      const input = createValidGemInput({
        name: "New Knockback Gem",
        description: "Pushes enemies back",
        skillType: "knockback",
        trigger: "combat",
        activationChance: 25,
        cooldown: 2,
        effectParams: { knockbackDistance: 1 },
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "new-gem-id",
            ...input,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z",
          }),
      });

      const result = await GemService.create(input);

      expect(result.id).toBeDefined();
      expect(result.name).toBe("New Knockback Gem");
      expect(result.description).toBe("Pushes enemies back");
      expect(result.skillType).toBe("knockback");
      expect(result.trigger).toBe("combat");
      expect(result.activationChance).toBe(25);
      expect(result.cooldown).toBe(2);
      expect(result.effectParams).toEqual({ knockbackDistance: 1 });
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should create gems with different skill types", async () => {
      const skillTypes = [
        "knockback",
        "retreat",
        "double_move",
        "double_attack",
        "execute",
        "leap_strike",
      ] as const;

      for (const skillType of skillTypes) {
        const input = createValidGemInput({ skillType });

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              id: `gem-${skillType}`,
              ...input,
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z",
            }),
        });

        const result = await GemService.create(input);
        expect(result.skillType).toBe(skillType);
      }
    });

    it("should reject empty name", async () => {
      const input = createValidGemInput({ name: "" });

      await expect(GemService.create(input)).rejects.toThrow(
        "Validation error",
      );
    });

    it("should reject whitespace-only name", async () => {
      const input = createValidGemInput({ name: "   " });

      await expect(GemService.create(input)).rejects.toThrow(
        "Validation error",
      );
    });

    it("should reject activation chance below 0", async () => {
      const input = createValidGemInput({ activationChance: -1 });

      await expect(GemService.create(input)).rejects.toThrow(
        "Validation error",
      );
    });

    it("should reject activation chance above 100", async () => {
      const input = createValidGemInput({ activationChance: 101 });

      await expect(GemService.create(input)).rejects.toThrow(
        "Validation error",
      );
    });

    it("should reject cooldown below 0", async () => {
      const input = createValidGemInput({ cooldown: -1 });

      await expect(GemService.create(input)).rejects.toThrow(
        "Validation error",
      );
    });

    it("should reject cooldown above 10", async () => {
      const input = createValidGemInput({ cooldown: 11 });

      await expect(GemService.create(input)).rejects.toThrow(
        "Validation error",
      );
    });
  });

  describe("update", () => {
    it("should update an existing gem (Requirement 1.3)", async () => {
      const existingGem = createMockGem({
        id: "gem-1",
        name: "Old Name",
        activationChance: 20,
      });

      // First call: getById
      // Second call: PUT
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(existingGem),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              ...existingGem,
              name: "New Name",
              activationChance: 50,
              updatedAt: "2025-01-02T00:00:00.000Z",
            }),
        });

      const result = await GemService.update("gem-1", {
        name: "New Name",
        activationChance: 50,
      });

      expect(result).not.toBeNull();
      expect(result!.name).toBe("New Name");
      expect(result!.activationChance).toBe(50);
      expect(result!.id).toBe("gem-1");
    });

    it("should preserve unspecified fields during partial update", async () => {
      const existingGem = createMockGem({
        id: "gem-1",
        name: "Original Name",
        description: "Original description",
        activationChance: 30,
        cooldown: 2,
      });

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(existingGem),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              ...existingGem,
              name: "Updated Name",
              updatedAt: "2025-01-02T00:00:00.000Z",
            }),
        });

      const result = await GemService.update("gem-1", { name: "Updated Name" });

      expect(result).not.toBeNull();
      expect(result!.name).toBe("Updated Name");
      // These should be preserved from original
      expect(result!.description).toBe("Original description");
      expect(result!.activationChance).toBe(30);
      expect(result!.cooldown).toBe(2);
    });

    it("should return null for non-existent gem", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await GemService.update("non-existent", { name: "Test" });

      expect(result).toBeNull();
    });

    it("should reject invalid update data", async () => {
      const existingGem = createMockGem({ id: "gem-1" });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(existingGem),
      });

      await expect(
        GemService.update("gem-1", { activationChance: 150 }),
      ).rejects.toThrow("Validation error");
    });
  });

  describe("delete", () => {
    it("should delete an existing gem (Requirement 1.4)", async () => {
      const existingGem = createMockGem({ id: "gem-1" });

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(existingGem),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      const result = await GemService.delete("gem-1");

      expect(result).toBe(true);
    });

    it("should return false for non-existent gem", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await GemService.delete("non-existent");

      expect(result).toBe(false);
    });
  });

  describe("clear", () => {
    it("should delete all gems", async () => {
      const mockGems = [
        createMockGem({ id: "gem-1" }),
        createMockGem({ id: "gem-2" }),
      ];

      // Use mockImplementation to handle parallel calls properly
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation((url: string) => {
        callCount++;

        // First call is getAll
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockGems),
          });
        }

        // Subsequent calls are getById and delete
        if (url.includes("/gems/gem-1") || url.includes("/gems/gem-2")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve(
                url.includes("gem-1") ? mockGems[0] : mockGems[1],
              ),
          });
        }

        return Promise.resolve({ ok: true, status: 200 });
      });

      await expect(GemService.clear()).resolves.not.toThrow();
    });
  });
});
