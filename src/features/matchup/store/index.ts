// Matchup store barrel export
export {
  useMatchupStore,
  selectMatchups,
  selectCurrentMatchup,
  selectIsLoading as selectMatchupIsLoading,
  selectError as selectMatchupError,
} from "./matchupStore";
export type { MatchupStoreState } from "./matchupStore";

export {
  useMatchupBettingStore,
  selectGoldBalance,
  selectCurrentBet,
  selectCanAffordBet,
  selectIsLoading as selectBettingIsLoading,
  selectError as selectBettingError,
  validateBetPlacement,
  calculateBalanceAfterBet,
  calculateBalanceAfterUpdate,
  calculateBalanceAfterCancellation,
  calculatePayout,
  validateBetUpdate,
  validateBetCancellation,
} from "./matchupBettingStore";
export type {
  MatchupBettingState,
  MatchupBettingActions,
  MatchupBettingStoreState,
} from "./matchupBettingStore";
