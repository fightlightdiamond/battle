/**
 * Betting system types and interfaces
 * Requirements: 2.1, 3.1, 4.2
 */

// Constants
export const DAILY_BONUS_AMOUNT = 1000;
export const PAYOUT_MULTIPLIER = 2;

/**
 * Bet record stored in json-api
 */
export interface BetRecord {
  id: string;
  battleId: string;
  betAmount: number;
  selectedCardId: string;
  selectedCardName: string;
  winnerCardId: string;
  winnerCardName: string;
  payoutAmount: number;
  result: "win" | "lose";
  timestamp: number;
}

/**
 * Active bet during battle
 */
export interface ActiveBet {
  selectedCardId: string;
  betAmount: number;
}

/**
 * Daily bonus claim record
 */
export interface DailyBonusClaim {
  lastClaimDate: string; // ISO date string YYYY-MM-DD
  lastClaimTimestamp: number;
}

/**
 * Betting state
 */
export interface BettingState {
  goldBalance: number;
  activeBet: ActiveBet | null;
  canPlaceBet: boolean;
  dailyBonusClaimed: boolean;
}

/**
 * Paginated bet history response
 */
export interface PaginatedBetResponse {
  data: BetRecord[];
  total: number;
  page: number;
  limit: number;
}
