/**
 * Matchup Bet Service - Bet operations for matchups
 *
 * Provides persistence and retrieval of matchup bet records from json-server.
 *
 * Requirements: 3.1, 3.5, 4.1, 4.2, 4.3, 6.1, 6.2, 6.4, 6.5, 7.1
 */

import type {
  MatchupBet,
  PlaceBetRequest,
  UpdateBetRequest,
  BetStatus,
} from "../types/matchup";

// API base URL from environment variable with fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

/**
 * Payout multiplier for winning bets
 * Requirements: 6.1
 */
const PAYOUT_MULTIPLIER = 2;

/**
 * Matchup Bet Service
 *
 * Provides CRUD operations for matchup bet records stored in json-server.
 */
export const matchupBetService = {
  /**
   * Place a new bet on a matchup
   *
   * @param request - The PlaceBetRequest with matchup and bet info
   * @returns The created MatchupBet
   *
   * Requirements: 3.1, 3.5
   */
  async placeBet(request: PlaceBetRequest): Promise<MatchupBet> {
    const now = Date.now();

    const bet: Omit<MatchupBet, "id"> = {
      matchupId: request.matchupId,
      selectedCardId: request.selectedCardId,
      selectedCardName: request.selectedCardName,
      betAmount: request.betAmount,
      status: "active",
      payoutAmount: null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    };

    const response = await fetch(`${API_BASE_URL}/matchupBets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bet),
    });

    return handleResponse<MatchupBet>(response);
  },

  /**
   * Get a single bet by ID
   *
   * @param id - The bet ID
   * @returns The MatchupBet or null if not found
   */
  async getBetById(id: string): Promise<MatchupBet | null> {
    const response = await fetch(`${API_BASE_URL}/matchupBets/${id}`);

    if (response.status === 404) {
      return null;
    }

    return handleResponse<MatchupBet>(response);
  },

  /**
   * Get all bets for a specific matchup
   *
   * @param matchupId - The matchup ID
   * @returns Array of MatchupBet records
   */
  async getBetsByMatchup(matchupId: string): Promise<MatchupBet[]> {
    const queryParams = new URLSearchParams();
    queryParams.set("matchupId", matchupId);

    const response = await fetch(
      `${API_BASE_URL}/matchupBets?${queryParams.toString()}`
    );

    return handleResponse<MatchupBet[]>(response);
  },

  /**
   * Get player's bet history sorted by timestamp descending
   *
   * @returns Array of MatchupBet records sorted by createdAt descending
   *
   * Requirements: 7.1
   */
  async getBetHistory(): Promise<MatchupBet[]> {
    const queryParams = new URLSearchParams();

    // Sort by createdAt descending (newest first) - Requirements: 7.1
    queryParams.set("_sort", "createdAt");
    queryParams.set("_order", "desc");

    const response = await fetch(
      `${API_BASE_URL}/matchupBets?${queryParams.toString()}`
    );

    return handleResponse<MatchupBet[]>(response);
  },

  /**
   * Get player's active bet on a specific matchup
   *
   * @param matchupId - The matchup ID
   * @returns The active MatchupBet or null if none exists
   */
  async getActiveBetForMatchup(matchupId: string): Promise<MatchupBet | null> {
    const queryParams = new URLSearchParams();
    queryParams.set("matchupId", matchupId);
    queryParams.set("status", "active");

    const response = await fetch(
      `${API_BASE_URL}/matchupBets?${queryParams.toString()}`
    );

    const bets = await handleResponse<MatchupBet[]>(response);

    // Return the first active bet (should only be one per matchup per player)
    return bets.length > 0 ? bets[0] : null;
  },

  /**
   * Update bet amount
   *
   * @param request - The UpdateBetRequest with betId and newAmount
   * @returns The updated MatchupBet
   *
   * Requirements: 4.3
   */
  async updateBet(request: UpdateBetRequest): Promise<MatchupBet> {
    const response = await fetch(
      `${API_BASE_URL}/matchupBets/${request.betId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          betAmount: request.newAmount,
          updatedAt: Date.now(),
        }),
      }
    );

    return handleResponse<MatchupBet>(response);
  },

  /**
   * Cancel a bet
   *
   * @param betId - The bet ID to cancel
   * @returns The updated MatchupBet with status "cancelled"
   *
   * Requirements: 4.1, 4.2
   */
  async cancelBet(betId: string): Promise<MatchupBet> {
    const response = await fetch(`${API_BASE_URL}/matchupBets/${betId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "cancelled" as BetStatus,
        updatedAt: Date.now(),
        resolvedAt: Date.now(),
      }),
    });

    return handleResponse<MatchupBet>(response);
  },

  /**
   * Resolve all bets for a completed matchup
   * Winners get 2x payout, losers get status "lost"
   *
   * @param matchupId - The matchup ID
   * @param winnerId - The winning card's ID
   *
   * Requirements: 6.1, 6.2, 6.4
   */
  async resolveBets(matchupId: string, winnerId: string): Promise<void> {
    // Get all active bets for this matchup
    const queryParams = new URLSearchParams();
    queryParams.set("matchupId", matchupId);
    queryParams.set("status", "active");

    const response = await fetch(
      `${API_BASE_URL}/matchupBets?${queryParams.toString()}`
    );

    const activeBets = await handleResponse<MatchupBet[]>(response);
    const now = Date.now();

    // Resolve each bet
    const updatePromises = activeBets.map(async (bet) => {
      const isWinner = bet.selectedCardId === winnerId;
      const newStatus: BetStatus = isWinner ? "won" : "lost";
      const payoutAmount = isWinner ? bet.betAmount * PAYOUT_MULTIPLIER : 0;

      return fetch(`${API_BASE_URL}/matchupBets/${bet.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          payoutAmount,
          updatedAt: now,
          resolvedAt: now,
        }),
      });
    });

    await Promise.all(updatePromises);
  },

  /**
   * Refund all active bets for a cancelled matchup
   *
   * @param matchupId - The matchup ID
   *
   * Requirements: 6.5
   */
  async refundBets(matchupId: string): Promise<void> {
    // Get all active bets for this matchup
    const queryParams = new URLSearchParams();
    queryParams.set("matchupId", matchupId);
    queryParams.set("status", "active");

    const response = await fetch(
      `${API_BASE_URL}/matchupBets?${queryParams.toString()}`
    );

    const activeBets = await handleResponse<MatchupBet[]>(response);
    const now = Date.now();

    // Refund each bet
    const updatePromises = activeBets.map(async (bet) => {
      return fetch(`${API_BASE_URL}/matchupBets/${bet.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "refunded" as BetStatus,
          payoutAmount: bet.betAmount, // Refund the original bet amount
          updatedAt: now,
          resolvedAt: now,
        }),
      });
    });

    await Promise.all(updatePromises);
  },
};
