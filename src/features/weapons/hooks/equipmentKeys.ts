// Query keys for equipment cache management
export const equipmentKeys = {
  all: ["equipment"] as const,
  cards: () => [...equipmentKeys.all, "card"] as const,
  card: (cardId: string) => [...equipmentKeys.cards(), cardId] as const,
};
