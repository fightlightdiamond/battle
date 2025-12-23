// Query keys for gem equipment cache management
export const gemEquipmentKeys = {
  all: ["gemEquipments"] as const,
  lists: () => [...gemEquipmentKeys.all, "list"] as const,
  list: () => [...gemEquipmentKeys.lists()] as const,
  details: () => [...gemEquipmentKeys.all, "detail"] as const,
  detail: (cardId: string) => [...gemEquipmentKeys.details(), cardId] as const,
};
