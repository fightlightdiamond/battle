import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  weaponFormSchema,
  weaponSchema,
  validateWeaponName,
  WEAPON_NAME_MAX_LENGTH,
} from "./schemas";
import { WEAPON_STAT_RANGES } from "./weapon";

/**
 * **Feature: weapon-equipment, Property 2: Empty/whitespace weapon names are rejected**
 * **Validates: Requirements 1.2**
 *
 * For any string composed entirely of whitespace characters, attempting to create
 * a weapon with that name should be rejected with a validation error.
 */
describe("Property 2: Empty/whitespace weapon names are rejected", () => {
  // Generator for whitespace-only strings
  const whitespaceOnlyArb = fc
    .array(fc.constantFrom(" ", "\t", "\n", "\r", "\f", "\v"), {
      minLength: 0,
      maxLength: 50,
    })
    .map((chars) => chars.join(""));

  it("property: empty string is rejected", () => {
    fc.assert(
      fc.property(fc.constant(""), (name) => {
        const result = validateWeaponName(name);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  it("property: whitespace-only strings are rejected", () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, (name) => {
        const result = validateWeaponName(name);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  it("property: weaponFormSchema rejects empty names", () => {
    fc.assert(
      fc.property(fc.constant(""), (name) => {
        const result = weaponFormSchema.safeParse({ name, image: null });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: weaponFormSchema rejects whitespace-only names", () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, (name) => {
        const result = weaponFormSchema.safeParse({ name, image: null });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: valid non-whitespace names are accepted", () => {
    // Generator for valid names (non-empty, non-whitespace-only, within length limit)
    const validNameArb = fc
      .string({ minLength: 1, maxLength: WEAPON_NAME_MAX_LENGTH })
      .filter((s) => s.trim().length > 0);

    fc.assert(
      fc.property(validNameArb, (name) => {
        const result = validateWeaponName(name);
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it("property: names exceeding max length are rejected", () => {
    const tooLongNameArb = fc.string({
      minLength: WEAPON_NAME_MAX_LENGTH + 1,
      maxLength: WEAPON_NAME_MAX_LENGTH + 100,
    });

    fc.assert(
      fc.property(tooLongNameArb, (name) => {
        const result = validateWeaponName(name);
        expect(result.success).toBe(false);
        expect(result.error).toContain("characters or less");
      }),
      { numRuns: 100 },
    );
  });

  it("property: names with leading/trailing whitespace but non-empty content are accepted", () => {
    const whitespaceArb = fc
      .array(fc.constantFrom(" ", "\t"), { minLength: 0, maxLength: 5 })
      .map((chars) => chars.join(""));

    const paddedNameArb = fc
      .tuple(
        whitespaceArb,
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        whitespaceArb,
      )
      .map(([prefix, content, suffix]) => prefix + content + suffix)
      .filter((s) => s.length <= WEAPON_NAME_MAX_LENGTH);

    fc.assert(
      fc.property(paddedNameArb, (name) => {
        const result = validateWeaponName(name);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Stat range validation tests
 */
describe("Weapon stat range validation", () => {
  it("property: stats within valid ranges are accepted", () => {
    const validStatsArb = fc.record({
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

    fc.assert(
      fc.property(validStatsArb, (stats) => {
        const result = weaponFormSchema.safeParse({
          name: "Test Weapon",
          image: null,
          ...stats,
        });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("property: ATK below minimum is rejected", () => {
    const invalidAtkArb = fc.integer({
      min: -1000,
      max: WEAPON_STAT_RANGES.atk.min - 1,
    });

    fc.assert(
      fc.property(invalidAtkArb, (atk) => {
        const result = weaponFormSchema.safeParse({
          name: "Test Weapon",
          image: null,
          atk,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: ATK above maximum is rejected", () => {
    const invalidAtkArb = fc.integer({
      min: WEAPON_STAT_RANGES.atk.max + 1,
      max: WEAPON_STAT_RANGES.atk.max + 1000,
    });

    fc.assert(
      fc.property(invalidAtkArb, (atk) => {
        const result = weaponFormSchema.safeParse({
          name: "Test Weapon",
          image: null,
          atk,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: critChance above 100 is rejected", () => {
    const invalidCritChanceArb = fc.integer({
      min: WEAPON_STAT_RANGES.critChance.max + 1,
      max: 200,
    });

    fc.assert(
      fc.property(invalidCritChanceArb, (critChance) => {
        const result = weaponFormSchema.safeParse({
          name: "Test Weapon",
          image: null,
          critChance,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Complete weapon schema validation
 */
describe("Complete weapon schema validation", () => {
  // Reusable generator for valid complete weapons
  const validWeaponArb = fc.record({
    id: fc.uuid(),
    name: fc
      .string({ minLength: 1, maxLength: WEAPON_NAME_MAX_LENGTH })
      .filter((s) => s.trim().length > 0),
    imagePath: fc.option(fc.string(), { nil: null }),
    imageUrl: fc.option(fc.string(), { nil: null }),
    createdAt: fc.integer({ min: 0 }),
    updatedAt: fc.integer({ min: 0 }),
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

  it("property: valid complete weapon passes schema", () => {
    fc.assert(
      fc.property(validWeaponArb, (weapon) => {
        const result = weaponSchema.safeParse(weapon);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: weapon-attack-range, Property 3: Weapon serialization round-trip**
 * **Validates: Requirements 1.4**
 *
 * For any valid weapon with attackRange, serializing then deserializing
 * SHALL produce an equivalent weapon object.
 */
describe("Property 3: Weapon serialization round-trip", () => {
  // Generator for valid complete weapons with attackRange
  const validWeaponArb = fc.record({
    id: fc.uuid(),
    name: fc
      .string({ minLength: 1, maxLength: WEAPON_NAME_MAX_LENGTH })
      .filter((s) => s.trim().length > 0),
    imagePath: fc.option(fc.string(), { nil: null }),
    imageUrl: fc.option(fc.string(), { nil: null }),
    createdAt: fc.integer({ min: 0 }),
    updatedAt: fc.integer({ min: 0 }),
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

  it("property: JSON serialize/deserialize produces equivalent weapon", () => {
    fc.assert(
      fc.property(validWeaponArb, (weapon) => {
        // Serialize to JSON string
        const serialized = JSON.stringify(weapon);

        // Deserialize back to object
        const deserialized = JSON.parse(serialized);

        // Validate with schema
        const result = weaponSchema.safeParse(deserialized);
        expect(result.success).toBe(true);

        if (result.success) {
          // All fields should match original
          expect(result.data.id).toBe(weapon.id);
          expect(result.data.name).toBe(weapon.name);
          expect(result.data.imagePath).toBe(weapon.imagePath);
          expect(result.data.imageUrl).toBe(weapon.imageUrl);
          expect(result.data.createdAt).toBe(weapon.createdAt);
          expect(result.data.updatedAt).toBe(weapon.updatedAt);
          expect(result.data.atk).toBe(weapon.atk);
          expect(result.data.critChance).toBe(weapon.critChance);
          expect(result.data.critDamage).toBe(weapon.critDamage);
          expect(result.data.armorPen).toBe(weapon.armorPen);
          expect(result.data.lifesteal).toBe(weapon.lifesteal);
          expect(result.data.attackRange).toBe(weapon.attackRange);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: attackRange is preserved through serialization", () => {
    fc.assert(
      fc.property(validWeaponArb, (weapon) => {
        const serialized = JSON.stringify(weapon);
        const deserialized = JSON.parse(serialized);

        // attackRange specifically should be preserved
        expect(deserialized.attackRange).toBe(weapon.attackRange);
      }),
      { numRuns: 100 },
    );
  });

  it("property: round-trip preserves all weapon stats", () => {
    fc.assert(
      fc.property(validWeaponArb, (weapon) => {
        const serialized = JSON.stringify(weapon);
        const deserialized = JSON.parse(serialized);

        // All stats should be preserved
        expect(deserialized.atk).toBe(weapon.atk);
        expect(deserialized.critChance).toBe(weapon.critChance);
        expect(deserialized.critDamage).toBe(weapon.critDamage);
        expect(deserialized.armorPen).toBe(weapon.armorPen);
        expect(deserialized.lifesteal).toBe(weapon.lifesteal);
        expect(deserialized.attackRange).toBe(weapon.attackRange);
      }),
      { numRuns: 100 },
    );
  });
});
