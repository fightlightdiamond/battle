// ============================================================================
// DAMAGE IMMUNITY SKILL HANDLER (SWORD & SHIELD)
// ============================================================================

import type { CombatSkillHandler, CombatSkillHandlerResult } from "../../types";

/**
 * Damage Immunity (Sword & Shield Passive): Negate all damage
 * This skill is a defensive skill - it should be processed on the defender side
 * When this activates, the defender takes no damage from the attack
 */
export const damageImmunityHandler: CombatSkillHandler = {
  skillType: "damage_immunity",
  trigger: "combat",

  execute(): CombatSkillHandlerResult {
    // This skill is processed differently - it needs to be checked
    // when the card is being attacked, not when attacking
    // For now, just return empty result (actual immunity handled by battle system)
    return {};
  },
};
