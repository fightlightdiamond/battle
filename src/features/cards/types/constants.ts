// ============================================================================
// STAT CONSTANTS
// ============================================================================

/**
 * Default values for all card stats.
 * Used when creating new cards or migrating old cards without new stat fields.
 */
export const DEFAULT_STATS = {
  // Core Stats (Tier 1)
  hp: 1000,
  atk: 100,
  def: 50,
  spd: 100,

  // Combat Stats (Tier 2)
  critChance: 5, // 5%
  critDamage: 150, // 150% = 1.5x multiplier
  armorPen: 0, // 0%
  lifesteal: 0, // 0%
} as const;

/**
 * Valid ranges for all card stats.
 * Used for validation in schemas and forms.
 */
export const STAT_RANGES = {
  hp: { min: 1, max: Infinity },
  atk: { min: 0, max: Infinity },
  def: { min: 0, max: Infinity },
  spd: { min: 1, max: Infinity },
  critChance: { min: 0, max: 100 },
  critDamage: { min: 100, max: Infinity },
  armorPen: { min: 0, max: 100 },
  lifesteal: { min: 0, max: 100 },
} as const;

// Type for stat names
export type StatName = keyof typeof DEFAULT_STATS;
