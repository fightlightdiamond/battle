import { getDB } from "./db";
import { saveImage, deleteImage, getImageUrl } from "./imageStorage";
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
 * Convert a stored card to a Card with imageUrl
 */
async function toCard(stored: StoredCard): Promise<Card> {
  const imageUrl = stored.imagePath
    ? await getImageUrl(stored.imagePath)
    : null;
  return {
    ...stored,
    imageUrl,
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
 * Images are stored separately in OPFS
 */
export const CardService = {
  /**
   * Get all cards from the database
   */
  async getAll(): Promise<Card[]> {
    const db = await getDB();
    const storedCards = await db.getAll("cards");
    return Promise.all(storedCards.map(toCard));
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
    const id = generateId();

    // Save image to OPFS if provided
    let imagePath: string | null = null;
    if (input.image) {
      imagePath = await saveImage(id, input.image);
    }

    const storedCard: StoredCard = {
      id,
      name: input.name,
      atk: input.atk,
      hp: input.hp,
      imagePath,
      createdAt: now,
      updatedAt: now,
    };

    await db.add("cards", storedCard);
    return toCard(storedCard);
  },

  /**
   * Create a new card with a pre-generated ID
   * Used for syncing between API and IndexedDB with consistent IDs
   */
  async createWithId(cardData: StoredCard): Promise<Card> {
    const db = await getDB();
    await db.add("cards", cardData);
    return toCard(cardData);
  },

  /**
   * Create or update a card (upsert)
   * If card with same ID exists, it will be replaced
   * Used for syncing to avoid duplicate key errors
   */
  async upsert(cardData: StoredCard): Promise<Card> {
    const db = await getDB();
    await db.put("cards", cardData);
    return toCard(cardData);
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
    let imagePath = existing.imagePath;

    // Handle image update
    if (input.image) {
      // Delete old image if exists
      if (existing.imagePath) {
        await deleteImage(existing.imagePath);
      }
      // Save new image
      imagePath = await saveImage(id, input.image);
    }

    const updatedCard: StoredCard = {
      ...existing,
      name: input.name,
      atk: input.atk,
      hp: input.hp,
      imagePath,
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

    // Delete image from OPFS if exists
    if (existing.imagePath) {
      await deleteImage(existing.imagePath);
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
    const pageCards = await Promise.all(
      cards.slice(startIndex, endIndex).map(toCard)
    );

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

    // Delete all images from OPFS
    const cards = await db.getAll("cards");
    await Promise.all(
      cards
        .filter((card) => card.imagePath)
        .map((card) => deleteImage(card.imagePath!))
    );

    await db.clear("cards");
  },
};
