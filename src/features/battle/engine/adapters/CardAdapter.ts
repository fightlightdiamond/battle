/**
 * Card to Combatant Adapter
 * Converts Card entities to Combatant entities for the battle engine
 * Requirements: 1.1, 7.1-7.6
 */

import type { Card } from "../../../cards/types";
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
 * Convert a Card to a Combatant for the battle engine
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
  };
}
