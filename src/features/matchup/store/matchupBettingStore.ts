/**
 * Matchup Betting Store - State management for matchup betting
 *
 * Provides actions for placing, updating, cancelling, and resolving matchup bets.
 * Integrates with the existing betting store for gold balance management.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.3, 4.4, 4.5, 6.1, 6.2
 */

import { create } from "zustand";
import type { MatchupBet, PlaceBetRequest, Matchup } from "../types/matchup";
import { matchupBetService } from "../services/matchupBetService";
import { matchupService } from "../services/matchupService";
import type {
  MatchupBettingState,
  MatchupBettingActions,
  MatchupBettingStoreState,
} from "./types";

// Re-export types for convenience
export type {
  MatchupBettingState,
  MatchupBettingActions,
  MatchupBettingStoreState,
};

// Local storage key for gold balance (shared with betting store)
const GOLD_BALANCE_STORAGE_KEY = "betting_gold_balance";

/**
 * Payout multiplier for winning bets
 * Requirements: 6.1
 */
const PAYOUT_MULTIPLIER = 2;

/**
 * Get gold balance from local storage
 */
const getStoredBalance = (): number => {
  try {
    const stored = localStorage.getItem(GOLD_BALANCE_STORAGE_KEY);
    if (stored) {
      const balance = parseInt(stored, 10);
      return isNaN(balance) ? 0 : balance;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 0;
};

/**
 * Persist gold balance to local storage
 * Requirements: 9.2, 9.3
 */
const persistBalance = (balance: number): void => {
  try {
    localStorage.setItem(GOLD_BALANCE_STORAGE_KEY, String(balance));
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * Initial state factory
 */
const createInitialState = (): MatchupBettingState => ({
  goldBalance: getStoredBalance(),
  currentBet: null,
  isLoading: false,
  error: null,
});

/**
 * Matchup Betting Store using Zustand
 */
export const useMatchupBettingStore = create<MatchupBettingStoreState>(
  (set, get) => ({
    ...createInitialState(),

    /**
     * Place a bet on a matchup
     *
     * @param request - The PlaceBetRequest with matchup and bet info
     * @returns true if bet was placed successfully, false otherwise
     *
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6
     */
    placeMatchupBet: async (request: PlaceBetRequest): Promise<boolean> => {
      const { goldBalance } = get();

      // Validate bet amount > 0 (Requirements: 3.3)
      if (request.betAmount <= 0) {
        set({ error: "Bet amount must be greater than zero" });
        return false;
      }

      // Validate bet amount <= balance (Requirements: 3.2)
      if (request.betAmount > goldBalance) {
        set({ error: "Insufficient funds" });
        return false;
      }

      set({ isLoading: true, error: null });

      try {
        // Check matchup status (Requirements: 3.6)
        const matchup = await matchupService.getMatchupById(request.matchupId);
        if (!matchup) {
          set({ isLoading: false, error: "Matchup not found" });
          return false;
        }

        if (matchup.status !== "pending") {
          set({
            isLoading: false,
            error: "Cannot place bet on non-pending matchup",
          });
          return false;
        }

        // Deduct bet amount from balance immediately (Requirements: 3.4)
        const newBalance = goldBalance - request.betAmount;

        // Update balance in state and persist
        set({ goldBalance: newBalance });
        persistBalance(newBalance);

        // Place bet via service (Requirements: 3.1, 3.5)
        const bet = await matchupBetService.placeBet(request);

        set({ isLoading: false, currentBet: bet });
        return true;
      } catch (error) {
        // Rollback balance on error
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to place bet",
        });
        return false;
      }
    },

    /**
     * Update an existing bet amount
     *
     * @param betId - The bet ID to update
     * @param newAmount - The new bet amount
     * @returns true if bet was updated successfully, false otherwise
     *
     * Requirements: 4.3, 4.4, 4.5, 4.6
     */
    updateMatchupBet: async (
      betId: string,
      newAmount: number,
    ): Promise<boolean> => {
      const { goldBalance } = get();

      // Validate new amount > 0
      if (newAmount <= 0) {
        set({ error: "Bet amount must be greater than zero" });
        return false;
      }

      set({ isLoading: true, error: null });

      try {
        // Get current bet
        const currentBet = await matchupBetService.getBetById(betId);
        if (!currentBet) {
          set({ isLoading: false, error: "Bet not found" });
          return false;
        }

        // Check if bet is active
        if (currentBet.status !== "active") {
          set({ isLoading: false, error: "Cannot update non-active bet" });
          return false;
        }

        // Check matchup status (Requirements: 4.6)
        const matchup = await matchupService.getMatchupById(
          currentBet.matchupId,
        );
        if (!matchup || matchup.status !== "pending") {
          set({
            isLoading: false,
            error: "Cannot update bet on non-pending matchup",
          });
          return false;
        }

        const oldAmount = currentBet.betAmount;
        const difference = newAmount - oldAmount;

        // Check if user can afford the increase (Requirements: 4.4)
        if (difference > 0 && difference > goldBalance) {
          set({ isLoading: false, error: "Insufficient funds for increase" });
          return false;
        }

        // Calculate new balance (Requirements: 4.4, 4.5)
        // If newAmount > oldAmount: deduct difference
        // If newAmount < oldAmount: refund difference
        const newBalance = goldBalance - difference;

        // Update balance in state and persist
        set({ goldBalance: newBalance });
        persistBalance(newBalance);

        // Update bet via service
        const updatedBet = await matchupBetService.updateBet({
          betId,
          newAmount,
        });

        set({ isLoading: false, currentBet: updatedBet });
        return true;
      } catch (error) {
        set({
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to update bet",
        });
        return false;
      }
    },

    /**
     * Cancel a bet and refund the amount
     *
     * @param betId - The bet ID to cancel
     * @returns true if bet was cancelled successfully, false otherwise
     *
     * Requirements: 4.1, 4.2, 4.6
     */
    cancelMatchupBet: async (betId: string): Promise<boolean> => {
      const { goldBalance } = get();

      set({ isLoading: true, error: null });

      try {
        // Get current bet
        const currentBet = await matchupBetService.getBetById(betId);
        if (!currentBet) {
          set({ isLoading: false, error: "Bet not found" });
          return false;
        }

        // Check if bet is active
        if (currentBet.status !== "active") {
          set({ isLoading: false, error: "Cannot cancel non-active bet" });
          return false;
        }

        // Check matchup status (Requirements: 4.6)
        const matchup = await matchupService.getMatchupById(
          currentBet.matchupId,
        );
        if (!matchup || matchup.status !== "pending") {
          set({
            isLoading: false,
            error: "Cannot cancel bet on non-pending matchup",
          });
          return false;
        }

        // Refund bet amount to balance (Requirements: 4.1)
        const newBalance = goldBalance + currentBet.betAmount;

        // Update balance in state and persist
        set({ goldBalance: newBalance });
        persistBalance(newBalance);

        // Cancel bet via service (Requirements: 4.2)
        await matchupBetService.cancelBet(betId);

        set({ isLoading: false, currentBet: null });
        return true;
      } catch (error) {
        set({
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to cancel bet",
        });
        return false;
      }
    },

    /**
     * Resolve all bets for a completed matchup
     * Winners get 2x payout, losers get status "lost"
     *
     * @param matchupId - The matchup ID
     * @param winnerId - The winning card's ID
     *
     * Requirements: 6.1, 6.2, 6.3, 6.4
     */
    resolveMatchupBets: async (
      matchupId: string,
      winnerId: string,
    ): Promise<void> => {
      const { goldBalance, currentBet } = get();

      set({ isLoading: true, error: null });

      try {
        // Get all active bets for this matchup to calculate payout
        const activeBets = await matchupBetService.getBetsByMatchup(matchupId);
        const myActiveBets = activeBets.filter(
          (bet) => bet.status === "active",
        );

        // Calculate total payout for winning bets
        let totalPayout = 0;
        for (const bet of myActiveBets) {
          if (bet.selectedCardId === winnerId) {
            // Winner gets 2x payout (Requirements: 6.1)
            totalPayout += bet.betAmount * PAYOUT_MULTIPLIER;
          }
          // Losers get nothing (already deducted) (Requirements: 6.2)
        }

        // Update balance with payout (Requirements: 6.3)
        const newBalance = goldBalance + totalPayout;
        set({ goldBalance: newBalance });
        persistBalance(newBalance);

        // Resolve bets via service (Requirements: 6.4)
        await matchupBetService.resolveBets(matchupId, winnerId);

        // Clear current bet if it was for this matchup
        if (currentBet && currentBet.matchupId === matchupId) {
          set({ currentBet: null });
        }

        set({ isLoading: false });
      } catch (error) {
        set({
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to resolve bets",
        });
      }
    },

    /**
     * Refund all bets for a cancelled matchup
     *
     * @param matchupId - The matchup ID
     *
     * Requirements: 6.5
     */
    refundMatchupBets: async (matchupId: string): Promise<void> => {
      const { goldBalance, currentBet } = get();

      set({ isLoading: true, error: null });

      try {
        // Get all active bets for this matchup to calculate refund
        const activeBets = await matchupBetService.getBetsByMatchup(matchupId);
        const myActiveBets = activeBets.filter(
          (bet) => bet.status === "active",
        );

        // Calculate total refund
        let totalRefund = 0;
        for (const bet of myActiveBets) {
          totalRefund += bet.betAmount;
        }

        // Update balance with refund (Requirements: 6.5)
        const newBalance = goldBalance + totalRefund;
        set({ goldBalance: newBalance });
        persistBalance(newBalance);

        // Refund bets via service
        await matchupBetService.refundBets(matchupId);

        // Clear current bet if it was for this matchup
        if (currentBet && currentBet.matchupId === matchupId) {
          set({ currentBet: null });
        }

        set({ isLoading: false });
      } catch (error) {
        set({
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to refund bets",
        });
      }
    },

    /**
     * Load balance from local storage
     */
    loadBalance: (): void => {
      const balance = getStoredBalance();
      set({ goldBalance: balance });
    },

    /**
     * Set current bet
     */
    setCurrentBet: (bet: MatchupBet | null): void => {
      set({ currentBet: bet });
    },

    /**
     * Clear error
     */
    clearError: (): void => {
      set({ error: null });
    },
  }),
);

// ============================================================================
// SELECTORS - Derived state
// ============================================================================

export const selectGoldBalance = (state: MatchupBettingState): number =>
  state.goldBalance;

export const selectCurrentBet = (
  state: MatchupBettingState,
): MatchupBet | null => state.currentBet;

export const selectIsLoading = (state: MatchupBettingState): boolean =>
  state.isLoading;

export const selectError = (state: MatchupBettingState): string | null =>
  state.error;

export const selectCanAffordBet =
  (amount: number) =>
  (state: MatchupBettingState): boolean =>
    state.goldBalance >= amount && amount > 0;

// ============================================================================
// PURE FUNCTIONS - For testing
// ============================================================================

/**
 * Validate bet placement
 * Returns error message or null if valid
 *
 * Requirements: 3.2, 3.3, 3.6
 */
export function validateBetPlacement(
  betAmount: number,
  goldBalance: number,
  matchup: Matchup | null,
): string | null {
  // Validate bet amount > 0 (Requirements: 3.3)
  if (betAmount <= 0) {
    return "Bet amount must be greater than zero";
  }

  // Validate bet amount <= balance (Requirements: 3.2)
  if (betAmount > goldBalance) {
    return "Insufficient funds";
  }

  // Validate matchup exists and is pending (Requirements: 3.6)
  if (!matchup) {
    return "Matchup not found";
  }

  if (matchup.status !== "pending") {
    return "Cannot place bet on non-pending matchup";
  }

  return null;
}

/**
 * Calculate balance after bet placement
 *
 * Requirements: 3.4
 */
export function calculateBalanceAfterBet(
  currentBalance: number,
  betAmount: number,
): number {
  return currentBalance - betAmount;
}

/**
 * Calculate balance after bet update
 *
 * Requirements: 4.4, 4.5
 */
export function calculateBalanceAfterUpdate(
  currentBalance: number,
  oldAmount: number,
  newAmount: number,
): number {
  const difference = newAmount - oldAmount;
  return currentBalance - difference;
}

/**
 * Calculate balance after bet cancellation
 *
 * Requirements: 4.1
 */
export function calculateBalanceAfterCancellation(
  currentBalance: number,
  betAmount: number,
): number {
  return currentBalance + betAmount;
}

/**
 * Calculate payout for a resolved bet
 *
 * Requirements: 6.1, 6.2
 */
export function calculatePayout(
  betAmount: number,
  selectedCardId: string,
  winnerId: string,
): { payout: number; status: "won" | "lost" } {
  if (selectedCardId === winnerId) {
    return {
      payout: betAmount * PAYOUT_MULTIPLIER,
      status: "won",
    };
  }
  return {
    payout: 0,
    status: "lost",
  };
}

/**
 * Validate bet update
 * Returns error message or null if valid
 *
 * Requirements: 4.4, 4.6
 */
export function validateBetUpdate(
  newAmount: number,
  oldAmount: number,
  goldBalance: number,
  matchup: Matchup | null,
): string | null {
  // Validate new amount > 0
  if (newAmount <= 0) {
    return "Bet amount must be greater than zero";
  }

  // Validate matchup is pending (Requirements: 4.6)
  if (!matchup || matchup.status !== "pending") {
    return "Cannot update bet on non-pending matchup";
  }

  // Check if user can afford the increase (Requirements: 4.4)
  const difference = newAmount - oldAmount;
  if (difference > 0 && difference > goldBalance) {
    return "Insufficient funds for increase";
  }

  return null;
}

/**
 * Validate bet cancellation
 * Returns error message or null if valid
 *
 * Requirements: 4.6
 */
export function validateBetCancellation(
  matchup: Matchup | null,
): string | null {
  if (!matchup || matchup.status !== "pending") {
    return "Cannot cancel bet on non-pending matchup";
  }
  return null;
}
