// ============================================================================
// WEAPON ENHANCEMENT SERVICE
// ============================================================================

import type { Weapon, WeaponStats } from "../types/weapon";
import type {
  EnhanceLevel,
  EnhanceResult,
  EnhanceAttempt,
  EnhancePreview,
  EnhancedWeaponStats,
  EnhanceConfig,
} from "../types/enhancement";
import {
  DEFAULT_ENHANCE_CONFIG,
  getTierForLevel,
  calculateSuccessRate,
  calculateTotalStatBonus,
} from "../config/enhanceConfig";

/**
 * EnhanceableWeapon type alias - all Weapons now have enhancement data
 */
export type EnhanceableWeapon = Weapon;

/**
 * Check if a weapon has enhancement data (always true now)
 */
export function isEnhanceableWeapon(
  _weapon: Weapon,
): _weapon is EnhanceableWeapon {
  return true;
}

/**
 * Initialize enhancement data for a weapon
 * Ensures enhanceLevel is always defined (defaults to 0)
 */
export function initializeEnhancement(weapon: Weapon): EnhanceableWeapon {
  return {
    ...weapon,
    enhanceLevel: weapon.enhanceLevel ?? 0,
    enhanceHistory: weapon.enhanceHistory ?? [],
  };
}

/**
 * Calculate enhanced stats based on enhancement level
 */
export function calculateEnhancedStats(
  weapon: Weapon | EnhanceableWeapon,
  config: EnhanceConfig = DEFAULT_ENHANCE_CONFIG,
): EnhancedWeaponStats {
  const enhanceLevel =
    (isEnhanceableWeapon(weapon) ? weapon.enhanceLevel : 0) ?? 0;
  const totalBonusPercent = calculateTotalStatBonus(enhanceLevel, config);
  const multiplier = 1 + totalBonusPercent / 100;

  return {
    baseAtk: weapon.atk,
    baseCritChance: weapon.critChance,
    baseCritDamage: weapon.critDamage,
    baseArmorPen: weapon.armorPen,
    baseLifesteal: weapon.lifesteal,
    baseAttackRange: weapon.attackRange,

    enhancedAtk: Math.floor(weapon.atk * multiplier),
    enhancedCritChance: Math.min(
      100,
      Math.floor(weapon.critChance * multiplier),
    ),
    enhancedCritDamage: Math.floor(weapon.critDamage * multiplier),
    enhancedArmorPen: Math.min(100, Math.floor(weapon.armorPen * multiplier)),
    enhancedLifesteal: Math.min(100, Math.floor(weapon.lifesteal * multiplier)),
    enhancedAttackRange: weapon.attackRange, // Range doesn't scale with enhancement

    enhanceLevel,
    totalBonusPercent,
  };
}

/**
 * Get effective weapon stats after enhancement
 */
export function getEffectiveWeaponStats(
  weapon: Weapon | EnhanceableWeapon,
  config: EnhanceConfig = DEFAULT_ENHANCE_CONFIG,
): WeaponStats {
  const enhanced = calculateEnhancedStats(weapon, config);

  return {
    atk: enhanced.enhancedAtk,
    critChance: enhanced.enhancedCritChance,
    critDamage: enhanced.enhancedCritDamage,
    armorPen: enhanced.enhancedArmorPen,
    lifesteal: enhanced.enhancedLifesteal,
    attackRange: enhanced.enhancedAttackRange,
  };
}

/**
 * Roll for enhancement success
 */
export function rollEnhancement(successRate: number): boolean {
  const roll = Math.random() * 100;
  return roll < successRate;
}

/**
 * Get enhancement preview
 */
export function getEnhancePreview(
  weapon: EnhanceableWeapon,
  config: EnhanceConfig = DEFAULT_ENHANCE_CONFIG,
): EnhancePreview | null {
  const currentLevel = weapon.enhanceLevel ?? 0;

  // Already at max level
  if (currentLevel >= config.maxEnhanceLevel) {
    return null;
  }

  const tier = getTierForLevel(currentLevel, config);
  if (!tier) {
    return null;
  }

  const targetLevel = currentLevel + 1;
  const successRate = calculateSuccessRate(currentLevel, config);
  const currentStats = calculateEnhancedStats(weapon, config);

  // Preview stats if success
  const previewWeapon: EnhanceableWeapon = {
    ...weapon,
    enhanceLevel: targetLevel,
  };
  const previewStats = calculateEnhancedStats(previewWeapon, config);

  // Calculate failure result
  let newLevelOnFailure = currentLevel;
  if (tier.levelLossOnFailure) {
    newLevelOnFailure = Math.max(
      tier.minLevel,
      currentLevel - tier.levelLossAmount,
    );
  }

  return {
    currentLevel,
    targetLevel,
    successRate,
    requiredMaterial: tier.requiredMaterial,
    currentStats,
    previewStats,
    failureResult: {
      newLevel: newLevelOnFailure,
      canUseProtection: tier.protectionAllowed,
    },
  };
}

/**
 * Perform enhancement attempt
 */
export function performEnhancement(
  weapon: EnhanceableWeapon,
  useProtection: boolean = false,
  config: EnhanceConfig = DEFAULT_ENHANCE_CONFIG,
): { weapon: EnhanceableWeapon; result: EnhanceResult } | null {
  const currentLevel = weapon.enhanceLevel ?? 0;

  // Already at max level
  if (currentLevel >= config.maxEnhanceLevel) {
    return null;
  }

  const tier = getTierForLevel(currentLevel, config);
  if (!tier) {
    return null;
  }

  const successRate = calculateSuccessRate(currentLevel, config);
  const success = rollEnhancement(successRate);
  const timestamp = Date.now();

  let newLevel: EnhanceLevel;
  let statBonusApplied: number;

  if (success) {
    // Success: increase level
    newLevel = currentLevel + 1;
    statBonusApplied = tier.statBonusPerLevel;
  } else {
    // Failure: check for level loss
    if (tier.levelLossOnFailure && !useProtection) {
      newLevel = Math.max(tier.minLevel, currentLevel - tier.levelLossAmount);
    } else {
      newLevel = currentLevel; // Protected or no level loss
    }
    statBonusApplied = 0;
  }

  // Create attempt record
  const attempt: EnhanceAttempt = {
    fromLevel: currentLevel,
    toLevel: newLevel,
    success,
    timestamp,
    materialId: tier.requiredMaterial.type,
    protectionUsed: useProtection && !success && tier.levelLossOnFailure,
  };

  // Update weapon
  const updatedWeapon: EnhanceableWeapon = {
    ...weapon,
    enhanceLevel: newLevel,
    enhanceHistory: [...weapon.enhanceHistory, attempt],
    updatedAt: timestamp,
  };

  const result: EnhanceResult = {
    success,
    previousLevel: currentLevel,
    newLevel,
    statBonusApplied,
    materialConsumed: null, // Will be set by caller
    protectionUsed: attempt.protectionUsed,
    timestamp,
  };

  return { weapon: updatedWeapon, result };
}

/**
 * Get enhancement statistics from history
 */
export function getEnhanceStatistics(weapon: EnhanceableWeapon): {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  protectionUsedCount: number;
  maxLevelReached: number;
} {
  const history = weapon.enhanceHistory;
  const totalAttempts = history.length;
  const successCount = history.filter((a) => a.success).length;
  const failureCount = totalAttempts - successCount;
  const protectionUsedCount = history.filter((a) => a.protectionUsed).length;
  const maxLevelReached = history.reduce(
    (max, a) => Math.max(max, a.toLevel),
    0,
  );

  return {
    totalAttempts,
    successCount,
    failureCount,
    successRate: totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0,
    protectionUsedCount,
    maxLevelReached,
  };
}

/**
 * Check if weapon can be enhanced
 */
export function canEnhance(
  weapon: EnhanceableWeapon,
  config: EnhanceConfig = DEFAULT_ENHANCE_CONFIG,
): boolean {
  return weapon.enhanceLevel < config.maxEnhanceLevel;
}

/**
 * Get display name with enhancement level
 */
export function getEnhancedWeaponName(weapon: EnhanceableWeapon): string {
  if (weapon.enhanceLevel === 0) {
    return weapon.name;
  }
  return `${weapon.name} +${weapon.enhanceLevel}`;
}

/**
 * EnhancementService - Static service class for weapon enhancement
 */
export const EnhancementService = {
  isEnhanceableWeapon,
  initializeEnhancement,
  calculateEnhancedStats,
  getEffectiveWeaponStats,
  rollEnhancement,
  getEnhancePreview,
  performEnhancement,
  getEnhanceStatistics,
  canEnhance,
  getEnhancedWeaponName,
};
