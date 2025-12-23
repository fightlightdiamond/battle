/**
 * Matchup Store Types
 * Separated from implementation for clean architecture
 */

import type {
  Matchup,
  MatchupStatus,
  CreateMatchupRequest,
  MatchupBet,
  PlaceBetRequest,
} from "../types/matchup";
import type { MatchupBattleResult } from "../services/matchupBattleService";

// ============================================
// Matchup Store Types
// ============================================

export interface MatchupStoreState {
  matchups: Matchup[];
  currentMatchup: Matchup | null;
  isLoading: boolean;
  error: string | null;
  lastBattleResult: MatchupBattleResult | null;
}

export interface MatchupStoreActions {
  // CRUD Actions
  fetchMatchups: (status?: MatchupStatus) => Promise<void>;
  fetchMatchupById: (id: string) => Promise<void>;
  createMatchup: (request: CreateMatchupRequest) => Promise<Matchup>;

  // Battle Execution Actions (Requirements: 5.1, 5.2, 5.3, 5.4)
  executeMatchupBattle: (matchupId: string) => Promise<MatchupBattleResult>;

  // Cancellation Action (Requirements: 6.5)
  cancelMatchup: (matchupId: string) => Promise<void>;

  // Utility Actions
  clearError: () => void;
  clearLastBattleResult: () => void;
}

export type MatchupStore = MatchupStoreState & MatchupStoreActions;

// ============================================
// Matchup Betting Store Types
// ============================================

/**
 * Matchup Betting Store State
 */
export interface MatchupBettingState {
  goldBalance: number;
  currentBet: MatchupBet | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Matchup Betting Store Actions
 */
export interface MatchupBettingActions {
  /**
   * Place a bet on a matchup
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  placeMatchupBet: (request: PlaceBetRequest) => Promise<boolean>;

  /**
   * Update an existing bet amount
   * Requirements: 4.3, 4.4, 4.5
   */
  updateMatchupBet: (betId: string, newAmount: number) => Promise<boolean>;

  /**
   * Cancel a bet and refund the amount
   * Requirements: 4.1
   */
  cancelMatchupBet: (betId: string) => Promise<boolean>;

  /**
   * Resolve all bets for a completed matchup
   * Requirements: 6.1, 6.2
   */
  resolveMatchupBets: (matchupId: string, winnerId: string) => Promise<void>;

  /**
   * Refund all bets for a cancelled matchup
   * Requirements: 6.5
   */
  refundMatchupBets: (matchupId: string) => Promise<void>;

  /**
   * Load balance from local storage
   */
  loadBalance: () => void;

  /**
   * Set current bet
   */
  setCurrentBet: (bet: MatchupBet | null) => void;

  /**
   * Clear error
   */
  clearError: () => void;
}

/**
 * Combined store type
 */
export type MatchupBettingStoreState = MatchupBettingState &
  MatchupBettingActions;
