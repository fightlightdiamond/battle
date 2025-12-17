/**
 * Property-based tests for Battle Service
 * Using fast-check for property-based testing
 *
 * Updated for battle-combat-visuals feature with calculateWithDetails
 * Requirements: 4.1, 4.2, 4.3
 *
 * Updated for weapon-equipment feature with effective stats calculation
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateAttack,
  checkBattleEnd,
  getHpBarColor,
  cardToBattleCardWithWeapon,
} from "./battleService";
import type { BattleCard } from "../types";
import { BATTLE_RESULTS, COMBAT_CONSTANTS } from "../types";
import type { Card } from "../../cards/types";
import type { Weapon } from "../../weapons/types/weapon";
import { WEAPON_STAT_RANGES } from "../../weapons/types/weapon";

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
        { numRuns: 100 },
      );
    });

    it("defender's new HP equals max(0, currentHp - finalDamage)", () => {
      fc.assert(
        fc.property(battleCardArb, battleCardArb, (attacker, defender) => {
          const result = calculateAttack(attacker, defender);

          const expectedNewHp = Math.max(0, defender.currentHp - result.damage);

          expect(result.defenderNewHp).toBe(expectedNewHp);
        }),
        { numRuns: 100 },
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
          },
        ),
        { numRuns: 100 },
      );
    });

    it("returns yellow when 25% <= HP <= 50%", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 25, max: 50, noNaN: true }),
          (percentage) => {
            expect(getHpBarColor(percentage)).toBe("yellow");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("returns red when HP < 25%", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: Math.fround(24.99), noNaN: true }),
          (percentage) => {
            expect(getHpBarColor(percentage)).toBe("red");
          },
        ),
        { numRuns: 100 },
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
          },
        ),
        { numRuns: 100 },
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
          },
        ),
        { numRuns: 100 },
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
          },
        ),
        { numRuns: 100 },
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
              result.damageResult!.finalDamage -
                result.damageResult!.baseDamage,
            );
          } else {
            expect(result.damageResult!.critBonus).toBe(0);
          }
        }),
        { numRuns: 100 },
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
            (result.damage * attacker.lifesteal) / 100,
          );

          expect(result.damageResult!.lifestealAmount).toBe(expectedLifesteal);
          expect(result.lifestealHeal).toBe(expectedLifesteal);
        }),
        { numRuns: 100 },
      );
    });

    it("attackerNewHp is capped at maxHp after lifesteal", () => {
      fc.assert(
        fc.property(battleCardArb, battleCardArb, (attacker, defender) => {
          const result = calculateAttack(attacker, defender);

          const expectedAttackerHp = Math.min(
            attacker.maxHp,
            attacker.currentHp + result.lifestealHeal,
          );

          expect(result.attackerNewHp).toBe(expectedAttackerHp);
        }),
        { numRuns: 100 },
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
        { numRuns: 100 },
      );
    });
  });
});

/**
 * Arbitrary generator for Card
 * Generates valid card entities for testing
 */
const cardArb: fc.Arbitrary<Card> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  imagePath: fc.constantFrom(null, "test-image.png"),
  imageUrl: fc.option(fc.webUrl(), { nil: null }),
  createdAt: fc.integer({ min: 0, max: Date.now() }),
  updatedAt: fc.integer({ min: 0, max: Date.now() }),

  // Card stats
  hp: fc.integer({ min: 1, max: 10000 }),
  atk: fc.integer({ min: 1, max: 1000 }),
  def: fc.integer({ min: 0, max: 500 }),
  spd: fc.integer({ min: 1, max: 500 }),
  critChance: fc.integer({ min: 0, max: 100 }),
  critDamage: fc.integer({ min: 100, max: 300 }),
  armorPen: fc.integer({ min: 0, max: 100 }),
  lifesteal: fc.integer({ min: 0, max: 100 }),
});

/**
 * Arbitrary generator for Weapon
 * Generates valid weapon entities for testing
 */
const weaponArb: fc.Arbitrary<Weapon> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  imagePath: fc.constantFrom(null, "weapon-image.png"),
  imageUrl: fc.option(fc.webUrl(), { nil: null }),
  createdAt: fc.integer({ min: 0, max: Date.now() }),
  updatedAt: fc.integer({ min: 0, max: Date.now() }),

  // Weapon stats
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
});

/**
 * **Feature: weapon-equipment, Property 1: Weapon creation with valid data persists correctly**
 * **Validates: Requirements 1.1**
 *
 * Note: This test validates that when a card with an equipped weapon enters battle,
 * the effective stats are correctly calculated by adding weapon stats to card base stats.
 *
 * For any card with base stats and equipped weapon with bonus stats, the BattleCard
 * effective stats should equal base stats + weapon stats for all offensive stats
 * (atk, critChance, critDamage, armorPen, lifesteal).
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
describe("Property: Battle effective stats with weapon bonuses", () => {
  it("property: cardToBattleCardWithWeapon calculates effective stats correctly", () => {
    fc.assert(
      fc.property(cardArb, weaponArb, (card, weapon) => {
        const battleCard = cardToBattleCardWithWeapon(card, weapon);

        // HP should be unchanged (weapons don't affect HP)
        expect(battleCard.maxHp).toBe(card.hp);
        expect(battleCard.currentHp).toBe(card.hp);

        // DEF should be unchanged (weapons don't affect DEF)
        expect(battleCard.def).toBe(card.def);

        // SPD should be unchanged (weapons don't affect SPD)
        expect(battleCard.spd).toBe(card.spd);

        // ATK should be card ATK + weapon ATK (Requirement 4.2)
        expect(battleCard.atk).toBe(card.atk + weapon.atk);

        // Crit Chance should be card critChance + weapon critChance (Requirement 4.3)
        expect(battleCard.critChance).toBe(card.critChance + weapon.critChance);

        // Crit Damage should be card critDamage + weapon critDamage (Requirement 4.4)
        expect(battleCard.critDamage).toBe(card.critDamage + weapon.critDamage);

        // Armor Pen should be card armorPen + weapon armorPen (Requirement 4.5)
        expect(battleCard.armorPen).toBe(card.armorPen + weapon.armorPen);

        // Lifesteal should be card lifesteal + weapon lifesteal (Requirement 4.6)
        expect(battleCard.lifesteal).toBe(card.lifesteal + weapon.lifesteal);

        // ID and name should be preserved from card
        expect(battleCard.id).toBe(card.id);
        expect(battleCard.name).toBe(card.name);
        expect(battleCard.imageUrl).toBe(card.imageUrl);
      }),
      { numRuns: 100 },
    );
  });

  it("property: cardToBattleCardWithWeapon with null weapon returns base stats", () => {
    fc.assert(
      fc.property(cardArb, (card) => {
        const battleCard = cardToBattleCardWithWeapon(card, null);

        // All stats should equal card base stats when no weapon equipped
        expect(battleCard.maxHp).toBe(card.hp);
        expect(battleCard.currentHp).toBe(card.hp);
        expect(battleCard.atk).toBe(card.atk);
        expect(battleCard.def).toBe(card.def);
        expect(battleCard.spd).toBe(card.spd);
        expect(battleCard.critChance).toBe(card.critChance);
        expect(battleCard.critDamage).toBe(card.critDamage);
        expect(battleCard.armorPen).toBe(card.armorPen);
        expect(battleCard.lifesteal).toBe(card.lifesteal);

        // ID and name should be preserved
        expect(battleCard.id).toBe(card.id);
        expect(battleCard.name).toBe(card.name);
      }),
      { numRuns: 100 },
    );
  });

  it("property: effective stats are additive (commutative)", () => {
    fc.assert(
      fc.property(cardArb, weaponArb, (card, weapon) => {
        const battleCard = cardToBattleCardWithWeapon(card, weapon);

        // Verify additive property: card.stat + weapon.stat = battleCard.stat
        // This should hold regardless of the order of addition
        const expectedAtk = card.atk + weapon.atk;
        const expectedCritChance = card.critChance + weapon.critChance;
        const expectedCritDamage = card.critDamage + weapon.critDamage;
        const expectedArmorPen = card.armorPen + weapon.armorPen;
        const expectedLifesteal = card.lifesteal + weapon.lifesteal;

        expect(battleCard.atk).toBe(expectedAtk);
        expect(battleCard.critChance).toBe(expectedCritChance);
        expect(battleCard.critDamage).toBe(expectedCritDamage);
        expect(battleCard.armorPen).toBe(expectedArmorPen);
        expect(battleCard.lifesteal).toBe(expectedLifesteal);
      }),
      { numRuns: 100 },
    );
  });
});
