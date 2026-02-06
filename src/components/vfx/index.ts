/**
 * VFX Module - Visual Effects System
 *
 * Design Patterns:
 * - Composition: VFXWrapper combines glow + particles + animations
 * - Factory: getVFXPreset() creates configs by variant name
 * - Strategy: Different effect presets for different use cases
 *
 * Usage Examples:
 *
 * // Enhancement tiers (weapon cards)
 * <EnhancementVFX tier="legendary">
 *   <WeaponCard />
 * </EnhancementVFX>
 *
 * // Success/Fail (enhancement results)
 * <SuccessVFX onComplete={() => handleComplete()}>
 *   <Card />
 * </SuccessVFX>
 *
 * // Combat effects
 * <AttackPrepVFX><Card /></AttackPrepVFX>
 * <DamageVFX><Card /></DamageVFX>
 * <CriticalHitVFX><Card /></CriticalHitVFX>
 *
 * // Movement effects
 * <MovingVFX><ArenaCard /></MovingVFX>
 *
 * // Custom effects
 * <CustomVFX
 *   baseVariant="enhancement-epic"
 *   overrides={{ particles: { count: 100 } }}
 * >
 *   <Card />
 * </CustomVFX>
 */

// Types
export type {
  VFXCategory,
  VFXVariant,
  GlowConfig,
  ParticleConfig,
  AnimationConfig,
  VFXConfig,
  VFXWrapperProps,
} from "./types";

export { particleConfigToOptions } from "./types";

// Presets & Factory
export {
  VFX_PRESETS,
  getVFXPreset,
  getPresetsByCategory,
  createCustomVFX,
} from "./presets";

// Core Component
export { VFXWrapper } from "./VFXWrapper";

// Convenience Components
export {
  // Enhancement
  EnhancementVFX,
  type EnhancementTier,
  // Results
  SuccessVFX,
  FailVFX,
  // Combat
  AttackPrepVFX,
  DamageVFX,
  HealVFX,
  CriticalHitVFX,
  // Movement
  MovingVFX,
  DashVFX,
  // Status
  BuffVFX,
  DebuffVFX,
  // Custom
  CustomVFX,
} from "./components";

// Backward compatibility alias
// @deprecated - Use EnhancementVFX instead
export { EnhancementVFX as EnhancementEffect } from "./components";
export type { EnhancementTier as EnhancementEffectTier } from "./components";
