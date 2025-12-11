import { getDB } from "./db";
import type {
  Card,
  CardFormInput,
  CardListParams,
  PaginatedCards,
} from "../types";

// Type for stored card (without runtime imageUrl)
type StoredCard = Omit<Card, "imageUrl">;

/**
 * Generate a UUID v4
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Ensure a value is a proper Blob instance
 * This handles cases where IndexedDB may return a serialized object
 */
function ensureBlob(value: Blob | null | unknown): Blob | null {
  if (!value) return null;
  if (value instanceof Blob) return value;
  // Handle case where Blob was serialized (e.g., in fake-indexeddb)
  if (typeof value === "object" && value !== null) {
    const obj = value as { type?: string; size?: number };
    if ("type" in obj && "size" in obj) {
      // It's a Blob-like object, try to reconstruct
      return new Blob([], { type: obj.type || "application/octet-stream" });
    }
  }
  return null;
}

/**
 * Convert a stored card to a Card with imageUrl
 */
function toCard(stored: StoredCard): Card {
  const imageBlob = ensureBlob(stored.imageBlob);
  return {
    ...stored,
    imageBlob,
    imageUrl: imageBlob ? URL.createObjectURL(imageBlob) : null,
  };
}

/**
 * Revoke object URLs to prevent memory leaks
 */
export function revokeCardImageUrl(card: Card): void {
  if (card.imageUrl) {
    URL.revokeObjectURL(card.imageUrl);
  }
}

/**
 * Revoke object URLs for multiple cards
 */
export function revokeCardImageUrls(cards: Card[]): void {
  cards.forEach(revokeCardImageUrl);
}

/**
 * CardService - CRUD operations for cards in IndexedDB
 */
export const CardService = {
  /**
   * Get all cards from the database
   */
  async getAll(): Promise<Card[]> {
    const db = await getDB();
    const storedCards = await db.getAll("cards");
    return storedCards.map(toCard);
  },

  /**
   * Get a single card by ID
   */
  async getById(id: string): Promise<Card | null> {
    const db = await getDB();
    const stored = await db.get("cards", id);
    return stored ? toCard(stored) : null;
  },

  /**
   * Create a new card
   */
  async create(input: CardFormInput): Promise<Card> {
    const db = await getDB();
    const now = Date.now();

    const storedCard: StoredCard = {
      id: generateId(),
      name: input.name,
      atk: input.atk,
      hp: input.hp,
      imageBlob: input.image
        ? new Blob([input.image], { type: input.image.type })
        : null,
      createdAt: now,
      updatedAt: now,
    };

    await db.add("cards", storedCard);
    return toCard(storedCard);
  },

  /**
   * Update an existing card
   */
  async update(id: string, input: CardFormInput): Promise<Card | null> {
    const db = await getDB();
    const existing = await db.get("cards", id);

    if (!existing) {
      return null;
    }

    const now = Date.now();
    const updatedCard: StoredCard = {
      ...existing,
      name: input.name,
      atk: input.atk,
      hp: input.hp,
      imageBlob: input.image
        ? new Blob([input.image], { type: input.image.type })
        : existing.imageBlob,
      updatedAt: now,
    };

    await db.put("cards", updatedCard);
    return toCard(updatedCard);
  },

  /**
   * Delete a card by ID
   */
  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get("cards", id);

    if (!existing) {
      return false;
    }

    await db.delete("cards", id);
    return true;
  },

  /**
   * Get paginated cards with search, sort, and pagination support
   */
  async getPaginated(params: CardListParams): Promise<PaginatedCards> {
    const { search, sortBy, sortOrder, page, pageSize } = params;
    const db = await getDB();

    // Get all cards
    let cards = await db.getAll("cards");

    // Filter by search term (case-insensitive)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      cards = cards.filter((card) =>
        card.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort cards
    cards.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "atk":
          comparison = a.atk - b.atk;
          break;
        case "hp":
          comparison = a.hp - b.hp;
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Calculate pagination
    const total = cards.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const validPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (validPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Get page slice and convert to Card with imageUrl
    const pageCards = cards.slice(startIndex, endIndex).map(toCard);

    return {
      cards: pageCards,
      total,
      page: validPage,
      pageSize,
      totalPages,
    };
  },

  /**
   * Clear all cards from the database (useful for testing)
   */
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear("cards");
  },
};
