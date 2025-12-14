/**
 * Battle Recorder Service
 *
 * Records battle data for history and replay functionality.
 * Captures combatant snapshots, turn records with damage breakdown,
 * and HP timeline for visualization.
 *
 * Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.6
 */

import type { Combatant, AttackResult } from "../engine/core/types";
import type {
  BattleRecord,
  TurnRecord,
  CombatantSnapshot,
  DamageBreakdown,
  LifestealDetail,
  DefenderHpState,
  HpTimelineEntry,
} from "../types/battleHistoryTypes";

// ============================================================================
// BATTLE RECORDER INTERFACE
// ============================================================================

export interface BattleRecorderInstance {
  /** Start recording a new battle */
  startRecording(challenger: Combatant, opponent: Combatant): void;

  /** Record a single turn/attack */
  recordTurn(
    turnNumber: number,
    attacker: Combatant,
    defender: Combatant,
    attackResult: AttackResult,
    defenderHpBefore: number,
    attackerHpBefore: number
  ): void;

  /** Finish recording and return the complete BattleRecord */
  finishRecording(winnerId: string, winnerName: string): BattleRecord;

  /** Reset the recorder for a new battle */
  reset(): void;

  /** Check if recording is in progress */
  isRecording(): boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a CombatantSnapshot from a Combatant
 * Requirements: 1.2, 1.4
 */
function createCombatantSnapshot(combatant: Combatant): CombatantSnapshot {
  return {
    id: combatant.id,
    name: combatant.name,
    imageUrl: combatant.imageUrl,
    maxHp: combatant.maxHp,
    currentHp: combatant.currentHp,
    atk: combatant.baseStats.atk,
    def: combatant.baseStats.def,
    spd: combatant.baseStats.spd,
    critChance: combatant.baseStats.critChance,
    critDamage: combatant.baseStats.critDamage,
    armorPen: combatant.baseStats.armorPen,
    lifesteal: combatant.baseStats.lifesteal,
  };
}

/**
 * Create DamageBreakdown from AttackResult
 * Requirements: 2.2
 */
function createDamageBreakdown(
  attackResult: AttackResult,
  attacker: Combatant,
  defender: Combatant
): DamageBreakdown {
  const damageResult = attackResult.damageResult;
  const armorPenPercent = attacker.baseStats.armorPen;
  const defenderOriginalDef = defender.baseStats.def;
  const effectiveDefense = defenderOriginalDef * (1 - armorPenPercent / 100);

  return {
    baseDamage: damageResult?.baseDamage ?? attackResult.damage,
    isCrit: damageResult?.isCrit ?? attackResult.isCritical,
    critMultiplier: damageResult?.isCrit
      ? attacker.baseStats.critDamage / 100
      : 1.0,
    critBonus: damageResult?.critBonus ?? 0,
    armorPenPercent,
    defenderOriginalDef,
    effectiveDefense,
    finalDamage: damageResult?.finalDamage ?? attackResult.damage,
  };
}

/**
 * Create LifestealDetail from AttackResult
 * Requirements: 2.3
 */
function createLifestealDetail(
  attackResult: AttackResult,
  attacker: Combatant,
  attackerHpBefore: number
): LifestealDetail {
  return {
    attackerLifestealPercent: attacker.baseStats.lifesteal,
    lifestealAmount: attackResult.lifestealHeal,
    attackerHpBefore,
    attackerHpAfter: attackResult.attackerNewHp,
    attackerMaxHp: attacker.maxHp,
  };
}

/**
 * Create DefenderHpState from AttackResult
 * Requirements: 2.4
 */
function createDefenderHpState(
  attackResult: AttackResult,
  defender: Combatant,
  defenderHpBefore: number
): DefenderHpState {
  return {
    defenderHpBefore,
    defenderHpAfter: attackResult.defenderNewHp,
    defenderMaxHp: defender.maxHp,
    isKnockout: attackResult.isKnockout,
  };
}

// ============================================================================
// BATTLE RECORDER IMPLEMENTATION
// ============================================================================

/**
 * Creates a BattleRecorder instance for recording battle data.
 *
 * Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.6
 */
export function createBattleRecorder(): BattleRecorderInstance {
  let recording = false;
  let battleId: string = "";
  let startedAt: number = 0;
  let challengerSnapshot: CombatantSnapshot | null = null;
  let opponentSnapshot: CombatantSnapshot | null = null;
  let turns: TurnRecord[] = [];
  let hpTimeline: HpTimelineEntry[] = [];

  return {
    /**
     * Start recording a new battle.
     * Captures initial combatant snapshots and creates initial HP timeline entry.
     *
     * Requirements: 1.1, 1.2, 5.6
     */
    startRecording(challenger: Combatant, opponent: Combatant): void {
      recording = true;
      battleId = generateUUID();
      startedAt = Date.now();
      challengerSnapshot = createCombatantSnapshot(challenger);
      opponentSnapshot = createCombatantSnapshot(opponent);
      turns = [];

      // Create initial HP timeline entry (turn 0)
      // Requirements: 5.6
      hpTimeline = [
        {
          turnNumber: 0,
          timestamp: startedAt,
          challengerHp: challenger.currentHp,
          challengerMaxHp: challenger.maxHp,
          opponentHp: opponent.currentHp,
          opponentMaxHp: opponent.maxHp,
        },
      ];
    },

    /**
     * Record a single turn/attack.
     * Creates a TurnRecord with full damage breakdown and updates HP timeline.
     *
     * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1
     */
    recordTurn(
      turnNumber: number,
      attacker: Combatant,
      defender: Combatant,
      attackResult: AttackResult,
      defenderHpBefore: number,
      attackerHpBefore: number
    ): void {
      if (!recording) {
        throw new Error("Recording not started. Call startRecording() first.");
      }

      const timestamp = Date.now();

      // Create TurnRecord with full breakdown
      // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
      const turnRecord: TurnRecord = {
        turnNumber,
        timestamp,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender.id,
        defenderName: defender.name,
        damage: createDamageBreakdown(attackResult, attacker, defender),
        lifesteal: createLifestealDetail(
          attackResult,
          attacker,
          attackerHpBefore
        ),
        defenderHp: createDefenderHpState(
          attackResult,
          defender,
          defenderHpBefore
        ),
      };

      turns.push(turnRecord);

      // Update HP timeline
      // Requirements: 5.1
      // Determine which combatant is challenger and which is opponent
      const isAttackerChallenger = attacker.id === challengerSnapshot?.id;

      const challengerHp = isAttackerChallenger
        ? attackResult.attackerNewHp
        : attackResult.defenderNewHp;

      const opponentHp = isAttackerChallenger
        ? attackResult.defenderNewHp
        : attackResult.attackerNewHp;

      hpTimeline.push({
        turnNumber,
        timestamp,
        challengerHp,
        challengerMaxHp: challengerSnapshot?.maxHp ?? 0,
        opponentHp,
        opponentMaxHp: opponentSnapshot?.maxHp ?? 0,
      });
    },

    /**
     * Finish recording and return the complete BattleRecord.
     *
     * Requirements: 1.1, 1.2, 5.3
     */
    finishRecording(winnerId: string, winnerName: string): BattleRecord {
      if (!recording) {
        throw new Error("Recording not started. Call startRecording() first.");
      }

      if (!challengerSnapshot || !opponentSnapshot) {
        throw new Error("Invalid state: combatant snapshots not captured.");
      }

      const endedAt = Date.now();
      const battleDurationMs = endedAt - startedAt;

      const record: BattleRecord = {
        id: battleId,
        startedAt,
        endedAt,
        battleDurationMs,
        challenger: challengerSnapshot,
        opponent: opponentSnapshot,
        winnerId,
        winnerName,
        totalTurns: turns.length,
        turns: [...turns],
        hpTimeline: [...hpTimeline],
      };

      // Reset state after finishing
      this.reset();

      return record;
    },

    /**
     * Reset the recorder for a new battle.
     */
    reset(): void {
      recording = false;
      battleId = "";
      startedAt = 0;
      challengerSnapshot = null;
      opponentSnapshot = null;
      turns = [];
      hpTimeline = [];
    },

    /**
     * Check if recording is in progress.
     */
    isRecording(): boolean {
      return recording;
    },
  };
}

// Default singleton instance
export const battleRecorder = createBattleRecorder();
