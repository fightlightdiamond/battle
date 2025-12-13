/**
 * Property-based tests for Battle Service
 * Using fast-check for property-based testing
 *
 * Updated for battle-combat-visuals feature with calculateWithDetails
 * Requirements: 4.1, 4.2, 4.3
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateAttack,
  checkBattleEnd,
  getHpBarColor,
} from "./battleService";
import type { BattleCard } from "../types";
import { BATTLE_RESULTS, COMBAT_CONSTANTS } from "../types";

/**
 * Arbitrary generator for BattleCard
 * Updated for Tier-Based Stat System with all new stats
 */
const battleCardArb = fc
  .record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    imageUrl: fc.option(fc.webUrl(), { nil: null }),

    // HP tracking
    maxHp: fc.integer({ min: 1, max: 10000 }),
    currentHp: fc.integer({ min: 1, max: 10000 }),

    // Core Stats (Tier 1)
    atk: fc.integer({ min: 1, max: 1000 }),
    def: fc.integer({ min: 0, max: 500 }),
    spd: fc.integer({ min: 1, max: 500 }),

    // Combat Stats (Tier 2)
    critChance: fc.integer({ min: 0, max: 100 }),
    critDamage: fc.integer({ min: 100, max: 300 }),
    armorPen: fc.integer({ min: 0, max: 100 }),
    lifesteal: fc.integer({ min: 0, max: 100 }),
  })
  .map((card) => ({
    ...card,
    // Ensure currentHp doesn't exceed maxHp
    currentHp: Math.min(card.currentHp, card.maxHp),
  })) as fc.Arbitrary<BattleCard>;

describe("battleService", () => {
  /**
   * **Feature: battle-combat-visuals, Property 4: DamageResult Structure Completeness**
   * **Validates: Requirements 4.1**
   *
   * For any damage calculation, the returned DamageResult SHALL contain all required fields:
   * finalDamage, baseDamage, isCrit, critBonus, lifestealAmount.
   */
  describe("Property 4: DamageResult Structure Completeness", () => {
    it("damageResult contains all required fields", () => {
      fc.assert(
        fc.property(battleCardArb, battleCardArb, (attacker, defender) => {
          const result = calculateAttack(attacker, defender);

          // DamageResult should be present
          expect(result.damageResult).toBeDefined();

          // All required fields should be present
          expect(typeof result.damageResult!.finalDamage).toBe("number");
          expect(typeof result.damageResult!.baseDamage).toBe("number");
          expect(typeof result.damageResult!.isCrit).toBe("boolean");
          expect(typeof result.damageResult!.critBonus).toBe("number");
          expect(typeof result.damageResult!.lifestealAmount).toBe("number");

          // finalDamage should match result.damage
          expect(result.damageResult!.finalDamage).toBe(result.damage);
        }),
        { numRuns: 100 }
      );
    });

    it("defender's new HP equals max(0, currentHp - finalDamage)", () => {
      fc.assert(
        fc.property(battleCardArb, battleCardArb, (attacker, defender) => {
          const result = calculateAttack(attacker, defender);

          const expectedNewHp = Math.max(0, defender.currentHp - result.damage);

          expect(result.defenderNewHp).toBe(expectedNewHp);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: card-battle-system, Property 5: HP Bar Color Thresholds**
   * **Validates: Requirements 2.3, 4.1, 4.2, 4.3, 8.3**
   *
   * For any HP percentage P:
   * - P > 50 → color SHALL be 'green'
   * - 25 ≤ P ≤ 50 → color SHALL be 'yellow'
   * - P < 25 → color SHALL be 'red'
   */
  describe("Property 5: HP Bar Color Thresholds", () => {
    it("returns green when HP > 50%", () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(50.01), max: 100, noNaN: true }),
          (percentage) => {
            expect(getHpBarColor(percentage)).toBe("green");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns yellow when 25% <= HP <= 50%", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 25, max: 50, noNaN: true }),
          (percentage) => {
            expect(getHpBarColor(percentage)).toBe("yellow");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns red when HP < 25%", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: Math.fround(24.99), noNaN: true }),
          (percentage) => {
            expect(getHpBarColor(percentage)).toBe("red");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: card-battle-system, Property 7: Victory Determination**
   * **Validates: Requirements 5.1**
   *
   * For any battle state where challenger.currentHp <= 0, the result SHALL be 'opponent_wins'.
   * For any battle state where opponent.currentHp <= 0, the result SHALL be 'challenger_wins'.
   */
  describe("Property 7: Victory Determination", () => {
    it("returns opponent_wins when challenger HP <= 0", () => {
      fc.assert(
        fc.property(
          battleCardArb.map((card) => ({ ...card, currentHp: 0 })),
          battleCardArb.filter((card) => card.currentHp > 0),
          (challenger, opponent) => {
            const result = checkBattleEnd(challenger, opponent);
            expect(result).toBe(BATTLE_RESULTS.OPPONENT_WINS);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns challenger_wins when opponent HP <= 0", () => {
      fc.assert(
        fc.property(
          battleCardArb.filter((card) => card.currentHp > 0),
          battleCardArb.map((card) => ({ ...card, currentHp: 0 })),
          (challenger, opponent) => {
            const result = checkBattleEnd(challenger, opponent);
            expect(result).toBe(BATTLE_RESULTS.CHALLENGER_WINS);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns null when both cards have HP > 0", () => {
      fc.assert(
        fc.property(
          battleCardArb.filter((card) => card.currentHp > 0),
          battleCardArb.filter((card) => card.currentHp > 0),
          (challenger, opponent) => {
            const result = checkBattleEnd(challenger, opponent);
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: battle-combat-visuals, Property 5: Crit Bonus Calculation**
   * **Validates: Requirements 4.2**
   *
   * For any DamageResult where isCrit=true, critBonus SHALL equal (finalDamage - baseDamage).
   * For any DamageResult where isCrit=false, critBonus SHALL equal 0.
   */
  describe("Property 5: Crit Bonus Calculation", () => {
    it("critBonus equals (finalDamage - baseDamage) when isCrit is true", () => {
      fc.assert(
        fc.property(battleCardArb, battleCardArb, (attacker, defender) => {
          const result = calculateAttack(attacker, defender);

          if (result.damageResult!.isCrit) {
            expect(result.damageResult!.critBonus).toBe(
              result.damageResult!.finalDamage - result.damageResult!.baseDamage
            );
          } else {
            expect(result.damageResult!.critBonus).toBe(0);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: battle-combat-visuals, Property 6: Lifesteal Calculation**
   * **Validates: Requirements 4.3**
   *
   * For any damage and lifesteal percentage, lifestealAmount SHALL equal
   * floor(finalDamage × lifesteal / 100).
   */
  describe("Property 6: Lifesteal Calculation", () => {
    it("lifestealAmount equals floor(finalDamage × lifesteal / 100)", () => {
      fc.assert(
        fc.property(battleCardArb, battleCardArb, (attacker, defender) => {
          const result = calculateAttack(attacker, defender);

          const expectedLifesteal = Math.floor(
            (result.damage * attacker.lifesteal) / 100
          );

          expect(result.damageResult!.lifestealAmount).toBe(expectedLifesteal);
          expect(result.lifestealHeal).toBe(expectedLifesteal);
        }),
        { numRuns: 100 }
      );
    });

    it("attackerNewHp is capped at maxHp after lifesteal", () => {
      fc.assert(
        fc.property(battleCardArb, battleCardArb, (attacker, defender) => {
          const result = calculateAttack(attacker, defender);

          const expectedAttackerHp = Math.min(
            attacker.maxHp,
            attacker.currentHp + result.lifestealHeal
          );

          expect(result.attackerNewHp).toBe(expectedAttackerHp);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: card-battle-system, Property 11: Critical Damage Threshold**
   * **Validates: Requirements 8.2**
   *
   * For any attack where damage D and defender's maxHp is M,
   * the attack SHALL be marked as critical if D > (M * 0.3) OR if crit was rolled.
   */
  describe("Property 11: Critical Damage Threshold", () => {
    it("isCritical is true when damage > 30% of defender maxHp OR crit was rolled", () => {
      fc.assert(
        fc.property(battleCardArb, battleCardArb, (attacker, defender) => {
          const result = calculateAttack(attacker, defender);

          const criticalThreshold =
            defender.maxHp * COMBAT_CONSTANTS.CRITICAL_DAMAGE_THRESHOLD;
          const damageExceedsThreshold = result.damage > criticalThreshold;
          const critWasRolled = result.damageResult!.isCrit;

          // isCritical should be true if either condition is met
          const expectedCritical = damageExceedsThreshold || critWasRolled;

          expect(result.isCritical).toBe(expectedCritical);
        }),
        { numRuns: 100 }
      );
    });
  });
});
