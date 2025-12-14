/**
 * Battle History Types
 *
 * Types for recording and replaying battle history.
 * These types capture complete battle data for persistence and replay.
 *
 * Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 5.5
 */

// ============================================================================
// COMBATANT SNAPSHOT
// ============================================================================

/**
 * Snapshot of a combatant's full stats at battle start.
 * Captures all information needed to display the card during replay.
 *
 * Requirements: 1.2, 1.4
 */
export interface CombatantSnapshot {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string | null;

  // HP
  readonly maxHp: number;
  readonly currentHp: number; // HP at battle start (= maxHp)

  // Core Stats (Tier 1)
  readonly atk: number;
  readonly def: number;
  readonly spd: number;

  // Combat Stats (Tier 2)
  readonly critChance: number; // 0-100 (percentage)
  readonly critDamage: number; // 100+ (150 = 1.5x multiplier)
  readonly armorPen: number; // 0-100 (percentage)
  readonly lifesteal: number; // 0-100 (percentage)
}

// ============================================================================
// DAMAGE BREAKDOWN
// ============================================================================

/**
 * Detailed damage calculation breakdown for a single attack.
 * Contains all intermediate values for UI display and analysis.
 *
 * Requirements: 2.2
 */
export interface DamageBreakdown {
  /** Damage before crit multiplier */
  readonly baseDamage: number;
  /** Whether critical hit was rolled */
  readonly isCrit: boolean;
  /** Crit multiplier (1.0 if no crit, or critDamage/100 e.g. 1.5) */
  readonly critMultiplier: number;
  /** Extra damage from crit (finalDamage - baseDamage if crit, else 0) */
  readonly critBonus: number;
  /** Attacker's armor penetration percentage */
  readonly armorPenPercent: number;
  /** Defender's original DEF stat */
  readonly defenderOriginalDef: number;
  /** Defender's effective DEF after armor pen */
  readonly effectiveDefense: number;
  /** Final damage dealt */
  readonly finalDamage: number;
}

// ============================================================================
// LIFESTEAL DETAIL
// ============================================================================

/**
 * Detailed lifesteal information for a single attack.
 * Tracks HP changes for the attacker due to lifesteal.
 *
 * Requirements: 2.3
 */
export interface LifestealDetail {
  /** Attacker's lifesteal percentage */
  readonly attackerLifestealPercent: number;
  /** HP healed from lifesteal */
  readonly lifestealAmount: number;
  /** Attacker's HP before lifesteal heal */
  readonly attackerHpBefore: number;
  /** Attacker's HP after lifesteal heal */
  readonly attackerHpAfter: number;
  /** Attacker's max HP (for cap calculation) */
  readonly attackerMaxHp: number;
}

// ============================================================================
// DEFENDER HP STATE
// ============================================================================

/**
 * Defender's HP state after receiving damage.
 *
 * Requirements: 2.4
 */
export interface DefenderHpState {
  /** Defender's HP before taking damage */
  readonly defenderHpBefore: number;
  /** Defender's HP after taking damage */
  readonly defenderHpAfter: number;
  /** Defender's max HP */
  readonly defenderMaxHp: number;
  /** Whether this attack knocked out the defender */
  readonly isKnockout: boolean;
}

// ============================================================================
// TURN RECORD
// ============================================================================

/**
 * Complete record of a single turn/attack in battle.
 * Contains all information needed to replay the turn.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export interface TurnRecord {
  /** Turn number (1-based, sequential) */
  readonly turnNumber: number;
  /** Timestamp of the action */
  readonly timestamp: number;

  // Identity
  readonly attackerId: string;
  readonly attackerName: string;
  readonly defenderId: string;
  readonly defenderName: string;

  // Damage detail
  readonly damage: DamageBreakdown;

  // Lifesteal detail
  readonly lifesteal: LifestealDetail;

  // Defender HP
  readonly defenderHp: DefenderHpState;
}

// ============================================================================
// HP TIMELINE ENTRY
// ============================================================================

/**
 * HP state at a specific point in the battle.
 * Used for timeline visualization and replay.
 *
 * Requirements: 5.1, 5.2, 5.6
 */
export interface HpTimelineEntry {
  /** Turn number (0 = initial state before any attack) */
  readonly turnNumber: number;
  /** Timestamp of this state */
  readonly timestamp: number;
  /** Challenger's current HP */
  readonly challengerHp: number;
  /** Challenger's max HP */
  readonly challengerMaxHp: number;
  /** Opponent's current HP */
  readonly opponentHp: number;
  /** Opponent's max HP */
  readonly opponentMaxHp: number;
}

// ============================================================================
// BATTLE RECORD
// ============================================================================

/**
 * Complete record of an entire battle.
 * Contains all information needed to replay the battle from start to finish.
 *
 * Requirements: 1.2, 1.4, 5.1, 5.3, 5.4
 */
export interface BattleRecord {
  /** Unique identifier (UUID) */
  readonly id: string;
  /** Timestamp when battle started (ms) */
  readonly startedAt: number;
  /** Timestamp when battle ended (ms) */
  readonly endedAt: number;
  /** Battle duration in milliseconds */
  readonly battleDurationMs: number;

  // Combatants (snapshots at battle start)
  readonly challenger: CombatantSnapshot;
  readonly opponent: CombatantSnapshot;

  // Result
  readonly winnerId: string;
  readonly winnerName: string;
  readonly totalTurns: number;

  // Detailed records
  readonly turns: TurnRecord[];
  readonly hpTimeline: HpTimelineEntry[];
}
