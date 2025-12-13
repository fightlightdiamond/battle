// ============================================================================
// STAT CONSTANTS - Re-exported from statConfig.ts for backward compatibility
// ============================================================================

import { STAT_REGISTRY, getDefaultStats } from "./statConfig";
import type { StatKey } from "./statTypes";

/**
 * Default values for all card stats.
 * Now derived from STAT_REGISTRY for single source of truth.
 * @deprecated Use getDefaultStats() from statConfig.ts instead
 */
export const DEFAULT_STATS = getDefaultStats() as {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  critChance: number;
  critDamage: number;
  armorPen: number;
  lifesteal: number;
};

/**
 * Valid ranges for all card stats.
 * Now derived from STAT_REGISTRY for single source of truth.
 * @deprecated Use STAT_REGISTRY from statConfig.ts instead
 */
export const STAT_RANGES = STAT_REGISTRY.reduce((acc, stat) => {
  acc[stat.key as StatKey] = { min: stat.min, max: stat.max };
  return acc;
}, {} as Record<StatKey, { min: number; max: number }>);

/**
 * Type for stat names - now derived from StatKey
 * @deprecated Use StatKey from statTypes.ts instead
 */
export type StatName = StatKey;
