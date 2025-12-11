// API types for json-server

// Card as stored in json-server (without runtime imageUrl)
export interface ApiCard {
  id: string;
  name: string;
  atk: number;
  hp: number;
  imagePath: string | null; // Reference to OPFS file
  createdAt: number;
  updatedAt: number;
}

// Input for creating a card via API (without image - handled separately via OPFS)
export interface CreateCardInput {
  name: string;
  atk: number;
  hp: number;
  imagePath: string | null;
}

// Input for updating a card via API
export interface UpdateCardInput {
  name: string;
  atk: number;
  hp: number;
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
