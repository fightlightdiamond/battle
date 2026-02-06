// ============================================================================
// WEAPON ENHANCEMENT CONFIGURATION
// ============================================================================

import type { EnhanceConfig, EnhanceTierConfig } from "../types/enhancement";

/**
 * Tier 1: +0 to +5 (Easy tier)
 * - 100% success rate
 * - No level loss on failure
 * - Basic enhancement stones
 */
const TIER_1: EnhanceTierConfig = {
  minLevel: 0,
  maxLevel: 4, // Enhancing from +0 to +5
  baseSuccessRate: 100,
  successRateDecayPerLevel: 0,
  statBonusPerLevel: 5, // +5% per level
  levelLossOnFailure: false,
  levelLossAmount: 0,
  requiredMaterial: {
    type: "enhancement_stone_basic",
    quantity: 1,
  },
  protectionAllowed: false, // Not needed for 100% success
};

/**
 * Tier 2: +5 to +10 (Medium tier)
 * - 70% → 50% success rate
 * - Lose 1 level on failure (unless protected)
 * - Intermediate enhancement stones
 */
const TIER_2: EnhanceTierConfig = {
  minLevel: 5,
  maxLevel: 9, // Enhancing from +5 to +10
  baseSuccessRate: 70,
  successRateDecayPerLevel: 4, // 70%, 66%, 62%, 58%, 54%
  statBonusPerLevel: 8, // +8% per level
  levelLossOnFailure: true,
  levelLossAmount: 1,
  requiredMaterial: {
    type: "enhancement_stone_intermediate",
    quantity: 1,
  },
  protectionAllowed: true,
};

/**
 * Tier 3: +10 to +15 (Hard tier)
 * - 40% → 10% success rate
 * - Lose 2 levels on failure (unless protected)
 * - Advanced enhancement stones
 * - NO DESTRUCTION (as per user request)
 */
const TIER_3: EnhanceTierConfig = {
  minLevel: 10,
  maxLevel: 14, // Enhancing from +10 to +15
  baseSuccessRate: 40,
  successRateDecayPerLevel: 6, // 40%, 34%, 28%, 22%, 16%
  statBonusPerLevel: 12, // +12% per level
  levelLossOnFailure: true,
  levelLossAmount: 2,
  requiredMaterial: {
    type: "enhancement_stone_advanced",
    quantity: 1,
  },
  protectionAllowed: true,
};

/**
 * Default enhancement configuration
 */
export const DEFAULT_ENHANCE_CONFIG: EnhanceConfig = {
  tiers: [TIER_1, TIER_2, TIER_3],
  maxEnhanceLevel: 15,
};

/**
 * Get the tier configuration for a given enhancement level
 */
export function getTierForLevel(
  level: number,
  config: EnhanceConfig = DEFAULT_ENHANCE_CONFIG,
): EnhanceTierConfig | null {
  return (
    config.tiers.find(
      (tier) => level >= tier.minLevel && level <= tier.maxLevel,
    ) ?? null
  );
}

/**
 * Calculate success rate for a given level
 */
export function calculateSuccessRate(
  level: number,
  config: EnhanceConfig = DEFAULT_ENHANCE_CONFIG,
): number {
  const tier = getTierForLevel(level, config);
  if (!tier) return 0;

  const levelInTier = level - tier.minLevel;
  const successRate =
    tier.baseSuccessRate - levelInTier * tier.successRateDecayPerLevel;

  return Math.max(0, Math.min(100, successRate));
}

/**
 * Calculate total stat bonus percentage for a given level
 * Accumulates bonuses from all tiers
 */
export function calculateTotalStatBonus(
  level: number,
  config: EnhanceConfig = DEFAULT_ENHANCE_CONFIG,
): number {
  let totalBonus = 0;

  for (const tier of config.tiers) {
    if (level <= tier.minLevel) break;

    const levelsInThisTier = Math.min(level, tier.maxLevel + 1) - tier.minLevel;
    totalBonus += levelsInThisTier * tier.statBonusPerLevel;
  }

  return totalBonus;
}

/**
 * Get enhancement level display string (e.g., "+5", "+10")
 */
export function getEnhanceLevelDisplay(level: number | undefined): string {
  if (level === undefined || level === null || level === 0) return "";
  return `+${level}`;
}

/**
 * Get enhancement level color based on tier
 */
export function getEnhanceLevelColor(level: number | undefined): string {
  if (level === undefined || level === null || level === 0)
    return "text-muted-foreground";
  if (level <= 5) return "text-green-500";
  if (level <= 10) return "text-blue-500";
  return "text-purple-500";
}

/**
 * Get enhancement level glow effect class
 */
export function getEnhanceLevelGlow(level: number): string {
  if (level === 0) return "";
  if (level <= 5) return "shadow-green-500/20";
  if (level <= 10) return "shadow-blue-500/30";
  return "shadow-purple-500/50 animate-pulse";
}
