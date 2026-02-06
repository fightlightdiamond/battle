/**
 * Convenience VFX Components - Pre-configured effect wrappers
 * Factory Pattern: Easy-to-use components for common effects
 */

import React from "react";
import { VFXWrapper } from "./VFXWrapper";
import { getVFXPreset, createCustomVFX } from "./presets";
import type {
  VFXVariant,
  GlowConfig,
  ParticleConfig,
  AnimationConfig,
} from "./types";

// ============================================================================
// BASE PROPS
// ============================================================================

interface BaseVFXProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  onComplete?: () => void;
}

// ============================================================================
// ENHANCEMENT TIER EFFECTS
// ============================================================================

export type EnhancementTier =
  | "common"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

const tierToVariant: Record<EnhancementTier, VFXVariant> = {
  common: "enhancement-common",
  rare: "enhancement-rare",
  epic: "enhancement-epic",
  legendary: "enhancement-legendary",
  mythic: "enhancement-mythic",
};

interface EnhancementVFXProps extends BaseVFXProps {
  tier: EnhancementTier;
}

/**
 * EnhancementVFX - Visual effect for weapon enhancement tiers
 * Usage: Wrap weapon cards to show their enhancement level
 */
export const EnhancementVFX: React.FC<EnhancementVFXProps> = ({
  tier,
  children,
  ...props
}) => {
  const config = getVFXPreset(tierToVariant[tier]);
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};

// ============================================================================
// RESULT EFFECTS (Success/Fail)
// ============================================================================

/**
 * SuccessVFX - Celebration effect for successful actions
 * Usage: Enhancement success, victory, achievement unlocked
 */
export const SuccessVFX: React.FC<BaseVFXProps> = ({ children, ...props }) => {
  const config = getVFXPreset("success");
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};

/**
 * FailVFX - Failure effect with shake and red glow
 * Usage: Enhancement failure, defeat, error states
 */
export const FailVFX: React.FC<BaseVFXProps> = ({ children, ...props }) => {
  const config = getVFXPreset("fail");
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};

// ============================================================================
// COMBAT EFFECTS
// ============================================================================

/**
 * AttackPrepVFX - Charging/preparing attack effect
 * Usage: Before attack animation, skill charging
 */
export const AttackPrepVFX: React.FC<BaseVFXProps> = ({
  children,
  ...props
}) => {
  const config = getVFXPreset("attack-prep");
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};

/**
 * DamageVFX - Taking damage effect with shake
 * Usage: When card receives damage
 */
export const DamageVFX: React.FC<BaseVFXProps> = ({ children, ...props }) => {
  const config = getVFXPreset("damage-received");
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};

/**
 * HealVFX - Healing effect with green glow
 * Usage: When card receives healing
 */
export const HealVFX: React.FC<BaseVFXProps> = ({ children, ...props }) => {
  const config = getVFXPreset("heal-received");
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};

/**
 * CriticalHitVFX - Critical hit explosion effect
 * Usage: Critical damage dealt
 */
export const CriticalHitVFX: React.FC<BaseVFXProps> = ({
  children,
  ...props
}) => {
  const config = getVFXPreset("critical-hit");
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};

// ============================================================================
// MOVEMENT EFFECTS
// ============================================================================

/**
 * MovingVFX - Subtle movement trail effect
 * Usage: Card moving on arena
 */
export const MovingVFX: React.FC<BaseVFXProps> = ({ children, ...props }) => {
  const config = getVFXPreset("moving");
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};

/**
 * DashVFX - Fast dash effect with strong trail
 * Usage: Quick movement, dodge, charge
 */
export const DashVFX: React.FC<BaseVFXProps> = ({ children, ...props }) => {
  const config = getVFXPreset("dash");
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};

// ============================================================================
// STATUS EFFECTS
// ============================================================================

/**
 * BuffVFX - Positive status effect glow
 * Usage: Attack up, defense up, speed boost
 */
export const BuffVFX: React.FC<BaseVFXProps> = ({ children, ...props }) => {
  const config = getVFXPreset("buff");
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};

/**
 * DebuffVFX - Negative status effect glow
 * Usage: Poison, slow, weaken
 */
export const DebuffVFX: React.FC<BaseVFXProps> = ({ children, ...props }) => {
  const config = getVFXPreset("debuff");
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};

// ============================================================================
// CUSTOM VFX FACTORY
// ============================================================================

interface CustomVFXProps extends BaseVFXProps {
  baseVariant: VFXVariant;
  overrides?: Partial<{
    glow: Partial<GlowConfig>;
    particles: Partial<ParticleConfig>;
    animation: Partial<AnimationConfig>;
  }>;
}

/**
 * CustomVFX - Create custom effect based on existing preset
 * Usage: When you need variations of existing effects
 */
export const CustomVFX: React.FC<CustomVFXProps> = ({
  baseVariant,
  overrides = {},
  children,
  ...props
}) => {
  const config = createCustomVFX(baseVariant, overrides);
  return (
    <VFXWrapper config={config} {...props}>
      {children}
    </VFXWrapper>
  );
};
