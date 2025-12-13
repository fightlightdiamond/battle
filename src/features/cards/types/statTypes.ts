// ============================================================================
// DERIVED TYPES FROM STAT REGISTRY
// ============================================================================

import { STAT_REGISTRY } from "./statConfig";

/**
 * Union type of all stat keys from the registry
 * Automatically updates when stats are added/removed from STAT_REGISTRY
 */
export type StatKey = (typeof STAT_REGISTRY)[number]["key"];

/**
 * Type mapping all stat keys to number values
 * Used as the base for card stats
 */
export type CardStats = {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  critChance: number;
  critDamage: number;
  armorPen: number;
  lifesteal: number;
};

/**
 * Card entity stored in IndexedDB
 * Includes all stat fields from CardStats plus metadata
 */
export interface Card extends CardStats {
  id: string;
  name: string;
  imagePath: string | null;
  imageUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Form input for creating/editing cards
 * Stats are optional - defaults will be applied by CardService
 */
export type CardFormInput = {
  name: string;
  image: File | null;
} & Partial<CardStats>;

/**
 * Type alias for stat names (same as StatKey)
 * Provided for backward compatibility
 */
export type StatName = StatKey;
