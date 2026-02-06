// ============================================================================
// WHIRLWIND CHARGE SKILL HANDLER (SPEAR)
// ============================================================================

import type {
  CombatSkillHandler,
  CombatSkillContext,
  CombatSkillHandlerResult,
} from "../../types";
import { clampPosition, getDirectionSign } from "../../utils/position";
import { calculateKnockbackWithWallCollision } from "../../utils/wallCollision";

/**
 * Whirlwind Charge (Spear): Leap to enemy, 200% damage + push 2 cells
 */
export const whirlwindChargeHandler: CombatSkillHandler = {
  skillType: "whirlwind_charge",
  trigger: "combat",

  execute(context: CombatSkillContext): CombatSkillHandlerResult {
    const { attackerPosition, defenderPosition, attackResult, gem } = context;
    const chargeKnockback = gem.effectParams.chargeKnockback ?? 2;

    // Move attacker to position adjacent to where defender was
    const directionToDefender = getDirectionSign(
      attackerPosition,
      defenderPosition,
    );
    const adjacentToDefender = defenderPosition - directionToDefender;
    const newAttackerPosition = clampPosition(adjacentToDefender);

    // Push defender back 2 cells from new attacker position with wall collision
    const knockbackDirection = getDirectionSign(
      newAttackerPosition,
      defenderPosition,
    );

    const wallResult = calculateKnockbackWithWallCollision(
      defenderPosition,
      knockbackDirection,
      chargeKnockback,
    );

    // Apply damage multiplier (200% = extra 100% damage)
    const damageMultiplier = gem.effectParams.damageMultiplier ?? 200;
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
      attackerNewPosition: newAttackerPosition,
      defenderNewPosition: wallResult.finalPosition,
      defenderNewHp: Math.max(0, attackResult.defenderNewHp - bonusDamage),
      wallCollision,
    };
  },
};
