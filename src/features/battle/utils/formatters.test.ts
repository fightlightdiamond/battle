/**
 * Property-based tests for Battle Formatters
 * Using fast-check for property-based testing
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  formatHpDisplay,
  formatBattleLogEntry,
  formatVictoryLog,
} from "./formatters";

describe("formatters", () => {
  /**
   * **Feature: card-battle-system, Property 6: HP Display Format**
   * **Validates: Requirements 4.4**
   *
   * For any card with currentHp C and maxHp M, the HP display string
   * SHALL be formatted as "C / M" where both values are shown as integers.
   */
  describe("Property 6: HP Display Format", () => {
    it("formats HP as 'current / max' with integer values", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (currentHp, maxHp) => {
            const result = formatHpDisplay(currentHp, maxHp);

            // Should match format "C / M"
            const expectedFormat = `${Math.floor(currentHp)} / ${Math.floor(
              maxHp
            )}`;
            expect(result).toBe(expectedFormat);

            // Verify the format structure
            const parts = result.split(" / ");
            expect(parts).toHaveLength(2);

            // Both parts should be valid integers
            const current = parseInt(parts[0], 10);
            const max = parseInt(parts[1], 10);
            expect(Number.isInteger(current)).toBe(true);
            expect(Number.isInteger(max)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("handles decimal HP values by flooring them", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.float({ min: 1, max: 10000, noNaN: true }),
          (currentHp, maxHp) => {
            const result = formatHpDisplay(currentHp, maxHp);

            const expectedFormat = `${Math.floor(currentHp)} / ${Math.floor(
              maxHp
            )}`;
            expect(result).toBe(expectedFormat);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: card-battle-system, Property 9: Battle Log Format**
   * **Validates: Requirements 6.1, 6.2, 6.3**
   *
   * For any attack where attacker name is A, defender name is D, damage is X,
   * and defender's remaining HP is R, the log entry SHALL contain:
   * - "[A] attacks [D] for [X] damage"
   * - "[D] has [R] HP remaining"
   */
  describe("Property 9: Battle Log Format", () => {
    it("contains attacker name, defender name, damage, and remaining HP", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          (attackerName, defenderName, damage, remainingHp) => {
            const result = formatBattleLogEntry(
              attackerName,
              defenderName,
              damage,
              remainingHp
            );

            // Should contain "[attackerName] attacks [defenderName] for [damage] damage"
            expect(result).toContain(
              `[${attackerName}] attacks [${defenderName}]`
            );
            expect(result).toContain(`for [${Math.floor(damage)}] damage`);

            // Should contain "[defenderName] has [remainingHp] HP remaining"
            expect(result).toContain(
              `[${defenderName}] has [${Math.floor(remainingHp)}] HP remaining`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("formats damage and HP as integers", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.float({ min: 1, max: 1000, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          (attackerName, defenderName, damage, remainingHp) => {
            const result = formatBattleLogEntry(
              attackerName,
              defenderName,
              damage,
              remainingHp
            );

            // Should contain floored integer values
            expect(result).toContain(`[${Math.floor(damage)}]`);
            expect(result).toContain(`[${Math.floor(remainingHp)}]`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Victory log format test
   * **Validates: Requirements 6.3**
   */
  describe("formatVictoryLog", () => {
    it("contains winner name in the victory message", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (winnerName) => {
            const result = formatVictoryLog(winnerName);

            // Should contain the winner's name
            expect(result).toContain(`[${winnerName}]`);
            // Should indicate victory
            expect(result.toLowerCase()).toContain("win");
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
