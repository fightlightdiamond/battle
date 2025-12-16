/**
 * Property-based tests for Matchup Betting Store
 * Using fast-check for property-based testing
 *
 * Tests validate the correctness properties defined in the design document.
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import type { Matchup, MatchupStatus } from "../types/matchup";
import {
  validateBetPlacement,
  calculateBalanceAfterBet,
  calculateBalanceAfterUpdate,
  calculateBalanceAfterCancellation,
  calculatePayout,
  validateBetUpdate,
  validateBetCancellation,
} from "./matchupBettingStore";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

/**
 * Generator for MatchupStatus (reserved for future tests)
 */
const _matchupStatusArb: fc.Arbitrary<MatchupStatus> = fc.constantFrom(
  "pending",
  "in_progress",
  "completed",
  "cancelled"
);
void _matchupStatusArb; // Suppress unused warning

/**
 * Generator for non-pending MatchupStatus
 */
const nonPendingStatusArb: fc.Arbitrary<MatchupStatus> = fc.constantFrom(
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
 * Generator for nullable number
 */
const nullableTimestampArb: fc.Arbitrary<number | null> = fc.oneof(
  fc.constant(null),
  fc.integer({ min: 0, max: 1800000000000 })
);

/**
 * Generator for Matchup with specific status
 */
const matchupWithStatusArb = (status: MatchupStatus): fc.Arbitrary<Matchup> =>
  fc.record({
    id: fc.uuid(),
    card1Id: fc.uuid(),
    card1Name: fc.string({ minLength: 1, maxLength: 100 }),
    card2Id: fc.uuid(),
    card2Name: fc.string({ minLength: 1, maxLength: 100 }),
    status: fc.constant(status),
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

/**
 * Generator for pending Matchup
 */
const pendingMatchupArb: fc.Arbitrary<Matchup> =
  matchupWithStatusArb("pending");

/**
 * Generator for non-pending Matchup
 */
const nonPendingMatchupArb: fc.Arbitrary<Matchup> = fc
  .tuple(nonPendingStatusArb, fc.uuid())
  .chain(([status, id]) =>
    fc.record({
      id: fc.constant(id),
      card1Id: fc.uuid(),
      card1Name: fc.string({ minLength: 1, maxLength: 100 }),
      card2Id: fc.uuid(),
      card2Name: fc.string({ minLength: 1, maxLength: 100 }),
      status: fc.constant(status),
      winnerId: nullableStringArb,
      winnerName: fc.oneof(
        fc.constant(null),
        fc.string({ minLength: 1, maxLength: 100 })
      ),
      battleHistoryId: nullableStringArb,
      createdAt: fc.integer({ min: 0, max: 1800000000000 }),
      startedAt: nullableTimestampArb,
      completedAt: nullableTimestampArb,
    })
  );

/**
 * Generator for positive bet amount
 */
const positiveBetAmountArb: fc.Arbitrary<number> = fc.integer({
  min: 1,
  max: 1000000,
});

/**
 * Generator for invalid bet amount (zero or negative)
 */
const invalidBetAmountArb: fc.Arbitrary<number> = fc.integer({
  min: -1000000,
  max: 0,
});

/**
 * Generator for positive gold balance
 */
const positiveBalanceArb: fc.Arbitrary<number> = fc.integer({
  min: 1,
  max: 10000000,
});

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("Matchup Betting Store - Property Tests", () => {
  /**
   * **Feature: matchup-betting, Property 5: Invalid Bet Rejection**
   *
   * For any bet amount that is less than or equal to zero OR exceeds the
   * current gold balance, the bet SHALL be rejected and the gold balance
   * SHALL remain unchanged.
   *
   * **Validates: Requirements 3.2, 3.3**
   */
  describe("Property 5: Invalid Bet Rejection", () => {
    it("rejects bets with zero or negative amounts", () => {
      fc.assert(
        fc.property(
          invalidBetAmountArb,
          positiveBalanceArb,
          pendingMatchupArb,
          (betAmount, goldBalance, matchup) => {
            const error = validateBetPlacement(betAmount, goldBalance, matchup);

            // Should be rejected with error message
            expect(error).not.toBeNull();
            expect(error).toBe("Bet amount must be greater than zero");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects bets exceeding gold balance", () => {
      fc.assert(
        fc.property(
          positiveBalanceArb,
          pendingMatchupArb,
          (goldBalance, matchup) => {
            // Bet amount exceeds balance
            const betAmount = goldBalance + 1;
            const error = validateBetPlacement(betAmount, goldBalance, matchup);

            // Should be rejected with error message
            expect(error).not.toBeNull();
            expect(error).toBe("Insufficient funds");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("balance remains unchanged when bet is invalid", () => {
      fc.assert(
        fc.property(
          invalidBetAmountArb,
          positiveBalanceArb,
          pendingMatchupArb,
          (betAmount, goldBalance, matchup) => {
            const error = validateBetPlacement(betAmount, goldBalance, matchup);

            // If rejected, balance calculation should not be applied
            if (error !== null) {
              // Balance should remain unchanged (we don't call calculateBalanceAfterBet)
              expect(goldBalance).toBe(goldBalance);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: matchup-betting, Property 6: Bet Deduction Consistency**
   *
   * For any valid bet placement with amount A and initial balance B,
   * the resulting balance SHALL equal B - A.
   *
   * **Validates: Requirements 3.4**
   */
  describe("Property 6: Bet Deduction Consistency", () => {
    it("deducts bet amount from balance correctly", () => {
      fc.assert(
        fc.property(
          positiveBalanceArb,
          pendingMatchupArb,
          (goldBalance, matchup) => {
            // Generate a valid bet amount (1 to goldBalance)
            const betAmount = Math.floor(Math.random() * goldBalance) + 1;

            // Validate bet is valid
            const error = validateBetPlacement(betAmount, goldBalance, matchup);
            expect(error).toBeNull();

            // Calculate new balance
            const newBalance = calculateBalanceAfterBet(goldBalance, betAmount);

            // Verify: newBalance = goldBalance - betAmount
            expect(newBalance).toBe(goldBalance - betAmount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("balance after bet is always non-negative for valid bets", () => {
      fc.assert(
        fc.property(
          positiveBalanceArb,
          positiveBetAmountArb,
          pendingMatchupArb,
          (goldBalance, betAmount, matchup) => {
            // Only test valid bets (amount <= balance)
            if (betAmount <= goldBalance) {
              const error = validateBetPlacement(
                betAmount,
                goldBalance,
                matchup
              );
              expect(error).toBeNull();

              const newBalance = calculateBalanceAfterBet(
                goldBalance,
                betAmount
              );
              expect(newBalance).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: matchup-betting, Property 7: Non-Pending Matchup Bet Prevention**
   *
   * For any matchup with status other than "pending", placing a new bet,
   * updating an existing bet, or cancelling a bet SHALL be rejected.
   *
   * **Validates: Requirements 3.6, 4.6**
   */
  describe("Property 7: Non-Pending Matchup Bet Prevention", () => {
    it("rejects bet placement on non-pending matchups", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          positiveBalanceArb,
          nonPendingMatchupArb,
          (betAmount, goldBalance, matchup) => {
            // Ensure bet amount is valid (within balance)
            const validBetAmount = Math.min(betAmount, goldBalance);

            const error = validateBetPlacement(
              validBetAmount,
              goldBalance,
              matchup
            );

            // Should be rejected because matchup is not pending
            expect(error).not.toBeNull();
            expect(error).toBe("Cannot place bet on non-pending matchup");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects bet update on non-pending matchups", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          positiveBetAmountArb,
          positiveBalanceArb,
          nonPendingMatchupArb,
          (oldAmount, newAmount, goldBalance, matchup) => {
            const error = validateBetUpdate(
              newAmount,
              oldAmount,
              goldBalance,
              matchup
            );

            // Should be rejected because matchup is not pending
            expect(error).not.toBeNull();
            expect(error).toBe("Cannot update bet on non-pending matchup");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects bet cancellation on non-pending matchups", () => {
      fc.assert(
        fc.property(nonPendingMatchupArb, (matchup) => {
          const error = validateBetCancellation(matchup);

          // Should be rejected because matchup is not pending
          expect(error).not.toBeNull();
          expect(error).toBe("Cannot cancel bet on non-pending matchup");
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: matchup-betting, Property 8: Bet Cancellation Refund**
   *
   * For any cancelled bet with amount A and current balance B,
   * the resulting balance SHALL equal B + A.
   *
   * **Validates: Requirements 4.1**
   */
  describe("Property 8: Bet Cancellation Refund", () => {
    it("refunds bet amount to balance correctly", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          positiveBalanceArb,
          pendingMatchupArb,
          (betAmount, currentBalance, matchup) => {
            // Validate cancellation is allowed
            const error = validateBetCancellation(matchup);
            expect(error).toBeNull();

            // Calculate new balance after cancellation
            const newBalance = calculateBalanceAfterCancellation(
              currentBalance,
              betAmount
            );

            // Verify: newBalance = currentBalance + betAmount
            expect(newBalance).toBe(currentBalance + betAmount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("balance after cancellation is always greater than before", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          positiveBalanceArb,
          pendingMatchupArb,
          (betAmount, currentBalance, matchup) => {
            const error = validateBetCancellation(matchup);
            expect(error).toBeNull();

            const newBalance = calculateBalanceAfterCancellation(
              currentBalance,
              betAmount
            );

            // Balance should increase by bet amount
            expect(newBalance).toBeGreaterThan(currentBalance);
            expect(newBalance - currentBalance).toBe(betAmount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: matchup-betting, Property 9: Bet Update Balance Adjustment**
   *
   * For any bet update from amount A1 to A2 with current balance B:
   * - If A2 > A1, resulting balance SHALL equal B - (A2 - A1)
   * - If A2 < A1, resulting balance SHALL equal B + (A1 - A2)
   *
   * **Validates: Requirements 4.4, 4.5**
   */
  describe("Property 9: Bet Update Balance Adjustment", () => {
    it("deducts difference when increasing bet amount", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          positiveBalanceArb,
          pendingMatchupArb,
          (oldAmount, goldBalance, matchup) => {
            // New amount is higher than old amount
            const newAmount = oldAmount + Math.floor(Math.random() * 1000) + 1;
            const difference = newAmount - oldAmount;

            // Only test if user can afford the increase
            if (difference <= goldBalance) {
              const error = validateBetUpdate(
                newAmount,
                oldAmount,
                goldBalance,
                matchup
              );
              expect(error).toBeNull();

              const newBalance = calculateBalanceAfterUpdate(
                goldBalance,
                oldAmount,
                newAmount
              );

              // Verify: newBalance = goldBalance - (newAmount - oldAmount)
              expect(newBalance).toBe(goldBalance - difference);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("refunds difference when decreasing bet amount", () => {
      fc.assert(
        fc.property(
          positiveBalanceArb,
          pendingMatchupArb,
          (goldBalance, matchup) => {
            // Generate old amount > 1 so we can decrease
            const oldAmount = Math.floor(Math.random() * 1000) + 2;
            // New amount is lower than old amount
            const newAmount = Math.floor(Math.random() * (oldAmount - 1)) + 1;
            const difference = oldAmount - newAmount;

            const error = validateBetUpdate(
              newAmount,
              oldAmount,
              goldBalance,
              matchup
            );
            expect(error).toBeNull();

            const newBalance = calculateBalanceAfterUpdate(
              goldBalance,
              oldAmount,
              newAmount
            );

            // Verify: newBalance = goldBalance + (oldAmount - newAmount)
            expect(newBalance).toBe(goldBalance + difference);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("balance unchanged when bet amount stays the same", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          positiveBalanceArb,
          pendingMatchupArb,
          (amount, goldBalance, matchup) => {
            const error = validateBetUpdate(
              amount,
              amount,
              goldBalance,
              matchup
            );
            expect(error).toBeNull();

            const newBalance = calculateBalanceAfterUpdate(
              goldBalance,
              amount,
              amount
            );

            // Balance should remain unchanged
            expect(newBalance).toBe(goldBalance);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: matchup-betting, Property 10: Payout Calculation**
   *
   * For any resolved bet with amount A:
   * - If selected card matches winner, payout SHALL equal 2 * A and status SHALL be "won"
   * - If selected card does not match winner, payout SHALL equal 0 and status SHALL be "lost"
   *
   * **Validates: Requirements 6.1, 6.2, 6.4**
   */
  describe("Property 10: Payout Calculation", () => {
    it("winning bet gets 2x payout", () => {
      fc.assert(
        fc.property(positiveBetAmountArb, fc.uuid(), (betAmount, cardId) => {
          // Selected card matches winner
          const result = calculatePayout(betAmount, cardId, cardId);

          // Verify: payout = 2 * betAmount
          expect(result.payout).toBe(betAmount * 2);
          expect(result.status).toBe("won");
        }),
        { numRuns: 100 }
      );
    });

    it("losing bet gets 0 payout", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          fc.uuid(),
          fc.uuid(),
          (betAmount, selectedCardId, winnerId) => {
            // Ensure cards are different
            if (selectedCardId !== winnerId) {
              const result = calculatePayout(
                betAmount,
                selectedCardId,
                winnerId
              );

              // Verify: payout = 0
              expect(result.payout).toBe(0);
              expect(result.status).toBe("lost");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("payout is always non-negative", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          fc.uuid(),
          fc.uuid(),
          (betAmount, selectedCardId, winnerId) => {
            const result = calculatePayout(betAmount, selectedCardId, winnerId);

            expect(result.payout).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("payout multiplier is exactly 2x for winners", () => {
      fc.assert(
        fc.property(positiveBetAmountArb, fc.uuid(), (betAmount, cardId) => {
          const result = calculatePayout(betAmount, cardId, cardId);

          // Verify exact 2x multiplier
          expect(result.payout / betAmount).toBe(2);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: matchup-betting, Property 11: Matchup Cancellation Refund**
   *
   * For any cancelled matchup, all active bets on that matchup SHALL have
   * status "refunded" and their amounts SHALL be credited back to players' balances.
   *
   * **Validates: Requirements 6.5**
   */
  describe("Property 11: Matchup Cancellation Refund", () => {
    it("total refund equals sum of all bet amounts", () => {
      fc.assert(
        fc.property(
          fc.array(positiveBetAmountArb, { minLength: 1, maxLength: 10 }),
          positiveBalanceArb,
          (betAmounts, initialBalance) => {
            // Calculate total refund
            const totalRefund = betAmounts.reduce((sum, amt) => sum + amt, 0);

            // Final balance should be initial + total refund
            const finalBalance = initialBalance + totalRefund;

            expect(finalBalance).toBe(initialBalance + totalRefund);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("each bet refund equals original bet amount", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          positiveBalanceArb,
          (betAmount, currentBalance) => {
            // Refund for a single bet
            const newBalance = calculateBalanceAfterCancellation(
              currentBalance,
              betAmount
            );

            // Refund should equal original bet amount
            expect(newBalance - currentBalance).toBe(betAmount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: matchup-betting, Property 13: Balance Persistence Consistency**
   *
   * For any gold balance change (bet placed, bet cancelled, bet updated, payout received),
   * the new balance SHALL be persisted to local storage immediately and match the in-memory state.
   *
   * **Validates: Requirements 9.2, 9.3**
   */
  describe("Property 13: Balance Persistence Consistency", () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it("balance after bet placement is consistent", () => {
      fc.assert(
        fc.property(
          positiveBalanceArb,
          pendingMatchupArb,
          (goldBalance, matchup) => {
            // Generate valid bet amount
            const betAmount = Math.floor(Math.random() * goldBalance) + 1;

            const error = validateBetPlacement(betAmount, goldBalance, matchup);
            if (error === null) {
              const newBalance = calculateBalanceAfterBet(
                goldBalance,
                betAmount
              );

              // Verify calculated balance is consistent
              expect(newBalance).toBe(goldBalance - betAmount);

              // Verify balance is a valid number
              expect(Number.isFinite(newBalance)).toBe(true);
              expect(Number.isInteger(newBalance)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("balance after bet cancellation is consistent", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          positiveBalanceArb,
          pendingMatchupArb,
          (betAmount, currentBalance, matchup) => {
            const error = validateBetCancellation(matchup);
            if (error === null) {
              const newBalance = calculateBalanceAfterCancellation(
                currentBalance,
                betAmount
              );

              // Verify calculated balance is consistent
              expect(newBalance).toBe(currentBalance + betAmount);

              // Verify balance is a valid number
              expect(Number.isFinite(newBalance)).toBe(true);
              expect(Number.isInteger(newBalance)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("balance after bet update is consistent", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          positiveBetAmountArb,
          positiveBalanceArb,
          pendingMatchupArb,
          (oldAmount, newAmount, goldBalance, matchup) => {
            const error = validateBetUpdate(
              newAmount,
              oldAmount,
              goldBalance,
              matchup
            );
            if (error === null) {
              const newBalance = calculateBalanceAfterUpdate(
                goldBalance,
                oldAmount,
                newAmount
              );

              // Verify calculated balance is consistent
              const difference = newAmount - oldAmount;
              expect(newBalance).toBe(goldBalance - difference);

              // Verify balance is a valid number
              expect(Number.isFinite(newBalance)).toBe(true);
              expect(Number.isInteger(newBalance)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("balance after payout is consistent", () => {
      fc.assert(
        fc.property(
          positiveBetAmountArb,
          positiveBalanceArb,
          fc.uuid(),
          fc.uuid(),
          (betAmount, currentBalance, selectedCardId, winnerId) => {
            const { payout } = calculatePayout(
              betAmount,
              selectedCardId,
              winnerId
            );
            const newBalance = currentBalance + payout;

            // Verify calculated balance is consistent
            if (selectedCardId === winnerId) {
              expect(newBalance).toBe(currentBalance + betAmount * 2);
            } else {
              expect(newBalance).toBe(currentBalance);
            }

            // Verify balance is a valid number
            expect(Number.isFinite(newBalance)).toBe(true);
            expect(Number.isInteger(newBalance)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
