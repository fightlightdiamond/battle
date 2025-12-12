import type { CombatantStats } from "../core/types";
import {
  type StageScalingConfig,
  DEFAULT_STAGE_SCALING_CONFIG,
} from "../core/config";

// ============================================================================
// STAGE SCALING INTERFACE
// ============================================================================

export interface StageScaling {
  readonly config: StageScalingConfig;
  scaleStats(baseStats: CombatantStats, stageNumber: number): CombatantStats;
  getMultiplier(stageNumber: number): number;
}

// ============================================================================
// STAGE SCALING IMPLEMENTATION
// ============================================================================

/**
 * Creates a StageScaling instance for scaling enemy stats based on stage number.
 *
 * Formula: stat = baseStat × (baseMultiplier + stageNumber × multiplierPerStage)
 *
 * @param config - Stage scaling configuration (optional, uses defaults)
 */
export function createStageScaling(
  config: StageScalingConfig = DEFAULT_STAGE_SCALING_CONFIG
): StageScaling {
  return {
    config,

    /**
     * Get the multiplier for a given stage number.
     */
    getMultiplier(stageNumber: number): number {
      return config.baseMultiplier + stageNumber * config.multiplierPerStage;
    },

    /**
     * Scale combatant stats based on stage number.
     */
    scaleStats(baseStats: CombatantStats, stageNumber: number): CombatantStats {
      const multiplier = this.getMultiplier(stageNumber);

      return {
        atk: Math.floor(baseStats.atk * multiplier),
        def: Math.floor(baseStats.def * multiplier),
        critRate: baseStats.critRate, // critRate is a percentage, don't scale
        critDamage: baseStats.critDamage, // critDamage is a multiplier, don't scale
      };
    },
  };
}

// Default singleton instance
export const stageScaling = createStageScaling();
