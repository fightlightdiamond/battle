/**
 * Property-based tests for Battle History Types
 * Using fast-check for property-based testing
 *
 * Tests validate that BattleRecord and TurnRecord structures are complete
 * and contain all required fields as specified in the design document.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  CombatantSnapshot,
  DamageBreakdown,
  LifestealDetail,
  DefenderHpState,
  TurnRecord,
  HpTimelineEntry,
  BattleRecord,
} from "./battleHistoryTypes";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

/**
 * Generator for CombatantSnapshot
 */
const combatantSnapshotArb: fc.Arbitrary<CombatantSnapshot> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  imageUrl: fc.option(fc.webUrl(), { nil: null }),

  // HP
  maxHp: fc.integer({ min: 1, max: 9999 }),
  currentHp: fc.integer({ min: 1, max: 9999 }),

  // Core Stats (Tier 1)
  atk: fc.integer({ min: 1, max: 9999 }),
  def: fc.integer({ min: 0, max: 9999 }),
  spd: fc.integer({ min: 1, max: 500 }),

  // Combat Stats (Tier 2)
  critChance: fc.integer({ min: 0, max: 100 }),
  critDamage: fc.integer({ min: 100, max: 300 }),
  armorPen: fc.integer({ min: 0, max: 100 }),
  lifesteal: fc.integer({ min: 0, max: 100 }),
});

/**
 * Generator for DamageBreakdown
 */
const damageBreakdownArb: fc.Arbitrary<DamageBreakdown> = fc
  .record({
    baseDamage: fc.integer({ min: 1, max: 9999 }),
    isCrit: fc.boolean(),
    armorPenPercent: fc.integer({ min: 0, max: 100 }),
    defenderOriginalDef: fc.integer({ min: 0, max: 9999 }),
    effectiveDefense: fc.integer({ min: 0, max: 9999 }),
  })
  .chain((base) => {
    // Calculate critMultiplier and critBonus based on isCrit
    const critMultiplier = base.isCrit
      ? fc.float({ min: 1.0, max: 3.0 })
      : fc.constant(1.0);

    return critMultiplier.map((mult) => {
      const critBonus = base.isCrit
        ? Math.floor(base.baseDamage * (mult - 1))
        : 0;
      const finalDamage = base.baseDamage + critBonus;
      return {
        ...base,
        critMultiplier: mult,
        critBonus,
        finalDamage,
      };
    });
  });

/**
 * Generator for LifestealDetail
 */
const lifestealDetailArb: fc.Arbitrary<LifestealDetail> = fc
  .record({
    attackerLifestealPercent: fc.integer({ min: 0, max: 100 }),
    attackerMaxHp: fc.integer({ min: 1, max: 9999 }),
    attackerHpBefore: fc.integer({ min: 0, max: 9999 }),
    finalDamage: fc.integer({ min: 0, max: 9999 }),
  })
  .map((base) => {
    const lifestealAmount = Math.floor(
      (base.finalDamage * base.attackerLifestealPercent) / 100
    );
    const attackerHpAfter = Math.min(
      base.attackerHpBefore + lifestealAmount,
      base.attackerMaxHp
    );
    return {
      attackerLifestealPercent: base.attackerLifestealPercent,
      lifestealAmount,
      attackerHpBefore: base.attackerHpBefore,
      attackerHpAfter,
      attackerMaxHp: base.attackerMaxHp,
    };
  });

/**
 * Generator for DefenderHpState
 */
const defenderHpStateArb: fc.Arbitrary<DefenderHpState> = fc
  .record({
    defenderMaxHp: fc.integer({ min: 1, max: 9999 }),
    defenderHpBefore: fc.integer({ min: 1, max: 9999 }),
    damage: fc.integer({ min: 0, max: 9999 }),
  })
  .map((base) => {
    const defenderHpAfter = Math.max(0, base.defenderHpBefore - base.damage);
    return {
      defenderHpBefore: base.defenderHpBefore,
      defenderHpAfter,
      defenderMaxHp: base.defenderMaxHp,
      isKnockout: defenderHpAfter === 0,
    };
  });

/**
 * Generator for TurnRecord
 */
const turnRecordArb: fc.Arbitrary<TurnRecord> = fc.record({
  turnNumber: fc.integer({ min: 1, max: 1000 }),
  timestamp: fc.integer({ min: 0 }),
  attackerId: fc.uuid(),
  attackerName: fc.string({ minLength: 1, maxLength: 100 }),
  defenderId: fc.uuid(),
  defenderName: fc.string({ minLength: 1, maxLength: 100 }),
  damage: damageBreakdownArb,
  lifesteal: lifestealDetailArb,
  defenderHp: defenderHpStateArb,
});

/**
 * Generator for HpTimelineEntry
 */
const hpTimelineEntryArb: fc.Arbitrary<HpTimelineEntry> = fc.record({
  turnNumber: fc.integer({ min: 0, max: 1000 }),
  timestamp: fc.integer({ min: 0 }),
  challengerHp: fc.integer({ min: 0, max: 9999 }),
  challengerMaxHp: fc.integer({ min: 1, max: 9999 }),
  opponentHp: fc.integer({ min: 0, max: 9999 }),
  opponentMaxHp: fc.integer({ min: 1, max: 9999 }),
});

/**
 * Generator for BattleRecord with consistent data
 */
const battleRecordArb: fc.Arbitrary<BattleRecord> = fc
  .record({
    challenger: combatantSnapshotArb,
    opponent: combatantSnapshotArb,
    startedAt: fc.integer({ min: 0, max: 1700000000000 }),
    durationMs: fc.integer({ min: 100, max: 600000 }),
    totalTurns: fc.integer({ min: 1, max: 100 }),
  })
  .chain((base) => {
    const endedAt = base.startedAt + base.durationMs;

    // Generate turns array with sequential turn numbers
    const turnsArb = fc.array(turnRecordArb, {
      minLength: base.totalTurns,
      maxLength: base.totalTurns,
    });

    // Generate hpTimeline with totalTurns + 1 entries (including initial state)
    const hpTimelineArb = fc.array(hpTimelineEntryArb, {
      minLength: base.totalTurns + 1,
      maxLength: base.totalTurns + 1,
    });

    // Winner is either challenger or opponent
    const winnerArb = fc
      .boolean()
      .map((isChallenger) =>
        isChallenger
          ? { winnerId: base.challenger.id, winnerName: base.challenger.name }
          : { winnerId: base.opponent.id, winnerName: base.opponent.name }
      );

    return fc
      .tuple(fc.uuid(), turnsArb, hpTimelineArb, winnerArb)
      .map(([id, turns, hpTimeline, winner]) => {
        // Fix turn numbers to be sequential
        const fixedTurns = turns.map((turn, index) => ({
          ...turn,
          turnNumber: index + 1,
        }));

        // Fix hpTimeline turn numbers
        const fixedHpTimeline = hpTimeline.map((entry, index) => ({
          ...entry,
          turnNumber: index,
        }));

        return {
          id,
          startedAt: base.startedAt,
          endedAt,
          battleDurationMs: base.durationMs,
          challenger: base.challenger,
          opponent: base.opponent,
          winnerId: winner.winnerId,
          winnerName: winner.winnerName,
          totalTurns: base.totalTurns,
          turns: fixedTurns,
          hpTimeline: fixedHpTimeline,
        };
      });
  });

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("Battle History Types - Property Tests", () => {
  /**
   * **Feature: battle-history, Property 1: BattleRecord Structure Completeness**
   *
   * For any BattleRecord, all required fields SHALL be present and non-null:
   * id, startedAt, endedAt, battleDurationMs, challenger (with full stats),
   * opponent (with full stats), winnerId, winnerName, totalTurns, turns array,
   * hpTimeline array.
   *
   * **Validates: Requirements 1.2, 1.4**
   */
  it("Property 1: BattleRecord contains all required fields", () => {
    fc.assert(
      fc.property(battleRecordArb, (record: BattleRecord) => {
        // Check top-level required fields
        expect(record.id).toBeDefined();
        expect(typeof record.id).toBe("string");
        expect(record.id.length).toBeGreaterThan(0);

        expect(record.startedAt).toBeDefined();
        expect(typeof record.startedAt).toBe("number");
        expect(record.startedAt).toBeGreaterThanOrEqual(0);

        expect(record.endedAt).toBeDefined();
        expect(typeof record.endedAt).toBe("number");
        expect(record.endedAt).toBeGreaterThanOrEqual(record.startedAt);

        expect(record.battleDurationMs).toBeDefined();
        expect(typeof record.battleDurationMs).toBe("number");
        expect(record.battleDurationMs).toBeGreaterThanOrEqual(0);

        // Check combatant snapshots
        expect(record.challenger).toBeDefined();
        expect(record.opponent).toBeDefined();

        // Verify challenger has all required stats
        const challenger = record.challenger;
        expect(challenger.id).toBeDefined();
        expect(challenger.name).toBeDefined();
        expect(typeof challenger.maxHp).toBe("number");
        expect(typeof challenger.currentHp).toBe("number");
        expect(typeof challenger.atk).toBe("number");
        expect(typeof challenger.def).toBe("number");
        expect(typeof challenger.spd).toBe("number");
        expect(typeof challenger.critChance).toBe("number");
        expect(typeof challenger.critDamage).toBe("number");
        expect(typeof challenger.armorPen).toBe("number");
        expect(typeof challenger.lifesteal).toBe("number");

        // Verify opponent has all required stats
        const opponent = record.opponent;
        expect(opponent.id).toBeDefined();
        expect(opponent.name).toBeDefined();
        expect(typeof opponent.maxHp).toBe("number");
        expect(typeof opponent.currentHp).toBe("number");
        expect(typeof opponent.atk).toBe("number");
        expect(typeof opponent.def).toBe("number");
        expect(typeof opponent.spd).toBe("number");
        expect(typeof opponent.critChance).toBe("number");
        expect(typeof opponent.critDamage).toBe("number");
        expect(typeof opponent.armorPen).toBe("number");
        expect(typeof opponent.lifesteal).toBe("number");

        // Check result fields
        expect(record.winnerId).toBeDefined();
        expect(typeof record.winnerId).toBe("string");
        expect(record.winnerName).toBeDefined();
        expect(typeof record.winnerName).toBe("string");
        expect(record.totalTurns).toBeDefined();
        expect(typeof record.totalTurns).toBe("number");
        expect(record.totalTurns).toBeGreaterThanOrEqual(1);

        // Check arrays
        expect(Array.isArray(record.turns)).toBe(true);
        expect(Array.isArray(record.hpTimeline)).toBe(true);
        expect(record.turns.length).toBe(record.totalTurns);
        expect(record.hpTimeline.length).toBe(record.totalTurns + 1);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: battle-history, Property 2: TurnRecord Structure Completeness**
   *
   * For any TurnRecord in a BattleRecord, all required fields SHALL be present:
   * turnNumber, timestamp, attackerId, attackerName, defenderId, defenderName,
   * damage (with all breakdown fields), lifesteal (with all detail fields),
   * defenderHp (with all state fields).
   *
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
   */
  it("Property 2: TurnRecord contains all required fields", () => {
    fc.assert(
      fc.property(turnRecordArb, (turn: TurnRecord) => {
        // Check identity fields
        expect(turn.turnNumber).toBeDefined();
        expect(typeof turn.turnNumber).toBe("number");
        expect(turn.turnNumber).toBeGreaterThanOrEqual(1);

        expect(turn.timestamp).toBeDefined();
        expect(typeof turn.timestamp).toBe("number");
        expect(turn.timestamp).toBeGreaterThanOrEqual(0);

        expect(turn.attackerId).toBeDefined();
        expect(typeof turn.attackerId).toBe("string");
        expect(turn.attackerName).toBeDefined();
        expect(typeof turn.attackerName).toBe("string");

        expect(turn.defenderId).toBeDefined();
        expect(typeof turn.defenderId).toBe("string");
        expect(turn.defenderName).toBeDefined();
        expect(typeof turn.defenderName).toBe("string");

        // Check damage breakdown fields (Requirements 2.2)
        const damage = turn.damage;
        expect(damage).toBeDefined();
        expect(typeof damage.baseDamage).toBe("number");
        expect(typeof damage.isCrit).toBe("boolean");
        expect(typeof damage.critMultiplier).toBe("number");
        expect(typeof damage.critBonus).toBe("number");
        expect(typeof damage.armorPenPercent).toBe("number");
        expect(typeof damage.defenderOriginalDef).toBe("number");
        expect(typeof damage.effectiveDefense).toBe("number");
        expect(typeof damage.finalDamage).toBe("number");

        // Check lifesteal detail fields (Requirements 2.3)
        const lifesteal = turn.lifesteal;
        expect(lifesteal).toBeDefined();
        expect(typeof lifesteal.attackerLifestealPercent).toBe("number");
        expect(typeof lifesteal.lifestealAmount).toBe("number");
        expect(typeof lifesteal.attackerHpBefore).toBe("number");
        expect(typeof lifesteal.attackerHpAfter).toBe("number");
        expect(typeof lifesteal.attackerMaxHp).toBe("number");

        // Check defender HP state fields (Requirements 2.4)
        const defenderHp = turn.defenderHp;
        expect(defenderHp).toBeDefined();
        expect(typeof defenderHp.defenderHpBefore).toBe("number");
        expect(typeof defenderHp.defenderHpAfter).toBe("number");
        expect(typeof defenderHp.defenderMaxHp).toBe("number");
        expect(typeof defenderHp.isKnockout).toBe("boolean");
      }),
      { numRuns: 100 }
    );
  });
});
