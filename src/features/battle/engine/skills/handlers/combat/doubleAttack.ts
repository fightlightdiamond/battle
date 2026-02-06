// ============================================================================
// DOUBLE ATTACK SKILL HANDLER
// ============================================================================

import type {
  CombatSkillHandler,
  CombatSkillContext,
  CombatSkillHandlerResult,
} from "../../types";

/**
 * Double Attack: Perform a second attack if defender survives
 * Requirements: 6.1, 6.2
 */
export const doubleAttackHandler: CombatSkillHandler = {
  skillType: "double_attack",
  trigger: "combat",

  execute(context: CombatSkillContext): CombatSkillHandlerResult {
    const { attacker, defender, attackResult, performAttack } = context;

    // Only perform second attack if defender is still alive
    if (attackResult.defenderNewHp > 0 && performAttack) {
      const secondAttack = performAttack(attacker, defender);
      return {
        defenderNewHp: secondAttack.defenderNewHp,
        additionalAttacks: [secondAttack],
      };
    }

    return {};
  },
};
