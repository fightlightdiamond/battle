/**
 * Matchup Store - State management for matchups
 *
 * Provides state management for matchup CRUD operations and battle execution.
 *
 * Requirements: 1.1, 2.1, 5.1, 5.2, 5.3, 5.4, 6.5
 */

import { create } from "zustand";
import type {
  Matchup,
  MatchupStatus,
  CreateMatchupRequest,
} from "../types/matchup";
import { matchupService } from "../services/matchupService";
import {
  matchupBattleService,
  type MatchupBattleResult,
} from "../services/matchupBattleService";
import type {
  MatchupStoreState,
  MatchupStoreActions,
  MatchupStore,
} from "./types";

// Re-export types for convenience
export type { MatchupStoreState, MatchupStoreActions, MatchupStore };

/**
 * Initial state factory
 */
const createInitialState = (): MatchupStoreState => ({
  matchups: [],
  currentMatchup: null,
  isLoading: false,
  error: null,
  lastBattleResult: null,
});

/**
 * Matchup Store using Zustand
 */
export const useMatchupStore = create<MatchupStore>((set, get) => ({
  ...createInitialState(),

  /**
   * Fetch matchups with optional status filter
   *
   * @param status - Optional status to filter by
   *
   * Requirements: 2.1
   */
  fetchMatchups: async (status?: MatchupStatus): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const matchups = await matchupService.getMatchups(status);
      set({ matchups, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch matchups",
      });
    }
  },

  /**
   * Fetch a single matchup by ID
   *
   * @param id - The matchup ID
   */
  fetchMatchupById: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const matchup = await matchupService.getMatchupById(id);
      set({ currentMatchup: matchup, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch matchup",
      });
    }
  },

  /**
   * Create a new matchup
   *
   * @param request - The CreateMatchupRequest
   * @returns The created Matchup
   *
   * Requirements: 1.1
   */
  createMatchup: async (request: CreateMatchupRequest): Promise<Matchup> => {
    set({ isLoading: true, error: null });

    try {
      const matchup = await matchupService.createMatchup(request);

      // Add to matchups list
      const { matchups } = get();
      set({
        matchups: [matchup, ...matchups],
        isLoading: false,
      });

      return matchup;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to create matchup",
      });
      throw error;
    }
  },

  /**
   * Execute a matchup battle and resolve bets
   *
   * This is the main entry point for admin to start a matchup.
   * It executes the battle, resolves all bets in the database,
   * and updates the player's local gold balance.
   *
   * @param matchupId - The matchup ID to execute
   * @returns The battle result
   *
   * Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4
   */
  executeMatchupBattle: async (
    matchupId: string,
  ): Promise<MatchupBattleResult> => {
    set({ isLoading: true, error: null });

    try {
      // Execute battle and resolve bets in database
      const result =
        await matchupBattleService.executeAndResolveBets(matchupId);

      // Update matchups list with completed matchup
      const { matchups } = get();
      const updatedMatchups = matchups.map((m) =>
        m.id === matchupId ? result.matchup : m,
      );

      set({
        matchups: updatedMatchups,
        currentMatchup: result.matchup,
        lastBattleResult: result,
        isLoading: false,
      });

      // Note: The player's local gold balance should be updated by calling
      // useMatchupBettingStore.getState().resolveMatchupBets(matchupId, result.winnerId)
      // This is typically done in the UI component after the battle completes.

      return result;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute matchup battle",
      });
      throw error;
    }
  },

  /**
   * Cancel a matchup and refund all bets
   *
   * This cancels the matchup and refunds all active bets in the database.
   * The player's local gold balance should be updated separately by calling
   * useMatchupBettingStore.getState().refundMatchupBets(matchupId).
   *
   * @param matchupId - The matchup ID to cancel
   *
   * Requirements: 6.5
   */
  cancelMatchup: async (matchupId: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const cancelledMatchup =
        await matchupBattleService.cancelMatchupAndRefundBets(matchupId);

      // Update matchups list with cancelled matchup
      const { matchups } = get();
      const updatedMatchups = matchups.map((m) =>
        m.id === matchupId ? cancelledMatchup : m,
      );

      set({
        matchups: updatedMatchups,
        currentMatchup: cancelledMatchup,
        isLoading: false,
      });

      // Note: The player's local gold balance should be updated by calling
      // useMatchupBettingStore.getState().refundMatchupBets(matchupId)
      // This is typically done in the UI component after the cancellation.
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to cancel matchup",
      });
      throw error;
    }
  },

  /**
   * Clear error state
   */
  clearError: (): void => {
    set({ error: null });
  },

  /**
   * Clear last battle result
   */
  clearLastBattleResult: (): void => {
    set({ lastBattleResult: null });
  },
}));

// ============================================================================
// SELECTORS - Derived state
// ============================================================================

export const selectMatchups = (state: MatchupStoreState): Matchup[] =>
  state.matchups;

export const selectCurrentMatchup = (
  state: MatchupStoreState,
): Matchup | null => state.currentMatchup;

export const selectIsLoading = (state: MatchupStoreState): boolean =>
  state.isLoading;

export const selectError = (state: MatchupStoreState): string | null =>
  state.error;

export const selectLastBattleResult = (
  state: MatchupStoreState,
): MatchupBattleResult | null => state.lastBattleResult;

export const selectPendingMatchups = (state: MatchupStoreState): Matchup[] =>
  state.matchups.filter((m) => m.status === "pending");

export const selectCompletedMatchups = (state: MatchupStoreState): Matchup[] =>
  state.matchups.filter((m) => m.status === "completed");
