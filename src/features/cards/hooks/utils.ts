import type { ApiCard } from "../api/types";
import type { Card } from "../types";
import { getImageUrl } from "../services/imageStorage";
import { DEFAULT_STATS } from "../types/constants";

/**
 * Convert ApiCard to Card by loading image URL from OPFS
 * Applies default values for any missing stats
 */
export async function toCard(apiCard: ApiCard): Promise<Card> {
  const imageUrl = apiCard.imagePath
    ? await getImageUrl(apiCard.imagePath)
    : null;
  return {
    id: apiCard.id,
    name: apiCard.name,
    imagePath: apiCard.imagePath,
    imageUrl,
    createdAt: apiCard.createdAt,
    updatedAt: apiCard.updatedAt,
    // Apply defaults for all stats
    hp: apiCard.hp,
    atk: apiCard.atk,
    def: apiCard.def ?? DEFAULT_STATS.def,
    spd: apiCard.spd ?? DEFAULT_STATS.spd,
    critChance: apiCard.critChance ?? DEFAULT_STATS.critChance,
    critDamage: apiCard.critDamage ?? DEFAULT_STATS.critDamage,
    armorPen: apiCard.armorPen ?? DEFAULT_STATS.armorPen,
    lifesteal: apiCard.lifesteal ?? DEFAULT_STATS.lifesteal,
  };
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}
