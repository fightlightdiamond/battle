/**
 * Property-based tests for Betting Types
 * Using fast-check for property-based testing
 *
 * Tests validate that BetRecord serialization/deserialization round-trip
 * produces equivalent objects as specified in the design document.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { BetRecord } from "./betting";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

/**
 * Generator for BetRecord
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

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("Betting Types - Property Tests", () => {
  /**
   * **Feature: betting-system, Property 7: Bet Record Serialization Round-Trip**
   *
   * For any valid BetRecord object, serializing to JSON and then deserializing
   * SHALL produce an equivalent object.
   *
   * **Validates: Requirements 4.4, 4.5**
   */
  it("Property 7: BetRecord serialization round-trip produces equivalent object", () => {
    fc.assert(
      fc.property(betRecordArb, (record: BetRecord) => {
        // Serialize to JSON
        const serialized = JSON.stringify(record);

        // Deserialize from JSON
        const deserialized = JSON.parse(serialized) as BetRecord;

        // Verify all fields are equivalent
        expect(deserialized.id).toBe(record.id);
        expect(deserialized.battleId).toBe(record.battleId);
        expect(deserialized.betAmount).toBe(record.betAmount);
        expect(deserialized.selectedCardId).toBe(record.selectedCardId);
        expect(deserialized.selectedCardName).toBe(record.selectedCardName);
        expect(deserialized.winnerCardId).toBe(record.winnerCardId);
        expect(deserialized.winnerCardName).toBe(record.winnerCardName);
        expect(deserialized.payoutAmount).toBe(record.payoutAmount);
        expect(deserialized.result).toBe(record.result);
        expect(deserialized.timestamp).toBe(record.timestamp);

        // Also verify deep equality
        expect(deserialized).toEqual(record);
      }),
      { numRuns: 100 }
    );
  });
});
