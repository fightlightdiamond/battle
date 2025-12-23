import type { CardGemEquipment } from "../types/equipment";
import { MAX_GEM_SLOTS } from "../types/equipment";

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
 * GemEquipmentService - Manages card-gem equipment relationships
 *
 * Requirements:
 * - 2.1: Equip gem to card if fewer than 3 gems are equipped
 * - 2.2: Reject equipping 4th gem with error message
 * - 2.3: Unequip gem from card
 * - 1.4: Unequip gem from all cards when gem is deleted
 */
export const GemEquipmentService = {
  /**
   * Get all card gem equipment records
   */
  async getAll(): Promise<CardGemEquipment[]> {
    const response = await fetch(`${API_BASE_URL}/cardGemEquipments`);
    return handleResponse<CardGemEquipment[]>(response);
  },

  /**
   * Get equipped gems for a specific card
   * Returns null if no equipment record exists
   */
  async getCardGems(cardId: string): Promise<CardGemEquipment | null> {
    const response = await fetch(
      `${API_BASE_URL}/cardGemEquipments?cardId=${encodeURIComponent(cardId)}`,
    );
    const results = await handleResponse<CardGemEquipment[]>(response);
    return results.length > 0 ? results[0] : null;
  },

  /**
   * Equip a gem to a card
   * Validates that the card has fewer than MAX_GEM_SLOTS gems equipped
   * Prevents duplicate gem equipping
   *
   * Requirements: 2.1, 2.2
   *
   * @throws Error if card already has MAX_GEM_SLOTS gems equipped
   * @throws Error if gem is already equipped to this card
   */
  async equipGem(cardId: string, gemId: string): Promise<CardGemEquipment> {
    // Get existing equipment for this card
    const existing = await this.getCardGems(cardId);

    if (existing) {
      // Check if gem is already equipped
      if (existing.gemIds.includes(gemId)) {
        throw new Error(`Gem ${gemId} is already equipped to card ${cardId}`);
      }

      // Check slot limit (Requirement 2.2)
      if (existing.gemIds.length >= MAX_GEM_SLOTS) {
        throw new Error(
          `Cannot equip gem: card ${cardId} already has ${MAX_GEM_SLOTS} gems equipped`,
        );
      }

      // Update existing record with new gem
      const updatedEquipment: CardGemEquipment = {
        ...existing,
        gemIds: [...existing.gemIds, gemId],
      };

      const response = await fetch(
        `${API_BASE_URL}/cardGemEquipments/${existing.cardId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedEquipment),
        },
      );

      return handleResponse<CardGemEquipment>(response);
    }

    // Create new equipment record
    const newEquipment: CardGemEquipment = {
      cardId,
      gemIds: [gemId],
    };

    const response = await fetch(`${API_BASE_URL}/cardGemEquipments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEquipment),
    });

    return handleResponse<CardGemEquipment>(response);
  },

  /**
   * Unequip a gem from a card
   * Idempotent - returns success even if gem was not equipped
   *
   * Requirement: 2.3
   */
  async unequipGem(cardId: string, gemId: string): Promise<CardGemEquipment> {
    const existing = await this.getCardGems(cardId);

    if (!existing) {
      // No equipment record exists, return empty equipment
      return { cardId, gemIds: [] };
    }

    // Remove the gem from the list
    const updatedGemIds = existing.gemIds.filter((id) => id !== gemId);

    const updatedEquipment: CardGemEquipment = {
      ...existing,
      gemIds: updatedGemIds,
    };

    const response = await fetch(
      `${API_BASE_URL}/cardGemEquipments/${existing.cardId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEquipment),
      },
    );

    return handleResponse<CardGemEquipment>(response);
  },

  /**
   * Unequip a gem from all cards
   * Used when a gem is deleted to maintain data integrity
   *
   * Requirement: 1.4
   */
  async unequipAllByGemId(gemId: string): Promise<void> {
    const allEquipments = await this.getAll();

    // Find all cards that have this gem equipped
    const affectedEquipments = allEquipments.filter((eq) =>
      eq.gemIds.includes(gemId),
    );

    // Update each affected card's equipment
    await Promise.all(
      affectedEquipments.map(async (equipment) => {
        const updatedGemIds = equipment.gemIds.filter((id) => id !== gemId);
        const updatedEquipment: CardGemEquipment = {
          ...equipment,
          gemIds: updatedGemIds,
        };

        await fetch(`${API_BASE_URL}/cardGemEquipments/${equipment.cardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedEquipment),
        });
      }),
    );
  },

  /**
   * Delete equipment record for a card
   * Used when a card is deleted
   */
  async deleteCardEquipment(cardId: string): Promise<void> {
    const existing = await this.getCardGems(cardId);
    if (!existing) {
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/cardGemEquipments/${cardId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
  },

  /**
   * Clear all equipment records (useful for testing)
   */
  async clear(): Promise<void> {
    const allEquipments = await this.getAll();
    await Promise.all(
      allEquipments.map((eq) => this.deleteCardEquipment(eq.cardId)),
    );
  },
};
