// ============================================================================
// POWER SHOT SKILL HANDLER (BOW)
// ============================================================================

import type {
  CombatSkillHandler,
  CombatSkillContext,
  CombatSkillHandlerResult,
} from "../../types";
import { getDirectionSign } from "../../utils/position";
import { calculateKnockbackWithWallCollision } from "../../utils/wallCollision";

/**
 * Power Shot (Bow): Deal 150% damage and knockback 1 cell
 */
export const powerShotHandler: CombatSkillHandler = {
  skillType: "power_shot",
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

    // Apply damage multiplier (150% = extra 50% damage)
    const damageMultiplier = gem.effectParams.damageMultiplier ?? 150;
    const bonusDamagePercent = (damageMultiplier - 100) / 100;
    const baseDamage = attackResult.defender.maxHp - attackResult.defenderNewHp;
    let bonusDamage = Math.floor(baseDamage * bonusDamagePercent);

    // Apply wall collision bonus damage
    let wallCollision;
    if (wallResult.bonusDamageMultiplier > 0) {
      const wallBonusDamage = Math.floor(
        baseDamage * wallResult.bonusDamageMultiplier,
      );
      bonusDamage += wallBonusDamage;

      wallCollision = {
        pushedToEdge: wallResult.pushedToEdge,
        wallSlam: wallResult.wallSlam,
        bonusDamage: wallBonusDamage,
      };
    }

    return {
      defenderNewPosition: wallResult.finalPosition,
      defenderNewHp: Math.max(0, attackResult.defenderNewHp - bonusDamage),
      wallCollision,
    };
  },
};
