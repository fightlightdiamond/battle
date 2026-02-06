/**
 * Sentence Service - CRUD operations for sentences
 * Uses json-server API
 */

import type {
  Sentence,
  SentenceFormInput,
  SentenceFilters,
  PaginatedSentences,
} from "../types";

const API_BASE = "http://localhost:3001";

/**
 * Generate a UUID v4
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * SentenceService - CRUD operations for matching game sentences
 */
export const SentenceService = {
  /**
   * Get all sentences with optional filters
   */
  async getAll(filters?: SentenceFilters): Promise<Sentence[]> {
    const params = new URLSearchParams();

    if (filters?.gameTemplateId) {
      params.append("gameTemplateId", filters.gameTemplateId);
    }
    if (filters?.difficulty) {
      params.append("difficulty", filters.difficulty);
    }
    if (filters?.category) {
      params.append("category", filters.category);
    }
    if (filters?.search) {
      params.append("q", filters.search);
    }

    const url = `${API_BASE}/sentences${params.toString() ? `?${params}` : ""}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch sentences");
    }

    return response.json();
  },

  /**
   * Get paginated sentences
   */
  async getPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: SentenceFilters,
  ): Promise<PaginatedSentences> {
    const params = new URLSearchParams({
      _page: page.toString(),
      _limit: limit.toString(),
    });

    if (filters?.gameTemplateId) {
      params.append("gameTemplateId", filters.gameTemplateId);
    }
    if (filters?.difficulty) {
      params.append("difficulty", filters.difficulty);
    }
    if (filters?.category) {
      params.append("category", filters.category);
    }
    if (filters?.search) {
      params.append("q", filters.search);
    }

    const url = `${API_BASE}/sentences?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch sentences");
    }

    const total = parseInt(response.headers.get("X-Total-Count") || "0", 10);
    const data = await response.json();

    return { data, total, page, limit };
  },

  /**
   * Get a sentence by ID
   */
  async getById(id: string): Promise<Sentence | null> {
    const response = await fetch(`${API_BASE}/sentences/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch sentence");
    }

    return response.json();
  },

  /**
   * Create a new sentence
   */
  async create(input: SentenceFormInput): Promise<Sentence> {
    const now = Date.now();
    const sentence = {
      id: generateId(),
      gameTemplateId: input.gameTemplateId ?? "",
      english: input.english,
      vietnamese: input.vietnamese,
      difficulty: input.difficulty,
      category: input.category,
      createdAt: now,
      updatedAt: now,
    };

    const response = await fetch(`${API_BASE}/sentences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sentence),
    });

    if (!response.ok) {
      throw new Error("Failed to create sentence");
    }

    return response.json();
  },

  /**
   * Update an existing sentence
   */
  async update(
    id: string,
    input: Partial<SentenceFormInput>,
  ): Promise<Sentence> {
    const response = await fetch(`${API_BASE}/sentences/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        updatedAt: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update sentence");
    }

    return response.json();
  },

  /**
   * Delete a sentence
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/sentences/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete sentence");
    }
  },

  /**
   * Get random sentences for a game round
   */
  async getRandomForGame(
    count: number,
    difficulty?: "easy" | "medium" | "hard" | "mixed",
  ): Promise<Sentence[]> {
    const filters: SentenceFilters = {};
    if (difficulty && difficulty !== "mixed") {
      filters.difficulty = difficulty;
    }

    const allSentences = await this.getAll(filters);

    // Shuffle and pick random sentences
    const shuffled = [...allSentences].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  },

  /**
   * Bulk create sentences (for seeding)
   */
  async bulkCreate(inputs: SentenceFormInput[]): Promise<Sentence[]> {
    const results: Sentence[] = [];
    for (const input of inputs) {
      const sentence = await this.create(input);
      results.push(sentence);
    }
    return results;
  },
};
