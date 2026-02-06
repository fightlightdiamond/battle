// ============================================================================
// PIERCING THRUST SKILL HANDLER (SPEAR)
// ============================================================================

import type {
  CombatSkillHandler,
  CombatSkillContext,
  CombatSkillHandlerResult,
} from "../../types";
import { clampPosition, getDirectionSign } from "../../utils/position";

/**
 * Piercing Thrust (Spear): Deal 170% damage and pull enemy 1 cell closer
 */
export const piercingThrustHandler: CombatSkillHandler = {
  skillType: "piercing_thrust",
  trigger: "combat",

  execute(context: CombatSkillContext): CombatSkillHandlerResult {
    const { attackerPosition, defenderPosition, attackResult, gem } = context;
    const pullDistance = gem.effectParams.pullDistance ?? 1;

    // Pull direction is opposite of knockback - towards attacker
    const pullDirection = getDirectionSign(defenderPosition, attackerPosition);
    const newPosition = defenderPosition + pullDirection * pullDistance;
    const clampedPos = clampPosition(newPosition);

    // Ensure enemy stays at least 1 cell away from attacker
    let newDefenderPosition;
    if (attackerPosition < defenderPosition) {
      newDefenderPosition = Math.max(
        attackerPosition + 1,
        clampedPos,
      ) as typeof clampedPos;
    } else {
      newDefenderPosition = Math.min(
        attackerPosition - 1,
        clampedPos,
      ) as typeof clampedPos;
    }

    // Apply damage multiplier (170% = extra 70% damage)
    const damageMultiplier = gem.effectParams.damageMultiplier ?? 170;
    const bonusDamagePercent = (damageMultiplier - 100) / 100;
    const baseDamage = attackResult.defender.maxHp - attackResult.defenderNewHp;
    const bonusDamage = Math.floor(baseDamage * bonusDamagePercent);

    return {
      defenderNewPosition: newDefenderPosition,
      defenderNewHp: Math.max(0, attackResult.defenderNewHp - bonusDamage),
    };
  },
};
