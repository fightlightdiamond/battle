// ============================================================================
// KNOCKBACK SKILL HANDLER
// ============================================================================

import type {
  CombatSkillHandler,
  CombatSkillContext,
  CombatSkillHandlerResult,
} from "../../types";
import { getDirectionSign } from "../../utils/position";
import { calculateKnockbackWithWallCollision } from "../../utils/wallCollision";

/**
 * Knockback: Push defender 1 cell away from attacker
 * Requirements: 3.1, 3.2
 */
export const knockbackHandler: CombatSkillHandler = {
  skillType: "knockback",
  trigger: "combat",

  execute(context: CombatSkillContext): CombatSkillHandlerResult {
    const { attackerPosition, defenderPosition, attackResult, gem } = context;
    const knockbackDistance = gem.effectParams.knockbackDistance ?? 1;
    const knockbackDirection = getDirectionSign(
      attackerPosition,
      defenderPosition,
    );

    // Calculate knockback with wall collision
    const wallResult = calculateKnockbackWithWallCollision(
      defenderPosition,
      knockbackDirection,
      knockbackDistance,
    );

    // Apply wall collision bonus damage
    let wallCollision;
    let defenderNewHp = attackResult.defenderNewHp;

    if (wallResult.bonusDamageMultiplier > 0) {
      const baseDamage =
        attackResult.defender.maxHp - attackResult.defenderNewHp;
      const wallBonusDamage = Math.floor(
        baseDamage * wallResult.bonusDamageMultiplier,
      );
      defenderNewHp = Math.max(0, defenderNewHp - wallBonusDamage);

      wallCollision = {
        pushedToEdge: wallResult.pushedToEdge,
        wallSlam: wallResult.wallSlam,
        bonusDamage: wallBonusDamage,
      };
    }

    return {
      defenderNewPosition: wallResult.finalPosition,
      defenderNewHp,
      wallCollision,
    };
  },
};
