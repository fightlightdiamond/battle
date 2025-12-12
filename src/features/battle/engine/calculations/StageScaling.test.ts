import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createStageScaling, stageScaling } from "./StageScaling";
import type { CombatantStats } from "../core/types";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

const combatantStatsArb: fc.Arbitrary<CombatantStats> = fc.record({
  atk: fc.integer({ min: 1, max: 9999 }),
  def: fc.integer({ min: 0, max: 9999 }),
  critRate: fc.float({ min: 0, max: 1, noNaN: true }),
  critDamage: fc.float({ min: 1, max: 5, noNaN: true }),
});

const stageNumberArb = fc.integer({ min: 0, max: 100 });

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("StageScaling", () => {
  /**
   * **Feature: battle-engine-refactor, Property 10: Stage Scaling Formula**
   *
   * For any base stat value B and stage number N, the scaled stat SHALL equal B × (1 + N × 0.1).
   *
   * **Validates: Requirements 6.1**
   */
  it("Property 10: scaled stats follow formula stat = baseStat × (1 + stageNumber × 0.1)", () => {
    fc.assert(
      fc.property(
        combatantStatsArb,
        stageNumberArb,
        (baseStats, stageNumber) => {
          const scaledStats = stageScaling.scaleStats(baseStats, stageNumber);
          const expectedMultiplier = 1 + stageNumber * 0.1;

          // ATK and DEF should be scaled and floored
          expect(scaledStats.atk).toBe(
            Math.floor(baseStats.atk * expectedMultiplier)
          );
          expect(scaledStats.def).toBe(
            Math.floor(baseStats.def * expectedMultiplier)
          );

          // critRate and critDamage should remain unchanged (they are percentages/multipliers)
          expect(scaledStats.critRate).toBe(baseStats.critRate);
          expect(scaledStats.critDamage).toBe(baseStats.critDamage);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // UNIT TESTS
  // ============================================================================

  describe("scaleStats()", () => {
    it("returns unscaled stats at stage 0", () => {
      const baseStats: CombatantStats = {
        atk: 100,
        def: 50,
        critRate: 0.1,
        critDamage: 1.5,
      };
      const scaled = stageScaling.scaleStats(baseStats, 0);

      expect(scaled.atk).toBe(100);
      expect(scaled.def).toBe(50);
      expect(scaled.critRate).toBe(0.1);
      expect(scaled.critDamage).toBe(1.5);
    });

    it("scales stats by 10% per stage", () => {
      const baseStats: CombatantStats = {
        atk: 100,
        def: 100,
        critRate: 0.1,
        critDamage: 1.5,
      };

      // Stage 1: 1.1x multiplier
      const stage1 = stageScaling.scaleStats(baseStats, 1);
      expect(stage1.atk).toBe(110);
      expect(stage1.def).toBe(110);

      // Stage 5: 1.5x multiplier
      const stage5 = stageScaling.scaleStats(baseStats, 5);
      expect(stage5.atk).toBe(150);
      expect(stage5.def).toBe(150);

      // Stage 10: 2.0x multiplier
      const stage10 = stageScaling.scaleStats(baseStats, 10);
      expect(stage10.atk).toBe(200);
      expect(stage10.def).toBe(200);
    });

    it("floors scaled values", () => {
      const baseStats: CombatantStats = {
        atk: 33,
        def: 17,
        critRate: 0.1,
        critDamage: 1.5,
      };

      // Stage 1: 33 × 1.1 = 36.3 → 36
      const scaled = stageScaling.scaleStats(baseStats, 1);
      expect(scaled.atk).toBe(36);
      // 17 × 1.1 = 18.7 → 18
      expect(scaled.def).toBe(18);
    });

    it("does not scale critRate and critDamage", () => {
      const baseStats: CombatantStats = {
        atk: 100,
        def: 50,
        critRate: 0.25,
        critDamage: 2.0,
      };

      const scaled = stageScaling.scaleStats(baseStats, 10);
      expect(scaled.critRate).toBe(0.25);
      expect(scaled.critDamage).toBe(2.0);
    });
  });

  describe("createStageScaling()", () => {
    it("creates independent scaling instances", () => {
      const scaling1 = createStageScaling();
      const scaling2 = createStageScaling();
      expect(scaling1).not.toBe(scaling2);
    });
  });
});
