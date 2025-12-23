// ============================================================================
// GEM EQUIPMENT TYPES
// ============================================================================

import type { Gem } from "./gem";

/**
 * Maximum number of gems that can be equipped on a single card
 */
export const MAX_GEM_SLOTS = 3;

/**
 * Card gem equipment relationship
 * Represents the association between a card and its equipped gems
 */
export interface CardGemEquipment {
  cardId: string;
  gemIds: string[]; // Max 3 gems
}

/**
 * Equipped gem with runtime state during battle
 * Tracks cooldown status for each equipped gem
 */
export interface EquippedGemState {
  gem: Gem;
  currentCooldown: number; // Remaining cooldown turns (0 = ready)
}

/**
 * Card with equipped gems in battle context
 * Contains all gem states for a card during battle
 */
export interface BattleCardGems {
  cardId: string;
  equippedGems: EquippedGemState[];
}
