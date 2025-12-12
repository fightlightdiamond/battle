// ============================================================================
// ENTITY TYPES
// ============================================================================

export interface CombatantStats {
  readonly atk: number;
  readonly def: number;
  readonly critRate: number;
  readonly critDamage: number;
}

export interface ActiveBuff {
  readonly id: string;
  readonly name: string;
  readonly type: "buff" | "debuff";
  readonly stat: keyof CombatantStats;
  readonly value: number;
  readonly isPercentage: boolean;
  readonly remainingDuration: number;
  readonly stackRule: "replace" | "add" | "max";
  readonly stacks: number;
}

export interface Combatant {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string | null;
  readonly baseStats: CombatantStats;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly buffs: readonly ActiveBuff[];
  readonly isDefeated: boolean;
}

// ============================================================================
// SKILL TYPES (Future Extension)
// ============================================================================

export interface SkillEffect {
  readonly type: "damage" | "heal" | "buff" | "debuff";
  readonly value: number;
  readonly multiplier: number;
  readonly duration?: number;
}

export interface Skill {
  readonly id: string;
  readonly name: string;
  readonly cooldown: number;
  readonly currentCooldown: number;
  readonly effects: readonly SkillEffect[];
}

// ============================================================================
// ROLE TYPES
// ============================================================================

/**
 * Represents the role of a combatant in battle.
 * - "challenger": The player's card
 * - "opponent": The enemy card
 */
export type CombatantRole = "challenger" | "opponent";

/**
 * Constants for combatant roles to avoid magic strings
 */
export const COMBATANT_ROLES = {
  CHALLENGER: "challenger" as const,
  OPPONENT: "opponent" as const,
} as const;

// ============================================================================
// STATE TYPES
// ============================================================================

export type BattlePhase = "setup" | "ready" | "fighting" | "finished";

/**
 * Constants for battle phases to avoid magic strings
 */
export const BATTLE_PHASES = {
  SETUP: "setup" as const,
  READY: "ready" as const,
  FIGHTING: "fighting" as const,
  FINISHED: "finished" as const,
} as const;

export interface BattleResult {
  readonly winner: CombatantRole;
  readonly winnerName: string;
  readonly totalTurns: number;
}

export interface AttackLogData {
  readonly attackerId: string;
  readonly defenderId: string;
  readonly damage: number;
  readonly isCritical: boolean;
  readonly defenderRemainingHp: number;
}

export interface SkillLogData {
  readonly skillId: string;
  readonly skillName: string;
  readonly casterId: string;
  readonly targetIds: readonly string[];
  readonly effects: readonly string[];
}

/**
 * Type for battle log entry types
 */
export type BattleLogEntryType =
  | "attack"
  | "damage"
  | "skill"
  | "buff"
  | "victory";

/**
 * Constants for battle log entry types to avoid magic strings
 */
export const LOG_ENTRY_TYPES = {
  ATTACK: "attack" as const,
  DAMAGE: "damage" as const,
  SKILL: "skill" as const,
  BUFF: "buff" as const,
  VICTORY: "victory" as const,
} as const;

export interface BattleLogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly type: BattleLogEntryType;
  readonly message: string;
  readonly data?: AttackLogData | SkillLogData;
}

export interface BattleState {
  readonly phase: BattlePhase;
  readonly turn: number;
  readonly challenger: Combatant;
  readonly opponent: Combatant;
  readonly currentAttacker: CombatantRole;
  readonly battleLog: readonly BattleLogEntry[];
  readonly result: BattleResult | null;
  readonly isAutoBattle: boolean;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type GameEventType =
  | "battle_start"
  | "turn_start"
  | "turn_end"
  | "attack"
  | "damage_dealt"
  | "combatant_defeated"
  | "battle_end"
  | "state_changed";

/**
 * Constants for game event types to avoid magic strings
 */
export const GAME_EVENTS = {
  BATTLE_START: "battle_start" as const,
  TURN_START: "turn_start" as const,
  TURN_END: "turn_end" as const,
  ATTACK: "attack" as const,
  DAMAGE_DEALT: "damage_dealt" as const,
  COMBATANT_DEFEATED: "combatant_defeated" as const,
  BATTLE_END: "battle_end" as const,
  STATE_CHANGED: "state_changed" as const,
} as const;

export interface GameEvent<T = unknown> {
  readonly type: GameEventType;
  readonly timestamp: number;
  readonly payload: T;
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface AttackResult {
  readonly attacker: Combatant;
  readonly defender: Combatant;
  readonly damage: number;
  readonly defenderNewHp: number;
  readonly isCritical: boolean;
  readonly isKnockout: boolean;
}

export interface DamageCalculationInput {
  readonly attackerAtk: number;
  readonly defenderDef: number;
  readonly skillMultiplier?: number;
  readonly critRate?: number;
  readonly critDamage?: number;
}
