// ============================================================================
// GEM TYPES
// ============================================================================

/**
 * Skill trigger types - when the skill can activate
 */
export type SkillTrigger = "movement" | "combat";

/**
 * Skill type enumeration - the different skills gems can provide
 */
export type SkillType =
  | "knockback" // Push enemy 1 cell away
  | "retreat" // Move back 1 cell after attack
  | "double_move" // Move 2 cells instead of 1
  | "double_attack" // Attack twice
  | "execute" // Kill if HP below threshold
  | "leap_strike" // Jump to enemy and knockback 2
  // Weapon-specific skills
  | "power_shot" // Bow: 150% damage + knockback
  | "evasive_shot" // Bow: 250% damage + retreat
  | "piercing_thrust" // Spear: 170% damage + pull enemy 1 cell
  | "whirlwind_charge" // Spear: leap to enemy + 200% damage + push 2 cells
  // Sword & Shield skills
  | "speed_boost" // Passive: 50% chance to move extra 1 cell
  | "damage_immunity" // Passive: 20% chance to negate all damage
  | "stunning_slash" // 180% damage + 20% stun 1 turn
  | "shield_bash"; // Push enemy 1 cell + follow + 120% damage

/**
 * Gem tier enumeration - progression levels for gems
 * Requirement 1.1: Support 4 tiers: Basic, Advanced, Master, Legendary
 */
export type GemTierType = "basic" | "advanced" | "master" | "legendary";

/**
 * Default tier for new gems
 * Requirement 1.2: Default tier is "basic"
 */
export const DEFAULT_GEM_TIER: GemTierType = "basic";

/**
 * Skill effect parameters - configurable values for each skill type
 */
export interface SkillEffectParams {
  knockbackDistance?: number; // For knockback/retreat (default: 1)
  moveDistance?: number; // For double_move (default: 2)
  attackCount?: number; // For double_attack (default: 2)
  executeThreshold?: number; // HP % for execute (0-100, default: 15)
  leapRange?: number; // Detection range for leap (default: 2)
  leapKnockback?: number; // Knockback distance after leap (default: 2)
  damageMultiplier?: number; // For power_shot/evasive_shot/piercing_thrust/whirlwind_charge
  retreatDistance?: number; // For evasive_shot (default: 1)
  pullDistance?: number; // For piercing_thrust - pull enemy towards attacker (default: 1)
  chargeKnockback?: number; // For whirlwind_charge - push distance after charge (default: 2)
  // Sword & Shield params
  stunDuration?: number; // For stunning_slash - stun duration in turns (default: 1)
  stunChance?: number; // For stunning_slash - chance to stun (0-100, default: 20)
  followPush?: boolean; // For shield_bash - attacker follows the push (default: true)
}

/**
 * Gem entity stored in database
 * Requirement 1.4: Store tier information as part of gem data
 */
export interface Gem {
  id: string;
  name: string;
  description: string;
  skillType: SkillType;
  trigger: SkillTrigger;
  activationChance: number; // 0-100 percentage
  cooldown: number; // 0 = no cooldown
  effectParams: SkillEffectParams;
  tier: GemTierType; // Gem tier (basic, advanced, master, legendary)
  imagePath: string | null; // Path to stored image file
  imageUrl: string | null; // Blob URL for display
  createdAt: string;
  updatedAt: string;
}

/**
 * Form input for creating/editing gems
 * Requirement 1.2: Default tier is "basic" when not specified
 */
export interface GemFormInput {
  name: string;
  description: string;
  skillType: SkillType;
  trigger: SkillTrigger;
  activationChance: number;
  cooldown: number;
  effectParams: SkillEffectParams;
  tier?: GemTierType; // Optional, defaults to "basic"
  image?: File | null; // Optional image file for upload
}
