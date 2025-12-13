/**
 * Battle type definitions for the Card Battle System
 * Requirements: 1.1, 2.1, 3.1
 */

/**
 * Battle participant constants
 */
export const BATTLE_PARTICIPANTS = {
  CHALLENGER: "challenger",
  OPPONENT: "opponent",
} as const;

/**
 * Battle phase constants
 */
export const BATTLE_PHASES = {
  SETUP: "setup",
  READY: "ready",
  FIGHTING: "fighting",
  FINISHED: "finished",
} as const;

/**
 * Battle result constants
 */
export const BATTLE_RESULTS = {
  CHALLENGER_WINS: "challenger_wins",
  OPPONENT_WINS: "opponent_wins",
} as const;

/**
 * Represents a card in battle with combat-relevant stats
 * Updated for Tier-Based Stat System (Requirements: 1.1, 7.1-7.6)
 */
export interface BattleCard {
  id: string;
  name: string;
  imageUrl: string | null;

  // HP tracking
  maxHp: number;
  currentHp: number;

  // Core Stats (Tier 1)
  atk: number;
  def: number;
  spd: number;

  // Combat Stats (Tier 2)
  critChance: number; // 0-100 (percentage)
  critDamage: number; // 100+ (150 = 1.5x multiplier)
  armorPen: number; // 0-100 (percentage)
  lifesteal: number; // 0-100 (percentage)
}

/**
 * Types of entries that can appear in the battle log
 */
export type BattleLogEntryType = "attack" | "damage" | "victory";

/**
 * A single entry in the battle log
 * Extended to support crit and lifesteal visual indicators
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export interface BattleLogEntry {
  id: string;
  timestamp: number;
  type: BattleLogEntryType;
  message: string;
  /** Whether this attack was a critical hit */
  isCrit?: boolean;
  /** Whether this attack triggered lifesteal */
  hasLifesteal?: boolean;
  /** The lifesteal amount healed (if any) */
  lifestealAmount?: number;
  /** The crit bonus damage (if any) */
  critBonus?: number;
}

/**
 * The current phase of the battle
 * - setup: Initial state, selecting cards
 * - ready: Both cards selected, ready to start
 * - fighting: Battle in progress
 * - finished: Battle ended, winner determined
 */
export type BattlePhase = (typeof BATTLE_PHASES)[keyof typeof BATTLE_PHASES];

/**
 * The result of a completed battle
 */
export type BattleResult =
  | (typeof BATTLE_RESULTS)[keyof typeof BATTLE_RESULTS]
  | null;

/**
 * Which card is currently attacking
 */
export type CurrentAttacker =
  (typeof BATTLE_PARTICIPANTS)[keyof typeof BATTLE_PARTICIPANTS];

/**
 * Result of a single attack action
 * Extended to include DamageResult for detailed combat visuals
 * Requirements: 4.1, 4.2, 4.3
 */
export interface AttackResult {
  attacker: BattleCard;
  defender: BattleCard;
  damage: number;
  defenderNewHp: number;
  attackerNewHp: number; // For lifesteal tracking
  isCritical: boolean; // damage > 30% of defender's maxHp OR crit rolled
  isKnockout: boolean; // defender HP <= 0
  lifestealHeal: number; // Amount healed via lifesteal
  /** Detailed damage breakdown for UI display */
  damageResult?: {
    finalDamage: number;
    baseDamage: number;
    isCrit: boolean;
    critBonus: number;
    lifestealAmount: number;
  };
}

/**
 * The complete battle state
 */
export interface BattleState {
  phase: BattlePhase;
  challenger: BattleCard | null;
  opponent: BattleCard | null;
  currentAttacker: CurrentAttacker;
  battleLog: BattleLogEntry[];
  result: BattleResult;
  isAutoBattle: boolean;
}

/**
 * HP Bar color based on percentage thresholds
 * - green: HP > 50%
 * - yellow: 25% <= HP <= 50%
 * - red: HP < 25%
 */
export type HpBarColor = "green" | "yellow" | "red";

/**
 * HP Bar color constants for consistent usage
 */
export const HP_BAR_COLORS = {
  GREEN: "green" as const,
  YELLOW: "yellow" as const,
  RED: "red" as const,
};

/**
 * HP percentage thresholds for color changes
 */
export const HP_THRESHOLDS = {
  HIGH: 50, // Above this = green
  LOW: 25, // Below this = red, between LOW and HIGH = yellow
} as const;

/**
 * Combat calculation constants
 */
export const COMBAT_CONSTANTS = {
  /** Critical damage threshold as percentage of defender's max HP (0.3 = 30%) */
  CRITICAL_DAMAGE_THRESHOLD: 0.3,
  /** Danger threshold for HP warning (0.25 = 25%) */
  DANGER_THRESHOLD: 0.25,
} as const;

/**
 * Card position constants for battle arena layout
 * - LEFT: Card displayed on the left side (typically challenger)
 * - RIGHT: Card displayed on the right side (typically opponent)
 */
export const CARD_POSITIONS = {
  LEFT: "left",
  RIGHT: "right",
} as const;

/**
 * Card position type derived from constants
 */
export type CardPosition = (typeof CARD_POSITIONS)[keyof typeof CARD_POSITIONS];
