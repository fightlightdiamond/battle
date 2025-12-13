import type { Combatant, AttackResult } from "../core/types";
import { type CombatConfig, DEFAULT_COMBAT_CONFIG } from "../core/config";
import {
  createDamageCalculator,
  type DamageCalculator,
  type DamageResult,
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
     * Uses calculateWithDetails() for full damage breakdown including crit and lifesteal.
     * Includes lifesteal mechanic: heal = damage × (lifesteal/100), capped at maxHp
     *
     * Requirements: 2.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3
     */
    calculateAttack(attacker: Combatant, defender: Combatant): AttackResult {
      // Calculate damage with full breakdown using calculateWithDetails (Requirements 4.1, 4.2, 4.3)
      const damageResult: DamageResult = calculator.calculateWithDetails({
        attackerAtk: attacker.baseStats.atk,
        defenderDef: defender.baseStats.def,
        armorPen: attacker.baseStats.armorPen,
        critChance: attacker.baseStats.critChance,
        critDamage: attacker.baseStats.critDamage,
        lifesteal: attacker.baseStats.lifesteal ?? 0,
      });

      const { finalDamage, isCrit, lifestealAmount } = damageResult;

      // Calculate new HP: max(0, currentHp - damage) (Property 7)
      const defenderNewHp = Math.max(0, defender.currentHp - finalDamage);

      // Check if this is a knockout (Requirements 2.4)
      const isKnockout = defenderNewHp <= 0;

      // Check if damage exceeds critical threshold OR crit was rolled (Property 11)
      const isCritical =
        isCrit || calculator.isCriticalDamage(finalDamage, defender.maxHp);

      // Lifesteal heal is already calculated in damageResult, cap at maxHp (Requirement 5.3)
      const lifestealHeal = lifestealAmount;
      const attackerNewHp = Math.min(
        attacker.maxHp,
        attacker.currentHp + lifestealHeal
      );

      // Create updated defender with new HP (immutable)
      const updatedDefender: Combatant = {
        ...defender,
        currentHp: defenderNewHp,
        isDefeated: isKnockout,
      };

      // Create updated attacker with lifesteal healing (immutable)
      const updatedAttacker: Combatant = {
        ...attacker,
        currentHp: attackerNewHp,
      };

      return {
        attacker: updatedAttacker,
        defender: updatedDefender,
        damage: finalDamage,
        defenderNewHp,
        attackerNewHp,
        isCritical,
        isKnockout,
        lifestealHeal,
        // Include full damage breakdown for UI components (Requirements 4.1)
        damageResult: {
          finalDamage: damageResult.finalDamage,
          baseDamage: damageResult.baseDamage,
          isCrit: damageResult.isCrit,
          critBonus: damageResult.critBonus,
          lifestealAmount: damageResult.lifestealAmount,
        },
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
