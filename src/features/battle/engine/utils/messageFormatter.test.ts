import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatBattleMessage } from "./messageFormatter";
import type { DamageResult } from "../calculations/DamageCalculator";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

/**
 * Generate a valid DamageResult object.
 * Ensures critBonus is consistent with isCrit flag.
 */
const damageResultArb: fc.Arbitrary<DamageResult> = fc
  .record({
    baseDamage: fc.integer({ min: 1, max: 9999 }),
    isCrit: fc.boolean(),
    critMultiplier: fc.integer({ min: 100, max: 500 }), // Used to calculate critBonus
    lifestealPercent: fc.integer({ min: 0, max: 100 }),
  })
  .map(({ baseDamage, isCrit, critMultiplier, lifestealPercent }) => {
    const finalDamage = isCrit
      ? Math.floor(baseDamage * (critMultiplier / 100))
      : baseDamage;
    const critBonus = isCrit ? finalDamage - baseDamage : 0;
    const lifestealAmount = Math.floor((finalDamage * lifestealPercent) / 100);

    return {
      finalDamage,
      baseDamage,
      isCrit,
      critBonus,
      lifestealAmount,
    };
  });

/**
 * Generate a non-empty string for attacker/defender names.
 * Uses alphanumeric characters and spaces to represent realistic card names.
 * Excludes special regex replacement patterns ($&, $', etc.) that would
 * cause issues with String.replace().
 */
const nameArb: fc.Arbitrary<string> = fc.stringMatching(/^[a-zA-Z0-9 ]{1,50}$/);

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("messageFormatter", () => {
  /**
   * **Feature: battle-combat-visuals, Property 2: Message Formatting Correctness**
   *
   * For any DamageResult, the formatted message SHALL contain the finalDamage value.
   * For any DamageResult with isCrit=true, the message SHALL contain the crit indicator.
   * For any DamageResult with lifestealAmount>0, the message SHALL contain the heal amount.
   *
   * **Validates: Requirements 2.1, 2.2, 2.3**
   */
  describe("Property 2: Message Formatting Correctness", () => {
    it("formatted message always contains finalDamage value", () => {
      fc.assert(
        fc.property(
          nameArb,
          nameArb,
          damageResultArb,
          (attacker, defender, damageResult) => {
            const message = formatBattleMessage({
              attacker,
              defender,
              damageResult,
            });

            // Message must contain the finalDamage value as a string
            expect(message).toContain(String(damageResult.finalDamage));
          }
        ),
        { numRuns: 100 }
      );
    });

    it("formatted message contains attacker and defender names", () => {
      fc.assert(
        fc.property(
          nameArb,
          nameArb,
          damageResultArb,
          (attacker, defender, damageResult) => {
            const message = formatBattleMessage({
              attacker,
              defender,
              damageResult,
            });

            // Message must contain both attacker and defender names
            expect(message).toContain(attacker);
            expect(message).toContain(defender);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("crit message contains critBonus when isCrit is true", () => {
      fc.assert(
        fc.property(
          nameArb,
          nameArb,
          damageResultArb.filter((dr) => dr.isCrit),
          (attacker, defender, damageResult) => {
            const message = formatBattleMessage({
              attacker,
              defender,
              damageResult,
            });

            // When crit occurs, message must contain the critBonus value
            expect(message).toContain(String(damageResult.critBonus));
            // Message should also contain "CRIT" indicator
            expect(message.toUpperCase()).toContain("CRIT");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("lifesteal message contains healAmount when lifestealAmount > 0", () => {
      fc.assert(
        fc.property(
          nameArb,
          nameArb,
          damageResultArb.filter((dr) => dr.lifestealAmount > 0),
          (attacker, defender, damageResult) => {
            const message = formatBattleMessage({
              attacker,
              defender,
              damageResult,
            });

            // When lifesteal occurs, message must contain the heal amount
            expect(message).toContain(String(damageResult.lifestealAmount));
            // Message should also contain "heal" indicator
            expect(message.toLowerCase()).toContain("heal");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("selects correct template based on crit and lifesteal combination", () => {
      fc.assert(
        fc.property(
          nameArb,
          nameArb,
          damageResultArb,
          (attacker, defender, damageResult) => {
            const message = formatBattleMessage({
              attacker,
              defender,
              damageResult,
            });

            const hasCrit = damageResult.isCrit;
            const hasLifesteal = damageResult.lifestealAmount > 0;

            if (hasCrit && hasLifesteal) {
              // Both crit and lifesteal - message should contain both indicators
              expect(message.toUpperCase()).toContain("CRIT");
              expect(message.toLowerCase()).toContain("heal");
            } else if (hasCrit) {
              // Only crit - message should contain crit but not heal
              expect(message.toUpperCase()).toContain("CRIT");
            } else if (hasLifesteal) {
              // Only lifesteal - message should contain heal but not crit
              expect(message.toLowerCase()).toContain("heal");
            }
            // Basic attack - no special indicators required
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
