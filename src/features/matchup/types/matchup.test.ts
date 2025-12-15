/**
 * Property-based tests for Matchup Types
 * Using fast-check for property-based testing
 *
 * Tests validate that Matchup serialization/deserialization round-trip
 * produces equivalent objects as specified in the design document.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { Matchup, MatchupStatus } from "./matchup";
import { serializeMatchup, deserializeMatchup } from "./matchup";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

/**
 * Generator for MatchupStatus
 */
const matchupStatusArb: fc.Arbitrary<MatchupStatus> = fc.constantFrom(
  "pending",
  "in_progress",
  "completed",
  "cancelled"
);

/**
 * Generator for nullable string (for winnerId, winnerName, battleHistoryId)
 */
const nullableStringArb: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant(null),
  fc.uuid()
);

/**
 * Generator for nullable number (for startedAt, completedAt)
 */
const nullableTimestampArb: fc.Arbitrary<number | null> = fc.oneof(
  fc.constant(null),
  fc.integer({ min: 0, max: 1800000000000 })
);

/**
 * Generator for Matchup
 */
const matchupArb: fc.Arbitrary<Matchup> = fc.record({
  id: fc.uuid(),
  card1Id: fc.uuid(),
  card1Name: fc.string({ minLength: 1, maxLength: 100 }),
  card2Id: fc.uuid(),
  card2Name: fc.string({ minLength: 1, maxLength: 100 }),
  status: matchupStatusArb,
  winnerId: nullableStringArb,
  winnerName: fc.oneof(
    fc.constant(null),
    fc.string({ minLength: 1, maxLength: 100 })
  ),
  battleHistoryId: nullableStringArb,
  createdAt: fc.integer({ min: 0, max: 1800000000000 }),
  startedAt: nullableTimestampArb,
  completedAt: nullableTimestampArb,
});

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("Matchup Types - Property Tests", () => {
  /**
   * **Feature: matchup-betting, Property 1: Matchup Serialization Round-Trip**
   *
   * For any valid Matchup object, serializing to JSON and then deserializing
   * SHALL produce an equivalent object.
   *
   * **Validates: Requirements 1.4, 1.5**
   */
  it("Property 1: Matchup serialization round-trip produces equivalent object", () => {
    fc.assert(
      fc.property(matchupArb, (matchup: Matchup) => {
        // Serialize to JSON
        const serialized = serializeMatchup(matchup);

        // Deserialize from JSON
        const deserialized = deserializeMatchup(serialized);

        // Verify all fields are equivalent
        expect(deserialized.id).toBe(matchup.id);
        expect(deserialized.card1Id).toBe(matchup.card1Id);
        expect(deserialized.card1Name).toBe(matchup.card1Name);
        expect(deserialized.card2Id).toBe(matchup.card2Id);
        expect(deserialized.card2Name).toBe(matchup.card2Name);
        expect(deserialized.status).toBe(matchup.status);
        expect(deserialized.winnerId).toBe(matchup.winnerId);
        expect(deserialized.winnerName).toBe(matchup.winnerName);
        expect(deserialized.battleHistoryId).toBe(matchup.battleHistoryId);
        expect(deserialized.createdAt).toBe(matchup.createdAt);
        expect(deserialized.startedAt).toBe(matchup.startedAt);
        expect(deserialized.completedAt).toBe(matchup.completedAt);

        // Also verify deep equality
        expect(deserialized).toEqual(matchup);
      }),
      { numRuns: 100 }
    );
  });
});
