import type { DamageCalculationInput } from "../core/types";
import { type CombatConfig, DEFAULT_COMBAT_CONFIG } from "../core/config";

// ============================================================================
// DAMAGE CALCULATOR INTERFACE
// ============================================================================

export interface DamageCalculator {
  readonly config: CombatConfig;
  calculate(input: DamageCalculationInput): number;
  calculateWithDef(atk: number, def: number, armorPen?: number): number;
  calculateEffectiveDef(def: number, armorPen: number): number;
  rollCritical(critChance: number): boolean;
  applyCritical(damage: number, critDamage: number): number;
  isCriticalDamage(damage: number, defenderMaxHp: number): boolean;
}

// ============================================================================
// DAMAGE CALCULATOR IMPLEMENTATION
// ============================================================================

/**
 * Creates a DamageCalculator instance for computing battle damage.
 *
 * Damage formula with defense:
 *   effectiveDef = DEF × (1 - armorPen/100)
 *   damage = ATK × skillMultiplier × (1 - effectiveDef/(effectiveDef + defScalingFactor))
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
     * If useDefense is true, uses defense formula with armor penetration.
     * Otherwise, uses simple ATK-based damage.
     */
    calculate(input: DamageCalculationInput): number {
      const {
        attackerAtk,
        defenderDef,
        skillMultiplier = 1,
        armorPen = 0,
      } = input;

      // Apply skill multiplier to base ATK
      const baseDamage = attackerAtk * skillMultiplier;

      if (config.useDefense && defenderDef !== undefined) {
        return this.calculateWithDef(baseDamage, defenderDef, armorPen);
      }

      // Simple damage = ATK × skillMultiplier (minimum 1)
      return Math.max(config.minDamage, Math.floor(baseDamage));
    },

    /**
     * Calculate effective defense after armor penetration.
     * Formula: effectiveDef = DEF × (1 - armorPen/100)
     *
     * Requirements: 2.3, 4.2
     */
    calculateEffectiveDef(def: number, armorPen: number): number {
      return def * (1 - armorPen / 100);
    },

    /**
     * Calculate damage with defense reduction and armor penetration.
     * Formula:
     *   effectiveDef = DEF × (1 - armorPen/100)
     *   damage = ATK × (1 - effectiveDef/(effectiveDef + defScalingFactor))
     *
     * Requirements: 1.4, 2.3, 4.2, 4.3
     */
    calculateWithDef(atk: number, def: number, armorPen: number = 0): number {
      const effectiveDef = this.calculateEffectiveDef(def, armorPen);
      const defReduction =
        effectiveDef / (effectiveDef + config.defScalingFactor);
      const damage = atk * (1 - defReduction);
      return Math.max(config.minDamage, Math.floor(damage));
    },

    /**
     * Roll for critical hit based on crit chance.
     * critChance is 0-100 (percentage)
     *
     * Requirements: 2.1
     */
    rollCritical(critChance: number): boolean {
      return Math.random() < critChance / 100;
    },

    /**
     * Apply critical damage multiplier.
     * critDamage is 100+ (150 = 1.5x multiplier)
     *
     * Requirements: 2.2, 4.4
     */
    applyCritical(damage: number, critDamage: number): number {
      return Math.floor(damage * (critDamage / 100));
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
