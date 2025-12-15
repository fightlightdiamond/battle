/**
 * Matchup Service - CRUD operations for matchups
 *
 * Provides persistence and retrieval of matchup records from json-server.
 *
 * Requirements: 1.1, 2.1, 5.1, 5.3
 */

import type {
  Matchup,
  MatchupStatus,
  CreateMatchupRequest,
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
 * Matchup Service
 *
 * Provides CRUD operations for matchup records stored in json-server.
 */
export const matchupService = {
  /**
   * Create a new matchup between two cards
   *
   * @param request - The CreateMatchupRequest with card1 and card2 info
   * @returns The created Matchup
   * @throws Error if card1Id equals card2Id (same card matchup)
   *
   * Requirements: 1.1, 1.2, 1.3
   */
  async createMatchup(request: CreateMatchupRequest): Promise<Matchup> {
    // Validate that card1 and card2 are different - Requirements: 1.3
    if (request.card1Id === request.card2Id) {
      throw new Error(
        "Cannot create matchup with the same card for both positions"
      );
    }

    const matchup: Omit<Matchup, "id"> = {
      card1Id: request.card1Id,
      card1Name: request.card1Name,
      card2Id: request.card2Id,
      card2Name: request.card2Name,
      status: "pending",
      winnerId: null,
      winnerName: null,
      battleHistoryId: null,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
    };

    const response = await fetch(`${API_BASE_URL}/matchups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(matchup),
    });

    return handleResponse<Matchup>(response);
  },

  /**
   * Get all matchups with optional status filter
   *
   * @param status - Optional status to filter by
   * @returns Array of Matchup records sorted by createdAt descending
   *
   * Requirements: 2.1
   */
  async getMatchups(status?: MatchupStatus): Promise<Matchup[]> {
    const queryParams = new URLSearchParams();

    // Sort by createdAt descending (newest first) - Requirements: 2.1
    queryParams.set("_sort", "createdAt");
    queryParams.set("_order", "desc");

    // Filter by status if provided
    if (status) {
      queryParams.set("status", status);
    }

    const response = await fetch(
      `${API_BASE_URL}/matchups?${queryParams.toString()}`
    );

    return handleResponse<Matchup[]>(response);
  },

  /**
   * Get a single matchup by ID
   *
   * @param id - The matchup ID
   * @returns The Matchup or null if not found
   */
  async getMatchupById(id: string): Promise<Matchup | null> {
    const response = await fetch(`${API_BASE_URL}/matchups/${id}`);

    if (response.status === 404) {
      return null;
    }

    return handleResponse<Matchup>(response);
  },

  /**
   * Start a matchup (admin only)
   * Updates status from "pending" to "in_progress"
   *
   * @param matchupId - The matchup ID to start
   * @returns The updated Matchup
   *
   * Requirements: 5.1
   */
  async startMatchup(matchupId: string): Promise<Matchup> {
    const response = await fetch(`${API_BASE_URL}/matchups/${matchupId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "in_progress",
        startedAt: Date.now(),
      }),
    });

    return handleResponse<Matchup>(response);
  },

  /**
   * Complete a matchup with winner information
   *
   * @param matchupId - The matchup ID to complete
   * @param winnerId - The winning card's ID
   * @param winnerName - The winning card's name
   * @param battleHistoryId - The ID of the battle history record
   * @returns The updated Matchup
   *
   * Requirements: 5.3
   */
  async completeMatchup(
    matchupId: string,
    winnerId: string,
    winnerName: string,
    battleHistoryId: string
  ): Promise<Matchup> {
    const response = await fetch(`${API_BASE_URL}/matchups/${matchupId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "completed",
        winnerId,
        winnerName,
        battleHistoryId,
        completedAt: Date.now(),
      }),
    });

    return handleResponse<Matchup>(response);
  },

  /**
   * Cancel a matchup
   *
   * @param matchupId - The matchup ID to cancel
   * @returns The updated Matchup
   */
  async cancelMatchup(matchupId: string): Promise<Matchup> {
    const response = await fetch(`${API_BASE_URL}/matchups/${matchupId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "cancelled",
        completedAt: Date.now(),
      }),
    });

    return handleResponse<Matchup>(response);
  },
};
