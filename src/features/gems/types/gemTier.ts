// ============================================================================
// GEM TIER TYPES
// ============================================================================

import { type Gem } from "./gem";

/**
 * Gem tier enumeration - progression levels for gems
 */
export type GemTier = "basic" | "advanced" | "master" | "legendary";

/**
 * Tier order for layout positioning and validation
 * Lower number = lower tier
 */
export const TIER_ORDER: Record<GemTier, number> = {
  basic: 0,
  advanced: 1,
  master: 2,
  legendary: 3,
};

/**
 * All available tiers in order
 */
export const ALL_TIERS: GemTier[] = [
  "basic",
  "advanced",
  "master",
  "legendary",
];

/**
 * Default tier for new gems
 */
export const DEFAULT_TIER: GemTier = "basic";

/**
 * Extended Gem interface with tier information
 */
export interface TieredGem extends Gem {
  tier: GemTier;
}

/**
 * Check if a tier is higher than another
 */
export function isTierHigher(tier1: GemTier, tier2: GemTier): boolean {
  return TIER_ORDER[tier1] > TIER_ORDER[tier2];
}

/**
 * Check if a tier is lower than another
 */
export function isTierLower(tier1: GemTier, tier2: GemTier): boolean {
  return TIER_ORDER[tier1] < TIER_ORDER[tier2];
}

/**
 * Get the next tier (returns null if already at legendary)
 */
export function getNextTier(tier: GemTier): GemTier | null {
  const currentOrder = TIER_ORDER[tier];
  const nextTier = ALL_TIERS.find((t) => TIER_ORDER[t] === currentOrder + 1);
  return nextTier ?? null;
}

/**
 * Get the previous tier (returns null if already at basic)
 */
export function getPreviousTier(tier: GemTier): GemTier | null {
  const currentOrder = TIER_ORDER[tier];
  const prevTier = ALL_TIERS.find((t) => TIER_ORDER[t] === currentOrder - 1);
  return prevTier ?? null;
}
