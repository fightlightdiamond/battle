// ============================================================================
// COMBAT VISUAL CONFIGURATION
// ============================================================================

/**
 * Damage type identifiers for visual styling
 */
export type DamageType = "normal" | "crit" | "heal";

/**
 * Style definition for each damage type
 */
export interface DamageTypeStyle {
  /** CSS color value */
  color: string;
  /** CSS font-size (e.g., "1.5rem", "2rem") */
  fontSize: string;
  /** CSS font-weight */
  fontWeight: string;
  /** Optional label (e.g., "CRIT!") */
  label?: string;
  /** Optional prefix (e.g., "+", "-") */
  prefix?: string;
}

/**
 * Animation settings for floating combat numbers
 */
export interface AnimationConfig {
  /** Duration in ms */
  duration: number;
  /** CSS easing function */
  easing: string;
  /** Animation direction */
  direction: "up" | "down";
  /** CSS distance (e.g., "50px") */
  distance: string;
}

/**
 * Message template placeholders: {attacker}, {defender}, {damage}, {critBonus}, {healAmount}
 */
export interface MessageTemplates {
  attack: string;
  attackWithCrit: string;
  attackWithLifesteal: string;
  attackWithCritAndLifesteal: string;
}

/**
 * Complete combat visual configuration
 */
export interface CombatVisualConfig {
  damageStyles: Record<DamageType, DamageTypeStyle>;
  animation: AnimationConfig;
  messageTemplates: MessageTemplates;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default combat visual configuration
 */
export const COMBAT_VISUAL_CONFIG: CombatVisualConfig = {
  damageStyles: {
    normal: {
      color: "#ffffff",
      fontSize: "1.5rem",
      fontWeight: "600",
      prefix: "-",
    },
    crit: {
      color: "#f59e0b", // amber-500
      fontSize: "2rem",
      fontWeight: "700",
      label: "CRIT!",
      prefix: "-",
    },
    heal: {
      color: "#22c55e", // green-500
      fontSize: "1.5rem",
      fontWeight: "600",
      prefix: "+",
    },
  },
  animation: {
    duration: 800,
    easing: "ease-out",
    direction: "up",
    distance: "50px",
  },
  messageTemplates: {
    attack: "{attacker} deals {damage} damage to {defender}",
    attackWithCrit:
      "{attacker} deals {damage} damage to {defender} (CRIT! +{critBonus})",
    attackWithLifesteal:
      "{attacker} deals {damage} damage to {defender}, heals {healAmount} HP",
    attackWithCritAndLifesteal:
      "{attacker} deals {damage} damage to {defender} (CRIT! +{critBonus}), heals {healAmount} HP",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the style configuration for a specific damage type
 * @param type - The damage type to get style for
 * @returns The style configuration for the damage type
 */
export function getDamageTypeStyle(type: DamageType): DamageTypeStyle {
  return COMBAT_VISUAL_CONFIG.damageStyles[type];
}

/**
 * Get the animation configuration
 * @returns The animation configuration
 */
export function getAnimationConfig(): AnimationConfig {
  return COMBAT_VISUAL_CONFIG.animation;
}

/**
 * Get the message templates configuration
 * @returns The message templates configuration
 */
export function getMessageTemplates(): MessageTemplates {
  return COMBAT_VISUAL_CONFIG.messageTemplates;
}
