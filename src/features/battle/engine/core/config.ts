import type { CombatantRole } from "./types";
import { COMBATANT_ROLES } from "./types";

// ============================================================================
// BATTLE ENGINE CONFIGURATION
// ============================================================================

/**
 * Combat calculation configuration
 */
export interface CombatConfig {
  /** Minimum damage that can be dealt per attack */
  minDamage: number;

  /** Defense scaling factor for damage reduction formula: DEF / (DEF + defScalingFactor) */
  defScalingFactor: number;

  /** Critical damage threshold as percentage of defender's max HP (0.3 = 30%) */
  criticalDamageThreshold: number;

  /** Whether to use defense in damage calculation */
  useDefense: boolean;
}

/**
 * Stage scaling configuration
 */
export interface StageScalingConfig {
  /** Multiplier increase per stage (0.1 = 10% per stage) */
  multiplierPerStage: number;

  /** Base multiplier at stage 0 */
  baseMultiplier: number;
}

/**
 * Default combatant stats configuration
 * Updated for Tier-Based Stat System
 */
export interface DefaultStatsConfig {
  // Core Stats (Tier 1)
  atk: number;
  def: number;
  spd: number;

  // Combat Stats (Tier 2)
  critChance: number; // 0-100 (percentage)
  critDamage: number; // 100+ (150 = 1.5x multiplier)
  armorPen: number; // 0-100 (percentage)
  lifesteal: number; // 0-100 (percentage)
}

/**
 * HP bar display configuration
 */
export interface HpBarConfig {
  /** HP percentage above which bar is green */
  highThreshold: number;

  /** HP percentage below which bar is red (between low and high = yellow) */
  lowThreshold: number;

  /** Danger threshold for warnings */
  dangerThreshold: number;
}

/**
 * Complete battle engine configuration
 */
export interface BattleEngineConfig {
  combat: CombatConfig;
  stageScaling: StageScalingConfig;
  defaultStats: DefaultStatsConfig;
  hpBar: HpBarConfig;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default combat configuration
 */
export const DEFAULT_COMBAT_CONFIG: CombatConfig = {
  minDamage: 1,
  defScalingFactor: 100,
  criticalDamageThreshold: 0.3,
  useDefense: false, // Current simple mode: damage = ATK
};

/**
 * Default stage scaling configuration
 */
export const DEFAULT_STAGE_SCALING_CONFIG: StageScalingConfig = {
  multiplierPerStage: 0.1,
  baseMultiplier: 1,
};

/**
 * Default combatant stats
 * Updated for Tier-Based Stat System
 */
export const DEFAULT_STATS_CONFIG: DefaultStatsConfig = {
  // Core Stats (Tier 1)
  atk: 100,
  def: 50,
  spd: 100,

  // Combat Stats (Tier 2)
  critChance: 5, // 5%
  critDamage: 150, // 150% = 1.5x multiplier
  armorPen: 0, // 0%
  lifesteal: 0, // 0%
};

/**
 * Default HP bar configuration
 */
export const DEFAULT_HP_BAR_CONFIG: HpBarConfig = {
  highThreshold: 50,
  lowThreshold: 25,
  dangerThreshold: 0.25,
};

/**
 * Complete default configuration
 */
export const DEFAULT_BATTLE_CONFIG: BattleEngineConfig = {
  combat: DEFAULT_COMBAT_CONFIG,
  stageScaling: DEFAULT_STAGE_SCALING_CONFIG,
  defaultStats: DEFAULT_STATS_CONFIG,
  hpBar: DEFAULT_HP_BAR_CONFIG,
};

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

/**
 * Hard mode configuration - higher difficulty
 */
export const HARD_MODE_CONFIG: BattleEngineConfig = {
  ...DEFAULT_BATTLE_CONFIG,
  combat: {
    ...DEFAULT_COMBAT_CONFIG,
    useDefense: true, // Enable defense calculation
  },
  stageScaling: {
    ...DEFAULT_STAGE_SCALING_CONFIG,
    multiplierPerStage: 0.15, // 15% increase per stage
  },
};

/**
 * Easy mode configuration - lower difficulty
 */
export const EASY_MODE_CONFIG: BattleEngineConfig = {
  ...DEFAULT_BATTLE_CONFIG,
  stageScaling: {
    ...DEFAULT_STAGE_SCALING_CONFIG,
    multiplierPerStage: 0.05, // 5% increase per stage
  },
};

// ============================================================================
// CONFIG UTILITIES
// ============================================================================

/**
 * Merge partial config with defaults
 */
export function createConfig(
  partial?: Partial<BattleEngineConfig>
): BattleEngineConfig {
  if (!partial) return DEFAULT_BATTLE_CONFIG;

  return {
    combat: { ...DEFAULT_COMBAT_CONFIG, ...partial.combat },
    stageScaling: { ...DEFAULT_STAGE_SCALING_CONFIG, ...partial.stageScaling },
    defaultStats: { ...DEFAULT_STATS_CONFIG, ...partial.defaultStats },
    hpBar: { ...DEFAULT_HP_BAR_CONFIG, ...partial.hpBar },
  };
}

/**
 * Get opposite battle role
 */
export function getOppositeRole(role: CombatantRole): CombatantRole {
  return role === COMBATANT_ROLES.CHALLENGER
    ? COMBATANT_ROLES.OPPONENT
    : COMBATANT_ROLES.CHALLENGER;
}
