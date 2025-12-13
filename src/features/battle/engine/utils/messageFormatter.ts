import type { DamageResult } from "../calculations/DamageCalculator";
import { COMBAT_VISUAL_CONFIG } from "../core/combatVisualConfig";

// ============================================================================
// MESSAGE FORMATTER TYPES
// ============================================================================

/**
 * Parameters for formatting a battle message
 */
export interface FormatMessageParams {
  /** Name of the attacking card/character */
  attacker: string;
  /** Name of the defending card/character */
  defender: string;
  /** Damage calculation result with full breakdown */
  damageResult: DamageResult;
}

// ============================================================================
// MESSAGE FORMATTER IMPLEMENTATION
// ============================================================================

/**
 * Format a battle message based on the damage result.
 * Selects the appropriate template based on crit and lifesteal status,
 * then replaces placeholders with actual values.
 *
 * Template placeholders:
 * - {attacker}: Name of the attacker
 * - {defender}: Name of the defender
 * - {damage}: Final damage amount
 * - {critBonus}: Extra damage from crit
 * - {healAmount}: HP healed from lifesteal
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 *
 * @param params - The format message parameters
 * @returns Formatted battle message string
 */
export function formatBattleMessage(params: FormatMessageParams): string {
  const { attacker, defender, damageResult } = params;
  const { finalDamage, isCrit, critBonus, lifestealAmount } = damageResult;

  const templates = COMBAT_VISUAL_CONFIG.messageTemplates;

  // Select appropriate template based on damage result
  let template: string;
  if (isCrit && lifestealAmount > 0) {
    template = templates.attackWithCritAndLifesteal;
  } else if (isCrit) {
    template = templates.attackWithCrit;
  } else if (lifestealAmount > 0) {
    template = templates.attackWithLifesteal;
  } else {
    template = templates.attack;
  }

  // Replace placeholders with actual values
  return template
    .replace("{attacker}", attacker)
    .replace("{defender}", defender)
    .replace("{damage}", String(finalDamage))
    .replace("{critBonus}", String(critBonus))
    .replace("{healAmount}", String(lifestealAmount));
}
