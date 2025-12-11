import { useCardStore } from "./cardStore";
import type { Card } from "../types";

/**
 * Hook to get a card by ID from store
 */
export function useCardById(id: string): Card | undefined {
  return useCardStore((s) => s.cards.find((card) => card.id === id));
}
