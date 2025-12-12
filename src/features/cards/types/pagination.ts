import type { Card } from "./card";

// ============================================
// Sort field constants
// ============================================

/** Available fields for sorting cards */
export const SORT_FIELDS = {
  NAME: "name",
  ATK: "atk",
  HP: "hp",
} as const;

export type SortField = (typeof SORT_FIELDS)[keyof typeof SORT_FIELDS];

// ============================================
// Sort order constants
// ============================================

/** Sort order options */
export const SORT_ORDERS = {
  ASC: "asc",
  DESC: "desc",
} as const;

export type SortOrder = (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

// ============================================
// Pagination constants
// ============================================

/** Default page size options */
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

/** Default page size */
export const DEFAULT_PAGE_SIZE = 10;

/** Default page number */
export const DEFAULT_PAGE = 1;

// ============================================
// Types
// ============================================

// Query params for card list
export interface CardListParams {
  search: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}

// Paginated response
export interface PaginatedCards {
  cards: Card[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
