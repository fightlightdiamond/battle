// ============================================================================
// RETREAT SKILL HANDLER
// ============================================================================

import type {
  CombatSkillHandler,
  CombatSkillContext,
  CombatSkillHandlerResult,
} from "../../types";
import { clampPosition, getDirectionSign } from "../../utils/position";

/**
 * Retreat: Move attacker 1 cell backward (away from defender)
 * Requirements: 4.1, 4.2
 */
export const retreatHandler: CombatSkillHandler = {
  skillType: "retreat",
  trigger: "combat",

  execute(context: CombatSkillContext): CombatSkillHandlerResult {
    const { attackerPosition, defenderPosition, gem } = context;
    const retreatDistance = gem.effectParams.knockbackDistance ?? 1;
    const retreatDirection = getDirectionSign(
      defenderPosition,
      attackerPosition,
    );
    const newPosition = attackerPosition + retreatDirection * retreatDistance;

    return {
      attackerNewPosition: clampPosition(newPosition),
    };
  },
};
