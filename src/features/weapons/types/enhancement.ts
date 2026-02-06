// ============================================================================
// WEAPON ENHANCEMENT TYPES
// ============================================================================

/**
 * Enhancement level range
 */
export const MIN_ENHANCE_LEVEL = 0;
export const MAX_ENHANCE_LEVEL = 15;

/**
 * Enhancement level type (+0 to +15)
 */
export type EnhanceLevel = number;

/**
 * Result of an enhancement attempt
 */
export interface EnhanceResult {
  success: boolean;
  previousLevel: EnhanceLevel;
  newLevel: EnhanceLevel;
  statBonusApplied: number; // Percentage bonus applied
  materialConsumed: EnhanceMaterial | null;
  protectionUsed: boolean;
  timestamp: number;
}

/**
 * History entry for tracking enhancement attempts
 */
export interface EnhanceAttempt {
  fromLevel: EnhanceLevel;
  toLevel: EnhanceLevel;
  success: boolean;
  timestamp: number;
  materialId: string | null;
  protectionUsed: boolean;
}

/**
 * Enhancement material types
 */
export type EnhanceMaterialType =
  | "enhancement_stone_basic" // For +0 to +5
  | "enhancement_stone_intermediate" // For +6 to +10
  | "enhancement_stone_advanced" // For +11 to +15
  | "protection_scroll"; // Prevents level loss on failure

/**
 * Enhancement material
 */
export interface EnhanceMaterial {
  id: string;
  type: EnhanceMaterialType;
  name: string;
  description: string;
  quantity: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Material requirement for each enhancement tier
 */
export interface MaterialRequirement {
  type: EnhanceMaterialType;
  quantity: number;
}

/**
 * Enhancement tier configuration
 */
export interface EnhanceTierConfig {
  minLevel: EnhanceLevel;
  maxLevel: EnhanceLevel;
  baseSuccessRate: number; // 0-100
  successRateDecayPerLevel: number; // Reduction per level within tier
  statBonusPerLevel: number; // Percentage increase per level
  levelLossOnFailure: boolean; // Whether to lose level on failure
  levelLossAmount: number; // How many levels to lose (0 if no loss)
  requiredMaterial: MaterialRequirement;
  protectionAllowed: boolean;
}

/**
 * Full enhancement configuration
 */
export interface EnhanceConfig {
  tiers: EnhanceTierConfig[];
  maxEnhanceLevel: EnhanceLevel;
}

/**
 * Enhanced weapon stats - calculated from base stats + enhancement bonus
 */
export interface EnhancedWeaponStats {
  baseAtk: number;
  baseCritChance: number;
  baseCritDamage: number;
  baseArmorPen: number;
  baseLifesteal: number;
  baseAttackRange: number;

  // Enhanced values (after applying enhancement bonus)
  enhancedAtk: number;
  enhancedCritChance: number;
  enhancedCritDamage: number;
  enhancedArmorPen: number;
  enhancedLifesteal: number;
  enhancedAttackRange: number;

  // Bonus info
  enhanceLevel: EnhanceLevel;
  totalBonusPercent: number;
}

/**
 * Enhancement preview - shows what will happen if enhancement succeeds/fails
 */
export interface EnhancePreview {
  currentLevel: EnhanceLevel;
  targetLevel: EnhanceLevel;
  successRate: number;
  requiredMaterial: MaterialRequirement;
  currentStats: EnhancedWeaponStats;
  previewStats: EnhancedWeaponStats; // Stats if success
  failureResult: {
    newLevel: EnhanceLevel;
    canUseProtection: boolean;
  };
}

/**
 * Default material quantities for new players
 */
export const DEFAULT_MATERIAL_QUANTITIES = {
  enhancement_stone_basic: 10,
  enhancement_stone_intermediate: 5,
  enhancement_stone_advanced: 2,
  protection_scroll: 3,
} as const;

/**
 * Material display info
 */
export const MATERIAL_INFO: Record<
  EnhanceMaterialType,
  { name: string; description: string; icon: string }
> = {
  enhancement_stone_basic: {
    name: "Basic Enhancement Stone",
    description: "Used for enhancing weapons from +0 to +5",
    icon: "💎",
  },
  enhancement_stone_intermediate: {
    name: "Intermediate Enhancement Stone",
    description: "Used for enhancing weapons from +6 to +10",
    icon: "💠",
  },
  enhancement_stone_advanced: {
    name: "Advanced Enhancement Stone",
    description: "Used for enhancing weapons from +11 to +15",
    icon: "🔮",
  },
  protection_scroll: {
    name: "Protection Scroll",
    description: "Prevents level loss when enhancement fails",
    icon: "📜",
  },
};
