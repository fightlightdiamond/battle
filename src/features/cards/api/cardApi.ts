import type {
  ApiCard,
  ApiCardListParams,
  ApiPaginatedResponse,
  CreateCardInput,
  UpdateCardInput,
} from "./types";

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
 * Card API - REST calls to json-server
 */
export const cardApi = {
  /**
   * Get all cards (without pagination)
   */
  async getAll(): Promise<ApiCard[]> {
    const response = await fetch(`${API_BASE_URL}/cards`);
    return handleResponse<ApiCard[]>(response);
  },

  /**
   * Get a single card by ID
   */
  async getById(id: string): Promise<ApiCard | null> {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`);
    if (response.status === 404) {
      return null;
    }
    return handleResponse<ApiCard>(response);
  },

  /**
   * Get paginated cards with search and sort
   * json-server supports: _page, _limit, _sort, _order, q (full-text search)
   */
  async getPaginated(params: ApiCardListParams): Promise<ApiPaginatedResponse> {
    const {
      search = "",
      sortBy = "name",
      sortOrder = "asc",
      page = 1,
      pageSize = 10,
    } = params;

    const queryParams = new URLSearchParams();

    // Pagination
    queryParams.set("_page", String(page));
    queryParams.set("_limit", String(pageSize));

    // Sorting
    queryParams.set("_sort", sortBy);
    queryParams.set("_order", sortOrder);

    // Search (json-server uses 'q' for full-text search, or 'name_like' for partial match)
    if (search.trim()) {
      queryParams.set("name_like", search.trim());
    }

    const response = await fetch(
      `${API_BASE_URL}/cards?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const cards = await response.json();

    // json-server returns total count in X-Total-Count header
    const totalHeader = response.headers.get("X-Total-Count");
    const total = totalHeader ? parseInt(totalHeader, 10) : cards.length;

    return { cards, total };
  },

  /**
   * Create a new card
   */
  async create(input: CreateCardInput): Promise<ApiCard> {
    const now = Date.now();
    const newCard = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newCard),
    });

    return handleResponse<ApiCard>(response);
  },

  /**
   * Create a new card with a pre-generated ID
   * Used for syncing between API and IndexedDB with consistent IDs
   */
  async createWithId(cardData: ApiCard): Promise<ApiCard> {
    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cardData),
    });

    return handleResponse<ApiCard>(response);
  },

  /**
   * Create or update a card (upsert)
   * If card with same ID exists, it will be updated
   * Used for syncing to avoid duplicate entries
   */
  async upsert(cardData: ApiCard): Promise<ApiCard> {
    // Check if card already exists
    const existing = await cardApi.getById(cardData.id);
    if (existing) {
      // Update existing card
      const response = await fetch(`${API_BASE_URL}/cards/${cardData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
      });
      return handleResponse<ApiCard>(response);
    } else {
      // Create new card
      return cardApi.createWithId(cardData);
    }
  },

  /**
   * Update an existing card
   */
  async update(id: string, input: UpdateCardInput): Promise<ApiCard> {
    // First get the existing card to preserve createdAt
    const existing = await cardApi.getById(id);
    if (!existing) {
      throw new Error(`Card with id ${id} not found`);
    }

    const updatedCard = {
      ...existing,
      ...input,
      updatedAt: Date.now(),
    };

    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedCard),
    });

    return handleResponse<ApiCard>(response);
  },

  /**
   * Delete a card by ID
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
  },
};
