import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createDamageCalculator, damageCalculator } from "./DamageCalculator";
import type { DamageCalculationInput } from "../core/types";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

const damageCalculationInputArb: fc.Arbitrary<DamageCalculationInput> =
  fc.record({
    attackerAtk: fc.integer({ min: 1, max: 9999 }),
    defenderDef: fc.integer({ min: 0, max: 9999 }),
    skillMultiplier: fc.option(fc.float({ min: 0.5, max: 3, noNaN: true }), {
      nil: undefined,
    }),
    critRate: fc.option(fc.float({ min: 0, max: 1, noNaN: true }), {
      nil: undefined,
    }),
    critDamage: fc.option(fc.float({ min: 1, max: 5, noNaN: true }), {
      nil: undefined,
    }),
  });

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("DamageCalculator", () => {
  /**
   * **Feature: battle-engine-refactor, Property 3: Attack Damage Equals ATK**
   *
   * For any attack where attacker has ATK value A, the damage dealt SHALL equal A.
   *
   * **Validates: Requirements 2.3**
   */
  it("Property 3: basic damage equals ATK value", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 0, max: 9999 }),
        (atk, def) => {
          const input: DamageCalculationInput = {
            attackerAtk: atk,
            defenderDef: def,
          };
          const damage = damageCalculator.calculate(input);

          // Basic damage should equal ATK (floored, minimum 1)
          expect(damage).toBe(Math.max(1, Math.floor(atk)));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: battle-engine-refactor, Property 11: Critical Damage Threshold**
   *
   * For any attack where damage D > defender.maxHp × 0.3, the attack SHALL be marked as critical.
   *
   * **Validates: Requirements 2.3**
   */
  it("Property 11: damage exceeding 30% of maxHp is marked as critical", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 1, max: 9999 }),
        (damage, maxHp) => {
          const isCritical = damageCalculator.isCriticalDamage(damage, maxHp);
          const threshold = maxHp * 0.3;

          if (damage > threshold) {
            expect(isCritical).toBe(true);
          } else {
            expect(isCritical).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // UNIT TESTS
  // ============================================================================

  describe("calculate()", () => {
    it("returns ATK value as damage", () => {
      const input: DamageCalculationInput = {
        attackerAtk: 100,
        defenderDef: 50,
      };
      expect(damageCalculator.calculate(input)).toBe(100);
    });

    it("ensures minimum damage of 1", () => {
      const input: DamageCalculationInput = {
        attackerAtk: 0,
        defenderDef: 100,
      };
      expect(damageCalculator.calculate(input)).toBe(1);
    });
  });

  describe("calculateWithDef()", () => {
    it("applies defense reduction formula", () => {
      // ATK × (1 - DEF/(DEF + 100))
      // 100 × (1 - 100/(100 + 100)) = 100 × 0.5 = 50
      expect(damageCalculator.calculateWithDef(100, 100)).toBe(50);
    });

    it("returns full damage when DEF is 0", () => {
      // 100 × (1 - 0/(0 + 100)) = 100 × 1 = 100
      expect(damageCalculator.calculateWithDef(100, 0)).toBe(100);
    });

    it("ensures minimum damage of 1 with high DEF", () => {
      // Very high DEF should still deal at least 1 damage
      expect(damageCalculator.calculateWithDef(1, 9999)).toBeGreaterThanOrEqual(
        1
      );
    });
  });

  describe("applyCritical()", () => {
    it("multiplies damage by crit multiplier", () => {
      expect(damageCalculator.applyCritical(100, 1.5)).toBe(150);
      expect(damageCalculator.applyCritical(100, 2.0)).toBe(200);
    });

    it("floors the result", () => {
      expect(damageCalculator.applyCritical(100, 1.33)).toBe(133);
    });
  });

  describe("isCriticalDamage()", () => {
    it("returns true when damage exceeds 30% of maxHp", () => {
      expect(damageCalculator.isCriticalDamage(31, 100)).toBe(true);
      expect(damageCalculator.isCriticalDamage(50, 100)).toBe(true);
    });

    it("returns false when damage is at or below 30% of maxHp", () => {
      expect(damageCalculator.isCriticalDamage(30, 100)).toBe(false);
      expect(damageCalculator.isCriticalDamage(10, 100)).toBe(false);
    });
  });

  describe("createDamageCalculator()", () => {
    it("creates independent calculator instances", () => {
      const calc1 = createDamageCalculator();
      const calc2 = createDamageCalculator();
      expect(calc1).not.toBe(calc2);
    });
  });
});
