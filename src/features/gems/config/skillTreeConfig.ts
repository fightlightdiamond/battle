// ============================================================================
// SKILL TREE CONFIGURATION
// ============================================================================

import type { GemTier } from "../types/gemTier";
import type { SkillType } from "../types/gem";
import type { NodeState } from "../types/skillTree";

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

/**
 * Configuration for each gem tier
 */
export interface TierConfig {
  name: string;
  color: string;
  backgroundColor: string;
  xPosition: number; // Column position in layout (0-3)
}

// ============================================================================
// NODE STYLE CONFIGURATION
// ============================================================================

/**
 * Style configuration for a specific node state
 */
export interface NodeStateStyle {
  borderColor: string;
  backgroundColor: string;
  opacity: number;
  glow?: string;
}

/**
 * Complete node style configuration
 */
export interface NodeStyleConfig {
  width: number;
  height: number;
  borderRadius: number;
  borderWidth: number;
  states: Record<NodeState, NodeStateStyle>;
}

// ============================================================================
// EDGE STYLE CONFIGURATION
// ============================================================================

/**
 * Style configuration for evolution edges
 */
export interface EdgeStyleConfig {
  strokeWidth: number;
  strokeColor: string;
  arrowSize: number;
  labelBackground: string;
  labelColor: string;
  animated: boolean;
}

// ============================================================================
// LAYOUT CONFIGURATION
// ============================================================================

/**
 * Layout parameters for skill tree positioning
 */
export interface LayoutConfig {
  tierSpacing: number; // Horizontal spacing between tiers
  nodeSpacing: number; // Vertical spacing between nodes
  canvasWidth: number;
  canvasHeight: number;
  padding: number;
}

// ============================================================================
// SKILL TYPE CONFIGURATION
// ============================================================================

/**
 * Configuration for skill type display
 */
export interface SkillTypeConfig {
  color: string;
  icon: string;
  label: string;
}

// ============================================================================
// COMPLETE SKILL TREE CONFIGURATION
// ============================================================================

/**
 * Complete skill tree configuration object
 */
export interface SkillTreeConfig {
  tiers: Record<GemTier, TierConfig>;
  nodeStyle: NodeStyleConfig;
  edgeStyle: EdgeStyleConfig;
  layout: LayoutConfig;
  skillTypes: Record<SkillType, SkillTypeConfig>;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default skill tree configuration
 */
export const defaultSkillTreeConfig: SkillTreeConfig = {
  tiers: {
    basic: {
      name: "Basic",
      color: "#9CA3AF",
      backgroundColor: "#F3F4F6",
      xPosition: 0,
    },
    advanced: {
      name: "Advanced",
      color: "#3B82F6",
      backgroundColor: "#DBEAFE",
      xPosition: 1,
    },
    master: {
      name: "Master",
      color: "#8B5CF6",
      backgroundColor: "#EDE9FE",
      xPosition: 2,
    },
    legendary: {
      name: "Legendary",
      color: "#F59E0B",
      backgroundColor: "#FEF3C7",
      xPosition: 3,
    },
  },
  nodeStyle: {
    width: 180,
    height: 100,
    borderRadius: 12,
    borderWidth: 3,
    states: {
      owned: {
        borderColor: "#10B981",
        backgroundColor: "#D1FAE5",
        opacity: 1,
        glow: "0 0 10px rgba(16, 185, 129, 0.5)",
      },
      available: {
        borderColor: "#F59E0B",
        backgroundColor: "#FEF3C7",
        opacity: 1,
        glow: "0 0 15px rgba(245, 158, 11, 0.6)",
      },
      locked: {
        borderColor: "#6B7280",
        backgroundColor: "#E5E7EB",
        opacity: 0.5,
      },
      unowned: {
        borderColor: "#D1D5DB",
        backgroundColor: "#F9FAFB",
        opacity: 0.7,
      },
    },
  },
  edgeStyle: {
    strokeWidth: 2,
    strokeColor: "#9CA3AF",
    arrowSize: 20,
    labelBackground: "#FFFFFF",
    labelColor: "#374151",
    animated: true,
  },
  layout: {
    tierSpacing: 300,
    nodeSpacing: 150,
    canvasWidth: 1400,
    canvasHeight: 800,
    padding: 50,
  },
  skillTypes: {
    knockback: { color: "#EF4444", icon: "💥", label: "Knockback" },
    retreat: { color: "#3B82F6", icon: "🔙", label: "Retreat" },
    double_move: { color: "#10B981", icon: "⚡", label: "Double Move" },
    double_attack: { color: "#F59E0B", icon: "⚔️", label: "Double Attack" },
    execute: { color: "#7C3AED", icon: "💀", label: "Execute" },
    leap_strike: { color: "#EC4899", icon: "🦘", label: "Leap Strike" },
    power_shot: { color: "#06B6D4", icon: "🏹", label: "Power Shot" },
    evasive_shot: { color: "#F472B6", icon: "💨", label: "Evasive Shot" },
    piercing_thrust: { color: "#F59E0B", icon: "🔱", label: "Piercing Thrust" },
    whirlwind_charge: {
      color: "#14B8A6",
      icon: "🌀",
      label: "Whirlwind Charge",
    },
    speed_boost: { color: "#84CC16", icon: "💨", label: "Swift Advance" },
    damage_immunity: { color: "#64748B", icon: "🛡️", label: "Iron Guard" },
    stunning_slash: { color: "#F43F5E", icon: "⚡", label: "Stunning Slash" },
    shield_bash: { color: "#6366F1", icon: "🔰", label: "Shield Bash" },
  },
};
