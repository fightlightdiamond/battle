/**
 * Game Template Service - CRUD operations for game templates
 * Uses json-server API
 */

import type { GameTemplate, GameTemplateFormInput } from "../types";

const API_BASE = "http://localhost:3001";

/**
 * Generate a UUID v4
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * GameTemplateService - CRUD operations for matching game templates
 */
export const GameTemplateService = {
  /**
   * Get all game templates
   */
  async getAll(onlyActive?: boolean): Promise<GameTemplate[]> {
    const params = new URLSearchParams();

    if (onlyActive) {
      params.append("isActive", "true");
    }

    const url = `${API_BASE}/gameTemplates${params.toString() ? `?${params}` : ""}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch game templates");
    }

    return response.json();
  },

  /**
   * Get a game template by ID
   */
  async getById(id: string): Promise<GameTemplate | null> {
    const response = await fetch(`${API_BASE}/gameTemplates/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch game template");
    }

    return response.json();
  },

  /**
   * Create a new game template
   */
  async create(input: GameTemplateFormInput): Promise<GameTemplate> {
    const now = Date.now();
    const gameTemplate: GameTemplate = {
      id: generateId(),
      name: input.name,
      description: input.description,
      coverImage: input.coverImage,
      config: input.config,
      isActive: input.isActive,
      createdAt: now,
      updatedAt: now,
    };

    const response = await fetch(`${API_BASE}/gameTemplates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameTemplate),
    });

    if (!response.ok) {
      throw new Error("Failed to create game template");
    }

    return response.json();
  },

  /**
   * Update an existing game template
   */
  async update(
    id: string,
    input: Partial<GameTemplateFormInput>,
  ): Promise<GameTemplate> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Game template not found");
    }

    const updated: GameTemplate = {
      ...existing,
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.coverImage !== undefined && { coverImage: input.coverImage }),
      ...(input.config !== undefined && { config: input.config }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      updatedAt: Date.now(),
    };

    const response = await fetch(`${API_BASE}/gameTemplates/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updated),
    });

    if (!response.ok) {
      throw new Error("Failed to update game template");
    }

    return response.json();
  },

  /**
   * Delete a game template
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/gameTemplates/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete game template");
    }
  },

  /**
   * Toggle game template active status
   */
  async toggleActive(id: string): Promise<GameTemplate> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Game template not found");
    }

    return this.update(id, { isActive: !existing.isActive });
  },

  /**
   * Get sentence count for a game template
   */
  async getSentenceCount(gameTemplateId: string): Promise<number> {
    const response = await fetch(
      `${API_BASE}/sentences?gameTemplateId=${gameTemplateId}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch sentence count");
    }

    const sentences = await response.json();
    return sentences.length;
  },
};
