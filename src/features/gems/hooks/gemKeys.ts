// Query keys for gem cache management
export const gemKeys = {
  all: ["gems"] as const,
  lists: () => [...gemKeys.all, "list"] as const,
  list: () => [...gemKeys.lists()] as const,
  details: () => [...gemKeys.all, "detail"] as const,
  detail: (id: string) => [...gemKeys.details(), id] as const,
};
