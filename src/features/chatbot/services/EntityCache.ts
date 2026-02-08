import { EntityResolver } from "./EntityResolver";
import type { NamedEntity } from "./EntityResolver";

/**
 * Entity cache with TTL (Time To Live) for performance optimization
 * Caches entity lists to reduce service calls
 */
export class EntityCache<T extends NamedEntity> {
  private resolver: EntityResolver<T> | null = null;
  private lastUpdated: number = 0;
  private readonly ttl: number;
  private readonly fetchFn: () => Promise<T[]>;

  /**
   * @param fetchFn - Function to fetch entities from service
   * @param ttl - Time to live in milliseconds (default: 60000 = 1 minute)
   */
  constructor(fetchFn: () => Promise<T[]>, ttl: number = 60000) {
    this.fetchFn = fetchFn;
    this.ttl = ttl;
  }

  /**
   * Check if the cache is stale and needs refresh
   */
  isStale(): boolean {
    return Date.now() - this.lastUpdated > this.ttl;
  }

  /**
   * Refresh the cache by fetching entities from the service
   */
  async refresh(): Promise<void> {
    const entities = await this.fetchFn();
    this.resolver = new EntityResolver(entities);
    this.lastUpdated = Date.now();
  }

  /**
   * Get the entity resolver, refreshing cache if stale
   */
  async getResolver(): Promise<EntityResolver<T>> {
    if (!this.resolver || this.isStale()) {
      await this.refresh();
    }
    return this.resolver!;
  }

  /**
   * Force clear the cache
   */
  clear(): void {
    this.resolver = null;
    this.lastUpdated = 0;
  }
}
