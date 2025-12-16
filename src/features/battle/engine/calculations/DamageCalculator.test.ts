import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createDamageCalculator, damageCalculator } from "./DamageCalculator";
import type { DamageCalculationInput } from "../core/types";

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("DamageCalculator", () => {
  /**
   * **Feature: tier-stat-system, Property 1: Defense Reduction Formula**
   *
   * For any attacker ATK value A and defender DEF value D,
   * the damage after defense reduction SHALL equal A × (1 - D/(D + 100)).
   *
   * **Validates: Requirements 1.4, 4.3**
   */
  it("Property 1: defense reduction formula", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }), // ATK
        fc.integer({ min: 0, max: 9999 }), // DEF
        (atk, def) => {
          // Calculate expected damage using the formula
          const defReduction = def / (def + 100);
          const expectedDamage = Math.max(
            1,
            Math.floor(atk * (1 - defReduction)),
          );

          // Use calculateWithDef with 0 armor pen to test pure defense formula
          const actualDamage = damageCalculator.calculateWithDef(atk, def, 0);

          expect(actualDamage).toBe(expectedDamage);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Feature: tier-stat-system, Property 2: Armor Penetration Reduces Effective Defense**
   *
   * For any defender DEF value D and attacker armorPen value P,
   * the effective defense SHALL equal D × (1 - P/100).
   *
   * **Validates: Requirements 2.3, 4.2**
   */
  it("Property 2: armor penetration reduces effective defense", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9999 }), // DEF
        fc.integer({ min: 0, max: 100 }), // armorPen (0-100%)
        (def, armorPen) => {
          const effectiveDef = damageCalculator.calculateEffectiveDef(
            def,
            armorPen,
          );
          const expected = def * (1 - armorPen / 100);

          expect(effectiveDef).toBeCloseTo(expected, 5);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Feature: tier-stat-system, Property 3: Critical Damage Multiplier**
   *
   * For any base damage B and critDamage value C,
   * when a critical hit occurs, the damage SHALL equal B × (C/100).
   *
   * **Validates: Requirements 2.2, 4.4**
   */
  it("Property 3: critical damage multiplier applies correctly", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }), // base damage
        fc.integer({ min: 100, max: 500 }), // critDamage (100+ means 1x to 5x)
        (baseDamage, critDamage) => {
          const criticalDamage = damageCalculator.applyCritical(
            baseDamage,
            critDamage,
          );
          const expected = Math.floor(baseDamage * (critDamage / 100));

          expect(criticalDamage).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Feature: tier-stat-system, Property 6: Minimum Damage Guarantee**
   *
   * For any attack, the final damage SHALL be at least 1.
   *
   * **Validates: Requirements 4.5**
   */
  it("Property 6: minimum damage guarantee", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9999 }), // ATK (including 0)
        fc.integer({ min: 0, max: 99999 }), // DEF (very high to test minimum)
        fc.integer({ min: 0, max: 100 }), // armorPen
        (atk, def, armorPen) => {
          // Test with defense calculation
          const damageWithDef = damageCalculator.calculateWithDef(
            atk,
            def,
            armorPen,
          );
          expect(damageWithDef).toBeGreaterThanOrEqual(1);

          // Test with simple calculation
          const input: DamageCalculationInput = {
            attackerAtk: atk,
            defenderDef: def,
            armorPen,
          };
          const damageSimple = damageCalculator.calculate(input);
          expect(damageSimple).toBeGreaterThanOrEqual(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Feature: battle-engine-refactor, Property: Attack Damage Equals ATK**
   *
   * For any attack where attacker has ATK value A, the damage dealt SHALL equal A.
   *
   * **Validates: Requirements 2.3**
   */
  it("basic damage equals ATK value (simple mode)", () => {
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
        },
      ),
      { numRuns: 100 },
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
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Feature: battle-combat-visuals, Property 4: DamageResult Structure Completeness**
   *
   * For any damage calculation, the returned DamageResult SHALL contain all required fields:
   * finalDamage, baseDamage, isCrit, critBonus, lifestealAmount.
   *
   * **Validates: Requirements 4.1**
   */
  it("Property 4: DamageResult structure completeness", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }), // attackerAtk
        fc.integer({ min: 0, max: 9999 }), // defenderDef
        fc.integer({ min: 0, max: 100 }), // critChance
        fc.integer({ min: 100, max: 500 }), // critDamage
        fc.integer({ min: 0, max: 100 }), // lifesteal
        (attackerAtk, defenderDef, critChance, critDamage, lifesteal) => {
          const result = damageCalculator.calculateWithDetails({
            attackerAtk,
            defenderDef,
            critChance,
            critDamage,
            lifesteal,
          });

          // Verify all required fields exist and are of correct type
          expect(result).toHaveProperty("finalDamage");
          expect(result).toHaveProperty("baseDamage");
          expect(result).toHaveProperty("isCrit");
          expect(result).toHaveProperty("critBonus");
          expect(result).toHaveProperty("lifestealAmount");

          expect(typeof result.finalDamage).toBe("number");
          expect(typeof result.baseDamage).toBe("number");
          expect(typeof result.isCrit).toBe("boolean");
          expect(typeof result.critBonus).toBe("number");
          expect(typeof result.lifestealAmount).toBe("number");

          // Verify values are non-negative
          expect(result.finalDamage).toBeGreaterThanOrEqual(1);
          expect(result.baseDamage).toBeGreaterThanOrEqual(1);
          expect(result.critBonus).toBeGreaterThanOrEqual(0);
          expect(result.lifestealAmount).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Feature: battle-combat-visuals, Property 5: Crit Bonus Calculation**
   *
   * For any DamageResult where isCrit=true, critBonus SHALL equal (finalDamage - baseDamage).
   * For any DamageResult where isCrit=false, critBonus SHALL equal 0.
   *
   * **Validates: Requirements 4.2**
   */
  it("Property 5: crit bonus calculation correctness", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }), // attackerAtk
        fc.integer({ min: 0, max: 9999 }), // defenderDef
        fc.integer({ min: 100, max: 500 }), // critDamage
        fc.boolean(), // forceCrit - we'll use 0 or 100 critChance to control crit
        (attackerAtk, defenderDef, critDamage, forceCrit) => {
          // Use 100% or 0% crit chance to deterministically control crit
          const critChance = forceCrit ? 100 : 0;

          const result = damageCalculator.calculateWithDetails({
            attackerAtk,
            defenderDef,
            critChance,
            critDamage,
            lifesteal: 0,
          });

          if (result.isCrit) {
            // When crit occurs, critBonus = finalDamage - baseDamage
            expect(result.critBonus).toBe(
              result.finalDamage - result.baseDamage,
            );
            expect(result.critBonus).toBeGreaterThanOrEqual(0);
          } else {
            // When no crit, critBonus = 0
            expect(result.critBonus).toBe(0);
            expect(result.finalDamage).toBe(result.baseDamage);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Feature: battle-combat-visuals, Property 6: Lifesteal Calculation**
   *
   * For any damage and lifesteal percentage, lifestealAmount SHALL equal
   * floor(finalDamage × lifesteal / 100).
   *
   * **Validates: Requirements 4.3**
   */
  it("Property 6: lifesteal calculation correctness", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }), // attackerAtk
        fc.integer({ min: 0, max: 9999 }), // defenderDef
        fc.integer({ min: 0, max: 100 }), // lifesteal percentage
        (attackerAtk, defenderDef, lifesteal) => {
          // Use 0% crit chance to get predictable finalDamage
          const result = damageCalculator.calculateWithDetails({
            attackerAtk,
            defenderDef,
            critChance: 0,
            critDamage: 100,
            lifesteal,
          });

          // Verify lifesteal formula: floor(finalDamage × lifesteal / 100)
          const expectedLifesteal = Math.floor(
            (result.finalDamage * lifesteal) / 100,
          );
          expect(result.lifestealAmount).toBe(expectedLifesteal);
        },
      ),
      { numRuns: 100 },
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
      expect(damageCalculator.calculateWithDef(1, 9999)).toBeGreaterThanOrEqual(
        1,
      );
    });
  });

  describe("applyCritical()", () => {
    it("multiplies damage by crit multiplier (critDamage as percentage)", () => {
      // critDamage is now 100+ (150 = 1.5x, 200 = 2.0x)
      expect(damageCalculator.applyCritical(100, 150)).toBe(150);
      expect(damageCalculator.applyCritical(100, 200)).toBe(200);
    });

    it("floors the result", () => {
      // 100 * (133/100) = 133
      expect(damageCalculator.applyCritical(100, 133)).toBe(133);
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
