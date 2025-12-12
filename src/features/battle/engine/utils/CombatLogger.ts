import type { BattleLogEntry, AttackLogData, Combatant } from "../core/types";
import { LOG_ENTRY_TYPES } from "../core/types";
import { type CombatConfig, DEFAULT_COMBAT_CONFIG } from "../core/config";

/**
 * Generates a unique ID for log entries.
 */
function generateId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * CombatLogger interface
 */
export interface CombatLoggerInstance {
  logAttack(
    attacker: Combatant,
    defender: Combatant,
    damage: number,
    remainingHp: number
  ): BattleLogEntry;
  logVictory(winnerName: string): BattleLogEntry;
}

/**
 * Creates a CombatLogger instance with configurable critical threshold.
 */
export function createCombatLogger(
  config: CombatConfig = DEFAULT_COMBAT_CONFIG
): CombatLoggerInstance {
  return {
    logAttack(
      attacker: Combatant,
      defender: Combatant,
      damage: number,
      remainingHp: number
    ): BattleLogEntry {
      const isCritical =
        damage > defender.maxHp * config.criticalDamageThreshold;

      const attackData: AttackLogData = {
        attackerId: attacker.id,
        defenderId: defender.id,
        damage,
        isCritical,
        defenderRemainingHp: remainingHp,
      };

      return {
        id: generateId(),
        timestamp: Date.now(),
        type: LOG_ENTRY_TYPES.ATTACK,
        message: `${attacker.name} attacks ${defender.name} for ${damage} damage!`,
        data: attackData,
      };
    },

    logVictory(winnerName: string): BattleLogEntry {
      return {
        id: generateId(),
        timestamp: Date.now(),
        type: LOG_ENTRY_TYPES.VICTORY,
        message: `${winnerName} wins the battle!`,
      };
    },
  };
}

// Default singleton instance (backward compatible)
export const CombatLogger = createCombatLogger();
