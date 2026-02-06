// ============================================================================
// LEAP STRIKE SKILL HANDLER
// ============================================================================

import type {
  MovementSkillHandler,
  MovementSkillContext,
  MovementSkillHandlerResult,
} from "../../types";
import { clampPosition, getDirectionSign } from "../../utils/position";

/**
 * Leap Strike: Jump to enemy if within range and knock them back
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export const leapStrikeHandler: MovementSkillHandler = {
  skillType: "leap_strike",
  trigger: "movement",

  execute(context: MovementSkillContext): MovementSkillHandlerResult {
    const { currentPosition, targetPosition, enemyPosition, gem } = context;
    const leapRange = gem.effectParams.leapRange ?? 2;
    const leapKnockback = gem.effectParams.leapKnockback ?? 2;
    const distanceToEnemy = Math.abs(currentPosition - enemyPosition);

    // Check if enemy is within leap range
    if (distanceToEnemy <= leapRange && distanceToEnemy > 0) {
      // Move to position adjacent to enemy
      const directionToEnemy = getDirectionSign(currentPosition, enemyPosition);
      const adjacentPosition = enemyPosition - directionToEnemy;
      const finalPosition = clampPosition(adjacentPosition);

      // Knock enemy back
      const knockbackDirection = getDirectionSign(finalPosition, enemyPosition);
      const newEnemyPosition =
        enemyPosition + knockbackDirection * leapKnockback;

      return {
        finalPosition,
        enemyNewPosition: clampPosition(newEnemyPosition),
      };
    }

    // No leap occurred, return original target
    return {
      finalPosition: targetPosition,
    };
  },
};
