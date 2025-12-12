import type { Combatant, AttackResult } from "../core/types";
import { type CombatConfig, DEFAULT_COMBAT_CONFIG } from "../core/config";
import {
  createDamageCalculator,
  type DamageCalculator,
} from "../calculations/DamageCalculator";

// ============================================================================
// COMBAT SYSTEM INTERFACE
// ============================================================================

export interface CombatSystem {
  readonly calculator: DamageCalculator;
  calculateAttack(attacker: Combatant, defender: Combatant): AttackResult;
  applyDamage(combatant: Combatant, damage: number): Combatant;
}

// ============================================================================
// COMBAT SYSTEM IMPLEMENTATION
// ============================================================================

/**
 * Creates a CombatSystem instance for handling combat logic.
 *
 * @param config - Combat configuration (optional, uses defaults)
 */
export function createCombatSystem(
  config: CombatConfig = DEFAULT_COMBAT_CONFIG
): CombatSystem {
  const calculator = createDamageCalculator(config);

  return {
    calculator,

    /**
     * Calculate the result of an attack from attacker to defender.
     */
    calculateAttack(attacker: Combatant, defender: Combatant): AttackResult {
      // Calculate damage using attacker's ATK (Requirements 2.3)
      const damage = calculator.calculate({
        attackerAtk: attacker.baseStats.atk,
        defenderDef: defender.baseStats.def,
      });

      // Calculate new HP: max(0, currentHp - damage) (Property 7)
      const defenderNewHp = Math.max(0, defender.currentHp - damage);

      // Check if this is a knockout (Requirements 2.4)
      const isKnockout = defenderNewHp <= 0;

      // Check if damage exceeds critical threshold (Property 11)
      const isCritical = calculator.isCriticalDamage(damage, defender.maxHp);

      // Create updated defender with new HP (immutable)
      const updatedDefender: Combatant = {
        ...defender,
        currentHp: defenderNewHp,
        isDefeated: isKnockout,
      };

      return {
        attacker,
        defender: updatedDefender,
        damage,
        defenderNewHp,
        isCritical,
        isKnockout,
      };
    },

    /**
     * Apply damage to a combatant, returning a new combatant with updated HP.
     * This is an immutable operation - the original combatant is not modified.
     *
     * @param combatant - The combatant to apply damage to
     * @param damage - The amount of damage to apply
     * @returns New Combatant with updated HP (Property 7: HP = max(0, H - D))
     */
    applyDamage(combatant: Combatant, damage: number): Combatant {
      // Calculate new HP: max(0, currentHp - damage) (Property 7)
      const newHp = Math.max(0, combatant.currentHp - damage);

      // Return new combatant with updated HP (immutable)
      return {
        ...combatant,
        currentHp: newHp,
        isDefeated: newHp <= 0,
      };
    },
  };
}

// Default singleton instance (using default config)
export const combatSystem = createCombatSystem();
