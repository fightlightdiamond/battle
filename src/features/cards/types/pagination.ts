import type { Card } from "./card";

// Query params for card list
export interface CardListParams {
  search: string;
  sortBy: "name" | "atk" | "hp";
  sortOrder: "asc" | "desc";
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
