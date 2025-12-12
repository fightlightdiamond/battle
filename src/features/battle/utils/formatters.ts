/**
 * Formatting utilities for the Card Battle System
 * Requirements: 4.4, 6.1, 6.2, 6.3
 */

/**
 * Format HP display string
 * Property 6: HP Display Format
 * For any card with currentHp C and maxHp M, the HP display string
 * SHALL be formatted as "C / M" where both values are shown as integers.
 *
 * @param currentHp - Current HP value
 * @param maxHp - Maximum HP value
 * @returns Formatted string "current / max"
 */
export function formatHpDisplay(currentHp: number, maxHp: number): string {
  const current = Math.floor(currentHp);
  const max = Math.floor(maxHp);
  return `${current} / ${max}`;
}

/**
 * Format battle log entry for an attack action
 * Property 9: Battle Log Format
 * For any attack where attacker name is A, defender name is D, damage is X,
 * and defender's remaining HP is R, the log entry SHALL contain:
 * - "[A] attacks [D] for [X] damage"
 * - "[D] has [R] HP remaining"
 *
 * @param attackerName - Name of the attacking card
 * @param defenderName - Name of the defending card
 * @param damage - Amount of damage dealt
 * @param remainingHp - Defender's remaining HP after the attack
 * @returns Formatted battle log entry string
 */
export function formatBattleLogEntry(
  attackerName: string,
  defenderName: string,
  damage: number,
  remainingHp: number
): string {
  const dmg = Math.floor(damage);
  const hp = Math.floor(remainingHp);
  return `[${attackerName}] attacks [${defenderName}] for [${dmg}] damage. [${defenderName}] has [${hp}] HP remaining`;
}

/**
 * Format victory log entry
 * Requirements: 6.3
 * Records the final result with the winner's name
 *
 * @param winnerName - Name of the winning card
 * @returns Formatted victory log entry string
 */
export function formatVictoryLog(winnerName: string): string {
  return `[${winnerName}] wins the battle!`;
}

/**
 * Formatters object with all formatting functions
 */
export const formatters = {
  formatHpDisplay,
  formatBattleLogEntry,
  formatVictoryLog,
};
