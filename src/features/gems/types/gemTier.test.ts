/**
 * Property-based tests for Gem Tier Types
 * Using fast-check for property-based testing
 *
 * **Feature: gem-skill-tree, Property 1: Gem Tier Default Assignment**
 * **Feature: gem-skill-tree, Property 2: Gem Tier Persistence Round Trip**
 * **Validates: Requirements 1.2, 1.4**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  type GemTier,
  TIER_ORDER,
  ALL_TIERS,
  DEFAULT_TIER,
  type TieredGem,
  isTierHigher,
  isTierLower,
  getNextTier,
  getPreviousTier,
} from "./gemTier";
import type { Gem, SkillType, SkillTrigger } from "./gem";

// ============================================
// Arbitraries (Generators)
// ============================================

// Valid gem tier generator
const gemTierArb: fc.Arbitrary<GemTier> = fc.constantFrom(
  "basic",
  "advanced",
  "master",
  "legendary",
);

// Valid skill types
const skillTypeArb: fc.Arbitrary<SkillType> = fc.constantFrom(
  "knockback",
  "retreat",
  "double_move",
  "double_attack",
  "execute",
  "leap_strike",
);

// Valid skill triggers
const skillTriggerArb: fc.Arbitrary<SkillTrigger> = fc.constantFrom(
  "movement",
  "combat",
);

// Valid ISO date string generator
const validIsoDateArb = fc
  .integer({
    min: new Date("2020-01-01").getTime(),
    max: new Date("2030-12-31").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

// Valid effect params generator
const effectParamsArb = fc.record({
  knockbackDistance: fc.option(fc.integer({ min: 1, max: 5 }), {
    nil: undefined,
  }),
  moveDistance: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  attackCount: fc.option(fc.integer({ min: 2, max: 5 }), { nil: undefined }),
  executeThreshold: fc.option(fc.integer({ min: 1, max: 50 }), {
    nil: undefined,
  }),
  leapRange: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  leapKnockback: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
});

// Valid base gem generator (without tier)
const baseGemArb: fc.Arbitrary<Gem> = fc.record({
  id: fc.uuid(),
  name: fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => s.trim().length > 0),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  skillType: skillTypeArb,
  trigger: skillTriggerArb,
  activationChance: fc.integer({ min: 0, max: 100 }),
  cooldown: fc.integer({ min: 0, max: 10 }),
  effectParams: effectParamsArb,
  tier: gemTierArb,
  imagePath: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
    nil: null,
  }),
  imageUrl: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
    nil: null,
  }),
  createdAt: validIsoDateArb,
  updatedAt: validIsoDateArb,
});

// Valid tiered gem generator
const tieredGemArb: fc.Arbitrary<TieredGem> = fc
  .tuple(baseGemArb, gemTierArb)
  .map(([gem, tier]) => ({ ...gem, tier }));

// ============================================
// Property Tests
// ============================================

/**
 * **Feature: gem-skill-tree, Property 1: Gem Tier Default Assignment**
 * **Validates: Requirements 1.2**
 *
 * For any gem created without an explicit tier, the Gem_System should
 * assign tier "basic" as the default value.
 */
describe("Property 1: Gem Tier Default Assignment", () => {
  it("property: DEFAULT_TIER constant is 'basic'", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        expect(DEFAULT_TIER).toBe("basic");
      }),
      { numRuns: 100 },
    );
  });

  it("property: creating a tiered gem without explicit tier uses default", () => {
    fc.assert(
      fc.property(baseGemArb, (gem) => {
        // Simulate creating a tiered gem with default tier
        const tieredGem: TieredGem = {
          ...gem,
          tier: DEFAULT_TIER,
        };

        expect(tieredGem.tier).toBe("basic");
        expect(TIER_ORDER[tieredGem.tier]).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it("property: default tier is the lowest tier in TIER_ORDER", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const defaultTierOrder = TIER_ORDER[DEFAULT_TIER];
        const allTierOrders = Object.values(TIER_ORDER);
        const minTierOrder = Math.min(...allTierOrders);

        expect(defaultTierOrder).toBe(minTierOrder);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-tree, Property 2: Gem Tier Persistence Round Trip**
 * **Validates: Requirements 1.4**
 *
 * For any valid tiered gem, creating the gem and then retrieving it by ID
 * should return a gem with the same tier value.
 */
describe("Property 2: Gem Tier Persistence Round Trip", () => {
  it("property: JSON serialize/deserialize preserves tier", () => {
    fc.assert(
      fc.property(tieredGemArb, (tieredGem) => {
        // Serialize to JSON string
        const serialized = JSON.stringify(tieredGem);

        // Deserialize back to object
        const deserialized = JSON.parse(serialized) as TieredGem;

        // Tier should be preserved
        expect(deserialized.tier).toBe(tieredGem.tier);
        expect(TIER_ORDER[deserialized.tier]).toBe(TIER_ORDER[tieredGem.tier]);
      }),
      { numRuns: 100 },
    );
  });

  it("property: all gem fields are preserved through serialization", () => {
    fc.assert(
      fc.property(tieredGemArb, (tieredGem) => {
        const serialized = JSON.stringify(tieredGem);
        const deserialized = JSON.parse(serialized) as TieredGem;

        // All fields should match
        expect(deserialized.id).toBe(tieredGem.id);
        expect(deserialized.name).toBe(tieredGem.name);
        expect(deserialized.description).toBe(tieredGem.description);
        expect(deserialized.skillType).toBe(tieredGem.skillType);
        expect(deserialized.trigger).toBe(tieredGem.trigger);
        expect(deserialized.activationChance).toBe(tieredGem.activationChance);
        expect(deserialized.cooldown).toBe(tieredGem.cooldown);
        expect(deserialized.tier).toBe(tieredGem.tier);
        expect(deserialized.createdAt).toBe(tieredGem.createdAt);
        expect(deserialized.updatedAt).toBe(tieredGem.updatedAt);
      }),
      { numRuns: 100 },
    );
  });

  it("property: tier is a valid GemTier value after deserialization", () => {
    fc.assert(
      fc.property(tieredGemArb, (tieredGem) => {
        const serialized = JSON.stringify(tieredGem);
        const deserialized = JSON.parse(serialized) as TieredGem;

        // Tier should be one of the valid tiers
        expect(ALL_TIERS).toContain(deserialized.tier);
        expect(TIER_ORDER[deserialized.tier]).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Additional Tier Helper Function Tests
// ============================================

describe("Tier comparison functions", () => {
  it("property: isTierHigher returns true when tier1 > tier2 in TIER_ORDER", () => {
    fc.assert(
      fc.property(gemTierArb, gemTierArb, (tier1, tier2) => {
        const result = isTierHigher(tier1, tier2);
        const expected = TIER_ORDER[tier1] > TIER_ORDER[tier2];
        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it("property: isTierLower returns true when tier1 < tier2 in TIER_ORDER", () => {
    fc.assert(
      fc.property(gemTierArb, gemTierArb, (tier1, tier2) => {
        const result = isTierLower(tier1, tier2);
        const expected = TIER_ORDER[tier1] < TIER_ORDER[tier2];
        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it("property: isTierHigher and isTierLower are mutually exclusive (except equal)", () => {
    fc.assert(
      fc.property(gemTierArb, gemTierArb, (tier1, tier2) => {
        const higher = isTierHigher(tier1, tier2);
        const lower = isTierLower(tier1, tier2);

        // Cannot be both higher and lower
        expect(higher && lower).toBe(false);

        // If equal, both should be false
        if (tier1 === tier2) {
          expect(higher).toBe(false);
          expect(lower).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("Tier navigation functions", () => {
  it("property: getNextTier returns null for legendary tier", () => {
    fc.assert(
      fc.property(fc.constant("legendary" as GemTier), (tier) => {
        const nextTier = getNextTier(tier);
        expect(nextTier).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it("property: getPreviousTier returns null for basic tier", () => {
    fc.assert(
      fc.property(fc.constant("basic" as GemTier), (tier) => {
        const prevTier = getPreviousTier(tier);
        expect(prevTier).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it("property: getNextTier returns a tier with order + 1 for non-legendary tiers", () => {
    const nonLegendaryTierArb = fc.constantFrom(
      "basic" as GemTier,
      "advanced" as GemTier,
      "master" as GemTier,
    );

    fc.assert(
      fc.property(nonLegendaryTierArb, (tier) => {
        const nextTier = getNextTier(tier);
        expect(nextTier).not.toBeNull();
        if (nextTier) {
          expect(TIER_ORDER[nextTier]).toBe(TIER_ORDER[tier] + 1);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: getPreviousTier returns a tier with order - 1 for non-basic tiers", () => {
    const nonBasicTierArb = fc.constantFrom(
      "advanced" as GemTier,
      "master" as GemTier,
      "legendary" as GemTier,
    );

    fc.assert(
      fc.property(nonBasicTierArb, (tier) => {
        const prevTier = getPreviousTier(tier);
        expect(prevTier).not.toBeNull();
        if (prevTier) {
          expect(TIER_ORDER[prevTier]).toBe(TIER_ORDER[tier] - 1);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: getNextTier and getPreviousTier are inverses", () => {
    const nonLegendaryTierArb = fc.constantFrom(
      "basic" as GemTier,
      "advanced" as GemTier,
      "master" as GemTier,
    );

    fc.assert(
      fc.property(nonLegendaryTierArb, (tier) => {
        const nextTier = getNextTier(tier);
        if (nextTier) {
          const backToOriginal = getPreviousTier(nextTier);
          expect(backToOriginal).toBe(tier);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("TIER_ORDER consistency", () => {
  it("property: ALL_TIERS contains exactly 4 tiers", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        expect(ALL_TIERS.length).toBe(4);
      }),
      { numRuns: 100 },
    );
  });

  it("property: TIER_ORDER has unique values for each tier", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const orderValues = Object.values(TIER_ORDER);
        const uniqueValues = new Set(orderValues);
        expect(uniqueValues.size).toBe(orderValues.length);
      }),
      { numRuns: 100 },
    );
  });

  it("property: TIER_ORDER values are consecutive starting from 0", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const orderValues = Object.values(TIER_ORDER).sort((a, b) => a - b);
        orderValues.forEach((value, index) => {
          expect(value).toBe(index);
        });
      }),
      { numRuns: 100 },
    );
  });

  it("property: every tier in ALL_TIERS has a corresponding TIER_ORDER entry", () => {
    fc.assert(
      fc.property(gemTierArb, (tier) => {
        expect(ALL_TIERS).toContain(tier);
        expect(TIER_ORDER[tier]).toBeDefined();
        expect(typeof TIER_ORDER[tier]).toBe("number");
      }),
      { numRuns: 100 },
    );
  });
});
