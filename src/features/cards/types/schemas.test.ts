import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  cardFormSchema,
  cardFormSchemaWithDefaults,
  cardSchema,
  imageSchema,
} from "./schemas";
import { STAT_REGISTRY, getStatByKey, getDefaultStats } from "./statConfig";

// Helper to get stat range from registry
const getStatRange = (key: string) => {
  const stat = getStatByKey(key);
  return stat ? { min: stat.min, max: stat.max } : { min: 0, max: Infinity };
};

// Get ranges from registry
const HP_RANGE = getStatRange("hp");
const ATK_RANGE = getStatRange("atk");
const DEF_RANGE = getStatRange("def");
const SPD_RANGE = getStatRange("spd");
const CRIT_CHANCE_RANGE = getStatRange("critChance");
const CRIT_DAMAGE_RANGE = getStatRange("critDamage");
const ARMOR_PEN_RANGE = getStatRange("armorPen");
const LIFESTEAL_RANGE = getStatRange("lifesteal");

// Get default stats from registry
const DEFAULT_STATS = getDefaultStats();

/**
 * **Feature: card-game-manager, Property 3: Invalid card validation rejection**
 * **Validates: Requirements 2.3, 2.4, 2.5, 2.7, 2.8**
 *
 * For any CardFormInput with invalid values (empty/whitespace name, negative ATK,
 * HP < 1, invalid image type, or image > 2MB), the validation SHALL reject the
 * input and return appropriate error messages.
 */
describe("Property 3: Invalid card validation rejection", () => {
  // Helper to create a mock File
  const createMockFile = (name: string, size: number, type: string): File => {
    const content = new Uint8Array(size);
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  };

  it("rejects empty or whitespace-only names (Requirement 2.3)", () => {
    // Generate empty strings or whitespace-only strings
    const whitespaceArb = fc.oneof(
      fc.constant(""),
      fc
        .array(fc.constantFrom(" ", "\t", "\n", "\r"), {
          minLength: 1,
          maxLength: 10,
        })
        .map((chars: string[]) => chars.join(""))
    );

    fc.assert(
      fc.property(whitespaceArb, (emptyOrWhitespaceName) => {
        const input = {
          name: emptyOrWhitespaceName,
          hp: DEFAULT_STATS.hp,
          atk: DEFAULT_STATS.atk,
          def: DEFAULT_STATS.def,
          spd: DEFAULT_STATS.spd,
          critChance: DEFAULT_STATS.critChance,
          critDamage: DEFAULT_STATS.critDamage,
          armorPen: DEFAULT_STATS.armorPen,
          lifesteal: DEFAULT_STATS.lifesteal,
          image: null,
        };
        const result = cardFormSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          const nameErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "name"
          );
          expect(nameErrors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("rejects negative ATK values (Requirement 2.4)", () => {
    fc.assert(
      fc.property(fc.integer({ max: ATK_RANGE.min - 1 }), (negativeAtk) => {
        const input = {
          name: "Valid Card",
          hp: DEFAULT_STATS.hp,
          atk: negativeAtk,
          def: DEFAULT_STATS.def,
          spd: DEFAULT_STATS.spd,
          critChance: DEFAULT_STATS.critChance,
          critDamage: DEFAULT_STATS.critDamage,
          armorPen: DEFAULT_STATS.armorPen,
          lifesteal: DEFAULT_STATS.lifesteal,
          image: null,
        };
        const result = cardFormSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          const atkErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "atk"
          );
          expect(atkErrors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("rejects HP values less than 1 (Requirement 2.5)", () => {
    fc.assert(
      fc.property(fc.integer({ max: HP_RANGE.min - 1 }), (invalidHp) => {
        const input = {
          name: "Valid Card",
          hp: invalidHp,
          atk: DEFAULT_STATS.atk,
          def: DEFAULT_STATS.def,
          spd: DEFAULT_STATS.spd,
          critChance: DEFAULT_STATS.critChance,
          critDamage: DEFAULT_STATS.critDamage,
          armorPen: DEFAULT_STATS.armorPen,
          lifesteal: DEFAULT_STATS.lifesteal,
          image: null,
        };
        const result = cardFormSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          const hpErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "hp"
          );
          expect(hpErrors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("rejects invalid image types (Requirement 2.7)", () => {
    const invalidTypes = [
      "image/gif",
      "image/bmp",
      "image/svg+xml",
      "application/pdf",
      "text/plain",
      "video/mp4",
    ];

    fc.assert(
      fc.property(fc.constantFrom(...invalidTypes), (invalidType) => {
        const file = createMockFile("test.file", 1024, invalidType);
        const result = imageSchema.safeParse(file);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects images larger than 2MB (Requirement 2.8)", () => {
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB

    fc.assert(
      fc.property(
        fc.integer({ min: MAX_SIZE + 1, max: MAX_SIZE + 1024 * 1024 }), // 2MB+1 to 3MB
        (oversizedBytes) => {
          const file = createMockFile("large.png", oversizedBytes, "image/png");
          const result = imageSchema.safeParse(file);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts valid card form inputs", () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          hp: fc.integer({ min: HP_RANGE.min, max: 10000 }),
          atk: fc.integer({ min: ATK_RANGE.min, max: 10000 }),
          def: fc.integer({ min: DEF_RANGE.min, max: 10000 }),
          spd: fc.integer({ min: SPD_RANGE.min, max: 10000 }),
          critChance: fc.double({
            min: CRIT_CHANCE_RANGE.min,
            max: CRIT_CHANCE_RANGE.max,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          critDamage: fc.double({
            min: CRIT_DAMAGE_RANGE.min,
            max: 500,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          armorPen: fc.double({
            min: ARMOR_PEN_RANGE.min,
            max: ARMOR_PEN_RANGE.max,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          lifesteal: fc.double({
            min: LIFESTEAL_RANGE.min,
            max: LIFESTEAL_RANGE.max,
            noNaN: true,
            noDefaultInfinity: true,
          }),
        }),
        (stats) => {
          const input = {
            ...stats,
            image: null,
          };
          const result = cardFormSchema.safeParse(input);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts valid image types (PNG, JPG, WEBP)", () => {
    const validTypes = ["image/png", "image/jpeg", "image/webp"];

    fc.assert(
      fc.property(
        fc.constantFrom(...validTypes),
        fc.integer({ min: 1, max: 2 * 1024 * 1024 }), // 1 byte to 2MB
        (validType, size) => {
          const file = createMockFile("test.img", size, validType);
          const result = imageSchema.safeParse(file);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: tier-stat-system, Property 8: Stat Validation Ranges**
 * **Validates: Requirements 9.1-9.6**
 *
 * For any stat value, the validation SHALL reject values outside the defined STAT_RANGES.
 */
describe("Property 8: Stat Validation Ranges", () => {
  it("rejects def values less than 0 (Requirement 9.1)", () => {
    fc.assert(
      fc.property(fc.integer({ max: DEF_RANGE.min - 1 }), (invalidDef) => {
        const input = {
          name: "Valid Card",
          hp: DEFAULT_STATS.hp,
          atk: DEFAULT_STATS.atk,
          def: invalidDef,
          spd: DEFAULT_STATS.spd,
          critChance: DEFAULT_STATS.critChance,
          critDamage: DEFAULT_STATS.critDamage,
          armorPen: DEFAULT_STATS.armorPen,
          lifesteal: DEFAULT_STATS.lifesteal,
          image: null,
        };
        const result = cardFormSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          const defErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "def"
          );
          expect(defErrors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("rejects spd values less than 1 (Requirement 9.2)", () => {
    fc.assert(
      fc.property(fc.integer({ max: SPD_RANGE.min - 1 }), (invalidSpd) => {
        const input = {
          name: "Valid Card",
          hp: DEFAULT_STATS.hp,
          atk: DEFAULT_STATS.atk,
          def: DEFAULT_STATS.def,
          spd: invalidSpd,
          critChance: DEFAULT_STATS.critChance,
          critDamage: DEFAULT_STATS.critDamage,
          armorPen: DEFAULT_STATS.armorPen,
          lifesteal: DEFAULT_STATS.lifesteal,
          image: null,
        };
        const result = cardFormSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          const spdErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "spd"
          );
          expect(spdErrors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("rejects critChance values outside 0-100 range (Requirement 9.3)", () => {
    // Test values below 0
    fc.assert(
      fc.property(
        fc.double({
          max: CRIT_CHANCE_RANGE.min - 0.01,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (invalidCritChance) => {
          const input = {
            name: "Valid Card",
            hp: DEFAULT_STATS.hp,
            atk: DEFAULT_STATS.atk,
            def: DEFAULT_STATS.def,
            spd: DEFAULT_STATS.spd,
            critChance: invalidCritChance,
            critDamage: DEFAULT_STATS.critDamage,
            armorPen: DEFAULT_STATS.armorPen,
            lifesteal: DEFAULT_STATS.lifesteal,
            image: null,
          };
          const result = cardFormSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );

    // Test values above 100
    fc.assert(
      fc.property(
        fc.double({
          min: CRIT_CHANCE_RANGE.max + 0.01,
          max: 1000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (invalidCritChance) => {
          const input = {
            name: "Valid Card",
            hp: DEFAULT_STATS.hp,
            atk: DEFAULT_STATS.atk,
            def: DEFAULT_STATS.def,
            spd: DEFAULT_STATS.spd,
            critChance: invalidCritChance,
            critDamage: DEFAULT_STATS.critDamage,
            armorPen: DEFAULT_STATS.armorPen,
            lifesteal: DEFAULT_STATS.lifesteal,
            image: null,
          };
          const result = cardFormSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects critDamage values less than 100 (Requirement 9.4)", () => {
    fc.assert(
      fc.property(
        fc.double({
          max: CRIT_DAMAGE_RANGE.min - 0.01,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (invalidCritDamage) => {
          const input = {
            name: "Valid Card",
            hp: DEFAULT_STATS.hp,
            atk: DEFAULT_STATS.atk,
            def: DEFAULT_STATS.def,
            spd: DEFAULT_STATS.spd,
            critChance: DEFAULT_STATS.critChance,
            critDamage: invalidCritDamage,
            armorPen: DEFAULT_STATS.armorPen,
            lifesteal: DEFAULT_STATS.lifesteal,
            image: null,
          };
          const result = cardFormSchema.safeParse(input);
          expect(result.success).toBe(false);
          if (!result.success) {
            const critDamageErrors = result.error.issues.filter(
              (issue) => issue.path[0] === "critDamage"
            );
            expect(critDamageErrors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects armorPen values outside 0-100 range (Requirement 9.5)", () => {
    // Test values below 0
    fc.assert(
      fc.property(
        fc.double({
          max: ARMOR_PEN_RANGE.min - 0.01,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (invalidArmorPen) => {
          const input = {
            name: "Valid Card",
            hp: DEFAULT_STATS.hp,
            atk: DEFAULT_STATS.atk,
            def: DEFAULT_STATS.def,
            spd: DEFAULT_STATS.spd,
            critChance: DEFAULT_STATS.critChance,
            critDamage: DEFAULT_STATS.critDamage,
            armorPen: invalidArmorPen,
            lifesteal: DEFAULT_STATS.lifesteal,
            image: null,
          };
          const result = cardFormSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );

    // Test values above 100
    fc.assert(
      fc.property(
        fc.double({
          min: ARMOR_PEN_RANGE.max + 0.01,
          max: 1000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (invalidArmorPen) => {
          const input = {
            name: "Valid Card",
            hp: DEFAULT_STATS.hp,
            atk: DEFAULT_STATS.atk,
            def: DEFAULT_STATS.def,
            spd: DEFAULT_STATS.spd,
            critChance: DEFAULT_STATS.critChance,
            critDamage: DEFAULT_STATS.critDamage,
            armorPen: invalidArmorPen,
            lifesteal: DEFAULT_STATS.lifesteal,
            image: null,
          };
          const result = cardFormSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects lifesteal values outside 0-100 range (Requirement 9.6)", () => {
    // Test values below 0
    fc.assert(
      fc.property(
        fc.double({
          max: LIFESTEAL_RANGE.min - 0.01,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (invalidLifesteal) => {
          const input = {
            name: "Valid Card",
            hp: DEFAULT_STATS.hp,
            atk: DEFAULT_STATS.atk,
            def: DEFAULT_STATS.def,
            spd: DEFAULT_STATS.spd,
            critChance: DEFAULT_STATS.critChance,
            critDamage: DEFAULT_STATS.critDamage,
            armorPen: DEFAULT_STATS.armorPen,
            lifesteal: invalidLifesteal,
            image: null,
          };
          const result = cardFormSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );

    // Test values above 100
    fc.assert(
      fc.property(
        fc.double({
          min: LIFESTEAL_RANGE.max + 0.01,
          max: 1000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (invalidLifesteal) => {
          const input = {
            name: "Valid Card",
            hp: DEFAULT_STATS.hp,
            atk: DEFAULT_STATS.atk,
            def: DEFAULT_STATS.def,
            spd: DEFAULT_STATS.spd,
            critChance: DEFAULT_STATS.critChance,
            critDamage: DEFAULT_STATS.critDamage,
            armorPen: DEFAULT_STATS.armorPen,
            lifesteal: invalidLifesteal,
            image: null,
          };
          const result = cardFormSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts all stat values within valid ranges", () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          hp: fc.integer({ min: HP_RANGE.min, max: 10000 }),
          atk: fc.integer({ min: ATK_RANGE.min, max: 10000 }),
          def: fc.integer({ min: DEF_RANGE.min, max: 10000 }),
          spd: fc.integer({ min: SPD_RANGE.min, max: 10000 }),
          critChance: fc.double({
            min: CRIT_CHANCE_RANGE.min,
            max: CRIT_CHANCE_RANGE.max,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          critDamage: fc.double({
            min: CRIT_DAMAGE_RANGE.min,
            max: 500,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          armorPen: fc.double({
            min: ARMOR_PEN_RANGE.min,
            max: ARMOR_PEN_RANGE.max,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          lifesteal: fc.double({
            min: LIFESTEAL_RANGE.min,
            max: LIFESTEAL_RANGE.max,
            noNaN: true,
            noDefaultInfinity: true,
          }),
        }),
        (stats) => {
          const input = {
            ...stats,
            image: null,
          };
          const result = cardFormSchema.safeParse(input);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: tier-stat-system, Property 7: Default Stats Applied**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 7.1-7.6**
 *
 * For any Card created without explicit stat values, the Card SHALL have
 * default values as defined in DEFAULT_STATS.
 */
describe("Property 7: Default Stats Applied", () => {
  it("applies default values for missing stat fields in cardFormSchemaWithDefaults", () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
        }),
        ({ name }) => {
          // Only provide name, all stats should get defaults
          const input = {
            name,
            image: null,
          };
          const result = cardFormSchemaWithDefaults.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.hp).toBe(DEFAULT_STATS.hp);
            expect(result.data.atk).toBe(DEFAULT_STATS.atk);
            expect(result.data.def).toBe(DEFAULT_STATS.def);
            expect(result.data.spd).toBe(DEFAULT_STATS.spd);
            expect(result.data.critChance).toBe(DEFAULT_STATS.critChance);
            expect(result.data.critDamage).toBe(DEFAULT_STATS.critDamage);
            expect(result.data.armorPen).toBe(DEFAULT_STATS.armorPen);
            expect(result.data.lifesteal).toBe(DEFAULT_STATS.lifesteal);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("applies default values for missing stat fields in cardSchema", () => {
    // Custom UUID v4 generator using stringMatching
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y is 8, 9, a, or b
    const uuidV4Arb = fc.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );

    fc.assert(
      fc.property(
        fc.record({
          id: uuidV4Arb,
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          createdAt: fc.integer({ min: 0 }),
          updatedAt: fc.integer({ min: 0 }),
        }),
        ({ id, name, createdAt, updatedAt }) => {
          // Only provide required fields, all stats should get defaults
          const input = {
            id,
            name,
            createdAt,
            updatedAt,
          };
          const result = cardSchema.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.hp).toBe(DEFAULT_STATS.hp);
            expect(result.data.atk).toBe(DEFAULT_STATS.atk);
            expect(result.data.def).toBe(DEFAULT_STATS.def);
            expect(result.data.spd).toBe(DEFAULT_STATS.spd);
            expect(result.data.critChance).toBe(DEFAULT_STATS.critChance);
            expect(result.data.critDamage).toBe(DEFAULT_STATS.critDamage);
            expect(result.data.armorPen).toBe(DEFAULT_STATS.armorPen);
            expect(result.data.lifesteal).toBe(DEFAULT_STATS.lifesteal);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("preserves explicitly provided stat values", () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          hp: fc.integer({ min: HP_RANGE.min, max: 10000 }),
          atk: fc.integer({ min: ATK_RANGE.min, max: 10000 }),
          def: fc.integer({ min: DEF_RANGE.min, max: 10000 }),
          spd: fc.integer({ min: SPD_RANGE.min, max: 10000 }),
          critChance: fc.double({
            min: CRIT_CHANCE_RANGE.min,
            max: CRIT_CHANCE_RANGE.max,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          critDamage: fc.double({
            min: CRIT_DAMAGE_RANGE.min,
            max: 500,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          armorPen: fc.double({
            min: ARMOR_PEN_RANGE.min,
            max: ARMOR_PEN_RANGE.max,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          lifesteal: fc.double({
            min: LIFESTEAL_RANGE.min,
            max: LIFESTEAL_RANGE.max,
            noNaN: true,
            noDefaultInfinity: true,
          }),
        }),
        (stats) => {
          const input = {
            ...stats,
            image: null,
          };
          const result = cardFormSchema.safeParse(input);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.hp).toBe(stats.hp);
            expect(result.data.atk).toBe(stats.atk);
            expect(result.data.def).toBe(stats.def);
            expect(result.data.spd).toBe(stats.spd);
            expect(result.data.critChance).toBe(stats.critChance);
            expect(result.data.critDamage).toBe(stats.critDamage);
            expect(result.data.armorPen).toBe(stats.armorPen);
            expect(result.data.lifesteal).toBe(stats.lifesteal);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("default values are within valid ranges", () => {
    // Verify that default values are within valid ranges
    for (const stat of STAT_REGISTRY) {
      expect(stat.defaultValue).toBeGreaterThanOrEqual(stat.min);
      if (stat.max !== Infinity) {
        expect(stat.defaultValue).toBeLessThanOrEqual(stat.max);
      }
    }
  });
});

/**
 * **Feature: tier-stat-system, Property 9: Card Serialization Round-Trip**
 * **Validates: Requirements 8.1, 8.2 (from battle-engine-refactor)**
 *
 * For any valid Card with all stat fields, serializing to JSON and deserializing
 * SHALL produce an equivalent Card.
 */
describe("Property 9: Card Serialization Round-Trip", () => {
  // Custom UUID v4 generator
  const uuidV4Arb = fc.stringMatching(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  );

  // Generator for valid Card objects with all stat fields
  const validCardArb = fc.record({
    id: uuidV4Arb,
    name: fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0),

    // Core Stats (Tier 1)
    hp: fc.integer({ min: HP_RANGE.min, max: 10000 }),
    atk: fc.integer({ min: ATK_RANGE.min, max: 10000 }),
    def: fc.integer({ min: DEF_RANGE.min, max: 10000 }),
    spd: fc.integer({ min: SPD_RANGE.min, max: 10000 }),

    // Combat Stats (Tier 2)
    critChance: fc.double({
      min: CRIT_CHANCE_RANGE.min,
      max: CRIT_CHANCE_RANGE.max,
      noNaN: true,
      noDefaultInfinity: true,
    }),
    critDamage: fc.double({
      min: CRIT_DAMAGE_RANGE.min,
      max: 500,
      noNaN: true,
      noDefaultInfinity: true,
    }),
    armorPen: fc.double({
      min: ARMOR_PEN_RANGE.min,
      max: ARMOR_PEN_RANGE.max,
      noNaN: true,
      noDefaultInfinity: true,
    }),
    lifesteal: fc.double({
      min: LIFESTEAL_RANGE.min,
      max: LIFESTEAL_RANGE.max,
      noNaN: true,
      noDefaultInfinity: true,
    }),

    // Metadata
    imagePath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
      nil: null,
    }),
    imageUrl: fc.option(fc.webUrl(), { nil: null }),
    createdAt: fc.integer({ min: 0 }),
    updatedAt: fc.integer({ min: 0 }),
  });

  it("serialize then deserialize produces equivalent Card (round-trip)", () => {
    fc.assert(
      fc.property(validCardArb, (originalCard) => {
        // Serialize to JSON
        const serialized = JSON.stringify(originalCard);

        // Deserialize from JSON
        const deserialized = JSON.parse(serialized);

        // Validate with cardSchema
        const result = cardSchema.safeParse(deserialized);
        expect(result.success).toBe(true);

        if (result.success) {
          // Verify all fields are preserved
          expect(result.data.id).toBe(originalCard.id);
          expect(result.data.name).toBe(originalCard.name);

          // Core Stats (Tier 1)
          expect(result.data.hp).toBe(originalCard.hp);
          expect(result.data.atk).toBe(originalCard.atk);
          expect(result.data.def).toBe(originalCard.def);
          expect(result.data.spd).toBe(originalCard.spd);

          // Combat Stats (Tier 2)
          expect(result.data.critChance).toBe(originalCard.critChance);
          expect(result.data.critDamage).toBe(originalCard.critDamage);
          expect(result.data.armorPen).toBe(originalCard.armorPen);
          expect(result.data.lifesteal).toBe(originalCard.lifesteal);

          // Metadata
          expect(result.data.imagePath).toBe(originalCard.imagePath);
          expect(result.data.imageUrl).toBe(originalCard.imageUrl);
          expect(result.data.createdAt).toBe(originalCard.createdAt);
          expect(result.data.updatedAt).toBe(originalCard.updatedAt);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("serialized Card includes all core and combat stats (Requirement 8.1)", () => {
    fc.assert(
      fc.property(validCardArb, (card) => {
        const serialized = JSON.stringify(card);
        const parsed = JSON.parse(serialized);

        // Verify all stat fields are present in serialized output
        expect(parsed).toHaveProperty("hp");
        expect(parsed).toHaveProperty("atk");
        expect(parsed).toHaveProperty("def");
        expect(parsed).toHaveProperty("spd");
        expect(parsed).toHaveProperty("critChance");
        expect(parsed).toHaveProperty("critDamage");
        expect(parsed).toHaveProperty("armorPen");
        expect(parsed).toHaveProperty("lifesteal");
      }),
      { numRuns: 100 }
    );
  });

  it("deserialized Card restores all stat values exactly (Requirement 8.2)", () => {
    fc.assert(
      fc.property(validCardArb, (originalCard) => {
        const serialized = JSON.stringify(originalCard);
        const deserialized = JSON.parse(serialized);

        // Direct comparison of all stat values
        expect(deserialized.hp).toBe(originalCard.hp);
        expect(deserialized.atk).toBe(originalCard.atk);
        expect(deserialized.def).toBe(originalCard.def);
        expect(deserialized.spd).toBe(originalCard.spd);
        expect(deserialized.critChance).toBe(originalCard.critChance);
        expect(deserialized.critDamage).toBe(originalCard.critDamage);
        expect(deserialized.armorPen).toBe(originalCard.armorPen);
        expect(deserialized.lifesteal).toBe(originalCard.lifesteal);
      }),
      { numRuns: 100 }
    );
  });
});
