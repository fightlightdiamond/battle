import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import "fake-indexeddb/auto";
import {
  WeaponService,
  serializeWeapon,
  deserializeWeapon,
} from "./weaponService";
import { EquipmentService } from "./equipmentService";
import { deleteDB } from "../../cards/services/db";
import type { WeaponFormInput, Weapon } from "../types/weapon";
import { WEAPON_STAT_RANGES } from "../types/weapon";

// Mock OPFS since it's not available in Node.js
vi.mock("../../cards/services/imageStorage", () => ({
  saveImage: vi.fn().mockResolvedValue("test-weapon-image.png"),
  deleteImage: vi.fn().mockResolvedValue(true),
  getImageUrl: vi.fn().mockResolvedValue("blob:test-weapon-url"),
}));

// Custom UUID v4 generator for testing
const uuidV4Arb = fc.stringMatching(
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
);

// Valid weapon name generator (non-empty, non-whitespace)
const validWeaponNameArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

// Valid weapon stats generator
const validWeaponStatsArb = fc.record({
  atk: fc.integer({
    min: WEAPON_STAT_RANGES.atk.min,
    max: WEAPON_STAT_RANGES.atk.max,
  }),
  critChance: fc.integer({
    min: WEAPON_STAT_RANGES.critChance.min,
    max: WEAPON_STAT_RANGES.critChance.max,
  }),
  critDamage: fc.integer({
    min: WEAPON_STAT_RANGES.critDamage.min,
    max: WEAPON_STAT_RANGES.critDamage.max,
  }),
  armorPen: fc.integer({
    min: WEAPON_STAT_RANGES.armorPen.min,
    max: WEAPON_STAT_RANGES.armorPen.max,
  }),
  lifesteal: fc.integer({
    min: WEAPON_STAT_RANGES.lifesteal.min,
    max: WEAPON_STAT_RANGES.lifesteal.max,
  }),
});

/**
 * Integration tests for WeaponService with IndexedDB
 */
describe("WeaponService - IndexedDB Integration", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await deleteDB();
  });

  describe("create", () => {
    it("should create a new weapon in IndexedDB", async () => {
      const input: WeaponFormInput = {
        name: "Test Sword",
        image: null,
        atk: 50,
        critChance: 10,
      };

      const weapon = await WeaponService.create(input);

      expect(weapon.id).toBeDefined();
      expect(weapon.name).toBe("Test Sword");
      expect(weapon.atk).toBe(50);
      expect(weapon.critChance).toBe(10);
      expect(weapon.createdAt).toBeDefined();
      expect(weapon.updatedAt).toBeDefined();
    });

    it("should apply default stats when not provided", async () => {
      const input: WeaponFormInput = {
        name: "Basic Weapon",
        image: null,
      };

      const weapon = await WeaponService.create(input);

      expect(weapon.atk).toBe(0);
      expect(weapon.critChance).toBe(0);
      expect(weapon.critDamage).toBe(0);
      expect(weapon.armorPen).toBe(0);
      expect(weapon.lifesteal).toBe(0);
    });
  });

  describe("getAll", () => {
    it("should return empty array when no weapons exist", async () => {
      const weapons = await WeaponService.getAll();
      expect(weapons).toEqual([]);
    });

    it("should return all weapons", async () => {
      await WeaponService.create({ name: "Weapon 1", image: null });
      await WeaponService.create({ name: "Weapon 2", image: null });
      await WeaponService.create({ name: "Weapon 3", image: null });

      const weapons = await WeaponService.getAll();
      expect(weapons).toHaveLength(3);
    });
  });

  describe("getById", () => {
    it("should return null for non-existent weapon", async () => {
      const weapon = await WeaponService.getById("non-existent-id");
      expect(weapon).toBeNull();
    });

    it("should return weapon by ID", async () => {
      const created = await WeaponService.create({
        name: "Find Me",
        image: null,
        atk: 100,
      });

      const found = await WeaponService.getById(created.id);
      expect(found).not.toBeNull();
      expect(found?.name).toBe("Find Me");
      expect(found?.atk).toBe(100);
    });
  });

  describe("update", () => {
    it("should update an existing weapon", async () => {
      const created = await WeaponService.create({
        name: "Original Name",
        image: null,
        atk: 100,
      });

      const updated = await WeaponService.update(created.id, {
        name: "Updated Name",
        image: null,
        atk: 200,
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("Updated Name");
      expect(updated?.atk).toBe(200);
      expect(updated?.id).toBe(created.id);
    });

    it("should return null for non-existent weapon", async () => {
      const result = await WeaponService.update("non-existent", {
        name: "Test",
        image: null,
      });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete an existing weapon", async () => {
      const created = await WeaponService.create({
        name: "To Delete",
        image: null,
      });

      const deleted = await WeaponService.delete(created.id);
      expect(deleted).toBe(true);

      const found = await WeaponService.getById(created.id);
      expect(found).toBeNull();
    });

    it("should return false for non-existent weapon", async () => {
      const result = await WeaponService.delete("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all weapons", async () => {
      await WeaponService.create({ name: "Weapon 1", image: null });
      await WeaponService.create({ name: "Weapon 2", image: null });

      await WeaponService.clear();

      const weapons = await WeaponService.getAll();
      expect(weapons).toHaveLength(0);
    });
  });
});

/**
 * **Feature: weapon-equipment, Property 4: Unique IDs for all weapons**
 * **Validates: Requirements 1.4**
 *
 * For any set of created weapons, all weapon IDs should be distinct from each other.
 */
describe("Property 4: Unique IDs for all weapons", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await deleteDB();
  });

  it("property: all created weapons have unique IDs", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validWeaponNameArb, { minLength: 2, maxLength: 10 }),
        async (names) => {
          // Clear database before each property run
          await WeaponService.clear();

          // Create weapons with the generated names
          const weapons: Weapon[] = [];
          for (const name of names) {
            const weapon = await WeaponService.create({ name, image: null });
            weapons.push(weapon);
          }

          // Collect all IDs
          const ids = weapons.map((w) => w.id);

          // All IDs should be unique
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);

          // Each ID should be a valid UUID format
          for (const id of ids) {
            expect(id).toMatch(
              /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: IDs are unique even with identical weapon data", async () => {
    await fc.assert(
      fc.asyncProperty(
        validWeaponNameArb,
        validWeaponStatsArb,
        fc.integer({ min: 2, max: 5 }),
        async (name, stats, count) => {
          await WeaponService.clear();

          // Create multiple weapons with identical data
          const weapons: Weapon[] = [];
          for (let i = 0; i < count; i++) {
            const weapon = await WeaponService.create({
              name,
              image: null,
              ...stats,
            });
            weapons.push(weapon);
          }

          // All IDs should still be unique
          const ids = weapons.map((w) => w.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(count);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: weapon-equipment, Property 5: Weapon update persists changes with new timestamp**
 * **Validates: Requirements 2.3**
 *
 * For any existing weapon and valid update input, updating the weapon should
 * persist the new values and set updatedAt > previous updatedAt.
 */
describe("Property 5: Weapon update persists changes with new timestamp", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await deleteDB();
  });

  it("property: update persists new values and increases timestamp", async () => {
    await fc.assert(
      fc.asyncProperty(
        validWeaponNameArb,
        validWeaponNameArb,
        validWeaponStatsArb,
        validWeaponStatsArb,
        async (originalName, newName, originalStats, newStats) => {
          await WeaponService.clear();

          // Create original weapon
          const original = await WeaponService.create({
            name: originalName,
            image: null,
            ...originalStats,
          });

          // Small delay to ensure timestamp difference
          await new Promise((resolve) => setTimeout(resolve, 5));

          // Update the weapon
          const updated = await WeaponService.update(original.id, {
            name: newName,
            image: null,
            ...newStats,
          });

          expect(updated).not.toBeNull();

          // New values should be persisted
          expect(updated!.name).toBe(newName);
          expect(updated!.atk).toBe(newStats.atk);
          expect(updated!.critChance).toBe(newStats.critChance);
          expect(updated!.critDamage).toBe(newStats.critDamage);
          expect(updated!.armorPen).toBe(newStats.armorPen);
          expect(updated!.lifesteal).toBe(newStats.lifesteal);

          // Timestamp should be updated
          expect(updated!.updatedAt).toBeGreaterThan(original.updatedAt);

          // createdAt should be preserved
          expect(updated!.createdAt).toBe(original.createdAt);

          // ID should be preserved
          expect(updated!.id).toBe(original.id);

          // Verify persistence by fetching from DB
          const fetched = await WeaponService.getById(original.id);
          expect(fetched).not.toBeNull();
          expect(fetched!.name).toBe(newName);
          expect(fetched!.atk).toBe(newStats.atk);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: partial update preserves unspecified stats", async () => {
    await fc.assert(
      fc.asyncProperty(
        validWeaponNameArb,
        validWeaponNameArb,
        validWeaponStatsArb,
        async (originalName, newName, originalStats) => {
          await WeaponService.clear();

          // Create original weapon with all stats
          const original = await WeaponService.create({
            name: originalName,
            image: null,
            ...originalStats,
          });

          await new Promise((resolve) => setTimeout(resolve, 5));

          // Update only the name (no stats specified)
          const updated = await WeaponService.update(original.id, {
            name: newName,
            image: null,
          });

          expect(updated).not.toBeNull();

          // Name should be updated
          expect(updated!.name).toBe(newName);

          // Stats should be preserved
          expect(updated!.atk).toBe(originalStats.atk);
          expect(updated!.critChance).toBe(originalStats.critChance);
          expect(updated!.critDamage).toBe(originalStats.critDamage);
          expect(updated!.armorPen).toBe(originalStats.armorPen);
          expect(updated!.lifesteal).toBe(originalStats.lifesteal);

          // Timestamp should still be updated
          expect(updated!.updatedAt).toBeGreaterThan(original.updatedAt);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: weapon-equipment, Property 11: Weapon serialization round-trip**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 *
 * For any valid weapon object, serializing to JSON then deserializing
 * should produce an equivalent weapon object.
 */
describe("Property 11: Weapon serialization round-trip", () => {
  // Generator for complete weapon objects
  const weaponArb: fc.Arbitrary<Weapon> = fc.record({
    id: uuidV4Arb,
    name: validWeaponNameArb,
    imagePath: fc.constantFrom(null, "test-image.png", "weapon-123.webp"),
    imageUrl: fc.constantFrom(null, "blob:test-url"),
    createdAt: fc.integer({ min: 0, max: Date.now() + 1000000 }),
    updatedAt: fc.integer({ min: 0, max: Date.now() + 1000000 }),
    atk: fc.integer({
      min: WEAPON_STAT_RANGES.atk.min,
      max: WEAPON_STAT_RANGES.atk.max,
    }),
    critChance: fc.integer({
      min: WEAPON_STAT_RANGES.critChance.min,
      max: WEAPON_STAT_RANGES.critChance.max,
    }),
    critDamage: fc.integer({
      min: WEAPON_STAT_RANGES.critDamage.min,
      max: WEAPON_STAT_RANGES.critDamage.max,
    }),
    armorPen: fc.integer({
      min: WEAPON_STAT_RANGES.armorPen.min,
      max: WEAPON_STAT_RANGES.armorPen.max,
    }),
    lifesteal: fc.integer({
      min: WEAPON_STAT_RANGES.lifesteal.min,
      max: WEAPON_STAT_RANGES.lifesteal.max,
    }),
  });

  it("property: serialize then deserialize produces equivalent weapon", () => {
    fc.assert(
      fc.property(weaponArb, (weapon) => {
        // Serialize to JSON
        const json = serializeWeapon(weapon);

        // Deserialize back to object
        const deserialized = deserializeWeapon(json);

        // All fields should be equal
        expect(deserialized.id).toBe(weapon.id);
        expect(deserialized.name).toBe(weapon.name);
        expect(deserialized.imagePath).toBe(weapon.imagePath);
        expect(deserialized.imageUrl).toBe(weapon.imageUrl);
        expect(deserialized.createdAt).toBe(weapon.createdAt);
        expect(deserialized.updatedAt).toBe(weapon.updatedAt);
        expect(deserialized.atk).toBe(weapon.atk);
        expect(deserialized.critChance).toBe(weapon.critChance);
        expect(deserialized.critDamage).toBe(weapon.critDamage);
        expect(deserialized.armorPen).toBe(weapon.armorPen);
        expect(deserialized.lifesteal).toBe(weapon.lifesteal);
      }),
      { numRuns: 100 },
    );
  });

  it("property: round-trip preserves object equality", () => {
    fc.assert(
      fc.property(weaponArb, (weapon) => {
        const json = serializeWeapon(weapon);
        const deserialized = deserializeWeapon(json);

        // Deep equality check
        expect(deserialized).toEqual(weapon);
      }),
      { numRuns: 100 },
    );
  });

  it("property: serialized JSON is valid JSON string", () => {
    fc.assert(
      fc.property(weaponArb, (weapon) => {
        const json = serializeWeapon(weapon);

        // Should be a valid JSON string
        expect(typeof json).toBe("string");
        expect(() => JSON.parse(json)).not.toThrow();
      }),
      { numRuns: 100 },
    );
  });

  it("property: multiple round-trips produce same result", () => {
    fc.assert(
      fc.property(weaponArb, (weapon) => {
        // First round-trip
        const json1 = serializeWeapon(weapon);
        const deserialized1 = deserializeWeapon(json1);

        // Second round-trip
        const json2 = serializeWeapon(deserialized1);
        const deserialized2 = deserializeWeapon(json2);

        // Both should be equal
        expect(deserialized2).toEqual(deserialized1);
        expect(deserialized2).toEqual(weapon);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: weapon-equipment, Property 6: Deleting equipped weapon unequips from card**
 * **Validates: Requirements 2.4**
 *
 * For any weapon that is equipped to a card, deleting the weapon should result in
 * the card having no equipped weapon (weaponId = null).
 */
describe("Property 6: Deleting equipped weapon unequips from card", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await deleteDB();
  });

  it("property: deleting equipped weapon sets card weaponId to null", async () => {
    await fc.assert(
      fc.asyncProperty(
        validWeaponNameArb,
        validWeaponStatsArb,
        async (weaponName, weaponStats) => {
          await WeaponService.clear();
          await EquipmentService.clear();

          // Create a weapon
          const weapon = await WeaponService.create({
            name: weaponName,
            image: null,
            ...weaponStats,
          });

          // Generate a card ID
          const cardId = crypto.randomUUID();

          // Equip the weapon to the card
          await EquipmentService.equipWeapon(cardId, weapon.id);

          // Verify weapon is equipped
          const equipmentBefore = await EquipmentService.getEquipment(cardId);
          expect(equipmentBefore?.weaponId).toBe(weapon.id);

          // Delete the weapon
          const deleted = await WeaponService.delete(weapon.id);
          expect(deleted).toBe(true);

          // Verify weapon is deleted
          const weaponAfter = await WeaponService.getById(weapon.id);
          expect(weaponAfter).toBeNull();

          // Verify card no longer has the weapon equipped
          const equipmentAfter = await EquipmentService.getEquipment(cardId);
          expect(equipmentAfter?.weaponId).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: deleting weapon unequips from correct card when multiple cards exist", async () => {
    await fc.assert(
      fc.asyncProperty(
        validWeaponNameArb,
        validWeaponNameArb,
        async (weaponName1, weaponName2) => {
          await WeaponService.clear();
          await EquipmentService.clear();

          // Create two weapons
          const weapon1 = await WeaponService.create({
            name: weaponName1,
            image: null,
          });
          const weapon2 = await WeaponService.create({
            name: weaponName2,
            image: null,
          });

          // Generate two card IDs
          const cardId1 = crypto.randomUUID();
          const cardId2 = crypto.randomUUID();

          // Equip weapon1 to card1, weapon2 to card2
          await EquipmentService.equipWeapon(cardId1, weapon1.id);
          await EquipmentService.equipWeapon(cardId2, weapon2.id);

          // Delete weapon1
          await WeaponService.delete(weapon1.id);

          // Card1 should have no weapon
          const equipment1 = await EquipmentService.getEquipment(cardId1);
          expect(equipment1?.weaponId).toBeNull();

          // Card2 should still have weapon2
          const equipment2 = await EquipmentService.getEquipment(cardId2);
          expect(equipment2?.weaponId).toBe(weapon2.id);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: deleting unequipped weapon does not affect other cards", async () => {
    await fc.assert(
      fc.asyncProperty(
        validWeaponNameArb,
        validWeaponNameArb,
        async (weaponName1, weaponName2) => {
          await WeaponService.clear();
          await EquipmentService.clear();

          // Create two weapons
          const weapon1 = await WeaponService.create({
            name: weaponName1,
            image: null,
          });
          const weapon2 = await WeaponService.create({
            name: weaponName2,
            image: null,
          });

          // Generate a card ID
          const cardId = crypto.randomUUID();

          // Equip only weapon2 to the card
          await EquipmentService.equipWeapon(cardId, weapon2.id);

          // Delete weapon1 (which is not equipped)
          await WeaponService.delete(weapon1.id);

          // Card should still have weapon2
          const equipment = await EquipmentService.getEquipment(cardId);
          expect(equipment?.weaponId).toBe(weapon2.id);
        },
      ),
      { numRuns: 100 },
    );
  });
});
