import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  STAT_REGISTRY,
  TIER_CONFIG,
  getStatsByTier,
  getCompactStats,
  getStatByKey,
  getStatKeys,
  getDefaultStats,
  type StatDefinition,
  type StatTier,
  type StatFormat,
} from "./statConfig";

/**
 * **Feature: config-driven-stats, Property 1: Stat Registry Completeness**
 * **Validates: Requirements 1.1**
 *
 * For any stat definition in the registry, the definition SHALL contain all
 * required fields (key, label, shortLabel, tier, defaultValue, min, max, format,
 * decimalPlaces, icon, showInCompact, displayOrder) with valid values.
 */
describe("Property 1: Stat Registry Completeness", () => {
  // Required fields for a StatDefinition
  const requiredFields: (keyof StatDefinition)[] = [
    "key",
    "label",
    "shortLabel",
    "tier",
    "defaultValue",
    "min",
    "max",
    "format",
    "decimalPlaces",
    "icon",
    "showInCompact",
    "displayOrder",
  ];

  // Valid values for enum-like fields
  const validTiers: StatTier[] = ["core", "combat"];
  const validFormats: StatFormat[] = ["number", "percentage"];

  it("every stat in registry has all required fields", () => {
    for (const stat of STAT_REGISTRY) {
      for (const field of requiredFields) {
        expect(stat).toHaveProperty(field);
        expect(stat[field]).not.toBeUndefined();
      }
    }
  });

  it("every stat has valid tier value", () => {
    for (const stat of STAT_REGISTRY) {
      expect(validTiers).toContain(stat.tier);
    }
  });

  it("every stat has valid format value", () => {
    for (const stat of STAT_REGISTRY) {
      expect(validFormats).toContain(stat.format);
    }
  });

  it("every stat has non-empty string fields", () => {
    for (const stat of STAT_REGISTRY) {
      expect(stat.key.length).toBeGreaterThan(0);
      expect(stat.label.length).toBeGreaterThan(0);
      expect(stat.shortLabel.length).toBeGreaterThan(0);
      expect(stat.icon.length).toBeGreaterThan(0);
    }
  });

  it("every stat has valid numeric constraints (min <= defaultValue <= max)", () => {
    for (const stat of STAT_REGISTRY) {
      expect(stat.min).toBeLessThanOrEqual(stat.defaultValue);
      expect(stat.defaultValue).toBeLessThanOrEqual(stat.max);
    }
  });

  it("every stat has non-negative decimalPlaces", () => {
    for (const stat of STAT_REGISTRY) {
      expect(stat.decimalPlaces).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(stat.decimalPlaces)).toBe(true);
    }
  });

  it("every stat has positive displayOrder", () => {
    for (const stat of STAT_REGISTRY) {
      expect(stat.displayOrder).toBeGreaterThan(0);
      expect(Number.isInteger(stat.displayOrder)).toBe(true);
    }
  });

  it("all stat keys are unique", () => {
    const keys = STAT_REGISTRY.map((s) => s.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("registry contains expected stats (hp, atk, def, spd, critChance, critDamage, armorPen, lifesteal)", () => {
    const expectedKeys = [
      "hp",
      "atk",
      "def",
      "spd",
      "critChance",
      "critDamage",
      "armorPen",
      "lifesteal",
    ];
    const actualKeys = STAT_REGISTRY.map((s) => s.key);

    for (const key of expectedKeys) {
      expect(actualKeys).toContain(key);
    }
  });

  it("TIER_CONFIG has entries for all tiers used in registry", () => {
    const tiersInRegistry = new Set(STAT_REGISTRY.map((s) => s.tier));
    for (const tier of tiersInRegistry) {
      expect(TIER_CONFIG).toHaveProperty(tier);
      expect(TIER_CONFIG[tier]).toHaveProperty("label");
      expect(TIER_CONFIG[tier]).toHaveProperty("order");
    }
  });

  // Property-based test: for any stat in registry, all fields are valid
  it("property: all stats satisfy completeness invariants", () => {
    fc.assert(
      fc.property(fc.constantFrom(...STAT_REGISTRY), (stat: StatDefinition) => {
        // Has all required fields
        for (const field of requiredFields) {
          expect(stat[field]).not.toBeUndefined();
        }

        // Valid tier
        expect(validTiers).toContain(stat.tier);

        // Valid format
        expect(validFormats).toContain(stat.format);

        // Valid numeric constraints
        expect(stat.min).toBeLessThanOrEqual(stat.defaultValue);
        expect(stat.defaultValue).toBeLessThanOrEqual(stat.max);

        // Non-negative decimalPlaces
        expect(stat.decimalPlaces).toBeGreaterThanOrEqual(0);

        // Positive displayOrder
        expect(stat.displayOrder).toBeGreaterThan(0);

        // Non-empty strings
        expect(stat.key.length).toBeGreaterThan(0);
        expect(stat.label.length).toBeGreaterThan(0);
        expect(stat.shortLabel.length).toBeGreaterThan(0);
        expect(stat.icon.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function tests
 */
describe("Stat Registry Helper Functions", () => {
  describe("getStatsByTier", () => {
    it("returns stats grouped by tier", () => {
      const grouped = getStatsByTier();

      expect(grouped).toHaveProperty("core");
      expect(grouped).toHaveProperty("combat");

      // All stats should be in one of the groups
      const allGroupedStats = [...grouped.core, ...grouped.combat];
      expect(allGroupedStats.length).toBe(STAT_REGISTRY.length);
    });

    it("stats within each tier are sorted by displayOrder", () => {
      const grouped = getStatsByTier();

      for (const tier of Object.keys(grouped) as StatTier[]) {
        const stats = grouped[tier];
        for (let i = 1; i < stats.length; i++) {
          expect(stats[i].displayOrder).toBeGreaterThanOrEqual(
            stats[i - 1].displayOrder
          );
        }
      }
    });
  });

  describe("getCompactStats", () => {
    it("returns only stats with showInCompact=true", () => {
      const compactStats = getCompactStats();

      for (const stat of compactStats) {
        expect(stat.showInCompact).toBe(true);
      }
    });

    it("returns subset of registry", () => {
      const compactStats = getCompactStats();
      expect(compactStats.length).toBeLessThanOrEqual(STAT_REGISTRY.length);
    });
  });
});

/**
 * **Feature: config-driven-stats, Property 5: Compact View Filtering**
 * **Validates: Requirements 3.4**
 *
 * For any card display in compact mode, only stats with showInCompact=true SHALL be displayed.
 */
describe("Property 5: Compact View Filtering", () => {
  it("property: getCompactStats returns exactly the stats with showInCompact=true", () => {
    fc.assert(
      fc.property(fc.constantFrom(...STAT_REGISTRY), (stat: StatDefinition) => {
        const compactStats = getCompactStats();
        const isInCompactList = compactStats.some((s) => s.key === stat.key);

        // A stat should be in compact list if and only if showInCompact is true
        expect(isInCompactList).toBe(stat.showInCompact);
      }),
      { numRuns: 100 }
    );
  });

  it("property: compact stats are a proper subset when some stats have showInCompact=false", () => {
    const compactStats = getCompactStats();
    const nonCompactStats = STAT_REGISTRY.filter((s) => !s.showInCompact);

    // If there are non-compact stats, compact should be a proper subset
    if (nonCompactStats.length > 0) {
      expect(compactStats.length).toBeLessThan(STAT_REGISTRY.length);
    }

    // All compact stats should have showInCompact=true
    for (const stat of compactStats) {
      expect(stat.showInCompact).toBe(true);
    }

    // No non-compact stat should be in the compact list
    for (const stat of nonCompactStats) {
      const isInCompact = compactStats.some((s) => s.key === stat.key);
      expect(isInCompact).toBe(false);
    }
  });

  it("property: compact stats count equals count of showInCompact=true in registry", () => {
    const compactStats = getCompactStats();
    const expectedCount = STAT_REGISTRY.filter((s) => s.showInCompact).length;

    expect(compactStats.length).toBe(expectedCount);
  });

  it("property: for any random subset of stats, filtering by showInCompact is consistent", () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray([...STAT_REGISTRY], { minLength: 1 }),
        (randomStats) => {
          const compactStats = getCompactStats();

          for (const stat of randomStats) {
            const shouldBeInCompact = stat.showInCompact;
            const isInCompact = compactStats.some((s) => s.key === stat.key);
            expect(isInCompact).toBe(shouldBeInCompact);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  describe("getStatByKey", () => {
    it("returns correct stat for valid key", () => {
      for (const stat of STAT_REGISTRY) {
        const found = getStatByKey(stat.key);
        expect(found).toBeDefined();
        expect(found?.key).toBe(stat.key);
      }
    });

    it("returns undefined for invalid key", () => {
      const found = getStatByKey("nonexistent_stat");
      expect(found).toBeUndefined();
    });
  });

  describe("getStatKeys", () => {
    it("returns all stat keys", () => {
      const keys = getStatKeys();
      expect(keys.length).toBe(STAT_REGISTRY.length);

      for (const stat of STAT_REGISTRY) {
        expect(keys).toContain(stat.key);
      }
    });
  });

  describe("getDefaultStats", () => {
    it("returns default values for all stats", () => {
      const defaults = getDefaultStats();

      for (const stat of STAT_REGISTRY) {
        expect(defaults).toHaveProperty(stat.key);
        expect(defaults[stat.key]).toBe(stat.defaultValue);
      }
    });
  });
});

/**
 * **Feature: config-driven-stats, Property 3: Stat Grouping Correctness**
 * **Validates: Requirements 1.4, 2.5**
 *
 * For any tier in the registry, all stats with that tier SHALL be grouped together,
 * and tiers SHALL be ordered according to TIER_CONFIG.
 */
describe("Property 3: Stat Grouping Correctness", () => {
  it("property: all stats with same tier are grouped together by getStatsByTier", () => {
    fc.assert(
      fc.property(fc.constantFrom(...STAT_REGISTRY), (stat: StatDefinition) => {
        const grouped = getStatsByTier();
        const tierStats = grouped[stat.tier];

        // The stat should be in its tier group
        const isInCorrectTier = tierStats.some((s) => s.key === stat.key);
        expect(isInCorrectTier).toBe(true);

        // The stat should NOT be in any other tier group
        for (const [tier, stats] of Object.entries(grouped)) {
          if (tier !== stat.tier) {
            const isInWrongTier = stats.some((s) => s.key === stat.key);
            expect(isInWrongTier).toBe(false);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("property: tiers are ordered according to TIER_CONFIG.order", () => {
    const grouped = getStatsByTier();
    const tierEntries = Object.entries(grouped) as [
      StatTier,
      StatDefinition[]
    ][];

    // Get tiers sorted by their config order
    const sortedTiers = tierEntries
      .map(([tier]) => tier)
      .sort((a, b) => TIER_CONFIG[a].order - TIER_CONFIG[b].order);

    // Verify TIER_CONFIG has correct ordering (core before combat)
    expect(TIER_CONFIG.core.order).toBeLessThan(TIER_CONFIG.combat.order);

    // Verify sorted order matches expected
    expect(sortedTiers[0]).toBe("core");
    expect(sortedTiers[1]).toBe("combat");
  });

  it("property: every stat in registry appears in exactly one tier group", () => {
    fc.assert(
      fc.property(fc.constantFrom(...STAT_REGISTRY), (stat: StatDefinition) => {
        const grouped = getStatsByTier();
        let appearanceCount = 0;

        for (const stats of Object.values(grouped)) {
          if (stats.some((s) => s.key === stat.key)) {
            appearanceCount++;
          }
        }

        // Each stat should appear exactly once across all tier groups
        expect(appearanceCount).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it("property: total stats across all tier groups equals registry length", () => {
    const grouped = getStatsByTier();
    const totalGroupedStats = Object.values(grouped).reduce(
      (sum, stats) => sum + stats.length,
      0
    );

    expect(totalGroupedStats).toBe(STAT_REGISTRY.length);
  });

  it("property: stats within each tier are sorted by displayOrder", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...(Object.keys(TIER_CONFIG) as StatTier[])),
        (tier: StatTier) => {
          const grouped = getStatsByTier();
          const tierStats = grouped[tier];

          // Check that stats are sorted by displayOrder
          for (let i = 1; i < tierStats.length; i++) {
            expect(tierStats[i].displayOrder).toBeGreaterThanOrEqual(
              tierStats[i - 1].displayOrder
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: TIER_CONFIG contains all tiers used in registry", () => {
    const tiersInRegistry = new Set(STAT_REGISTRY.map((s) => s.tier));

    for (const tier of tiersInRegistry) {
      expect(TIER_CONFIG).toHaveProperty(tier);
      expect(TIER_CONFIG[tier].label).toBeDefined();
      expect(typeof TIER_CONFIG[tier].label).toBe("string");
      expect(TIER_CONFIG[tier].label.length).toBeGreaterThan(0);
      expect(TIER_CONFIG[tier].order).toBeDefined();
      expect(typeof TIER_CONFIG[tier].order).toBe("number");
    }
  });

  it("property: tier labels are human-readable (non-empty strings)", () => {
    for (const [tier, config] of Object.entries(TIER_CONFIG)) {
      expect(config.label).toBeDefined();
      expect(config.label.length).toBeGreaterThan(0);
      // Label should contain the tier name or be descriptive
      expect(config.label.toLowerCase()).toContain(
        tier.toLowerCase().substring(0, 3)
      );
    }
  });
});
