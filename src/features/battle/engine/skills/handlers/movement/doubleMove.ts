// ============================================================================
// DOUBLE MOVE SKILL HANDLER
// ============================================================================

import type {
  MovementSkillHandler,
  MovementSkillContext,
  MovementSkillHandlerResult,
} from "../../types";
import { clampPosition } from "../../utils/position";

/**
 * Double Move: Move 2 cells instead of 1
 * Requirements: 5.1, 5.2
 */
export const doubleMoveHandler: MovementSkillHandler = {
  skillType: "double_move",
  trigger: "movement",

  execute(context: MovementSkillContext): MovementSkillHandlerResult {
    const { currentPosition, moveDirection, gem } = context;
    const moveDistance = gem.effectParams.moveDistance ?? 2;
    const newPosition = currentPosition + moveDirection * moveDistance;

    return {
      finalPosition: clampPosition(newPosition),
    };
  },
};
