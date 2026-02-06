// ============================================================================
// EXECUTE SKILL HANDLER
// ============================================================================

import type {
  CombatSkillHandler,
  CombatSkillContext,
  CombatSkillHandlerResult,
} from "../../types";

/**
 * Execute: Kill defender if HP below threshold after damage
 * Requirements: 7.1, 7.2
 */
export const executeHandler: CombatSkillHandler = {
  skillType: "execute",
  trigger: "combat",

  execute(context: CombatSkillContext): CombatSkillHandlerResult {
    const { attackResult, gem } = context;
    const executeThreshold = gem.effectParams.executeThreshold ?? 15;
    const defenderMaxHp = attackResult.defender.maxHp;
    const currentHp = attackResult.defenderNewHp;
    const hpPercentage = (currentHp / defenderMaxHp) * 100;

    // Only execute if defender is still alive and below threshold
    if (currentHp > 0 && hpPercentage < executeThreshold) {
      return {
        defenderNewHp: 0,
      };
    }

    return {};
  },
};
