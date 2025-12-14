/**
 * Query keys for bet history cache management
 *
 * Requirements: 5.4
 */

export interface BetHistoryListParams {
  page: number;
  limit: number;
}

export const betHistoryKeys = {
  all: ["betHistory"] as const,
  lists: () => [...betHistoryKeys.all, "list"] as const,
  list: (params: BetHistoryListParams) =>
    [...betHistoryKeys.lists(), params] as const,
  details: () => [...betHistoryKeys.all, "detail"] as const,
  detail: (id: string) => [...betHistoryKeys.details(), id] as const,
};
