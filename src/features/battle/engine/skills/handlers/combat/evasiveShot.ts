// ============================================================================
// EVASIVE SHOT SKILL HANDLER (BOW)
// ============================================================================

import type {
  CombatSkillHandler,
  CombatSkillContext,
  CombatSkillHandlerResult,
} from "../../types";
import { clampPosition, getDirectionSign } from "../../utils/position";

/**
 * Evasive Shot (Bow): Deal 250% damage and retreat 1 cell
 */
export const evasiveShotHandler: CombatSkillHandler = {
  skillType: "evasive_shot",
  trigger: "combat",

  execute(context: CombatSkillContext): CombatSkillHandlerResult {
    const { attackerPosition, defenderPosition, attackResult, gem } = context;
    const retreatDistance = gem.effectParams.retreatDistance ?? 1;
    const retreatDirection = getDirectionSign(
      defenderPosition,
      attackerPosition,
    );
    const newPosition = attackerPosition + retreatDirection * retreatDistance;

    // Apply damage multiplier (250% = extra 150% damage)
    const damageMultiplier = gem.effectParams.damageMultiplier ?? 250;
    const bonusDamagePercent = (damageMultiplier - 100) / 100;
    const baseDamage = attackResult.defender.maxHp - attackResult.defenderNewHp;
    const bonusDamage = Math.floor(baseDamage * bonusDamagePercent);

    return {
      attackerNewPosition: clampPosition(newPosition),
      defenderNewHp: Math.max(0, attackResult.defenderNewHp - bonusDamage),
    };
  },
};
