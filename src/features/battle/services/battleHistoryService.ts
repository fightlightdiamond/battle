/**
 * Battle History Service - CRUD operations for battle history
 *
 * Provides persistence and retrieval of battle records from json-server.
 *
 * Requirements: 1.3, 3.1
 */

import type { BattleRecord } from "../types/battleHistoryTypes";

// API base URL from environment variable with fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

/**
 * Paginated response for battle history
 */
export interface PaginatedBattleResponse {
  data: BattleRecord[];
  total: number;
  page: number;
  totalPages: number;
}

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
 * Battle History Service
 *
 * Provides CRUD operations for battle records stored in json-server.
 */
export const battleHistoryService = {
  /**
   * Save a battle record to the server
   *
   * @param record - The BattleRecord to save
   * @returns The saved BattleRecord
   *
   * Requirements: 1.3
   */
  async saveBattle(record: BattleRecord): Promise<BattleRecord> {
    const response = await fetch(`${API_BASE_URL}/battleHistory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    });

    return handleResponse<BattleRecord>(response);
  },

  /**
   * Get paginated battle records
   *
   * @param page - Page number (1-based)
   * @param limit - Number of records per page (default: 10)
   * @returns Paginated response with battle records
   *
   * Requirements: 3.1, 3.5
   */
  async getBattles(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedBattleResponse> {
    const queryParams = new URLSearchParams();

    // Pagination
    queryParams.set("_page", String(page));
    queryParams.set("_limit", String(limit));

    // Sort by date descending (newest first) - Requirements: 3.4
    queryParams.set("_sort", "startedAt");
    queryParams.set("_order", "desc");

    const response = await fetch(
      `${API_BASE_URL}/battleHistory?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // json-server returns total count in X-Total-Count header
    const totalHeader = response.headers.get("X-Total-Count");
    const total = totalHeader ? parseInt(totalHeader, 10) : data.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      totalPages,
    };
  },

  /**
   * Get a single battle record by ID
   *
   * @param id - The battle record ID
   * @returns The BattleRecord or null if not found
   *
   * Requirements: 3.3
   */
  async getBattleById(id: string): Promise<BattleRecord | null> {
    const response = await fetch(`${API_BASE_URL}/battleHistory/${id}`);

    if (response.status === 404) {
      return null;
    }

    return handleResponse<BattleRecord>(response);
  },

  /**
   * Delete a battle record by ID
   *
   * @param id - The battle record ID to delete
   *
   * Requirements: 3.1
   */
  async deleteBattle(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/battleHistory/${id}`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
  },
};
