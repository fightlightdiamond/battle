/**
 * Battle type definitions for the Card Battle System
 * Requirements: 1.1, 2.1, 3.1
 */

/**
 * Represents a card in battle with combat-relevant stats
 */
export interface BattleCard {
  id: string;
  name: string;
  atk: number;
  maxHp: number;
  currentHp: number;
  imageUrl: string | null;
}

/**
 * Types of entries that can appear in the battle log
 */
export type BattleLogEntryType = "attack" | "damage" | "victory";

/**
 * A single entry in the battle log
 */
export interface BattleLogEntry {
  id: string;
  timestamp: number;
  type: BattleLogEntryType;
  message: string;
}

/**
 * The current phase of the battle
 * - setup: Initial state, selecting cards
 * - ready: Both cards selected, ready to start
 * - fighting: Battle in progress
 * - finished: Battle ended, winner determined
 */
export type BattlePhase = "setup" | "ready" | "fighting" | "finished";

/**
 * The result of a completed battle
 */
export type BattleResult = "card1_wins" | "card2_wins" | null;

/**
 * Which card is currently attacking
 */
export type CurrentAttacker = "card1" | "card2";

/**
 * Result of a single attack action
 */
export interface AttackResult {
  attacker: BattleCard;
  defender: BattleCard;
  damage: number;
  defenderNewHp: number;
  isCritical: boolean; // damage > 30% of defender's maxHp
  isKnockout: boolean; // defender HP <= 0
}

/**
 * The complete battle state
 */
export interface BattleState {
  phase: BattlePhase;
  card1: BattleCard | null;
  card2: BattleCard | null;
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
