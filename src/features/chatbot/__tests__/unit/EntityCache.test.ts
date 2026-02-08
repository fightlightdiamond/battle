import { describe, it, expect, vi, beforeEach } from "vitest";
import { EntityCache } from "../../services/EntityCache";
import type { NamedEntity } from "../../services/EntityResolver";

describe("EntityCache", () => {
  const testEntities: NamedEntity[] = [
    { id: "1", name: "Dragon" },
    { id: "2", name: "Phoenix" },
  ];

  let fetchFn: () => Promise<NamedEntity[]>;

  beforeEach(() => {
    fetchFn = vi.fn().mockResolvedValue(testEntities) as () => Promise<
      NamedEntity[]
    >;
  });

  describe("initialization", () => {
    it("should create cache with custom TTL", () => {
      const cache = new EntityCache(fetchFn, 5000);
      expect(cache).toBeDefined();
    });

    it("should create cache with default TTL (60000ms)", () => {
      const cache = new EntityCache(fetchFn);
      expect(cache).toBeDefined();
    });
  });

  describe("isStale", () => {
    it("should be stale initially", () => {
      const cache = new EntityCache(fetchFn);
      expect(cache.isStale()).toBe(true);
    });

    it("should not be stale after refresh", async () => {
      const cache = new EntityCache(fetchFn);
      await cache.refresh();
      expect(cache.isStale()).toBe(false);
    });

    it("should be stale after TTL expires", async () => {
      const cache = new EntityCache(fetchFn, 10); // 10ms TTL
      await cache.refresh();

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(cache.isStale()).toBe(true);
    });
  });

  describe("refresh", () => {
    it("should fetch entities from service", async () => {
      const cache = new EntityCache(fetchFn);
      await cache.refresh();

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("should create resolver with fetched entities", async () => {
      const cache = new EntityCache(fetchFn);
      await cache.refresh();

      const resolver = await cache.getResolver();
      const result = resolver.resolve("Dragon");

      expect(result.status).toBe("exact");
      expect(result.entity).toEqual({ id: "1", name: "Dragon" });
    });
  });

  describe("getResolver", () => {
    it("should refresh cache if stale", async () => {
      const cache = new EntityCache(fetchFn);

      // First call should trigger refresh
      await cache.getResolver();
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("should not refresh if cache is fresh", async () => {
      const cache = new EntityCache(fetchFn, 60000);

      // First call
      await cache.getResolver();
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Second call should not trigger refresh
      await cache.getResolver();
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("should refresh if cache is stale", async () => {
      const cache = new EntityCache(fetchFn, 10); // 10ms TTL

      // First call
      await cache.getResolver();
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Second call should trigger refresh
      await cache.getResolver();
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it("should return working resolver", async () => {
      const cache = new EntityCache(fetchFn);
      const resolver = await cache.getResolver();

      const result = resolver.resolve("Phoenix");
      expect(result.status).toBe("exact");
      expect(result.entity).toEqual({ id: "2", name: "Phoenix" });
    });
  });

  describe("clear", () => {
    it("should clear the cache", async () => {
      const cache = new EntityCache(fetchFn);
      await cache.refresh();

      expect(cache.isStale()).toBe(false);

      cache.clear();

      expect(cache.isStale()).toBe(true);
    });

    it("should require refresh after clear", async () => {
      const cache = new EntityCache(fetchFn);
      await cache.refresh();
      expect(fetchFn).toHaveBeenCalledTimes(1);

      cache.clear();

      await cache.getResolver();
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });
});
