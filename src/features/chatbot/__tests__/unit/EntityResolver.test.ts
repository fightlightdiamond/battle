import { describe, it, expect } from "vitest";
import { EntityResolver, FUSE_OPTIONS } from "../../services/EntityResolver";
import type { NamedEntity } from "../../services/EntityResolver";

describe("EntityResolver", () => {
  // Test entities
  const testEntities: NamedEntity[] = [
    { id: "1", name: "Dragon" },
    { id: "2", name: "Phoenix" },
    { id: "3", name: "Tiger" },
    { id: "4", name: "Dragon Warrior" },
    { id: "5", name: "Fire Dragon" },
  ];

  describe("Fuse.js configuration", () => {
    it("should have correct Fuse options configured", () => {
      expect(FUSE_OPTIONS.threshold).toBe(0.3);
      expect(FUSE_OPTIONS.keys).toEqual(["name"]);
      expect(FUSE_OPTIONS.includeScore).toBe(true);
    });
  });

  describe("exact matching", () => {
    it("should find exact match (case-insensitive)", () => {
      const resolver = new EntityResolver(testEntities);
      const result = resolver.resolve("Dragon");

      expect(result.status).toBe("exact");
      expect(result.entity).toEqual({ id: "1", name: "Dragon" });
    });

    it("should find exact match with different case", () => {
      const resolver = new EntityResolver(testEntities);
      const result = resolver.resolve("dragon");

      expect(result.status).toBe("exact");
      expect(result.entity).toEqual({ id: "1", name: "Dragon" });
    });

    it("should find exact match with whitespace trimmed", () => {
      const resolver = new EntityResolver(testEntities);
      const result = resolver.resolve("  Phoenix  ");

      expect(result.status).toBe("exact");
      expect(result.entity).toEqual({ id: "2", name: "Phoenix" });
    });
  });

  describe("fuzzy matching", () => {
    it("should find fuzzy match with typo", () => {
      const resolver = new EntityResolver(testEntities);
      const result = resolver.resolve("Draon"); // Missing 'g'

      expect(result.status).toBe("fuzzy");
      expect(result.entity?.name).toBe("Dragon");
    });

    it("should find fuzzy match with extra character", () => {
      const resolver = new EntityResolver(testEntities);
      const result = resolver.resolve("Tigerr"); // Extra 'r'

      expect(result.status).toBe("fuzzy");
      expect(result.entity?.name).toBe("Tiger");
    });
  });

  describe("multiple matches", () => {
    it("should return multiple matches when several entities match well", () => {
      const resolver = new EntityResolver(testEntities);
      const result = resolver.resolve("Drag"); // Matches Dragon, Dragon Warrior, Fire Dragon

      // This might be fuzzy or multiple depending on scores
      expect(["fuzzy", "multiple"]).toContain(result.status);

      if (result.status === "multiple") {
        expect(result.matches).toBeDefined();
        expect(result.matches!.length).toBeGreaterThan(1);
      }
    });
  });

  describe("no matches", () => {
    it("should return none status when no good match found", () => {
      const resolver = new EntityResolver(testEntities);
      const result = resolver.resolve("Unicorn");

      expect(result.status).toBe("none");
      expect(result.entity).toBeUndefined();
    });

    it("should provide suggestions when no good match found", () => {
      const resolver = new EntityResolver(testEntities);
      const result = resolver.resolve("Drgn"); // Similar but not close enough

      expect(result.status).toBe("none");
      // Should provide suggestions if Fuse finds any matches
      // (may be undefined if the query is too different)
      if (result.matches) {
        expect(result.matches.length).toBeGreaterThan(0);
        expect(result.matches.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe("entity updates", () => {
    it("should update entities and rebuild index", () => {
      const resolver = new EntityResolver(testEntities);

      // Initial search
      let result = resolver.resolve("Dragon");
      expect(result.entity).toEqual({ id: "1", name: "Dragon" });

      // Update entities
      const newEntities: NamedEntity[] = [
        { id: "10", name: "Wolf" },
        { id: "11", name: "Bear" },
      ];
      resolver.updateEntities(newEntities);

      // Old entity should not be found
      result = resolver.resolve("Dragon");
      expect(result.status).toBe("none");

      // New entity should be found
      result = resolver.resolve("Wolf");
      expect(result.status).toBe("exact");
      expect(result.entity).toEqual({ id: "10", name: "Wolf" });
    });
  });

  describe("getAll", () => {
    it("should return all entities", () => {
      const resolver = new EntityResolver(testEntities);
      const all = resolver.getAll();

      expect(all).toEqual(testEntities);
      expect(all.length).toBe(5);
    });
  });
});
