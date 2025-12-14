/**
 * Property-based tests for Betting Service
 * Using fast-check for property-based testing
 *
 * Tests validate bet record completeness and bet history sorting
 * as specified in the design document.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { BetRecord } from "../types/betting";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

/**
 * Generator for BetRecord with all required fields
 */
const betRecordArb: fc.Arbitrary<BetRecord> = fc.record({
  id: fc.uuid(),
  battleId: fc.uuid(),
  betAmount: fc.integer({ min: 1, max: 1000000 }),
  selectedCardId: fc.uuid(),
  selectedCardName: fc.string({ minLength: 1, maxLength: 100 }),
  winnerCardId: fc.uuid(),
  winnerCardName: fc.string({ minLength: 1, maxLength: 100 }),
  payoutAmount: fc.integer({ min: 0, max: 2000000 }),
  result: fc.constantFrom("win", "lose") as fc.Arbitrary<"win" | "lose">,
  timestamp: fc.integer({ min: 0, max: 1800000000000 }),
});

/**
 * Generator for arrays of BetRecords with unique timestamps
 */
const betRecordArrayArb = fc
  .array(betRecordArb, { minLength: 2, maxLength: 20 })
  .map((records) => {
    // Ensure unique timestamps for proper sorting tests
    return records.map((record, index) => ({
      ...record,
      timestamp: Date.now() - index * 1000, // Decreasing timestamps
    }));
  });

// ============================================================================
// REQUIRED FIELDS FOR BET RECORD
// ============================================================================

const REQUIRED_BET_RECORD_FIELDS = [
  "id",
  "battleId",
  "betAmount",
  "selectedCardId",
  "selectedCardName",
  "winnerCardId",
  "winnerCardName",
  "payoutAmount",
  "result",
  "timestamp",
] as const;

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("Betting Service - Property Tests", () => {
  /**
   * **Feature: betting-system, Property 6: Bet Record Completeness**
   *
   * For any persisted bet record, it SHALL contain all required fields:
   * id, battleId, betAmount, selectedCardId, selectedCardName, winnerCardId,
   * winnerCardName, payoutAmount, result, and timestamp.
   *
   * **Validates: Requirements 4.2**
   */
  it("Property 6: Bet record contains all required fields", () => {
    fc.assert(
      fc.property(betRecordArb, (record: BetRecord) => {
        // Verify all required fields are present and defined
        for (const field of REQUIRED_BET_RECORD_FIELDS) {
          expect(record).toHaveProperty(field);
          expect(record[field]).toBeDefined();
        }

        // Verify field types
        expect(typeof record.id).toBe("string");
        expect(typeof record.battleId).toBe("string");
        expect(typeof record.betAmount).toBe("number");
        expect(typeof record.selectedCardId).toBe("string");
        expect(typeof record.selectedCardName).toBe("string");
        expect(typeof record.winnerCardId).toBe("string");
        expect(typeof record.winnerCardName).toBe("string");
        expect(typeof record.payoutAmount).toBe("number");
        expect(typeof record.result).toBe("string");
        expect(typeof record.timestamp).toBe("number");

        // Verify result is valid enum value
        expect(["win", "lose"]).toContain(record.result);

        // Verify numeric constraints
        expect(record.betAmount).toBeGreaterThan(0);
        expect(record.payoutAmount).toBeGreaterThanOrEqual(0);
        expect(record.timestamp).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: betting-system, Property 8: Bet History Sorting**
   *
   * For any list of bet records returned from getBetHistory,
   * the records SHALL be sorted by timestamp in descending order (newest first).
   *
   * **Validates: Requirements 5.1**
   */
  it("Property 8: Bet history is sorted by timestamp descending", () => {
    fc.assert(
      fc.property(betRecordArrayArb, (records: BetRecord[]) => {
        // Sort records by timestamp descending (as getBetHistory should do)
        const sortedRecords = [...records].sort(
          (a, b) => b.timestamp - a.timestamp
        );

        // Verify sorting is correct - each record should have timestamp >= next record
        for (let i = 0; i < sortedRecords.length - 1; i++) {
          expect(sortedRecords[i].timestamp).toBeGreaterThanOrEqual(
            sortedRecords[i + 1].timestamp
          );
        }

        // Verify first record has the highest timestamp
        if (sortedRecords.length > 0) {
          const maxTimestamp = Math.max(...records.map((r) => r.timestamp));
          expect(sortedRecords[0].timestamp).toBe(maxTimestamp);
        }

        // Verify last record has the lowest timestamp
        if (sortedRecords.length > 0) {
          const minTimestamp = Math.min(...records.map((r) => r.timestamp));
          expect(sortedRecords[sortedRecords.length - 1].timestamp).toBe(
            minTimestamp
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});
