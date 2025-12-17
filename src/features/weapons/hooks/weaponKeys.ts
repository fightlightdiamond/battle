// Query keys for weapon cache management
export const weaponKeys = {
  all: ["weapons"] as const,
  lists: () => [...weaponKeys.all, "list"] as const,
  list: () => [...weaponKeys.lists()] as const,
  details: () => [...weaponKeys.all, "detail"] as const,
  detail: (id: string) => [...weaponKeys.details(), id] as const,
};
