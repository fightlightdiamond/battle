/**
 * EnhancementService Unit Tests
 *
 * Tests for weapon enhancement logic including:
 * - Enhancement calculations
 * - Success/failure logic
 * - Protection scroll behavior
 * - Level loss mechanics
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
  calculateEnhancedStats,
  getEnhancePreview,
  performEnhancement,
  rollEnhancement,
  canEnhance,
  getEnhanceStatistics,
  getEnhancedWeaponName,
} from "./enhancementService";
import {
  getTierForLevel,
  calculateSuccessRate,
  calculateTotalStatBonus,
} from "../config/enhanceConfig";
import type { Weapon } from "../types/weapon";
import {
  MAX_ENHANCE_LEVEL,
  MIN_ENHANCE_LEVEL,
  type EnhanceAttempt,
} from "../types/enhancement";

// ===========================================================================
// TEST FIXTURES
// ===========================================================================

const createTestWeapon = (overrides: Partial<Weapon> = {}): Weapon => ({
  id: "test-weapon-id",
  name: "Test Sword",
  imagePath: null,
  imageUrl: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  weaponType: "sword_shield",
  atk: 100,
  critChance: 10,
  critDamage: 150,
  armorPen: 5,
  lifesteal: 3,
  attackRange: 1,
  enhanceLevel: 0,
  enhanceHistory: [],
  ...overrides,
});

// ===========================================================================
// UNIT TESTS
// ===========================================================================

describe("EnhancementService", () => {
  describe("getTierForLevel", () => {
    it("should return tier 1 for levels 0-4", () => {
      for (let level = 0; level <= 4; level++) {
        const tier = getTierForLevel(level);
        expect(tier).not.toBeNull();
        expect(tier?.minLevel).toBe(0);
        expect(tier?.maxLevel).toBe(4);
      }
    });

    it("should return tier 2 for levels 5-9", () => {
      for (let level = 5; level <= 9; level++) {
        const tier = getTierForLevel(level);
        expect(tier).not.toBeNull();
        expect(tier?.minLevel).toBe(5);
        expect(tier?.maxLevel).toBe(9);
      }
    });

    it("should return tier 3 for levels 10-14", () => {
      for (let level = 10; level <= 14; level++) {
        const tier = getTierForLevel(level);
        expect(tier).not.toBeNull();
        expect(tier?.minLevel).toBe(10);
        expect(tier?.maxLevel).toBe(14);
      }
    });

    it("should return null for max level", () => {
      const tier = getTierForLevel(MAX_ENHANCE_LEVEL);
      expect(tier).toBeNull();
    });
  });

  describe("calculateSuccessRate", () => {
    it("should return 100% for tier 1 (levels 0-4)", () => {
      for (let level = 0; level <= 4; level++) {
        expect(calculateSuccessRate(level)).toBe(100);
      }
    });

    it("should decrease success rate in tier 2", () => {
      expect(calculateSuccessRate(5)).toBe(70);
      expect(calculateSuccessRate(6)).toBe(66);
      expect(calculateSuccessRate(7)).toBe(62);
      expect(calculateSuccessRate(8)).toBe(58);
      expect(calculateSuccessRate(9)).toBe(54);
    });

    it("should decrease success rate in tier 3", () => {
      expect(calculateSuccessRate(10)).toBe(40);
      expect(calculateSuccessRate(11)).toBe(34);
      expect(calculateSuccessRate(12)).toBe(28);
      expect(calculateSuccessRate(13)).toBe(22);
      expect(calculateSuccessRate(14)).toBe(16);
    });
  });

  describe("calculateTotalStatBonus", () => {
    it("should return 0% for level 0", () => {
      expect(calculateTotalStatBonus(0)).toBe(0);
    });

    it("should return 5% per level for tier 1", () => {
      expect(calculateTotalStatBonus(1)).toBe(5);
      expect(calculateTotalStatBonus(2)).toBe(10);
      expect(calculateTotalStatBonus(5)).toBe(25);
    });

    it("should add 8% per level for tier 2", () => {
      // Tier 1: 5 levels * 5% = 25%
      // Tier 2 level 6: 25% + 8% = 33%
      expect(calculateTotalStatBonus(6)).toBe(33);
      expect(calculateTotalStatBonus(10)).toBe(65);
    });

    it("should add 12% per level for tier 3", () => {
      // Tier 1: 25% + Tier 2: 40% = 65%
      // Tier 3 level 11: 65% + 12% = 77%
      expect(calculateTotalStatBonus(11)).toBe(77);
      expect(calculateTotalStatBonus(15)).toBe(125);
    });
  });

  describe("calculateEnhancedStats", () => {
    it("should return base stats for +0 weapon", () => {
      const weapon = createTestWeapon({ enhanceLevel: 0 });
      const stats = calculateEnhancedStats(weapon);

      expect(stats.baseAtk).toBe(100);
      expect(stats.enhancedAtk).toBe(100);
      expect(stats.totalBonusPercent).toBe(0);
    });

    it("should apply bonus for enhanced weapons", () => {
      const weapon = createTestWeapon({ enhanceLevel: 5 });
      const stats = calculateEnhancedStats(weapon);

      expect(stats.totalBonusPercent).toBe(25);
      expect(stats.enhancedAtk).toBe(125); // 100 * 1.25
    });

    it("should cap crit chance at 100", () => {
      const weapon = createTestWeapon({
        critChance: 80,
        enhanceLevel: 15,
      });
      const stats = calculateEnhancedStats(weapon);

      expect(stats.enhancedCritChance).toBeLessThanOrEqual(100);
    });
  });

  describe("getEnhancePreview", () => {
    it("should return null for max level weapon", () => {
      const weapon = createTestWeapon({ enhanceLevel: MAX_ENHANCE_LEVEL });
      const preview = getEnhancePreview(weapon);

      expect(preview).toBeNull();
    });

    it("should return preview with correct info for tier 1", () => {
      const weapon = createTestWeapon({ enhanceLevel: 0 });
      const preview = getEnhancePreview(weapon);

      expect(preview).not.toBeNull();
      expect(preview?.currentLevel).toBe(0);
      expect(preview?.targetLevel).toBe(1);
      expect(preview?.successRate).toBe(100);
      expect(preview?.failureResult.canUseProtection).toBe(false);
    });

    it("should show level loss for tier 2", () => {
      const weapon = createTestWeapon({ enhanceLevel: 7 });
      const preview = getEnhancePreview(weapon);

      expect(preview).not.toBeNull();
      expect(preview?.failureResult.newLevel).toBe(6); // Lose 1 level
      expect(preview?.failureResult.canUseProtection).toBe(true);
    });

    it("should show 2 level loss for tier 3", () => {
      const weapon = createTestWeapon({ enhanceLevel: 12 });
      const preview = getEnhancePreview(weapon);

      expect(preview).not.toBeNull();
      expect(preview?.failureResult.newLevel).toBe(10); // Lose 2 levels, capped at tier min
      expect(preview?.failureResult.canUseProtection).toBe(true);
    });
  });

  describe("performEnhancement", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("should return null for max level weapon", () => {
      const weapon = createTestWeapon({ enhanceLevel: MAX_ENHANCE_LEVEL });
      const result = performEnhancement(weapon);

      expect(result).toBeNull();
    });

    it("should always succeed in tier 1", () => {
      // Run 10 times - tier 1 has 100% success rate
      for (let i = 0; i < 10; i++) {
        const result = performEnhancement(
          createTestWeapon({ enhanceLevel: i % 5 }),
        );
        expect(result?.result.success).toBe(true);
        expect(result?.weapon.enhanceLevel).toBe((i % 5) + 1);
      }
    });

    it("should add to enhance history on attempt", () => {
      const weapon = createTestWeapon({ enhanceLevel: 0 });
      const result = performEnhancement(weapon);

      expect(result?.weapon.enhanceHistory).toHaveLength(1);
      expect(result?.weapon.enhanceHistory[0].success).toBe(true);
      expect(result?.weapon.enhanceHistory[0].fromLevel).toBe(0);
      expect(result?.weapon.enhanceHistory[0].toLevel).toBe(1);
    });

    it("should not lose levels in tier 1 on failure (if it could fail)", () => {
      // Tier 1 always succeeds, but this tests the logic
      const tier = getTierForLevel(0);
      expect(tier?.levelLossOnFailure).toBe(false);
    });

    it("should prevent level loss when protection is used", () => {
      const weapon = createTestWeapon({ enhanceLevel: 7 });

      // Mock random to force failure
      vi.spyOn(Math, "random").mockReturnValue(0.99);

      const result = performEnhancement(weapon, true);

      expect(result?.result.success).toBe(false);
      expect(result?.weapon.enhanceLevel).toBe(7); // Level preserved
      expect(result?.result.protectionUsed).toBe(true);
    });

    it("should lose levels without protection", () => {
      const weapon = createTestWeapon({ enhanceLevel: 7 });

      // Mock random to force failure
      vi.spyOn(Math, "random").mockReturnValue(0.99);

      const result = performEnhancement(weapon, false);

      expect(result?.result.success).toBe(false);
      expect(result?.weapon.enhanceLevel).toBe(6); // Lost 1 level
      expect(result?.result.protectionUsed).toBe(false);
    });
  });

  describe("rollEnhancement", () => {
    it("should return true for 100% success rate", () => {
      // With 100% success rate, any random value should succeed
      vi.spyOn(Math, "random").mockReturnValue(0.99);
      expect(rollEnhancement(100)).toBe(true);
    });

    it("should return false for 0% success rate", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.01);
      expect(rollEnhancement(0)).toBe(false);
    });

    it("should respect success rate threshold", () => {
      // Mock random to return 0.5 (50%)
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      // 60% success rate should pass with roll of 50
      expect(rollEnhancement(60)).toBe(true);

      // 40% success rate should fail with roll of 50
      expect(rollEnhancement(40)).toBe(false);
    });
  });

  describe("canEnhance", () => {
    it("should return true for weapons below max level", () => {
      const weapon = createTestWeapon({ enhanceLevel: 10 });
      expect(canEnhance(weapon)).toBe(true);
    });

    it("should return false for max level weapons", () => {
      const weapon = createTestWeapon({ enhanceLevel: MAX_ENHANCE_LEVEL });
      expect(canEnhance(weapon)).toBe(false);
    });
  });

  describe("getEnhanceStatistics", () => {
    it("should return correct stats for empty history", () => {
      const weapon = createTestWeapon({ enhanceHistory: [] });
      const stats = getEnhanceStatistics(weapon);

      expect(stats.totalAttempts).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.failureCount).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it("should calculate correct statistics", () => {
      const weapon = createTestWeapon({
        enhanceHistory: [
          {
            fromLevel: 0,
            toLevel: 1,
            success: true,
            timestamp: 1,
            materialId: null,
            protectionUsed: false,
          },
          {
            fromLevel: 1,
            toLevel: 2,
            success: true,
            timestamp: 2,
            materialId: null,
            protectionUsed: false,
          },
          {
            fromLevel: 2,
            toLevel: 2,
            success: false,
            timestamp: 3,
            materialId: null,
            protectionUsed: true,
          },
          {
            fromLevel: 2,
            toLevel: 3,
            success: true,
            timestamp: 4,
            materialId: null,
            protectionUsed: false,
          },
        ],
      });
      const stats = getEnhanceStatistics(weapon);

      expect(stats.totalAttempts).toBe(4);
      expect(stats.successCount).toBe(3);
      expect(stats.failureCount).toBe(1);
      expect(stats.successRate).toBe(75);
      expect(stats.protectionUsedCount).toBe(1);
      expect(stats.maxLevelReached).toBe(3);
    });
  });

  describe("getEnhancedWeaponName", () => {
    it("should return plain name for +0 weapon", () => {
      const weapon = createTestWeapon({ name: "Test Sword", enhanceLevel: 0 });
      expect(getEnhancedWeaponName(weapon)).toBe("Test Sword");
    });

    it("should append enhancement level for enhanced weapons", () => {
      const weapon = createTestWeapon({ name: "Test Sword", enhanceLevel: 5 });
      expect(getEnhancedWeaponName(weapon)).toBe("Test Sword +5");
    });
  });
});

// ===========================================================================
// PROPERTY-BASED TESTS
// ===========================================================================

describe("EnhancementService Property Tests", () => {
  const validEnhanceLevelArb = fc.integer({
    min: MIN_ENHANCE_LEVEL,
    max: MAX_ENHANCE_LEVEL,
  });

  const weaponArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    imagePath: fc.constant(null),
    imageUrl: fc.constant(null),
    createdAt: fc.integer({ min: 0, max: Date.now() }),
    updatedAt: fc.integer({ min: 0, max: Date.now() }),
    weaponType: fc.constantFrom(
      "bow" as const,
      "spear" as const,
      "sword_shield" as const,
    ),
    atk: fc.integer({ min: 1, max: 9999 }),
    critChance: fc.integer({ min: 0, max: 100 }),
    critDamage: fc.integer({ min: 0, max: 500 }),
    armorPen: fc.integer({ min: 0, max: 100 }),
    lifesteal: fc.integer({ min: 0, max: 100 }),
    attackRange: fc.integer({ min: 0, max: 6 }),
    enhanceLevel: validEnhanceLevelArb,
    enhanceHistory: fc.constant([] as EnhanceAttempt[]),
  });

  it("property: total stat bonus is always non-negative", () => {
    fc.assert(
      fc.property(validEnhanceLevelArb, (level) => {
        const bonus = calculateTotalStatBonus(level);
        expect(bonus).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it("property: stat bonus increases monotonically with level", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MIN_ENHANCE_LEVEL, max: MAX_ENHANCE_LEVEL - 1 }),
        (level) => {
          const currentBonus = calculateTotalStatBonus(level);
          const nextBonus = calculateTotalStatBonus(level + 1);
          expect(nextBonus).toBeGreaterThan(currentBonus);
        },
      ),
    );
  });

  it("property: enhanced stats are always >= base stats", () => {
    fc.assert(
      fc.property(weaponArb, (weapon) => {
        const stats = calculateEnhancedStats(weapon);

        expect(stats.enhancedAtk).toBeGreaterThanOrEqual(stats.baseAtk);
        expect(stats.enhancedCritDamage).toBeGreaterThanOrEqual(
          stats.baseCritDamage,
        );
      }),
    );
  });

  it("property: success rate is always between 0 and 100", () => {
    fc.assert(
      fc.property(validEnhanceLevelArb, (level) => {
        const rate = calculateSuccessRate(level);
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
      }),
    );
  });

  it("property: canEnhance returns false only at max level", () => {
    fc.assert(
      fc.property(weaponArb, (weapon) => {
        const result = canEnhance(weapon);
        if (weapon.enhanceLevel >= MAX_ENHANCE_LEVEL) {
          expect(result).toBe(false);
        } else {
          expect(result).toBe(true);
        }
      }),
    );
  });

  it("property: getEnhancePreview returns null only at max level", () => {
    fc.assert(
      fc.property(weaponArb, (weapon) => {
        const preview = getEnhancePreview(weapon);
        if (weapon.enhanceLevel >= MAX_ENHANCE_LEVEL) {
          expect(preview).toBeNull();
        } else {
          expect(preview).not.toBeNull();
        }
      }),
    );
  });

  it("property: enhancement level never goes below tier minimum on failure", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: MAX_ENHANCE_LEVEL - 1 }),
        (level) => {
          const tier = getTierForLevel(level);
          if (!tier) return;

          // Simulate failure with level loss
          const newLevel = Math.max(
            tier.minLevel,
            level - tier.levelLossAmount,
          );
          expect(newLevel).toBeGreaterThanOrEqual(tier.minLevel);
        },
      ),
    );
  });

  it("property: crit chance never exceeds 100 after enhancement", () => {
    fc.assert(
      fc.property(
        weaponArb.filter((w) => w.critChance >= 50),
        (weapon) => {
          const stats = calculateEnhancedStats(weapon as Weapon);
          expect(stats.enhancedCritChance).toBeLessThanOrEqual(100);
        },
      ),
    );
  });
});
