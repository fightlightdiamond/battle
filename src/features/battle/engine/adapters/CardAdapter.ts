/**
 * Card to Combatant Adapter
 * Converts Card entities to Combatant entities for the battle engine
 * Requirements: 1.1, 7.1-7.6, 4.1-4.6 (weapon bonuses), 2.2 (effective range)
 */

import type { Card } from "../../../cards/types";
import type { Weapon } from "../../../weapons/types/weapon";
import type { EffectiveCardStats } from "../../../weapons/types/equipment";
import {
  calculateEffectiveStats,
  calculateEffectiveRange,
  DEFAULT_ATTACK_RANGE,
} from "../../../weapons/services/equipmentService";
import type { Combatant, CombatantStats } from "../core/types";

/**
 * Convert Card stats to CombatantStats
 */
export function cardToCombatantStats(card: Card): CombatantStats {
  return {
    atk: card.atk,
    def: card.def,
    spd: card.spd,
    critChance: card.critChance,
    critDamage: card.critDamage,
    armorPen: card.armorPen,
    lifesteal: card.lifesteal,
  };
}

/**
 * Convert EffectiveCardStats to CombatantStats
 */
export function effectiveStatsToCombatantStats(
  stats: EffectiveCardStats,
): CombatantStats {
  return {
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    critChance: stats.critChance,
    critDamage: stats.critDamage,
    armorPen: stats.armorPen,
    lifesteal: stats.lifesteal,
  };
}

/**
 * Convert a Card to a Combatant for the battle engine
 * Uses default attack range (1) when no weapon is equipped
 *
 * Requirements: 2.1 - Default attack range of 1 without weapon
 */
export function cardToCombatant(card: Card): Combatant {
  return {
    id: card.id,
    name: card.name,
    imageUrl: card.imageUrl,
    baseStats: cardToCombatantStats(card),
    currentHp: card.hp,
    maxHp: card.hp,
    buffs: [],
    isDefeated: false,
    effectiveRange: DEFAULT_ATTACK_RANGE,
  };
}

/**
 * Convert a Card with equipped Weapon to a Combatant for the battle engine
 * Calculates effective stats by adding weapon bonuses to card base stats
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 2.2
 * - 4.1: Calculate effective stats by adding weapon stats to card base stats
 * - 4.2: Use effective ATK value (card ATK + weapon ATK)
 * - 4.3: Use effective Crit Chance (card Crit Chance + weapon Crit Chance)
 * - 4.4: Use effective Crit Damage (card Crit Damage + weapon Crit Damage)
 * - 4.5: Use effective Armor Pen (card Armor Pen + weapon Armor Pen)
 * - 4.6: Use effective Lifesteal (card Lifesteal + weapon Lifesteal)
 * - 2.2: Calculate effective range as default range (1) + weapon attack range bonus
 */
export function cardToCombatantWithWeapon(
  card: Card,
  weapon: Weapon | null,
): Combatant {
  const effectiveStats = calculateEffectiveStats(card, weapon);
  const effectiveRange = calculateEffectiveRange(weapon);

  return {
    id: card.id,
    name: card.name,
    imageUrl: card.imageUrl,
    baseStats: effectiveStatsToCombatantStats(effectiveStats),
    currentHp: effectiveStats.hp,
    maxHp: effectiveStats.hp,
    buffs: [],
    isDefeated: false,
    effectiveRange,
  };
}
