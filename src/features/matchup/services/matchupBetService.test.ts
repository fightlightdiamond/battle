/**
 * Property-based tests for Matchup Bet Service
 * Using fast-check for property-based testing
 *
 * Tests validate matchup bet service operations as specified in the design document.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import type { MatchupBet, BetStatus } from "../types/matchup";
import { matchupBetService } from "./matchupBetService";

// ============================================================================
// MOCKS
// ============================================================================

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

/**
 * Generator for BetStatus
 */
const betStatusArb: fc.Arbitrary<BetStatus> = fc.constantFrom(
  "active",
  "won",
  "lost",
  "cancelled",
  "refunded"
);

/**
 * Generator for nullable number (payout amount)
 */
const nullablePayoutArb: fc.Arbitrary<number | null> = fc.oneof(
  fc.constant(null),
  fc.integer({ min: 0, max: 1000000 })
);

/**
 * Generator for nullable timestamp
 */
const nullableTimestampArb: fc.Arbitrary<number | null> = fc.oneof(
  fc.constant(null),
  fc.integer({ min: 0, max: 1800000000000 })
);

/**
 * Generator for MatchupBet
 */
const matchupBetArb: fc.Arbitrary<MatchupBet> = fc.record({
  id: fc.uuid(),
  matchupId: fc.uuid(),
  selectedCardId: fc.uuid(),
  selectedCardName: fc.string({ minLength: 1, maxLength: 100 }),
  betAmount: fc.integer({ min: 1, max: 1000000 }),
  status: betStatusArb,
  payoutAmount: nullablePayoutArb,
  createdAt: fc.integer({ min: 0, max: 1800000000000 }),
  updatedAt: fc.integer({ min: 0, max: 1800000000000 }),
  resolvedAt: nullableTimestampArb,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockResponse<T>(data: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  } as Response;
}

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("Matchup Bet Service - Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: matchup-betting, Property 12: Bet History Sorting**
   *
   * For any list of bets returned from getBetHistory, the bets SHALL be
   * sorted by createdAt descending.
   *
   * **Validates: Requirements 7.1**
   */
  it("Property 12: Bet history sorting", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(matchupBetArb, { minLength: 0, maxLength: 20 }),
        async (bets) => {
          // Sort bets by createdAt descending (as the API should return)
          const sortedBets = [...bets].sort(
            (a, b) => b.createdAt - a.createdAt
          );

          // Mock the API response with sorted bets
          mockFetch.mockResolvedValueOnce(createMockResponse(sortedBets));

          const result = await matchupBetService.getBetHistory();

          // Verify sorting by createdAt descending
          for (let i = 1; i < result.length; i++) {
            expect(result[i - 1].createdAt).toBeGreaterThanOrEqual(
              result[i].createdAt
            );
          }

          // Verify the API was called with correct sorting parameters
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("_sort=createdAt")
          );
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("_order=desc")
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
