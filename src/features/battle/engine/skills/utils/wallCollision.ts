// ============================================================================
// WALL COLLISION UTILITIES
// ============================================================================

import type { CellIndex } from "@/features/arena1d/types/arena";
import {
  clampPosition,
  isAtEdge,
  MIN_POSITION,
  MAX_POSITION,
} from "./position";

/**
 * Wall collision result when knockback occurs
 */
export interface WallCollisionResult {
  finalPosition: CellIndex;
  pushedToEdge: boolean; // Was pushed to the edge (50% bonus damage)
  wallSlam: boolean; // Was already at edge, couldn't move (guaranteed crit = 100% bonus)
  bonusDamageMultiplier: number; // 0 = no bonus, 0.5 = 50% bonus, 1.0 = 100% bonus (crit)
}

/**
 * Calculate knockback with wall collision effects
 * - If pushed to arena edge: 50% bonus damage
 * - If already at edge and can't be pushed: guaranteed crit (100% bonus damage)
 */
export function calculateKnockbackWithWallCollision(
  currentPosition: number,
  knockbackDirection: number,
  knockbackDistance: number,
): WallCollisionResult {
  const targetPosition =
    currentPosition + knockbackDirection * knockbackDistance;
  const clampedPosition = clampPosition(targetPosition);

  // Check if already at edge before knockback
  const wasAtEdge = isAtEdge(currentPosition);
  const wouldBePushedBeyondEdge = targetPosition !== clampedPosition;

  // Wall slam: already at edge AND knockback direction would push further into wall
  const wallSlam =
    wasAtEdge &&
    ((currentPosition === MIN_POSITION && knockbackDirection < 0) ||
      (currentPosition === MAX_POSITION && knockbackDirection > 0));

  // Pushed to edge: wasn't at edge, but now is at edge after knockback
  const pushedToEdge =
    !wasAtEdge && isAtEdge(clampedPosition) && wouldBePushedBeyondEdge;

  // Calculate bonus damage multiplier
  let bonusDamageMultiplier = 0;
  if (wallSlam) {
    bonusDamageMultiplier = 1.0; // 100% bonus (guaranteed crit)
  } else if (pushedToEdge) {
    bonusDamageMultiplier = 0.5; // 50% bonus
  }

  return {
    finalPosition: clampedPosition,
    pushedToEdge,
    wallSlam,
    bonusDamageMultiplier,
  };
}

/**
 * Apply wall collision bonus damage to base damage
 */
export function applyWallCollisionDamage(
  baseDamage: number,
  wallResult: WallCollisionResult,
): { bonusDamage: number; totalDamage: number } {
  const bonusDamage = Math.floor(baseDamage * wallResult.bonusDamageMultiplier);
  return {
    bonusDamage,
    totalDamage: baseDamage + bonusDamage,
  };
}
