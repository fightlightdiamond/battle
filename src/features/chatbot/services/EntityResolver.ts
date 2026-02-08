import Fuse, { type IFuseOptions } from "fuse.js";

/**
 * Fuse.js configuration for entity name matching
 * - threshold: 0.3 (lower = stricter, 0.3 means 70% similarity required)
 * - keys: ['name'] (search on the name property)
 * - includeScore: true (include match scores in results)
 */
export const FUSE_OPTIONS: IFuseOptions<{ name: string }> = {
  keys: ["name"],
  threshold: 0.3,
  includeScore: true,
  distance: 100,
  minMatchCharLength: 2,
};

/**
 * Result status for entity resolution
 */
export type ResolveStatus = "exact" | "fuzzy" | "multiple" | "none";

/**
 * Result of entity resolution with fuzzy matching
 */
export interface ResolveResult<T> {
  status: ResolveStatus;
  entity?: T;
  matches?: Array<{ entity: T; score: number }>;
  query: string;
}

/**
 * Entity with a name property (Card, Weapon, Gem, etc.)
 */
export interface NamedEntity {
  id: string;
  name: string;
}

/**
 * EntityResolver provides fuzzy matching for entity names using Fuse.js
 *
 * Resolution logic:
 * 1. Try exact match (case-insensitive)
 * 2. If no exact match, use Fuse.js fuzzy search
 * 3. If single match with score > 0.7, return as fuzzy match
 * 4. If multiple matches with score > 0.7, return as multiple
 * 5. If no matches > 0.7, return top 3 as suggestions
 */
export class EntityResolver<T extends NamedEntity> {
  private fuse: Fuse<T>;
  private entities: T[];

  constructor(entities: T[]) {
    this.entities = entities;
    this.fuse = new Fuse(entities, FUSE_OPTIONS);
  }

  /**
   * Resolve an entity by name with fuzzy matching
   * @param name - The entity name to search for
   * @returns ResolveResult with status and matched entity/entities
   */
  resolve(name: string): ResolveResult<T> {
    const normalizedQuery = name.trim().toLowerCase();

    // Step 1: Try exact match (case-insensitive)
    const exactMatch = this.entities.find(
      (entity) => entity.name.toLowerCase() === normalizedQuery,
    );

    if (exactMatch) {
      return {
        status: "exact",
        entity: exactMatch,
        query: name,
      };
    }

    // Step 2: Use Fuse.js fuzzy search
    const fuzzyResults = this.fuse.search(name);

    // Filter matches with score > 0.7 (Fuse scores are 0-1, lower is better)
    // So we want score < 0.3 (since threshold is 0.3)
    const goodMatches = fuzzyResults.filter(
      (result) => result.score !== undefined && result.score < 0.3,
    );

    // No good matches, return top 3 as suggestions (or all results if less than 3)
    if (goodMatches.length === 0) {
      const suggestions = fuzzyResults.slice(0, 3).map((result) => ({
        entity: result.item,
        score: result.score || 1,
      }));

      return {
        status: "none",
        matches: suggestions.length > 0 ? suggestions : undefined,
        query: name,
      };
    }

    // Single good match
    if (goodMatches.length === 1) {
      return {
        status: "fuzzy",
        entity: goodMatches[0].item,
        query: name,
      };
    }

    // Multiple good matches
    return {
      status: "multiple",
      matches: goodMatches.map((result) => ({
        entity: result.item,
        score: result.score || 0,
      })),
      query: name,
    };
  }

  /**
   * Update the entity list and rebuild the Fuse index
   * @param entities - New list of entities
   */
  updateEntities(entities: T[]): void {
    this.entities = entities;
    this.fuse = new Fuse(entities, FUSE_OPTIONS);
  }

  /**
   * Get all entities
   */
  getAll(): T[] {
    return this.entities;
  }
}
