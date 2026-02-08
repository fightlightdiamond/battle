/**
 * Entity Cache Instances - Singleton instances for each entity type
 *
 * Provides cached entity resolvers for cards, weapons, and gems
 * with automatic refresh on stale data.
 */

import { EntityCache } from "./EntityCache";
import { CardService } from "@/features/cards/services/cardService";
import { WeaponService } from "@/features/weapons/services/weaponService";
import { GemService } from "@/features/gems/services/gemService";
import type { Card } from "@/features/cards/types/card";
import type { Weapon } from "@/features/weapons/types/weapon";
import type { Gem } from "@/features/gems/types/gem";

/**
 * Card cache instance (1 minute TTL)
 */
export const cardCache = new EntityCache<Card>(
  () => CardService.getAll(),
  60000,
);

/**
 * Weapon cache instance (1 minute TTL)
 */
export const weaponCache = new EntityCache<Weapon>(
  () => WeaponService.getAll(),
  60000,
);

/**
 * Gem cache instance (1 minute TTL)
 */
export const gemCache = new EntityCache<Gem>(() => GemService.getAll(), 60000);
