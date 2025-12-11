import type { CardListParams } from "../types";

// Query keys for cache management
export const cardKeys = {
  all: ["cards"] as const,
  lists: () => [...cardKeys.all, "list"] as const,
  list: (params: CardListParams) => [...cardKeys.lists(), params] as const,
  details: () => [...cardKeys.all, "detail"] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
};
