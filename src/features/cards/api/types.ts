// API types for json-server
import type { CardStats } from "../types/statTypes";

// Card as stored in json-server (without runtime imageUrl)
// Uses CardStats for all stat fields to stay in sync with config
export interface ApiCard extends Partial<CardStats> {
  id: string;
  name: string;
  // hp and atk are required for backward compatibility
  hp: number;
  atk: number;
  imagePath: string | null; // Reference to OPFS file
  createdAt: number;
  updatedAt: number;
}

// Input for creating a card via API (without image - handled separately via OPFS)
// All stats are optional - defaults will be applied
export interface CreateCardInput extends Partial<CardStats> {
  name: string;
  hp: number;
  atk: number;
  imagePath: string | null;
}

// Input for updating a card via API
// All stats are optional - existing values will be preserved
export interface UpdateCardInput extends Partial<CardStats> {
  name: string;
  hp: number;
  atk: number;
  imagePath: string | null;
}

// Query params for fetching paginated cards from json-server
export interface ApiCardListParams {
  search?: string;
  sortBy?: "name" | "atk" | "hp";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

// json-server returns total count in headers, so we need to handle pagination manually
export interface ApiPaginatedResponse {
  cards: ApiCard[];
  total: number;
}
