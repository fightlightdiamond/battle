// ============================================================================
// SHIELD BASH SKILL HANDLER (SWORD & SHIELD)
// ============================================================================

import type {
  CombatSkillHandler,
  CombatSkillContext,
  CombatSkillHandlerResult,
} from "../../types";
import { getDirectionSign } from "../../utils/position";
import { calculateKnockbackWithWallCollision } from "../../utils/wallCollision";
import type { CellIndex } from "@/features/arena1d/types/arena";

/**
 * Shield Bash (Sword & Shield): Push enemy 1 cell + follow + 120% damage
 */
export const shieldBashHandler: CombatSkillHandler = {
  skillType: "shield_bash",
  trigger: "combat",

  execute(context: CombatSkillContext): CombatSkillHandlerResult {
    const { attackerPosition, defenderPosition, attackResult, gem } = context;
    const knockbackDistance = gem.effectParams.knockbackDistance ?? 1;
    const followPush = gem.effectParams.followPush ?? true;

    // Push defender back with wall collision
    const knockbackDirection = getDirectionSign(
      attackerPosition,
      defenderPosition,
    );

    const wallResult = calculateKnockbackWithWallCollision(
      defenderPosition,
      knockbackDirection,
      knockbackDistance,
    );

    // If followPush is true, attacker moves to defender's old position
    let newAttackerPosition: CellIndex | undefined;
    if (followPush) {
      newAttackerPosition = defenderPosition as CellIndex;
    }

    // Apply damage multiplier (120% = extra 20% damage)
    const damageMultiplier = gem.effectParams.damageMultiplier ?? 120;
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
