/**
 * Property-based tests for Betting Store
 * Using fast-check for property-based testing
 *
 * Tests validate betting store behavior as specified in the design document.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { useBettingStore } from "./bettingStore";
import { DAILY_BONUS_AMOUNT, PAYOUT_MULTIPLIER } from "../types/betting";
import { useBattleStore } from "../../battle/store/battleStore";
import { BATTLE_PHASES } from "../../battle/types/battle";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

// Mock dailyBonusService
vi.mock("../services/dailyBonusService", () => ({
  dailyBonusService: {
    canClaimToday: vi.fn(() => true),
    recordClaim: vi.fn(),
    getLastClaim: vi.fn(() => null),
  },
}));

// Mock bettingService
vi.mock("../services/bettingService", () => ({
  bettingService: {
    saveBetRecord: vi.fn().mockResolvedValue({}),
  },
}));

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

/**
 * Generator for invalid bet amounts (zero or negative)
 */
const invalidBetAmountArb = fc.oneof(
  fc.integer({ max: 0 }), // Zero or negative
  fc.double({ min: -1000000, max: 0, noNaN: true }) // Negative doubles
);

/**
 * Generator for valid positive bet amounts
 */
const validBetAmountArb = fc.integer({ min: 1, max: 1000000 });

/**
 * Generator for gold balance
 */
const goldBalanceArb = fc.integer({ min: 0, max: 10000000 });

/**
 * Generator for card IDs
 */
const cardIdArb = fc.uuid();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Reset store state before each test
 */
const resetStores = () => {
  localStorageMock.clear();
  useBettingStore.setState({
    goldBalance: 0,
    activeBet: null,
    canPlaceBet: true,
    dailyBonusClaimed: false,
  });
  useBattleStore.setState({
    phase: BATTLE_PHASES.SETUP,
    challenger: null,
    opponent: null,
    currentAttacker: "challenger",
    battleLog: [],
    result: null,
    isAutoBattle: false,
  });
};

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("Betting Store - Property Tests", () => {
  beforeEach(() => {
    resetStores();
  });

  /**
   * **Feature: betting-system, Property 2: Invalid Bet Rejection**
   *
   * For any bet amount that is less than or equal to zero OR exceeds the current
   * gold balance, the bet SHALL be rejected and the gold balance SHALL remain unchanged.
   *
   * **Validates: Requirements 2.2, 2.3**
   */
  describe("Property 2: Invalid Bet Rejection", () => {
    it("rejects bets with zero or negative amounts", () => {
      fc.assert(
        fc.property(
          goldBalanceArb,
          invalidBetAmountArb,
          cardIdArb,
          (initialBalance, invalidAmount, cardId) => {
            resetStores();

            // Set initial balance
            useBettingStore.setState({ goldBalance: initialBalance });
            const balanceBefore = useBettingStore.getState().goldBalance;

            // Attempt to place invalid bet
            const result = useBettingStore
              .getState()
              .placeBet(cardId, invalidAmount);

            // Bet should be rejected
            expect(result).toBe(false);

            // Balance should remain unchanged
            expect(useBettingStore.getState().goldBalance).toBe(balanceBefore);

            // No active bet should be set
            expect(useBettingStore.getState().activeBet).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects bets exceeding current balance", () => {
      fc.assert(
        fc.property(
          goldBalanceArb,
          validBetAmountArb,
          cardIdArb,
          (initialBalance, betAmount, cardId) => {
            // Only test when bet exceeds balance
            fc.pre(betAmount > initialBalance);

            resetStores();

            // Set initial balance
            useBettingStore.setState({ goldBalance: initialBalance });
            const balanceBefore = useBettingStore.getState().goldBalance;

            // Attempt to place bet exceeding balance
            const result = useBettingStore
              .getState()
              .placeBet(cardId, betAmount);

            // Bet should be rejected
            expect(result).toBe(false);

            // Balance should remain unchanged
            expect(useBettingStore.getState().goldBalance).toBe(balanceBefore);

            // No active bet should be set
            expect(useBettingStore.getState().activeBet).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * **Feature: betting-system, Property 3: Bet Deduction Consistency**
 *
 * For any valid bet placement with amount A and initial balance B,
 * the resulting balance SHALL equal B - A.
 *
 * **Validates: Requirements 2.4**
 */
describe("Property 3: Bet Deduction Consistency", () => {
  it("deducts exact bet amount from balance for valid bets", () => {
    fc.assert(
      fc.property(
        goldBalanceArb,
        validBetAmountArb,
        cardIdArb,
        (initialBalance, betAmount, cardId) => {
          // Only test when bet is valid (amount <= balance)
          fc.pre(betAmount <= initialBalance && betAmount > 0);

          resetStores();

          // Set initial balance
          useBettingStore.setState({ goldBalance: initialBalance });

          // Place valid bet
          const result = useBettingStore.getState().placeBet(cardId, betAmount);

          // Bet should succeed
          expect(result).toBe(true);

          // Balance should equal initialBalance - betAmount
          expect(useBettingStore.getState().goldBalance).toBe(
            initialBalance - betAmount
          );

          // Active bet should be set with correct values
          const activeBet = useBettingStore.getState().activeBet;
          expect(activeBet).not.toBeNull();
          expect(activeBet?.selectedCardId).toBe(cardId);
          expect(activeBet?.betAmount).toBe(betAmount);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: betting-system, Property 4: Battle Phase Bet Prevention**
 *
 * For any attempt to place a bet while a battle is in progress (phase = 'fighting'),
 * the bet SHALL be rejected.
 *
 * **Validates: Requirements 2.5**
 */
describe("Property 4: Battle Phase Bet Prevention", () => {
  it("rejects bets when battle is in fighting phase", () => {
    fc.assert(
      fc.property(
        goldBalanceArb,
        validBetAmountArb,
        cardIdArb,
        (initialBalance, betAmount, cardId) => {
          // Only test when bet would otherwise be valid
          fc.pre(betAmount <= initialBalance && betAmount > 0);

          resetStores();

          // Set initial balance
          useBettingStore.setState({ goldBalance: initialBalance });
          const balanceBefore = useBettingStore.getState().goldBalance;

          // Set battle phase to fighting
          useBattleStore.setState({ phase: BATTLE_PHASES.FIGHTING });

          // Attempt to place bet during battle
          const result = useBettingStore.getState().placeBet(cardId, betAmount);

          // Bet should be rejected
          expect(result).toBe(false);

          // Balance should remain unchanged
          expect(useBettingStore.getState().goldBalance).toBe(balanceBefore);

          // No active bet should be set
          expect(useBettingStore.getState().activeBet).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("allows bets when battle is not in fighting phase", () => {
    const nonFightingPhases = [
      BATTLE_PHASES.SETUP,
      BATTLE_PHASES.READY,
      BATTLE_PHASES.FINISHED,
    ];

    fc.assert(
      fc.property(
        goldBalanceArb,
        validBetAmountArb,
        cardIdArb,
        fc.constantFrom(...nonFightingPhases),
        (initialBalance, betAmount, cardId, phase) => {
          // Only test when bet would be valid
          fc.pre(betAmount <= initialBalance && betAmount > 0);

          resetStores();

          // Set initial balance
          useBettingStore.setState({ goldBalance: initialBalance });

          // Set battle phase to non-fighting
          useBattleStore.setState({ phase });

          // Attempt to place bet
          const result = useBettingStore.getState().placeBet(cardId, betAmount);

          // Bet should succeed
          expect(result).toBe(true);

          // Active bet should be set
          expect(useBettingStore.getState().activeBet).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: betting-system, Property 5: Payout Calculation**
 *
 * For any resolved bet with amount A, if the selected card matches the winner
 * then payout SHALL equal 2 * A, otherwise payout SHALL equal 0.
 *
 * **Validates: Requirements 3.1, 3.2**
 */
describe("Property 5: Payout Calculation", () => {
  it("pays 2x bet amount when selected card wins", async () => {
    await fc.assert(
      fc.asyncProperty(
        goldBalanceArb,
        validBetAmountArb,
        cardIdArb,
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (
          initialBalance,
          betAmount,
          selectedCardId,
          battleId,
          selectedCardName,
          winnerCardName
        ) => {
          // Only test when bet would be valid
          fc.pre(betAmount <= initialBalance && betAmount > 0);

          resetStores();

          // Set initial balance and place bet
          useBettingStore.setState({ goldBalance: initialBalance });
          useBettingStore.getState().placeBet(selectedCardId, betAmount);

          const balanceAfterBet = useBettingStore.getState().goldBalance;
          expect(balanceAfterBet).toBe(initialBalance - betAmount);

          // Resolve bet with selected card as winner
          const betRecord = await useBettingStore.getState().resolveBet(
            selectedCardId, // winner is the selected card
            winnerCardName,
            battleId,
            selectedCardName
          );

          // Payout should be 2x bet amount
          expect(betRecord).not.toBeNull();
          expect(betRecord?.payoutAmount).toBe(betAmount * PAYOUT_MULTIPLIER);
          expect(betRecord?.result).toBe("win");

          // Balance should be: (initialBalance - betAmount) + (2 * betAmount)
          // = initialBalance + betAmount
          expect(useBettingStore.getState().goldBalance).toBe(
            initialBalance + betAmount
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("pays 0 when selected card loses", async () => {
    await fc.assert(
      fc.asyncProperty(
        goldBalanceArb,
        validBetAmountArb,
        cardIdArb,
        cardIdArb,
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (
          initialBalance,
          betAmount,
          selectedCardId,
          winnerCardId,
          battleId,
          selectedCardName,
          winnerCardName
        ) => {
          // Only test when bet would be valid and cards are different
          fc.pre(betAmount <= initialBalance && betAmount > 0);
          fc.pre(selectedCardId !== winnerCardId);

          resetStores();

          // Set initial balance and place bet
          useBettingStore.setState({ goldBalance: initialBalance });
          useBettingStore.getState().placeBet(selectedCardId, betAmount);

          const balanceAfterBet = useBettingStore.getState().goldBalance;
          expect(balanceAfterBet).toBe(initialBalance - betAmount);

          // Resolve bet with different card as winner
          const betRecord = await useBettingStore.getState().resolveBet(
            winnerCardId, // winner is NOT the selected card
            winnerCardName,
            battleId,
            selectedCardName
          );

          // Payout should be 0
          expect(betRecord).not.toBeNull();
          expect(betRecord?.payoutAmount).toBe(0);
          expect(betRecord?.result).toBe("lose");

          // Balance should remain at: initialBalance - betAmount (no payout)
          expect(useBettingStore.getState().goldBalance).toBe(
            initialBalance - betAmount
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: betting-system, Property 9: Balance Persistence Consistency**
 *
 * For any gold balance change (bet placed, payout received, daily bonus),
 * the new balance SHALL be persisted to local storage immediately and match
 * the in-memory state.
 *
 * **Validates: Requirements 6.2, 6.3**
 */
describe("Property 9: Balance Persistence Consistency", () => {
  it("persists balance to localStorage after placing a bet", () => {
    fc.assert(
      fc.property(
        goldBalanceArb,
        validBetAmountArb,
        cardIdArb,
        (initialBalance, betAmount, cardId) => {
          // Only test when bet would be valid
          fc.pre(betAmount <= initialBalance && betAmount > 0);

          resetStores();

          // Set initial balance
          useBettingStore.setState({ goldBalance: initialBalance });

          // Place bet
          useBettingStore.getState().placeBet(cardId, betAmount);

          // Get in-memory balance
          const inMemoryBalance = useBettingStore.getState().goldBalance;

          // Get persisted balance from localStorage
          const persistedBalance = parseInt(
            localStorageMock.getItem("betting_gold_balance") || "0",
            10
          );

          // They should match
          expect(persistedBalance).toBe(inMemoryBalance);
          expect(persistedBalance).toBe(initialBalance - betAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("persists balance to localStorage after payout", async () => {
    await fc.assert(
      fc.asyncProperty(
        goldBalanceArb,
        validBetAmountArb,
        cardIdArb,
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (
          initialBalance,
          betAmount,
          selectedCardId,
          battleId,
          selectedCardName,
          winnerCardName
        ) => {
          // Only test when bet would be valid
          fc.pre(betAmount <= initialBalance && betAmount > 0);

          resetStores();

          // Set initial balance and place bet
          useBettingStore.setState({ goldBalance: initialBalance });
          useBettingStore.getState().placeBet(selectedCardId, betAmount);

          // Resolve bet (win case)
          await useBettingStore
            .getState()
            .resolveBet(
              selectedCardId,
              winnerCardName,
              battleId,
              selectedCardName
            );

          // Get in-memory balance
          const inMemoryBalance = useBettingStore.getState().goldBalance;

          // Get persisted balance from localStorage
          const persistedBalance = parseInt(
            localStorageMock.getItem("betting_gold_balance") || "0",
            10
          );

          // They should match
          expect(persistedBalance).toBe(inMemoryBalance);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("persists balance to localStorage after daily bonus", () => {
    fc.assert(
      fc.property(goldBalanceArb, (initialBalance) => {
        resetStores();

        // Set initial balance
        useBettingStore.setState({ goldBalance: initialBalance });

        // Claim daily bonus
        useBettingStore.getState().claimDailyBonus();

        // Get in-memory balance
        const inMemoryBalance = useBettingStore.getState().goldBalance;

        // Get persisted balance from localStorage
        const persistedBalance = parseInt(
          localStorageMock.getItem("betting_gold_balance") || "0",
          10
        );

        // They should match
        expect(persistedBalance).toBe(inMemoryBalance);
        expect(persistedBalance).toBe(initialBalance + DAILY_BONUS_AMOUNT);
      }),
      { numRuns: 100 }
    );
  });
});
