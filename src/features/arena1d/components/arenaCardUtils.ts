/**
 * Utility functions for ArenaCardWithStats component
 * Requirements: 6.2, 6.3
 */

import { calculateHpPercentage } from "@/features/battle/services/battleService";

/** Threshold for danger state (25% HP) */
export const DANGER_THRESHOLD = 25;

/**
 * Check if HP is in danger state (below 25%)
 * Property 10: Danger state triggers below 25% HP
 */
export function isDangerState(currentHp: number, maxHp: number): boolean {
  if (maxHp <= 0) return false;
  const percentage = calculateHpPercentage(currentHp, maxHp);
  return percentage < DANGER_THRESHOLD;
}

/**
 * Calculate HP bar percentage (0-100)
 * Property 9: HP bar reflects current HP
 */
export function getHpBarPercentage(currentHp: number, maxHp: number): number {
  return calculateHpPercentage(currentHp, maxHp);
}
