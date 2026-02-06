/**
 * VFX Types - Visual Effects Configuration Types
 * Design Pattern: Composition + Factory
 */

import type { ISourceOptions } from "@tsparticles/engine";

// ============================================================================
// EFFECT TYPES
// ============================================================================

/**
 * Effect category for different use cases
 */
export type VFXCategory =
  | "enhancement" // Weapon enhancement tiers
  | "result" // Success/Fail states
  | "combat" // Attack, damage, heal
  | "movement" // Movement effects
  | "status"; // Buff/debuff indicators

/**
 * Predefined effect variants
 */
export type VFXVariant =
  // Enhancement tiers
  | "enhancement-common"
  | "enhancement-rare"
  | "enhancement-epic"
  | "enhancement-legendary"
  | "enhancement-mythic"
  // Result states
  | "success"
  | "fail"
  // Combat effects
  | "attack-prep"
  | "damage-received"
  | "heal-received"
  | "critical-hit"
  // Movement
  | "moving"
  | "dash"
  // Status
  | "buff"
  | "debuff";

// ============================================================================
// GLOW CONFIGURATION
// ============================================================================

export interface GlowConfig {
  /** Center color for radial gradient (rgba) */
  centerColor: string;
  /** Middle color for radial gradient (rgba) */
  midColor: string;
  /** Edge color for radial gradient (rgba) */
  edgeColor: string;
  /** Border color */
  borderColor: string;
  /** Border width in pixels */
  borderWidth: number;
  /** Box shadow for outer glow */
  outerGlow: string;
  /** Animation duration in seconds */
  pulseDuration: number;
  /** Intensity multiplier for pulse animation (1 = normal, 1.5 = intense) */
  pulseIntensity: number;
}

// ============================================================================
// PARTICLE CONFIGURATION
// ============================================================================

export interface ParticleConfig {
  /** Enable/disable particles */
  enabled: boolean;
  /** Particle colors (hex array) */
  colors: string[];
  /** Number of particles */
  count: number;
  /** Movement speed */
  speed: number;
  /** Movement direction */
  direction:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "none"
    | "outside"
    | "inside";
  /** Particle shape */
  shape: "circle" | "star" | "square" | "triangle";
  /** Min/max size range */
  sizeRange: [number, number];
  /** Enable twinkle effect */
  twinkle: boolean;
  /** Opacity range */
  opacityRange: [number, number];
}

// ============================================================================
// ANIMATION CONFIGURATION
// ============================================================================

export interface AnimationConfig {
  /** Enable shake effect */
  shake: boolean;
  /** Shake intensity (pixels) */
  shakeIntensity: number;
  /** Enable scale pulse */
  scalePulse: boolean;
  /** Scale range [min, max] */
  scaleRange: [number, number];
  /** Animation repeat count (Infinity for loop) */
  repeat: number | typeof Infinity;
  /** Duration override (seconds) */
  duration: number;
}

// ============================================================================
// FULL VFX CONFIGURATION
// ============================================================================

export interface VFXConfig {
  /** Effect variant name */
  variant: VFXVariant;
  /** Effect category */
  category: VFXCategory;
  /** Glow settings */
  glow: GlowConfig;
  /** Particle settings */
  particles: ParticleConfig;
  /** Animation settings */
  animation: AnimationConfig;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface VFXWrapperProps {
  /** Effect configuration */
  config: VFXConfig;
  /** Children to wrap */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Unique ID for particles (required if multiple instances) */
  id?: string;
  /** Callback when effect completes (for non-looping effects) */
  onComplete?: () => void;
}

/**
 * Helper function to convert ParticleConfig to tsparticles ISourceOptions
 */
export function particleConfigToOptions(
  config: ParticleConfig,
): ISourceOptions {
  return {
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: {
        value: config.count,
        density: { enable: true, width: 200, height: 300 },
      },
      color: { value: config.colors },
      shape: { type: config.shape },
      opacity: {
        value: { min: config.opacityRange[0], max: config.opacityRange[1] },
        animation: {
          enable: true,
          speed: 1,
          sync: false,
        },
      },
      size: {
        value: { min: config.sizeRange[0], max: config.sizeRange[1] },
        animation: {
          enable: true,
          speed: 2,
          sync: false,
        },
      },
      move: {
        enable: true,
        speed: config.speed,
        direction: config.direction as
          | "top"
          | "bottom"
          | "left"
          | "right"
          | "none"
          | "outside"
          | "inside",
        random: true,
        straight: false,
        outModes: { default: "out" as const },
      },
      twinkle: config.twinkle
        ? {
            particles: {
              enable: true,
              frequency: 0.05,
              opacity: 1,
            },
          }
        : undefined,
    },
    detectRetina: true,
  };
}
