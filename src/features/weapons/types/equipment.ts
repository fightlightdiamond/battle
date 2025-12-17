// ============================================================================
// EQUIPMENT TYPES
// ============================================================================

import type { CardStats } from "../../cards/types/statTypes";

/**
 * Card-Weapon equipment relationship
 * Represents the association between a card and its equipped weapon
 */
export interface CardEquipment {
  cardId: string;
  weaponId: string | null;
  equippedAt: number | null;
}

/**
 * Effective stats after applying weapon bonuses
 * Combines card base stats with weapon offensive stats
 */
export type EffectiveCardStats = CardStats;

/**
 * Helper type for stats that can be modified by weapons
 * These are the offensive stats that weapons provide bonuses for
 */
export type WeaponBonusStats = Pick<
  CardStats,
  "atk" | "critChance" | "critDamage" | "armorPen" | "lifesteal"
>;
