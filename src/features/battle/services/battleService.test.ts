/**
 * Property-based tests for Battle Service
 * Using fast-check for property-based testing
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateAttack,
  checkBattleEnd,
  getHpBarColor,
} from "./battleService";
import type { BattleCard } from "../types";
import { BATTLE_RESULTS } from "../types";

/**
 * Arbitrary generator for BattleCard
 */
const battleCardArb = fc
  .record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    atk: fc.integer({ min: 1, max: 1000 }),
    maxHp: fc.integer({ min: 1, max: 1000 }),
    currentHp: fc.integer({ min: 1, max: 1000 }),
    imageUrl: fc.option(fc.webUrl(), { nil: null }),
  })
  .map((card) => ({
    ...card,
    // Ensure currentHp doesn't exceed maxHp
    currentHp: Math.min(card.currentHp, card.maxHp),
  })) as fc.Arbitrary<BattleCard>;

describe("battleService", () => {
  /**
   * **Feature: card-battle-system, Property 3: Attack Damage Equals ATK**
   * **Validates: Requirements 3.1, 3.2**
   *
   * For any attack action where attacker has ATK value A and defender has
   * current HP value H, after the attack the defender's new HP SHALL equal max(0, H - A).
   */
  describe("Property 3: Attack Damage Equals ATK", () => {
    it("defender's new HP equals max(0, currentHp - attacker.atk)", () => {
      fc.assert(
        fc.property(battleCardArb, battleCardArb, (attacker, defender) => {
          const result = calculateAttack(attacker, defender);

          const expectedNewHp = Math.max(0, defender.currentHp - attacker.atk);

          expect(result.damage).toBe(attacker.atk);
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
   * **Feature: card-battle-system, Property 11: Critical Damage Threshold**
   * **Validates: Requirements 8.2**
   *
   * For any attack where damage D and defender's maxHp is M,
   * the attack SHALL be marked as critical if and only if D > (M * 0.3).
   */
  describe("Property 11: Critical Damage Threshold", () => {
    it("isCritical is true when damage > 30% of defender maxHp", () => {
      fc.assert(
        fc.property(battleCardArb, battleCardArb, (attacker, defender) => {
          const result = calculateAttack(attacker, defender);

          const criticalThreshold = defender.maxHp * 0.3;
          const expectedCritical = result.damage > criticalThreshold;

          expect(result.isCritical).toBe(expectedCritical);
        }),
        { numRuns: 100 }
      );
    });
  });
});
