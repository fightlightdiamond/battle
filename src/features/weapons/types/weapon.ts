// ============================================================================
// WEAPON TYPES
// ============================================================================

/**
 * Offensive stats that weapons can provide
 */
export interface WeaponStats {
  atk: number; // Attack bonus (0-9999)
  critChance: number; // Crit chance bonus (0-100)
  critDamage: number; // Crit damage bonus (0-500)
  armorPen: number; // Armor penetration bonus (0-100)
  lifesteal: number; // Lifesteal bonus (0-100)
  attackRange: number; // Attack range bonus (0-6)
}

/**
 * Weapon entity stored in IndexedDB
 */
export interface Weapon extends WeaponStats {
  id: string;
  name: string;
  imagePath: string | null;
  imageUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Form input for creating/editing weapons
 * Stats are optional - defaults will be applied by WeaponService
 */
export interface WeaponFormInput {
  name: string;
  image: File | null;
  atk?: number;
  critChance?: number;
  critDamage?: number;
  armorPen?: number;
  lifesteal?: number;
  attackRange?: number;
}

/**
 * Default weapon stats - all offensive stats start at 0
 */
export const DEFAULT_WEAPON_STATS: WeaponStats = {
  atk: 0,
  critChance: 0,
  critDamage: 0,
  armorPen: 0,
  lifesteal: 0,
  attackRange: 0,
};

/**
 * Stat ranges for weapon validation
 */
export const WEAPON_STAT_RANGES = {
  atk: { min: 0, max: 9999 },
  critChance: { min: 0, max: 100 },
  critDamage: { min: 0, max: 500 },
  armorPen: { min: 0, max: 100 },
  lifesteal: { min: 0, max: 100 },
  attackRange: { min: 0, max: 6 },
} as const;

/**
 * Type for weapon stat keys
 */
export type WeaponStatKey = keyof WeaponStats;

/**
 * Helper to apply default stats to partial weapon stats
 * Filters out undefined values to ensure defaults are applied correctly
 */
export function applyDefaultWeaponStats(
  partial?: Partial<WeaponStats>,
): WeaponStats {
  if (!partial) {
    return { ...DEFAULT_WEAPON_STATS };
  }

  // Filter out undefined values so defaults are applied
  const definedStats: Partial<WeaponStats> = {};
  for (const key of Object.keys(partial) as (keyof WeaponStats)[]) {
    if (partial[key] !== undefined) {
      definedStats[key] = partial[key];
    }
  }

  return {
    ...DEFAULT_WEAPON_STATS,
    ...definedStats,
  };
}
