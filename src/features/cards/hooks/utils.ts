import type { ApiCard } from "../api/types";
import type { Card } from "../types";
import { getImageUrl } from "../services/imageStorage";

/**
 * Convert ApiCard to Card by loading image URL from OPFS
 */
export async function toCard(apiCard: ApiCard): Promise<Card> {
  const imageUrl = apiCard.imagePath
    ? await getImageUrl(apiCard.imagePath)
    : null;
  return {
    ...apiCard,
    imageUrl,
  };
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}
