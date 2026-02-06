// ============================================================================
// SPEED BOOST SKILL HANDLER
// ============================================================================

import type {
  MovementSkillHandler,
  MovementSkillContext,
  MovementSkillHandlerResult,
} from "../../types";
import { clampPosition } from "../../utils/position";

/**
 * Speed Boost (Sword & Shield Passive): Move extra 1 cell
 * 50% chance to increase movement by 1 cell
 */
export const speedBoostHandler: MovementSkillHandler = {
  skillType: "speed_boost",
  trigger: "movement",

  execute(context: MovementSkillContext): MovementSkillHandlerResult {
    const { targetPosition, moveDirection, gem } = context;
    const extraMove = gem.effectParams.moveDistance ?? 1;
    const newPosition = targetPosition + moveDirection * extraMove;

    return {
      finalPosition: clampPosition(newPosition),
    };
  },
};
