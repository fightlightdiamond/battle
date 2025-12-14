/**
 * Query keys for battle history cache management
 *
 * Requirements: 3.1, 3.5
 */

export interface BattleHistoryListParams {
  page: number;
  limit: number;
}

export const battleHistoryKeys = {
  all: ["battleHistory"] as const,
  lists: () => [...battleHistoryKeys.all, "list"] as const,
  list: (params: BattleHistoryListParams) =>
    [...battleHistoryKeys.lists(), params] as const,
  details: () => [...battleHistoryKeys.all, "detail"] as const,
  detail: (id: string) => [...battleHistoryKeys.details(), id] as const,
};
