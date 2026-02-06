// ============================================================================
// STUNNING SLASH SKILL HANDLER (SWORD & SHIELD)
// ============================================================================

import type {
  CombatSkillHandler,
  CombatSkillContext,
  CombatSkillHandlerResult,
} from "../../types";

/**
 * Stunning Slash (Sword & Shield): 180% damage + 20% stun chance
 */
export const stunningSlashHandler: CombatSkillHandler = {
  skillType: "stunning_slash",
  trigger: "combat",

  execute(context: CombatSkillContext): CombatSkillHandlerResult {
    const { attackResult, gem } = context;

    // Apply damage multiplier (180% = extra 80% damage)
    const damageMultiplier = gem.effectParams.damageMultiplier ?? 180;
    const bonusDamagePercent = (damageMultiplier - 100) / 100;
    const baseDamage = attackResult.defender.maxHp - attackResult.defenderNewHp;
    const bonusDamage = Math.floor(baseDamage * bonusDamagePercent);

    // Stun effect is handled by the battle system (future implementation)
    // The stunChance and stunDuration are in effectParams for the battle system to use

    return {
      defenderNewHp: Math.max(0, attackResult.defenderNewHp - bonusDamage),
    };
  },
};
