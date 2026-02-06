/**
 * VFX Presets - Predefined effect configurations
 * Factory Pattern: Create effects by variant name
 */

import type {
  VFXConfig,
  VFXVariant,
  GlowConfig,
  ParticleConfig,
  AnimationConfig,
} from "./types";

// ============================================================================
// DEFAULT CONFIGS
// ============================================================================

const defaultParticles: ParticleConfig = {
  enabled: true,
  colors: ["#ffffff"],
  count: 20,
  speed: 0.5,
  direction: "top",
  shape: "circle",
  sizeRange: [1, 4],
  twinkle: true,
  opacityRange: [0.3, 0.8],
};

const defaultAnimation: AnimationConfig = {
  shake: false,
  shakeIntensity: 5,
  scalePulse: false,
  scaleRange: [1, 1.05],
  repeat: Infinity,
  duration: 2,
};

// ============================================================================
// ENHANCEMENT TIER PRESETS
// ============================================================================

const enhancementCommon: VFXConfig = {
  variant: "enhancement-common",
  category: "enhancement",
  glow: {
    centerColor: "rgba(180,180,255,0.5)",
    midColor: "rgba(180,180,255,0.25)",
    edgeColor: "rgba(180,180,255,0)",
    borderColor: "rgba(180,180,255,0.8)",
    borderWidth: 2,
    outerGlow: "0 0 40px 15px rgba(180,180,255,0.4)",
    pulseDuration: 2,
    pulseIntensity: 1.5,
  },
  particles: {
    ...defaultParticles,
    colors: ["#b4b4ff", "#e0e0ff"],
    count: 15,
    speed: 0.3,
  },
  animation: { ...defaultAnimation },
};

const enhancementRare: VFXConfig = {
  variant: "enhancement-rare",
  category: "enhancement",
  glow: {
    centerColor: "rgba(80,180,255,0.6)",
    midColor: "rgba(80,180,255,0.3)",
    edgeColor: "rgba(80,180,255,0)",
    borderColor: "rgba(80,180,255,0.9)",
    borderWidth: 2,
    outerGlow: "0 0 50px 18px rgba(80,180,255,0.5)",
    pulseDuration: 1.8,
    pulseIntensity: 1.5,
  },
  particles: {
    ...defaultParticles,
    colors: ["#50b4ff", "#80d0ff", "#ffffff"],
    count: 25,
    speed: 0.5,
  },
  animation: { ...defaultAnimation },
};

const enhancementEpic: VFXConfig = {
  variant: "enhancement-epic",
  category: "enhancement",
  glow: {
    centerColor: "rgba(180,80,255,0.7)",
    midColor: "rgba(180,80,255,0.35)",
    edgeColor: "rgba(180,80,255,0)",
    borderColor: "rgba(180,80,255,0.95)",
    borderWidth: 2,
    outerGlow: "0 0 60px 22px rgba(180,80,255,0.6)",
    pulseDuration: 1.6,
    pulseIntensity: 1.6,
  },
  particles: {
    ...defaultParticles,
    colors: ["#b450ff", "#d080ff", "#ffffff"],
    count: 35,
    speed: 0.7,
  },
  animation: { ...defaultAnimation },
};

const enhancementLegendary: VFXConfig = {
  variant: "enhancement-legendary",
  category: "enhancement",
  glow: {
    centerColor: "rgba(255,180,80,0.8)",
    midColor: "rgba(255,180,80,0.4)",
    edgeColor: "rgba(255,180,80,0)",
    borderColor: "rgba(255,180,80,1)",
    borderWidth: 3,
    outerGlow: "0 0 70px 25px rgba(255,180,80,0.7)",
    pulseDuration: 1.4,
    pulseIntensity: 1.7,
  },
  particles: {
    ...defaultParticles,
    colors: ["#ffb450", "#ffd080", "#ffffff", "#ffe0a0"],
    count: 45,
    speed: 1,
    shape: "star",
  },
  animation: { ...defaultAnimation, scalePulse: true, scaleRange: [1, 1.03] },
};

const enhancementMythic: VFXConfig = {
  variant: "enhancement-mythic",
  category: "enhancement",
  glow: {
    centerColor: "rgba(255,80,180,0.9)",
    midColor: "rgba(255,80,180,0.45)",
    edgeColor: "rgba(255,80,180,0)",
    borderColor: "rgba(255,80,180,1)",
    borderWidth: 3,
    outerGlow: "0 0 80px 30px rgba(255,80,180,0.8)",
    pulseDuration: 1.2,
    pulseIntensity: 1.8,
  },
  particles: {
    ...defaultParticles,
    colors: ["#ff50b4", "#ff80d0", "#ffffff", "#ffa0e0", "#d050ff"],
    count: 60,
    speed: 1.3,
    shape: "star",
  },
  animation: { ...defaultAnimation, scalePulse: true, scaleRange: [1, 1.05] },
};

// ============================================================================
// RESULT PRESETS (Success/Fail)
// ============================================================================

const success: VFXConfig = {
  variant: "success",
  category: "result",
  glow: {
    centerColor: "rgba(80,255,120,0.8)",
    midColor: "rgba(80,255,120,0.4)",
    edgeColor: "rgba(80,255,120,0)",
    borderColor: "rgba(80,255,120,1)",
    borderWidth: 3,
    outerGlow: "0 0 60px 25px rgba(80,255,120,0.7)",
    pulseDuration: 0.5,
    pulseIntensity: 2,
  },
  particles: {
    enabled: true,
    colors: ["#50ff78", "#80ffa0", "#ffffff", "#ffff00", "#ffd700"],
    count: 80,
    speed: 2,
    direction: "outside",
    shape: "star",
    sizeRange: [2, 6],
    twinkle: true,
    opacityRange: [0.5, 1],
  },
  animation: {
    shake: false,
    shakeIntensity: 0,
    scalePulse: true,
    scaleRange: [1, 1.1],
    repeat: 3,
    duration: 0.8,
  },
};

const fail: VFXConfig = {
  variant: "fail",
  category: "result",
  glow: {
    centerColor: "rgba(255,80,80,0.8)",
    midColor: "rgba(255,80,80,0.4)",
    edgeColor: "rgba(255,80,80,0)",
    borderColor: "rgba(255,80,80,1)",
    borderWidth: 3,
    outerGlow: "0 0 50px 20px rgba(255,80,80,0.6)",
    pulseDuration: 0.3,
    pulseIntensity: 1.8,
  },
  particles: {
    enabled: true,
    colors: ["#ff5050", "#ff8080", "#800000"],
    count: 40,
    speed: 1.5,
    direction: "bottom",
    shape: "circle",
    sizeRange: [2, 5],
    twinkle: false,
    opacityRange: [0.4, 0.9],
  },
  animation: {
    shake: true,
    shakeIntensity: 8,
    scalePulse: false,
    scaleRange: [1, 1],
    repeat: 4,
    duration: 0.6,
  },
};

// ============================================================================
// COMBAT PRESETS
// ============================================================================

const attackPrep: VFXConfig = {
  variant: "attack-prep",
  category: "combat",
  glow: {
    centerColor: "rgba(255,200,50,0.7)",
    midColor: "rgba(255,200,50,0.35)",
    edgeColor: "rgba(255,200,50,0)",
    borderColor: "rgba(255,200,50,0.9)",
    borderWidth: 2,
    outerGlow: "0 0 40px 15px rgba(255,200,50,0.5)",
    pulseDuration: 0.4,
    pulseIntensity: 2,
  },
  particles: {
    enabled: true,
    colors: ["#ffc832", "#ffff00", "#ffffff"],
    count: 30,
    speed: 1.5,
    direction: "inside",
    shape: "circle",
    sizeRange: [1, 3],
    twinkle: true,
    opacityRange: [0.5, 1],
  },
  animation: {
    shake: false,
    shakeIntensity: 0,
    scalePulse: true,
    scaleRange: [1, 1.08],
    repeat: 2,
    duration: 0.5,
  },
};

const damageReceived: VFXConfig = {
  variant: "damage-received",
  category: "combat",
  glow: {
    centerColor: "rgba(255,50,50,0.6)",
    midColor: "rgba(255,50,50,0.3)",
    edgeColor: "rgba(255,50,50,0)",
    borderColor: "rgba(255,50,50,0.8)",
    borderWidth: 2,
    outerGlow: "0 0 30px 10px rgba(255,50,50,0.5)",
    pulseDuration: 0.2,
    pulseIntensity: 1.5,
  },
  particles: {
    enabled: false,
    colors: ["#ff3232"],
    count: 0,
    speed: 0,
    direction: "none",
    shape: "circle",
    sizeRange: [1, 2],
    twinkle: false,
    opacityRange: [0.5, 0.8],
  },
  animation: {
    shake: true,
    shakeIntensity: 6,
    scalePulse: false,
    scaleRange: [1, 1],
    repeat: 2,
    duration: 0.3,
  },
};

const healReceived: VFXConfig = {
  variant: "heal-received",
  category: "combat",
  glow: {
    centerColor: "rgba(80,255,150,0.6)",
    midColor: "rgba(80,255,150,0.3)",
    edgeColor: "rgba(80,255,150,0)",
    borderColor: "rgba(80,255,150,0.8)",
    borderWidth: 2,
    outerGlow: "0 0 40px 15px rgba(80,255,150,0.5)",
    pulseDuration: 0.8,
    pulseIntensity: 1.5,
  },
  particles: {
    enabled: true,
    colors: ["#50ff96", "#80ffc0", "#ffffff"],
    count: 25,
    speed: 0.8,
    direction: "top",
    shape: "circle",
    sizeRange: [2, 4],
    twinkle: true,
    opacityRange: [0.4, 0.9],
  },
  animation: {
    shake: false,
    shakeIntensity: 0,
    scalePulse: true,
    scaleRange: [1, 1.05],
    repeat: 2,
    duration: 0.8,
  },
};

const criticalHit: VFXConfig = {
  variant: "critical-hit",
  category: "combat",
  glow: {
    centerColor: "rgba(255,220,50,0.9)",
    midColor: "rgba(255,180,50,0.5)",
    edgeColor: "rgba(255,150,50,0)",
    borderColor: "rgba(255,200,50,1)",
    borderWidth: 3,
    outerGlow: "0 0 60px 25px rgba(255,200,50,0.7)",
    pulseDuration: 0.3,
    pulseIntensity: 2.5,
  },
  particles: {
    enabled: true,
    colors: ["#ffdc32", "#ffffff", "#ff8000", "#ffff00"],
    count: 50,
    speed: 2.5,
    direction: "outside",
    shape: "star",
    sizeRange: [3, 7],
    twinkle: true,
    opacityRange: [0.6, 1],
  },
  animation: {
    shake: true,
    shakeIntensity: 10,
    scalePulse: true,
    scaleRange: [1, 1.15],
    repeat: 1,
    duration: 0.5,
  },
};

// ============================================================================
// MOVEMENT PRESETS
// ============================================================================

const moving: VFXConfig = {
  variant: "moving",
  category: "movement",
  glow: {
    centerColor: "rgba(100,200,255,0.3)",
    midColor: "rgba(100,200,255,0.15)",
    edgeColor: "rgba(100,200,255,0)",
    borderColor: "rgba(100,200,255,0.5)",
    borderWidth: 1,
    outerGlow: "0 0 20px 8px rgba(100,200,255,0.3)",
    pulseDuration: 0.5,
    pulseIntensity: 1.2,
  },
  particles: {
    enabled: true,
    colors: ["#64c8ff", "#a0e0ff"],
    count: 10,
    speed: 1,
    direction: "left",
    shape: "circle",
    sizeRange: [1, 2],
    twinkle: false,
    opacityRange: [0.2, 0.5],
  },
  animation: {
    shake: false,
    shakeIntensity: 0,
    scalePulse: false,
    scaleRange: [1, 1],
    repeat: Infinity,
    duration: 0.5,
  },
};

const dash: VFXConfig = {
  variant: "dash",
  category: "movement",
  glow: {
    centerColor: "rgba(150,220,255,0.5)",
    midColor: "rgba(150,220,255,0.25)",
    edgeColor: "rgba(150,220,255,0)",
    borderColor: "rgba(150,220,255,0.7)",
    borderWidth: 2,
    outerGlow: "0 0 35px 12px rgba(150,220,255,0.5)",
    pulseDuration: 0.3,
    pulseIntensity: 1.8,
  },
  particles: {
    enabled: true,
    colors: ["#96dcff", "#c0f0ff", "#ffffff"],
    count: 25,
    speed: 3,
    direction: "left",
    shape: "circle",
    sizeRange: [1, 3],
    twinkle: true,
    opacityRange: [0.3, 0.7],
  },
  animation: {
    shake: false,
    shakeIntensity: 0,
    scalePulse: false,
    scaleRange: [1, 1],
    repeat: 1,
    duration: 0.4,
  },
};

// ============================================================================
// STATUS PRESETS
// ============================================================================

const buff: VFXConfig = {
  variant: "buff",
  category: "status",
  glow: {
    centerColor: "rgba(100,255,200,0.5)",
    midColor: "rgba(100,255,200,0.25)",
    edgeColor: "rgba(100,255,200,0)",
    borderColor: "rgba(100,255,200,0.7)",
    borderWidth: 2,
    outerGlow: "0 0 30px 12px rgba(100,255,200,0.4)",
    pulseDuration: 1.5,
    pulseIntensity: 1.3,
  },
  particles: {
    enabled: true,
    colors: ["#64ffc8", "#a0ffe0", "#ffffff"],
    count: 15,
    speed: 0.5,
    direction: "top",
    shape: "circle",
    sizeRange: [1, 3],
    twinkle: true,
    opacityRange: [0.3, 0.7],
  },
  animation: {
    shake: false,
    shakeIntensity: 0,
    scalePulse: true,
    scaleRange: [1, 1.02],
    repeat: Infinity,
    duration: 1.5,
  },
};

const debuff: VFXConfig = {
  variant: "debuff",
  category: "status",
  glow: {
    centerColor: "rgba(150,50,150,0.5)",
    midColor: "rgba(150,50,150,0.25)",
    edgeColor: "rgba(150,50,150,0)",
    borderColor: "rgba(150,50,150,0.7)",
    borderWidth: 2,
    outerGlow: "0 0 30px 12px rgba(150,50,150,0.4)",
    pulseDuration: 1.5,
    pulseIntensity: 1.3,
  },
  particles: {
    enabled: true,
    colors: ["#963296", "#c864c8", "#800080"],
    count: 15,
    speed: 0.3,
    direction: "bottom",
    shape: "circle",
    sizeRange: [1, 3],
    twinkle: false,
    opacityRange: [0.3, 0.6],
  },
  animation: {
    shake: false,
    shakeIntensity: 0,
    scalePulse: true,
    scaleRange: [0.98, 1],
    repeat: Infinity,
    duration: 1.5,
  },
};

// ============================================================================
// PRESET REGISTRY & FACTORY
// ============================================================================

export const VFX_PRESETS: Record<VFXVariant, VFXConfig> = {
  // Enhancement tiers
  "enhancement-common": enhancementCommon,
  "enhancement-rare": enhancementRare,
  "enhancement-epic": enhancementEpic,
  "enhancement-legendary": enhancementLegendary,
  "enhancement-mythic": enhancementMythic,
  // Results
  success,
  fail,
  // Combat
  "attack-prep": attackPrep,
  "damage-received": damageReceived,
  "heal-received": healReceived,
  "critical-hit": criticalHit,
  // Movement
  moving,
  dash,
  // Status
  buff,
  debuff,
};

/**
 * Factory function to get VFX config by variant name
 */
export function getVFXPreset(variant: VFXVariant): VFXConfig {
  return VFX_PRESETS[variant];
}

/**
 * Get all presets for a category
 */
export function getPresetsByCategory(
  category: VFXConfig["category"],
): VFXConfig[] {
  return Object.values(VFX_PRESETS).filter(
    (preset) => preset.category === category,
  );
}

/**
 * Create custom config by merging with a base preset
 */
export function createCustomVFX(
  baseVariant: VFXVariant,
  overrides: Partial<{
    glow: Partial<GlowConfig>;
    particles: Partial<ParticleConfig>;
    animation: Partial<AnimationConfig>;
  }>,
): VFXConfig {
  const base = getVFXPreset(baseVariant);
  return {
    ...base,
    glow: { ...base.glow, ...overrides.glow },
    particles: { ...base.particles, ...overrides.particles },
    animation: { ...base.animation, ...overrides.animation },
  };
}
