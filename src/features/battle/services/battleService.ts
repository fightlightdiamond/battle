/**
 * Battle Service - Core combat logic for the Card Battle System
 * Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 8.2
 */

import type {
  BattleCard,
  AttackResult,
  BattleResult,
  HpBarColor,
} from "../types";
import { HP_BAR_COLORS, HP_THRESHOLDS, BATTLE_RESULTS } from "../types";

/**
 * Calculate HP percentage
 * @param currentHp - Current HP value
 * @param maxHp - Maximum HP value
 * @returns Percentage as a number (0-100)
 */
export function calculateHpPercentage(
  currentHp: number,
  maxHp: number
): number {
  if (maxHp <= 0) return 0;
  const percentage = (currentHp / maxHp) * 100;
  return Math.max(0, Math.min(100, percentage));
}

/**
 * Get HP bar color based on percentage
 * Property 5: HP Bar Color Thresholds
 * - P > 50 → 'green'
 * - 25 ≤ P ≤ 50 → 'yellow'
 * - P < 25 → 'red'
 *
 * @param percentage - HP percentage (0-100)
 * @returns Color string for HP bar
 */
export function getHpBarColor(percentage: number): HpBarColor {
  if (percentage > HP_THRESHOLDS.HIGH) {
    return HP_BAR_COLORS.GREEN;
  }
  if (percentage >= HP_THRESHOLDS.LOW) {
    return HP_BAR_COLORS.YELLOW;
  }
  return HP_BAR_COLORS.RED;
}

/**
 * Calculate attack result
 * Property 3: Attack Damage Equals ATK
 * Property 11: Critical Damage Threshold (damage > 30% of defender's maxHp)
 *
 * @param attacker - The attacking card
 * @param defender - The defending card
 * @returns AttackResult with damage, new HP, critical and knockout flags
 */
export function calculateAttack(
  attacker: BattleCard,
  defender: BattleCard
): AttackResult {
  const damage = attacker.atk;
  const defenderNewHp = Math.max(0, defender.currentHp - damage);
  const isCritical = damage > defender.maxHp * 0.3;
  const isKnockout = defenderNewHp <= 0;

  return {
    attacker,
    defender,
    damage,
    defenderNewHp,
    isCritical,
    isKnockout,
  };
}

/**
 * Check if battle has ended and determine winner
 * Property 7: Victory Determination
 * - challenger.currentHp <= 0 → 'opponent_wins'
 * - opponent.currentHp <= 0 → 'challenger_wins'
 *
 * @param challenger - Challenger battle card
 * @param opponent - Opponent battle card
 * @returns BattleResult or null if battle continues
 */
export function checkBattleEnd(
  challenger: BattleCard,
  opponent: BattleCard
): BattleResult {
  if (challenger.currentHp <= 0) {
    return BATTLE_RESULTS.OPPONENT_WINS;
  }
  if (opponent.currentHp <= 0) {
    return BATTLE_RESULTS.CHALLENGER_WINS;
  }
  return null;
}

/**
 * Battle service object with all combat functions
 */
export const battleService = {
  calculateAttack,
  checkBattleEnd,
  calculateHpPercentage,
  getHpBarColor,
};
