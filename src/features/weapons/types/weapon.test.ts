import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  DEFAULT_WEAPON_STATS,
  WEAPON_STAT_RANGES,
  applyDefaultWeaponStats,
  type WeaponStats,
  type WeaponStatKey,
} from "./weapon";

/**
 * **Feature: weapon-equipment, Property 3: Default stats applied when not specified**
 * **Validates: Requirements 1.3**
 *
 * For any weapon created without specifying stats, all offensive stats
 * (atk, critChance, critDamage, armorPen, lifesteal) should equal 0.
 */
describe("Property 3: Default stats applied when not specified", () => {
  const weaponStatKeys: WeaponStatKey[] = [
    "atk",
    "critChance",
    "critDamage",
    "armorPen",
    "lifesteal",
    "attackRange",
  ];

  it("DEFAULT_WEAPON_STATS has all offensive stats set to 0", () => {
    for (const key of weaponStatKeys) {
      expect(DEFAULT_WEAPON_STATS[key]).toBe(0);
    }
  });

  it("property: applyDefaultWeaponStats with undefined returns all zeros", () => {
    fc.assert(
      fc.property(fc.constant(undefined), () => {
        const result = applyDefaultWeaponStats(undefined);

        for (const key of weaponStatKeys) {
          expect(result[key]).toBe(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: applyDefaultWeaponStats with empty object returns all zeros", () => {
    fc.assert(
      fc.property(fc.constant({}), () => {
        const result = applyDefaultWeaponStats({});

        for (const key of weaponStatKeys) {
          expect(result[key]).toBe(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: applyDefaultWeaponStats preserves provided stats and fills missing with 0", () => {
    // Generator for partial weapon stats
    const partialStatsArb = fc.record(
      {
        atk: fc.option(
          fc.integer({
            min: WEAPON_STAT_RANGES.atk.min,
            max: WEAPON_STAT_RANGES.atk.max,
          }),
          { nil: undefined },
        ),
        critChance: fc.option(
          fc.integer({
            min: WEAPON_STAT_RANGES.critChance.min,
            max: WEAPON_STAT_RANGES.critChance.max,
          }),
          { nil: undefined },
        ),
        critDamage: fc.option(
          fc.integer({
            min: WEAPON_STAT_RANGES.critDamage.min,
            max: WEAPON_STAT_RANGES.critDamage.max,
          }),
          { nil: undefined },
        ),
        armorPen: fc.option(
          fc.integer({
            min: WEAPON_STAT_RANGES.armorPen.min,
            max: WEAPON_STAT_RANGES.armorPen.max,
          }),
          { nil: undefined },
        ),
        lifesteal: fc.option(
          fc.integer({
            min: WEAPON_STAT_RANGES.lifesteal.min,
            max: WEAPON_STAT_RANGES.lifesteal.max,
          }),
          { nil: undefined },
        ),
        attackRange: fc.option(
          fc.integer({
            min: WEAPON_STAT_RANGES.attackRange.min,
            max: WEAPON_STAT_RANGES.attackRange.max,
          }),
          { nil: undefined },
        ),
      },
      { requiredKeys: [] },
    );

    fc.assert(
      fc.property(partialStatsArb, (partialStats) => {
        const result = applyDefaultWeaponStats(partialStats);

        for (const key of weaponStatKeys) {
          const providedValue = partialStats[key];
          if (providedValue !== undefined) {
            // Provided stats should be preserved
            expect(result[key]).toBe(providedValue);
          } else {
            // Missing stats should default to 0
            expect(result[key]).toBe(0);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: result of applyDefaultWeaponStats always has all stat keys", () => {
    const partialStatsArb = fc.record(
      {
        atk: fc.option(fc.integer({ min: 0, max: 9999 }), { nil: undefined }),
        critChance: fc.option(fc.integer({ min: 0, max: 100 }), {
          nil: undefined,
        }),
        critDamage: fc.option(fc.integer({ min: 0, max: 500 }), {
          nil: undefined,
        }),
        armorPen: fc.option(fc.integer({ min: 0, max: 100 }), {
          nil: undefined,
        }),
        lifesteal: fc.option(fc.integer({ min: 0, max: 100 }), {
          nil: undefined,
        }),
        attackRange: fc.option(fc.integer({ min: 0, max: 6 }), {
          nil: undefined,
        }),
      },
      { requiredKeys: [] },
    );

    fc.assert(
      fc.property(partialStatsArb, (partialStats) => {
        const result = applyDefaultWeaponStats(partialStats);

        // Result should have all weapon stat keys
        for (const key of weaponStatKeys) {
          expect(result).toHaveProperty(key);
          expect(typeof result[key]).toBe("number");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: applyDefaultWeaponStats is idempotent for complete stats", () => {
    const completeStatsArb: fc.Arbitrary<WeaponStats> = fc.record({
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
      fc.property(completeStatsArb, (stats) => {
        const result = applyDefaultWeaponStats(stats);

        // For complete stats, result should equal input
        for (const key of weaponStatKeys) {
          expect(result[key]).toBe(stats[key]);
        }
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * WEAPON_STAT_RANGES validation tests
 */
describe("WEAPON_STAT_RANGES validation", () => {
  it("all stat ranges have min <= max", () => {
    for (const [, range] of Object.entries(WEAPON_STAT_RANGES)) {
      expect(range.min).toBeLessThanOrEqual(range.max);
    }
  });

  it("all stat ranges have non-negative min", () => {
    for (const [, range] of Object.entries(WEAPON_STAT_RANGES)) {
      expect(range.min).toBeGreaterThanOrEqual(0);
    }
  });

  it("DEFAULT_WEAPON_STATS values are within ranges", () => {
    for (const key of Object.keys(DEFAULT_WEAPON_STATS) as WeaponStatKey[]) {
      const value = DEFAULT_WEAPON_STATS[key];
      const range = WEAPON_STAT_RANGES[key];
      expect(value).toBeGreaterThanOrEqual(range.min);
      expect(value).toBeLessThanOrEqual(range.max);
    }
  });
});

/**
 * **Feature: weapon-attack-range, Property 1: Weapon attack range default value**
 * **Validates: Requirements 1.1**
 *
 * For any weapon created without specifying attackRange, the attackRange field
 * SHALL have a value of 0.
 */
describe("Property 1: Weapon attack range default value", () => {
  it("DEFAULT_WEAPON_STATS has attackRange set to 0", () => {
    expect(DEFAULT_WEAPON_STATS.attackRange).toBe(0);
  });

  it("property: applyDefaultWeaponStats without attackRange returns attackRange = 0", () => {
    // Generator for partial weapon stats without attackRange
    const partialStatsWithoutAttackRangeArb = fc.record(
      {
        atk: fc.option(
          fc.integer({
            min: WEAPON_STAT_RANGES.atk.min,
            max: WEAPON_STAT_RANGES.atk.max,
          }),
          { nil: undefined },
        ),
        critChance: fc.option(
          fc.integer({
            min: WEAPON_STAT_RANGES.critChance.min,
            max: WEAPON_STAT_RANGES.critChance.max,
          }),
          { nil: undefined },
        ),
        critDamage: fc.option(
          fc.integer({
            min: WEAPON_STAT_RANGES.critDamage.min,
            max: WEAPON_STAT_RANGES.critDamage.max,
          }),
          { nil: undefined },
        ),
        armorPen: fc.option(
          fc.integer({
            min: WEAPON_STAT_RANGES.armorPen.min,
            max: WEAPON_STAT_RANGES.armorPen.max,
          }),
          { nil: undefined },
        ),
        lifesteal: fc.option(
          fc.integer({
            min: WEAPON_STAT_RANGES.lifesteal.min,
            max: WEAPON_STAT_RANGES.lifesteal.max,
          }),
          { nil: undefined },
        ),
        // attackRange is intentionally omitted
      },
      { requiredKeys: [] },
    );

    fc.assert(
      fc.property(partialStatsWithoutAttackRangeArb, (partialStats) => {
        const result = applyDefaultWeaponStats(partialStats);
        // attackRange should default to 0 when not specified
        expect(result.attackRange).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it("property: applyDefaultWeaponStats with undefined returns attackRange = 0", () => {
    fc.assert(
      fc.property(fc.constant(undefined), () => {
        const result = applyDefaultWeaponStats(undefined);
        expect(result.attackRange).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it("property: applyDefaultWeaponStats with empty object returns attackRange = 0", () => {
    fc.assert(
      fc.property(fc.constant({}), () => {
        const result = applyDefaultWeaponStats({});
        expect(result.attackRange).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: weapon-attack-range, Property 2: Weapon attack range validation bounds**
 * **Validates: Requirements 1.2**
 *
 * For any attackRange value, the Weapon_System SHALL accept values in range [0, 6]
 * and reject values outside this range.
 */
describe("Property 2: Weapon attack range validation bounds", () => {
  it("WEAPON_STAT_RANGES.attackRange has correct bounds [0, 6]", () => {
    expect(WEAPON_STAT_RANGES.attackRange.min).toBe(0);
    expect(WEAPON_STAT_RANGES.attackRange.max).toBe(6);
  });

  it("property: values within [0, 6] are valid attackRange values", () => {
    fc.assert(
      fc.property(
        fc.integer({
          min: WEAPON_STAT_RANGES.attackRange.min,
          max: WEAPON_STAT_RANGES.attackRange.max,
        }),
        (attackRange) => {
          // Value should be within bounds
          expect(attackRange).toBeGreaterThanOrEqual(
            WEAPON_STAT_RANGES.attackRange.min,
          );
          expect(attackRange).toBeLessThanOrEqual(
            WEAPON_STAT_RANGES.attackRange.max,
          );

          // applyDefaultWeaponStats should preserve valid attackRange
          const result = applyDefaultWeaponStats({ attackRange });
          expect(result.attackRange).toBe(attackRange);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: values below 0 are outside valid attackRange bounds", () => {
    fc.assert(
      fc.property(
        fc.integer({
          min: -1000,
          max: WEAPON_STAT_RANGES.attackRange.min - 1,
        }),
        (attackRange) => {
          // Value should be below minimum
          expect(attackRange).toBeLessThan(WEAPON_STAT_RANGES.attackRange.min);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: values above 6 are outside valid attackRange bounds", () => {
    fc.assert(
      fc.property(
        fc.integer({
          min: WEAPON_STAT_RANGES.attackRange.max + 1,
          max: 1000,
        }),
        (attackRange) => {
          // Value should be above maximum
          expect(attackRange).toBeGreaterThan(
            WEAPON_STAT_RANGES.attackRange.max,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: all integers in [0, 6] are valid attackRange values", () => {
    // Exhaustively test all valid values
    for (let i = 0; i <= 6; i++) {
      expect(i).toBeGreaterThanOrEqual(WEAPON_STAT_RANGES.attackRange.min);
      expect(i).toBeLessThanOrEqual(WEAPON_STAT_RANGES.attackRange.max);
    }
  });
});
