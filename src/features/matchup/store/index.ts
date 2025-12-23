// Store types (separated from implementation)
export type {
  MatchupStoreState,
  MatchupStoreActions,
  MatchupStore,
  MatchupBettingState,
  MatchupBettingActions,
  MatchupBettingStoreState,
} from "./types";

// Matchup store exports
export {
  useMatchupStore,
  selectMatchups,
  selectCurrentMatchup,
  selectIsLoading as selectMatchupIsLoading,
  selectError as selectMatchupError,
  selectLastBattleResult,
  selectPendingMatchups,
  selectCompletedMatchups,
} from "./matchupStore";

// Matchup betting store exports
export {
  useMatchupBettingStore,
  selectGoldBalance,
  selectCurrentBet,
  selectIsLoading as selectBettingIsLoading,
  selectError as selectBettingError,
  selectCanAffordBet,
  validateBetPlacement,
  calculateBalanceAfterBet,
  calculateBalanceAfterUpdate,
  calculateBalanceAfterCancellation,
  calculatePayout,
  validateBetUpdate,
  validateBetCancellation,
} from "./matchupBettingStore";
