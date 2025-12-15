/**
 * Property-based tests for Matchup Service
 * Using fast-check for property-based testing
 *
 * Tests validate matchup service operations as specified in the design document.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import type {
  Matchup,
  MatchupStatus,
  CreateMatchupRequest,
} from "../types/matchup";
import { matchupService } from "./matchupService";

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
 * Generator for card ID (UUID format)
 */
const cardIdArb: fc.Arbitrary<string> = fc.uuid();

/**
 * Generator for card name
 */
const cardNameArb: fc.Arbitrary<string> = fc.string({
  minLength: 1,
  maxLength: 100,
});

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
 * Generator for nullable string
 */
const nullableStringArb: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant(null),
  fc.uuid()
);

/**
 * Generator for nullable timestamp
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
  card1Id: cardIdArb,
  card1Name: cardNameArb,
  card2Id: cardIdArb,
  card2Name: cardNameArb,
  status: matchupStatusArb,
  winnerId: nullableStringArb,
  winnerName: fc.oneof(fc.constant(null), cardNameArb),
  battleHistoryId: nullableStringArb,
  createdAt: fc.integer({ min: 0, max: 1800000000000 }),
  startedAt: nullableTimestampArb,
  completedAt: nullableTimestampArb,
});

/**
 * Generator for CreateMatchupRequest with DIFFERENT card IDs
 */
const validCreateMatchupRequestArb: fc.Arbitrary<CreateMatchupRequest> = fc
  .tuple(cardIdArb, cardIdArb, cardNameArb, cardNameArb)
  .filter(([card1Id, card2Id]) => card1Id !== card2Id)
  .map(([card1Id, card2Id, card1Name, card2Name]) => ({
    card1Id,
    card1Name,
    card2Id,
    card2Name,
  }));

/**
 * Generator for CreateMatchupRequest with SAME card ID (invalid)
 */
const sameCardMatchupRequestArb: fc.Arbitrary<CreateMatchupRequest> = fc
  .tuple(cardIdArb, cardNameArb, cardNameArb)
  .map(([cardId, card1Name, card2Name]) => ({
    card1Id: cardId,
    card1Name,
    card2Id: cardId,
    card2Name,
  }));

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

describe("Matchup Service - Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: matchup-betting, Property 2: Same Card Matchup Rejection**
   *
   * For any card, attempting to create a matchup with the same card for both
   * card1 and card2 positions SHALL be rejected.
   *
   * **Validates: Requirements 1.3**
   */
  it("Property 2: Same card matchup rejection", async () => {
    await fc.assert(
      fc.asyncProperty(sameCardMatchupRequestArb, async (request) => {
        // Attempt to create matchup with same card for both positions
        await expect(matchupService.createMatchup(request)).rejects.toThrow(
          "Cannot create matchup with the same card for both positions"
        );

        // Verify fetch was never called (validation happens before API call)
        expect(mockFetch).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: matchup-betting, Property 3: Matchup Record Completeness**
   *
   * For any created matchup, it SHALL contain all required fields:
   * id, card1Id, card1Name, card2Id, card2Name, status, createdAt.
   *
   * **Validates: Requirements 1.2**
   */
  it("Property 3: Matchup record completeness", async () => {
    await fc.assert(
      fc.asyncProperty(validCreateMatchupRequestArb, async (request) => {
        // Mock the API response with a generated ID
        const mockId =
          "generated-id-" + Math.random().toString(36).substr(2, 9);
        const mockCreatedAt = Date.now();

        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            id: mockId,
            ...request,
            status: "pending",
            winnerId: null,
            winnerName: null,
            battleHistoryId: null,
            createdAt: mockCreatedAt,
            startedAt: null,
            completedAt: null,
          })
        );

        const result = await matchupService.createMatchup(request);

        // Verify all required fields are present
        expect(result).toHaveProperty("id");
        expect(typeof result.id).toBe("string");

        expect(result).toHaveProperty("card1Id");
        expect(result.card1Id).toBe(request.card1Id);

        expect(result).toHaveProperty("card1Name");
        expect(result.card1Name).toBe(request.card1Name);

        expect(result).toHaveProperty("card2Id");
        expect(result.card2Id).toBe(request.card2Id);

        expect(result).toHaveProperty("card2Name");
        expect(result.card2Name).toBe(request.card2Name);

        expect(result).toHaveProperty("status");
        expect(result.status).toBe("pending");

        expect(result).toHaveProperty("createdAt");
        expect(typeof result.createdAt).toBe("number");
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: matchup-betting, Property 4: Pending Matchup Filtering and Sorting**
   *
   * For any list of matchups returned from getMatchups with status "pending",
   * all matchups SHALL have status "pending" and be sorted by createdAt descending.
   *
   * **Validates: Requirements 2.1**
   */
  it("Property 4: Pending matchup filtering and sorting", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(matchupArb, { minLength: 0, maxLength: 20 }),
        async (matchups) => {
          // Filter to only pending matchups and sort by createdAt descending
          const pendingMatchups = matchups
            .filter((m) => m.status === "pending")
            .sort((a, b) => b.createdAt - a.createdAt);

          // Mock the API response
          mockFetch.mockResolvedValueOnce(createMockResponse(pendingMatchups));

          const result = await matchupService.getMatchups("pending");

          // Verify all returned matchups have status "pending"
          for (const matchup of result) {
            expect(matchup.status).toBe("pending");
          }

          // Verify sorting by createdAt descending
          for (let i = 1; i < result.length; i++) {
            expect(result[i - 1].createdAt).toBeGreaterThanOrEqual(
              result[i].createdAt
            );
          }

          // Verify the API was called with correct parameters
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("status=pending")
          );
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
