/**
 * Betting Service - CRUD operations for bet records
 *
 * Provides persistence and retrieval of bet records from json-server.
 *
 * Requirements: 4.1, 4.2, 4.3, 5.1, 5.4
 */

import type { BetRecord, PaginatedBetResponse } from "../types/betting";

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
 * Betting Service
 *
 * Provides CRUD operations for bet records stored in json-server.
 */
export const bettingService = {
  /**
   * Save a bet record to the server
   *
   * @param record - The BetRecord to save
   * @returns The saved BetRecord
   *
   * Requirements: 4.1, 4.2
   */
  async saveBetRecord(record: BetRecord): Promise<BetRecord> {
    const response = await fetch(`${API_BASE_URL}/bets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    });

    return handleResponse<BetRecord>(response);
  },

  /**
   * Get paginated bet history sorted by timestamp descending
   *
   * @param page - Page number (1-based)
   * @param limit - Number of records per page (default: 10)
   * @returns Paginated response with bet records
   *
   * Requirements: 5.1, 5.4
   */
  async getBetHistory(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedBetResponse> {
    const queryParams = new URLSearchParams();

    // Pagination
    queryParams.set("_page", String(page));
    queryParams.set("_limit", String(limit));

    // Sort by timestamp descending (newest first) - Requirements: 5.1
    queryParams.set("_sort", "timestamp");
    queryParams.set("_order", "desc");

    const response = await fetch(
      `${API_BASE_URL}/bets?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // json-server returns total count in X-Total-Count header
    const totalHeader = response.headers.get("X-Total-Count");
    const total = totalHeader ? parseInt(totalHeader, 10) : data.length;

    return {
      data,
      total,
      page,
      limit,
    };
  },

  /**
   * Get a single bet record by ID
   *
   * @param id - The bet record ID
   * @returns The BetRecord or null if not found
   *
   * Requirements: 5.4
   */
  async getBetById(id: string): Promise<BetRecord | null> {
    const response = await fetch(`${API_BASE_URL}/bets/${id}`);

    if (response.status === 404) {
      return null;
    }

    return handleResponse<BetRecord>(response);
  },
};
