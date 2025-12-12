import type { DamageCalculationInput } from "../core/types";
import { type CombatConfig, DEFAULT_COMBAT_CONFIG } from "../core/config";

// ============================================================================
// DAMAGE CALCULATOR INTERFACE
// ============================================================================

export interface DamageCalculator {
  readonly config: CombatConfig;
  calculate(input: DamageCalculationInput): number;
  calculateWithDef(atk: number, def: number): number;
  rollCritical(critRate: number): boolean;
  applyCritical(damage: number, critDamage: number): number;
  isCriticalDamage(damage: number, defenderMaxHp: number): boolean;
}

// ============================================================================
// DAMAGE CALCULATOR IMPLEMENTATION
// ============================================================================

/**
 * Creates a DamageCalculator instance for computing battle damage.
 *
 * Current formula (simple): damage = ATK
 * Future formula (with DEF): damage = ATK × (1 - DEF/(DEF + defScalingFactor))
 *
 * @param config - Combat configuration (optional, uses defaults)
 */
export function createDamageCalculator(
  config: CombatConfig = DEFAULT_COMBAT_CONFIG
): DamageCalculator {
  return {
    config,

    /**
     * Calculate damage based on config.
     * If useDefense is true, uses defense formula.
     * Otherwise, uses simple ATK-based damage.
     */
    calculate(input: DamageCalculationInput): number {
      const { attackerAtk, defenderDef } = input;

      if (config.useDefense && defenderDef !== undefined) {
        return this.calculateWithDef(attackerAtk, defenderDef);
      }

      // Simple damage = ATK (as per Requirements 2.3)
      return Math.max(config.minDamage, Math.floor(attackerAtk));
    },

    /**
     * Calculate damage with defense reduction.
     * Formula: damage = ATK × (1 - DEF/(DEF + defScalingFactor))
     */
    calculateWithDef(atk: number, def: number): number {
      const defReduction = def / (def + config.defScalingFactor);
      const damage = atk * (1 - defReduction);
      return Math.max(config.minDamage, Math.floor(damage));
    },

    /**
     * Roll for critical hit based on crit rate.
     */
    rollCritical(critRate: number): boolean {
      return Math.random() < critRate;
    },

    /**
     * Apply critical damage multiplier.
     */
    applyCritical(damage: number, critDamage: number): number {
      return Math.floor(damage * critDamage);
    },

    /**
     * Check if damage exceeds critical threshold.
     */
    isCriticalDamage(damage: number, defenderMaxHp: number): boolean {
      return damage > defenderMaxHp * config.criticalDamageThreshold;
    },
  };
}

// Default singleton instance
export const damageCalculator = createDamageCalculator();
