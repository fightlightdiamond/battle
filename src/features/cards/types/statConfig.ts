// ============================================================================
// STAT CONFIGURATION - Single Source of Truth
// ============================================================================

/**
 * Format types for stat display
 */
export type StatFormat = "number" | "percentage";

/**
 * Tier categories for grouping stats
 */
export type StatTier = "core" | "combat";

/**
 * Complete definition for a single stat
 */
export interface StatDefinition {
  /** Unique identifier (e.g., 'hp', 'critChance') */
  key: string;
  /** Full display label (e.g., 'HP (Hit Points)') */
  label: string;
  /** Short label for compact view (e.g., 'HP') */
  shortLabel: string;
  /** Grouping tier */
  tier: StatTier;
  /** Default value for new cards */
  defaultValue: number;
  /** Minimum allowed value */
  min: number;
  /** Maximum allowed value (Infinity for unlimited) */
  max: number;
  /** How to format the value */
  format: StatFormat;
  /** Number of decimal places */
  decimalPlaces: number;
  /** Lucide icon name */
  icon: string;
  /** Show in compact card view */
  showInCompact: boolean;
  /** Order within tier */
  displayOrder: number;
}

/**
 * Tier configuration for labels and ordering
 */
export const TIER_CONFIG = {
  core: { label: "Core Stats", order: 1 },
  combat: { label: "Combat Stats", order: 2 },
} as const;

/**
 * The Stat Registry - Single source of truth for all card stats
 */
export const STAT_REGISTRY: readonly StatDefinition[] = [
  // Core Stats (Tier 1)
  {
    key: "hp",
    label: "HP (Hit Points)",
    shortLabel: "HP",
    tier: "core",
    defaultValue: 1000,
    min: 1,
    max: Infinity,
    format: "number",
    decimalPlaces: 0,
    icon: "Heart",
    showInCompact: true,
    displayOrder: 1,
  },
  {
    key: "atk",
    label: "ATK (Attack)",
    shortLabel: "ATK",
    tier: "core",
    defaultValue: 100,
    min: 0,
    max: Infinity,
    format: "number",
    decimalPlaces: 0,
    icon: "Sword",
    showInCompact: true,
    displayOrder: 2,
  },
  {
    key: "def",
    label: "DEF (Defense)",
    shortLabel: "DEF",
    tier: "core",
    defaultValue: 50,
    min: 0,
    max: Infinity,
    format: "number",
    decimalPlaces: 0,
    icon: "Shield",
    showInCompact: true,
    displayOrder: 3,
  },
  {
    key: "spd",
    label: "SPD (Speed)",
    shortLabel: "SPD",
    tier: "core",
    defaultValue: 100,
    min: 1,
    max: Infinity,
    format: "number",
    decimalPlaces: 0,
    icon: "Zap",
    showInCompact: true,
    displayOrder: 4,
  },
  // Combat Stats (Tier 2)
  {
    key: "critChance",
    label: "Crit Chance",
    shortLabel: "Crit%",
    tier: "combat",
    defaultValue: 5,
    min: 0,
    max: 100,
    format: "percentage",
    decimalPlaces: 1,
    icon: "Target",
    showInCompact: true,
    displayOrder: 1,
  },
  {
    key: "critDamage",
    label: "Crit Damage",
    shortLabel: "CritDmg",
    tier: "combat",
    defaultValue: 150,
    min: 100,
    max: Infinity,
    format: "percentage",
    decimalPlaces: 0,
    icon: "Flame",
    showInCompact: true,
    displayOrder: 2,
  },
  {
    key: "armorPen",
    label: "Armor Penetration",
    shortLabel: "ArPen",
    tier: "combat",
    defaultValue: 0,
    min: 0,
    max: 100,
    format: "percentage",
    decimalPlaces: 1,
    icon: "Crosshair",
    showInCompact: true,
    displayOrder: 3,
  },
  {
    key: "lifesteal",
    label: "Lifesteal",
    shortLabel: "LS",
    tier: "combat",
    defaultValue: 0,
    min: 0,
    max: 100,
    format: "percentage",
    decimalPlaces: 1,
    icon: "HeartPulse",
    showInCompact: true,
    displayOrder: 4,
  },
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get stats grouped by tier, sorted by displayOrder
 */
export function getStatsByTier(): Record<StatTier, StatDefinition[]> {
  const result: Record<StatTier, StatDefinition[]> = {
    core: [],
    combat: [],
  };

  for (const stat of STAT_REGISTRY) {
    result[stat.tier].push(stat);
  }

  // Sort each tier by displayOrder
  for (const tier of Object.keys(result) as StatTier[]) {
    result[tier].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return result;
}

/**
 * Get stats that should be shown in compact view
 */
export function getCompactStats(): StatDefinition[] {
  return STAT_REGISTRY.filter((stat) => stat.showInCompact);
}

/**
 * Get a stat definition by its key
 */
export function getStatByKey(key: string): StatDefinition | undefined {
  return STAT_REGISTRY.find((stat) => stat.key === key);
}

/**
 * Get all stat keys
 */
export function getStatKeys(): string[] {
  return STAT_REGISTRY.map((stat) => stat.key);
}

/**
 * Get default values for all stats
 */
export function getDefaultStats(): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const stat of STAT_REGISTRY) {
    defaults[stat.key] = stat.defaultValue;
  }
  return defaults;
}
