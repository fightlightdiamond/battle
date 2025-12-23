import type {
  BattleLogEntry,
  AttackLogData,
  Combatant,
  GemSkillLogData,
} from "../core/types";
import { LOG_ENTRY_TYPES } from "../core/types";
import { type CombatConfig, DEFAULT_COMBAT_CONFIG } from "../core/config";
import type { SkillType } from "../../../gems/types/gem";

/**
 * Generates a unique ID for log entries.
 */
function generateId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Skill activation input for logging
 */
export interface SkillActivationInput {
  gemId: string;
  gemName: string;
  skillType: SkillType;
  cardId: string;
  cardName: string;
}

/**
 * CombatLogger interface
 */
export interface CombatLoggerInstance {
  logAttack(
    attacker: Combatant,
    defender: Combatant,
    damage: number,
    remainingHp: number,
  ): BattleLogEntry;
  logVictory(winnerName: string): BattleLogEntry;
  logSkillActivation(input: SkillActivationInput): BattleLogEntry;
}

/**
 * Get human-readable effect description for a skill type
 */
export function getSkillEffectDescription(skillType: SkillType): string {
  const effectDescriptions: Record<SkillType, string> = {
    knockback: "pushed enemy back",
    retreat: "retreated after attack",
    double_move: "moved 2 cells",
    double_attack: "attacked twice",
    execute: "executed low HP enemy",
    leap_strike: "leaped to enemy and knocked back",
  };
  return effectDescriptions[skillType] ?? "activated skill";
}

/**
 * Creates a CombatLogger instance with configurable critical threshold.
 */
export function createCombatLogger(
  config: CombatConfig = DEFAULT_COMBAT_CONFIG,
): CombatLoggerInstance {
  return {
    logAttack(
      attacker: Combatant,
      defender: Combatant,
      damage: number,
      remainingHp: number,
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

    logSkillActivation(input: SkillActivationInput): BattleLogEntry {
      const { gemId, gemName, skillType, cardId, cardName } = input;
      const effect = getSkillEffectDescription(skillType);

      const skillData: GemSkillLogData = {
        gemId,
        gemName,
        skillType,
        cardId,
        cardName,
        effect,
      };

      return {
        id: generateId(),
        timestamp: Date.now(),
        type: LOG_ENTRY_TYPES.GEM_SKILL,
        message: `${cardName}'s ${gemName} activated: ${effect}!`,
        data: skillData,
      };
    },
  };
}

// Default singleton instance (backward compatible)
export const CombatLogger = createCombatLogger();
