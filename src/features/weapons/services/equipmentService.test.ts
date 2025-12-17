import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import "fake-indexeddb/auto";
import {
  EquipmentService,
  calculateEffectiveStats,
  calculateEffectiveRange,
  DEFAULT_ATTACK_RANGE,
  serializeEquipment,
  deserializeEquipment,
} from "./equipmentService";
import { deleteDB } from "../../cards/services/db";
import type { Card } from "../../cards/types/card";
import type { Weapon, WeaponStats } from "../types/weapon";
import type { CardEquipment } from "../types/equipment";
import { WEAPON_STAT_RANGES } from "../types/weapon";

// Mock OPFS since it's not available in Node.js
vi.mock("../../cards/services/imageStorage", () => ({
  saveImage: vi.fn().mockResolvedValue("test-image.png"),
  deleteImage: vi.fn().mockResolvedValue(true),
  getImageUrl: vi.fn().mockResolvedValue("blob:test-url"),
}));

// Custom UUID v4 generator for testing
const uuidV4Arb = fc.stringMatching(
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
);

// Valid weapon stats generator
const validWeaponStatsArb: fc.Arbitrary<WeaponStats> = fc.record({
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
  attackRange: fc.integer({
    min: WEAPON_STAT_RANGES.attackRange.min,
    max: WEAPON_STAT_RANGES.attackRange.max,
  }),
});

// Card generator
const cardArb: fc.Arbitrary<Card> = fc.record({
  id: uuidV4Arb,
  name: fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0),
  imagePath: fc.constantFrom(null, "test-card.png"),
  imageUrl: fc.constantFrom(null, "blob:test-card-url"),
  createdAt: fc.integer({ min: 0, max: Date.now() + 1000000 }),
  updatedAt: fc.integer({ min: 0, max: Date.now() + 1000000 }),
  hp: fc.integer({ min: 1, max: 99999 }),
  atk: fc.integer({ min: 0, max: 9999 }),
  def: fc.integer({ min: 0, max: 9999 }),
  spd: fc.integer({ min: 0, max: 999 }),
  critChance: fc.integer({ min: 0, max: 100 }),
  critDamage: fc.integer({ min: 0, max: 500 }),
  armorPen: fc.integer({ min: 0, max: 100 }),
  lifesteal: fc.integer({ min: 0, max: 100 }),
});

// Weapon generator
const weaponArb: fc.Arbitrary<Weapon> = fc.record({
  id: uuidV4Arb,
  name: fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0),
  imagePath: fc.constantFrom(null, "test-weapon.png"),
  imageUrl: fc.constantFrom(null, "blob:test-weapon-url"),
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
  attackRange: fc.integer({
    min: WEAPON_STAT_RANGES.attackRange.min,
    max: WEAPON_STAT_RANGES.attackRange.max,
  }),
});

// CardEquipment generator
const cardEquipmentArb: fc.Arbitrary<CardEquipment> = fc.record({
  cardId: uuidV4Arb,
  weaponId: fc.oneof(fc.constant(null), uuidV4Arb),
  equippedAt: fc.oneof(
    fc.constant(null),
    fc.integer({ min: 0, max: Date.now() + 1000000 }),
  ),
});

/**
 * **Feature: weapon-equipment, Property 8: Effective stats calculation is additive**
 * **Validates: Requirements 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
 *
 * For any card with base stats and equipped weapon with bonus stats,
 * the effective stats should equal base stats + weapon stats for all
 * offensive stats (atk, critChance, critDamage, armorPen, lifesteal).
 */
describe("Property 8: Effective stats calculation is additive", () => {
  it("property: effective stats = base stats + weapon stats for offensive stats", () => {
    fc.assert(
      fc.property(cardArb, weaponArb, (card, weapon) => {
        const effectiveStats = calculateEffectiveStats(card, weapon);

        // Offensive stats should be additive
        expect(effectiveStats.atk).toBe(card.atk + weapon.atk);
        expect(effectiveStats.critChance).toBe(
          card.critChance + weapon.critChance,
        );
        expect(effectiveStats.critDamage).toBe(
          card.critDamage + weapon.critDamage,
        );
        expect(effectiveStats.armorPen).toBe(card.armorPen + weapon.armorPen);
        expect(effectiveStats.lifesteal).toBe(
          card.lifesteal + weapon.lifesteal,
        );

        // Non-offensive stats should remain unchanged
        expect(effectiveStats.hp).toBe(card.hp);
        expect(effectiveStats.def).toBe(card.def);
        expect(effectiveStats.spd).toBe(card.spd);
      }),
      { numRuns: 100 },
    );
  });

  it("property: null weapon results in base stats unchanged", () => {
    fc.assert(
      fc.property(cardArb, (card) => {
        const effectiveStats = calculateEffectiveStats(card, null);

        // All stats should equal base stats when no weapon
        expect(effectiveStats.hp).toBe(card.hp);
        expect(effectiveStats.atk).toBe(card.atk);
        expect(effectiveStats.def).toBe(card.def);
        expect(effectiveStats.spd).toBe(card.spd);
        expect(effectiveStats.critChance).toBe(card.critChance);
        expect(effectiveStats.critDamage).toBe(card.critDamage);
        expect(effectiveStats.armorPen).toBe(card.armorPen);
        expect(effectiveStats.lifesteal).toBe(card.lifesteal);
      }),
      { numRuns: 100 },
    );
  });

  it("property: weapon stats only (without full weapon object) works correctly", () => {
    fc.assert(
      fc.property(cardArb, validWeaponStatsArb, (card, weaponStats) => {
        const effectiveStats = calculateEffectiveStats(card, weaponStats);

        // Offensive stats should be additive
        expect(effectiveStats.atk).toBe(card.atk + weaponStats.atk);
        expect(effectiveStats.critChance).toBe(
          card.critChance + weaponStats.critChance,
        );
        expect(effectiveStats.critDamage).toBe(
          card.critDamage + weaponStats.critDamage,
        );
        expect(effectiveStats.armorPen).toBe(
          card.armorPen + weaponStats.armorPen,
        );
        expect(effectiveStats.lifesteal).toBe(
          card.lifesteal + weaponStats.lifesteal,
        );
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: weapon-equipment, Property 7: Equipment association persists correctly**
 * **Validates: Requirements 3.2**
 *
 * For any card and weapon, equipping the weapon to the card should result in
 * a persisted relationship where getEquipment(cardId).weaponId equals the weapon's ID.
 */
describe("Property 7: Equipment association persists correctly", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await deleteDB();
  });

  it("property: equipping weapon persists the association", async () => {
    await fc.assert(
      fc.asyncProperty(uuidV4Arb, uuidV4Arb, async (cardId, weaponId) => {
        await EquipmentService.clear();

        // Equip weapon to card
        const equipment = await EquipmentService.equipWeapon(cardId, weaponId);

        // Verify the returned equipment
        expect(equipment.cardId).toBe(cardId);
        expect(equipment.weaponId).toBe(weaponId);
        expect(equipment.equippedAt).toBeDefined();
        expect(equipment.equippedAt).not.toBeNull();

        // Verify persistence by fetching from DB
        const fetched = await EquipmentService.getEquipment(cardId);
        expect(fetched).not.toBeNull();
        expect(fetched!.cardId).toBe(cardId);
        expect(fetched!.weaponId).toBe(weaponId);
      }),
      { numRuns: 100 },
    );
  });

  it("property: re-equipping same weapon updates timestamp", async () => {
    await fc.assert(
      fc.asyncProperty(uuidV4Arb, uuidV4Arb, async (cardId, weaponId) => {
        await EquipmentService.clear();

        // First equip
        const first = await EquipmentService.equipWeapon(cardId, weaponId);

        // Small delay
        await new Promise((resolve) => setTimeout(resolve, 5));

        // Re-equip same weapon
        const second = await EquipmentService.equipWeapon(cardId, weaponId);

        // Weapon ID should be the same
        expect(second.weaponId).toBe(first.weaponId);

        // Timestamp should be updated
        expect(second.equippedAt).toBeGreaterThanOrEqual(first.equippedAt!);
      }),
      { numRuns: 50 },
    );
  });
});

/**
 * **Feature: weapon-equipment, Property 9: Unequip reverts to base stats**
 * **Validates: Requirements 3.4**
 *
 * For any card with an equipped weapon, unequipping should result in
 * effective stats equaling base stats.
 */
describe("Property 9: Unequip reverts to base stats", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await deleteDB();
  });

  it("property: unequipping removes weapon association", async () => {
    await fc.assert(
      fc.asyncProperty(uuidV4Arb, uuidV4Arb, async (cardId, weaponId) => {
        await EquipmentService.clear();

        // Equip weapon
        await EquipmentService.equipWeapon(cardId, weaponId);

        // Verify equipped
        const equipped = await EquipmentService.getEquipment(cardId);
        expect(equipped?.weaponId).toBe(weaponId);

        // Unequip
        await EquipmentService.unequipWeapon(cardId);

        // Verify unequipped
        const unequipped = await EquipmentService.getEquipment(cardId);
        expect(unequipped).not.toBeNull();
        expect(unequipped!.weaponId).toBeNull();
        expect(unequipped!.equippedAt).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it("property: after unequip, effective stats equal base stats", () => {
    fc.assert(
      fc.property(cardArb, weaponArb, (card, weapon) => {
        // Calculate effective stats with weapon
        const withWeapon = calculateEffectiveStats(card, weapon);

        // Verify weapon bonuses were applied
        expect(withWeapon.atk).toBe(card.atk + weapon.atk);

        // Calculate effective stats without weapon (simulating unequip)
        const withoutWeapon = calculateEffectiveStats(card, null);

        // All stats should equal base stats
        expect(withoutWeapon.hp).toBe(card.hp);
        expect(withoutWeapon.atk).toBe(card.atk);
        expect(withoutWeapon.def).toBe(card.def);
        expect(withoutWeapon.spd).toBe(card.spd);
        expect(withoutWeapon.critChance).toBe(card.critChance);
        expect(withoutWeapon.critDamage).toBe(card.critDamage);
        expect(withoutWeapon.armorPen).toBe(card.armorPen);
        expect(withoutWeapon.lifesteal).toBe(card.lifesteal);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: weapon-equipment, Property 10: Weapon exclusivity - one card at a time**
 * **Validates: Requirements 3.5**
 *
 * For any weapon equipped to card A, equipping it to card B should result in
 * card A having no equipped weapon and card B having the weapon.
 */
describe("Property 10: Weapon exclusivity - one card at a time", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await deleteDB();
  });

  it("property: equipping to new card unequips from previous card", async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidV4Arb,
        uuidV4Arb,
        uuidV4Arb,
        async (cardIdA, cardIdB, weaponId) => {
          // Skip if card IDs are the same
          fc.pre(cardIdA !== cardIdB);

          await EquipmentService.clear();

          // Equip weapon to card A
          await EquipmentService.equipWeapon(cardIdA, weaponId);

          // Verify card A has the weapon
          const equipmentA1 = await EquipmentService.getEquipment(cardIdA);
          expect(equipmentA1?.weaponId).toBe(weaponId);

          // Equip same weapon to card B
          await EquipmentService.equipWeapon(cardIdB, weaponId);

          // Verify card A no longer has the weapon
          const equipmentA2 = await EquipmentService.getEquipment(cardIdA);
          expect(equipmentA2?.weaponId).toBeNull();

          // Verify card B now has the weapon
          const equipmentB = await EquipmentService.getEquipment(cardIdB);
          expect(equipmentB?.weaponId).toBe(weaponId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: findCardByWeaponId returns correct card", async () => {
    await fc.assert(
      fc.asyncProperty(uuidV4Arb, uuidV4Arb, async (cardId, weaponId) => {
        await EquipmentService.clear();

        // Initially no card should have the weapon
        const initialCard = await EquipmentService.findCardByWeaponId(weaponId);
        expect(initialCard).toBeNull();

        // Equip weapon to card
        await EquipmentService.equipWeapon(cardId, weaponId);

        // Now the card should be found
        const foundCard = await EquipmentService.findCardByWeaponId(weaponId);
        expect(foundCard).toBe(cardId);
      }),
      { numRuns: 100 },
    );
  });

  it("property: weapon can only be found on one card at a time", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(uuidV4Arb, { minLength: 2, maxLength: 5 }),
        uuidV4Arb,
        async (cardIds, weaponId) => {
          // Ensure unique card IDs
          const uniqueCardIds = [...new Set(cardIds)];
          fc.pre(uniqueCardIds.length >= 2);

          await EquipmentService.clear();

          // Equip weapon to each card in sequence
          for (const cardId of uniqueCardIds) {
            await EquipmentService.equipWeapon(cardId, weaponId);
          }

          // Only the last card should have the weapon
          const lastCardId = uniqueCardIds[uniqueCardIds.length - 1];
          const foundCard = await EquipmentService.findCardByWeaponId(weaponId);
          expect(foundCard).toBe(lastCardId);

          // All other cards should have null weaponId
          for (let i = 0; i < uniqueCardIds.length - 1; i++) {
            const equipment = await EquipmentService.getEquipment(
              uniqueCardIds[i],
            );
            expect(equipment?.weaponId).toBeNull();
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});

/**
 * **Feature: weapon-equipment, Property 12: Equipment state serialization round-trip**
 * **Validates: Requirements 6.1, 6.2, 6.3**
 *
 * For any valid card equipment state, serializing then deserializing
 * should produce an equivalent equipment relationship.
 */
describe("Property 12: Equipment state serialization round-trip", () => {
  it("property: serialize then deserialize produces equivalent equipment", () => {
    fc.assert(
      fc.property(cardEquipmentArb, (equipment) => {
        // Serialize to JSON
        const json = serializeEquipment(equipment);

        // Deserialize back to object
        const deserialized = deserializeEquipment(json);

        // All fields should be equal
        expect(deserialized.cardId).toBe(equipment.cardId);
        expect(deserialized.weaponId).toBe(equipment.weaponId);
        expect(deserialized.equippedAt).toBe(equipment.equippedAt);
      }),
      { numRuns: 100 },
    );
  });

  it("property: round-trip preserves object equality", () => {
    fc.assert(
      fc.property(cardEquipmentArb, (equipment) => {
        const json = serializeEquipment(equipment);
        const deserialized = deserializeEquipment(json);

        // Deep equality check
        expect(deserialized).toEqual(equipment);
      }),
      { numRuns: 100 },
    );
  });

  it("property: serialized JSON is valid JSON string", () => {
    fc.assert(
      fc.property(cardEquipmentArb, (equipment) => {
        const json = serializeEquipment(equipment);

        // Should be a valid JSON string
        expect(typeof json).toBe("string");
        expect(() => JSON.parse(json)).not.toThrow();
      }),
      { numRuns: 100 },
    );
  });

  it("property: multiple round-trips produce same result", () => {
    fc.assert(
      fc.property(cardEquipmentArb, (equipment) => {
        // First round-trip
        const json1 = serializeEquipment(equipment);
        const deserialized1 = deserializeEquipment(json1);

        // Second round-trip
        const json2 = serializeEquipment(deserialized1);
        const deserialized2 = deserializeEquipment(json2);

        // Both should be equal
        expect(deserialized2).toEqual(deserialized1);
        expect(deserialized2).toEqual(equipment);
      }),
      { numRuns: 100 },
    );
  });

  it("property: equipment with null weaponId round-trips correctly", () => {
    fc.assert(
      fc.property(uuidV4Arb, (cardId) => {
        const equipment: CardEquipment = {
          cardId,
          weaponId: null,
          equippedAt: null,
        };

        const json = serializeEquipment(equipment);
        const deserialized = deserializeEquipment(json);

        expect(deserialized.cardId).toBe(cardId);
        expect(deserialized.weaponId).toBeNull();
        expect(deserialized.equippedAt).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Integration tests for EquipmentService with IndexedDB
 */
describe("EquipmentService - IndexedDB Integration", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await deleteDB();
  });

  describe("getEquipment", () => {
    it("should return null for non-existent card", async () => {
      const equipment = await EquipmentService.getEquipment("non-existent-id");
      expect(equipment).toBeNull();
    });
  });

  describe("equipWeapon", () => {
    it("should create equipment record", async () => {
      const cardId = crypto.randomUUID();
      const weaponId = crypto.randomUUID();

      const equipment = await EquipmentService.equipWeapon(cardId, weaponId);

      expect(equipment.cardId).toBe(cardId);
      expect(equipment.weaponId).toBe(weaponId);
      expect(equipment.equippedAt).toBeDefined();
    });
  });

  describe("unequipWeapon", () => {
    it("should set weaponId to null", async () => {
      const cardId = crypto.randomUUID();
      const weaponId = crypto.randomUUID();

      await EquipmentService.equipWeapon(cardId, weaponId);
      await EquipmentService.unequipWeapon(cardId);

      const equipment = await EquipmentService.getEquipment(cardId);
      expect(equipment?.weaponId).toBeNull();
      expect(equipment?.equippedAt).toBeNull();
    });
  });

  describe("findCardByWeaponId", () => {
    it("should return null when weapon is not equipped", async () => {
      const cardId = await EquipmentService.findCardByWeaponId("non-existent");
      expect(cardId).toBeNull();
    });

    it("should return cardId when weapon is equipped", async () => {
      const cardId = crypto.randomUUID();
      const weaponId = crypto.randomUUID();

      await EquipmentService.equipWeapon(cardId, weaponId);

      const foundCardId = await EquipmentService.findCardByWeaponId(weaponId);
      expect(foundCardId).toBe(cardId);
    });
  });

  describe("deleteEquipment", () => {
    it("should remove equipment record", async () => {
      const cardId = crypto.randomUUID();
      const weaponId = crypto.randomUUID();

      await EquipmentService.equipWeapon(cardId, weaponId);
      await EquipmentService.deleteEquipment(cardId);

      const equipment = await EquipmentService.getEquipment(cardId);
      expect(equipment).toBeNull();
    });
  });

  describe("clear", () => {
    it("should remove all equipment records", async () => {
      await EquipmentService.equipWeapon(
        crypto.randomUUID(),
        crypto.randomUUID(),
      );
      await EquipmentService.equipWeapon(
        crypto.randomUUID(),
        crypto.randomUUID(),
      );

      await EquipmentService.clear();

      // Verify by trying to find any equipment (should all be gone)
      const equipment = await EquipmentService.getEquipment(
        crypto.randomUUID(),
      );
      expect(equipment).toBeNull();
    });
  });
});

/**
 * **Feature: weapon-attack-range, Property 4: Default effective range without weapon**
 * **Validates: Requirements 2.1**
 *
 * For any card without an equipped weapon, the effective attack range SHALL be exactly 1.
 */
describe("Property 4: Default effective range without weapon", () => {
  it("property: effective range is 1 when weapon is null", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const effectiveRange = calculateEffectiveRange(null);
        expect(effectiveRange).toBe(DEFAULT_ATTACK_RANGE);
        expect(effectiveRange).toBe(1);
      }),
      { numRuns: 100 },
    );
  });

  it("property: DEFAULT_ATTACK_RANGE constant equals 1", () => {
    expect(DEFAULT_ATTACK_RANGE).toBe(1);
  });
});

/**
 * **Feature: weapon-attack-range, Property 5: Effective range calculation with weapon**
 * **Validates: Requirements 2.2**
 *
 * For any card with an equipped weapon, the effective attack range SHALL equal weapon.attackRange
 * (or DEFAULT_ATTACK_RANGE if attackRange is 0).
 * Attack range is the absolute distance: |attacker_pos - target_pos|
 */
describe("Property 5: Effective range calculation with weapon", () => {
  it("property: effective range equals weapon.attackRange when > 0, else DEFAULT_ATTACK_RANGE", () => {
    fc.assert(
      fc.property(weaponArb, (weapon) => {
        const effectiveRange = calculateEffectiveRange(weapon);
        const expectedRange =
          weapon.attackRange > 0 ? weapon.attackRange : DEFAULT_ATTACK_RANGE;
        expect(effectiveRange).toBe(expectedRange);
      }),
      { numRuns: 100 },
    );
  });

  it("property: effective range equals attackRange when > 0 for weapon stats only", () => {
    fc.assert(
      fc.property(validWeaponStatsArb, (weaponStats) => {
        const effectiveRange = calculateEffectiveRange(weaponStats);
        const expectedRange =
          weaponStats.attackRange > 0
            ? weaponStats.attackRange
            : DEFAULT_ATTACK_RANGE;
        expect(effectiveRange).toBe(expectedRange);
      }),
      { numRuns: 100 },
    );
  });

  it("property: effective range is always >= 1", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(null), weaponArb, validWeaponStatsArb),
        (weapon) => {
          const effectiveRange = calculateEffectiveRange(weapon);
          expect(effectiveRange).toBeGreaterThanOrEqual(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: effective range is at most max attackRange (6)", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(null), weaponArb, validWeaponStatsArb),
        (weapon) => {
          const effectiveRange = calculateEffectiveRange(weapon);
          expect(effectiveRange).toBeLessThanOrEqual(
            WEAPON_STAT_RANGES.attackRange.max,
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
