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
  | "leap_strike"; // Jump to enemy and knockback 2

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
}

/**
 * Gem entity stored in database
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
  imagePath: string | null; // Path to stored image file
  imageUrl: string | null; // Blob URL for display
  createdAt: string;
  updatedAt: string;
}

/**
 * Form input for creating/editing gems
 */
export interface GemFormInput {
  name: string;
  description: string;
  skillType: SkillType;
  trigger: SkillTrigger;
  activationChance: number;
  cooldown: number;
  effectParams: SkillEffectParams;
  image?: File | null; // Optional image file for upload
}
