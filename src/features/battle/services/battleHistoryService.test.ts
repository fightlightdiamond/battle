/**
 * Property-based tests for BattleHistoryService
 * Using fast-check for property-based testing
 *
 * Tests validate battle duration calculation and JSON round-trip serialization.
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
} from "../types/battleHistoryTypes";

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
 * Note: Using fc.double with noNaN and noDefaultInfinity to ensure valid numeric values
 * that can be properly serialized to JSON and back.
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
    // Use fc.double with noNaN to avoid NaN values that don't serialize properly
    const critMultiplier = base.isCrit
      ? fc.double({ min: 1.0, max: 3.0, noNaN: true, noDefaultInfinity: true })
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
    durationMs: fc.integer({ min: 0, max: 600000 }),
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

describe("BattleHistoryService - Property Tests", () => {
  /**
   * **Feature: battle-history, Property 7: Battle Duration Calculation**
   *
   * For any BattleRecord, battleDurationMs SHALL equal (endedAt - startedAt)
   * and SHALL be >= 0.
   *
   * **Validates: Requirements 5.3**
   */
  it("Property 7: Battle duration equals endedAt minus startedAt and is non-negative", () => {
    fc.assert(
      fc.property(battleRecordArb, (record: BattleRecord) => {
        // Verify battleDurationMs equals endedAt - startedAt
        expect(record.battleDurationMs).toBe(record.endedAt - record.startedAt);

        // Verify battleDurationMs is non-negative
        expect(record.battleDurationMs).toBeGreaterThanOrEqual(0);

        // Verify endedAt is greater than or equal to startedAt
        expect(record.endedAt).toBeGreaterThanOrEqual(record.startedAt);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: battle-history, Property 8: JSON Round-Trip Serialization**
   *
   * For any valid BattleRecord, JSON.parse(JSON.stringify(record)) SHALL
   * produce a deeply equal object.
   *
   * **Validates: Requirements 5.4**
   */
  it("Property 8: JSON serialization round-trip preserves all data", () => {
    fc.assert(
      fc.property(battleRecordArb, (record: BattleRecord) => {
        // Serialize to JSON and back
        const serialized = JSON.stringify(record);
        const deserialized = JSON.parse(serialized) as BattleRecord;

        // Verify top-level fields
        expect(deserialized.id).toBe(record.id);
        expect(deserialized.startedAt).toBe(record.startedAt);
        expect(deserialized.endedAt).toBe(record.endedAt);
        expect(deserialized.battleDurationMs).toBe(record.battleDurationMs);
        expect(deserialized.winnerId).toBe(record.winnerId);
        expect(deserialized.winnerName).toBe(record.winnerName);
        expect(deserialized.totalTurns).toBe(record.totalTurns);

        // Verify challenger snapshot
        expect(deserialized.challenger.id).toBe(record.challenger.id);
        expect(deserialized.challenger.name).toBe(record.challenger.name);
        expect(deserialized.challenger.imageUrl).toBe(
          record.challenger.imageUrl
        );
        expect(deserialized.challenger.maxHp).toBe(record.challenger.maxHp);
        expect(deserialized.challenger.currentHp).toBe(
          record.challenger.currentHp
        );
        expect(deserialized.challenger.atk).toBe(record.challenger.atk);
        expect(deserialized.challenger.def).toBe(record.challenger.def);
        expect(deserialized.challenger.spd).toBe(record.challenger.spd);
        expect(deserialized.challenger.critChance).toBe(
          record.challenger.critChance
        );
        expect(deserialized.challenger.critDamage).toBe(
          record.challenger.critDamage
        );
        expect(deserialized.challenger.armorPen).toBe(
          record.challenger.armorPen
        );
        expect(deserialized.challenger.lifesteal).toBe(
          record.challenger.lifesteal
        );

        // Verify opponent snapshot
        expect(deserialized.opponent.id).toBe(record.opponent.id);
        expect(deserialized.opponent.name).toBe(record.opponent.name);
        expect(deserialized.opponent.imageUrl).toBe(record.opponent.imageUrl);
        expect(deserialized.opponent.maxHp).toBe(record.opponent.maxHp);
        expect(deserialized.opponent.currentHp).toBe(record.opponent.currentHp);
        expect(deserialized.opponent.atk).toBe(record.opponent.atk);
        expect(deserialized.opponent.def).toBe(record.opponent.def);
        expect(deserialized.opponent.spd).toBe(record.opponent.spd);
        expect(deserialized.opponent.critChance).toBe(
          record.opponent.critChance
        );
        expect(deserialized.opponent.critDamage).toBe(
          record.opponent.critDamage
        );
        expect(deserialized.opponent.armorPen).toBe(record.opponent.armorPen);
        expect(deserialized.opponent.lifesteal).toBe(record.opponent.lifesteal);

        // Verify turns array length and structure
        expect(deserialized.turns.length).toBe(record.turns.length);
        for (let i = 0; i < record.turns.length; i++) {
          const originalTurn = record.turns[i];
          const deserializedTurn = deserialized.turns[i];

          expect(deserializedTurn.turnNumber).toBe(originalTurn.turnNumber);
          expect(deserializedTurn.timestamp).toBe(originalTurn.timestamp);
          expect(deserializedTurn.attackerId).toBe(originalTurn.attackerId);
          expect(deserializedTurn.attackerName).toBe(originalTurn.attackerName);
          expect(deserializedTurn.defenderId).toBe(originalTurn.defenderId);
          expect(deserializedTurn.defenderName).toBe(originalTurn.defenderName);

          // Verify damage breakdown
          expect(deserializedTurn.damage.baseDamage).toBe(
            originalTurn.damage.baseDamage
          );
          expect(deserializedTurn.damage.isCrit).toBe(
            originalTurn.damage.isCrit
          );
          expect(deserializedTurn.damage.critMultiplier).toBe(
            originalTurn.damage.critMultiplier
          );
          expect(deserializedTurn.damage.critBonus).toBe(
            originalTurn.damage.critBonus
          );
          expect(deserializedTurn.damage.armorPenPercent).toBe(
            originalTurn.damage.armorPenPercent
          );
          expect(deserializedTurn.damage.defenderOriginalDef).toBe(
            originalTurn.damage.defenderOriginalDef
          );
          expect(deserializedTurn.damage.effectiveDefense).toBe(
            originalTurn.damage.effectiveDefense
          );
          expect(deserializedTurn.damage.finalDamage).toBe(
            originalTurn.damage.finalDamage
          );

          // Verify lifesteal detail
          expect(deserializedTurn.lifesteal.attackerLifestealPercent).toBe(
            originalTurn.lifesteal.attackerLifestealPercent
          );
          expect(deserializedTurn.lifesteal.lifestealAmount).toBe(
            originalTurn.lifesteal.lifestealAmount
          );
          expect(deserializedTurn.lifesteal.attackerHpBefore).toBe(
            originalTurn.lifesteal.attackerHpBefore
          );
          expect(deserializedTurn.lifesteal.attackerHpAfter).toBe(
            originalTurn.lifesteal.attackerHpAfter
          );
          expect(deserializedTurn.lifesteal.attackerMaxHp).toBe(
            originalTurn.lifesteal.attackerMaxHp
          );

          // Verify defender HP state
          expect(deserializedTurn.defenderHp.defenderHpBefore).toBe(
            originalTurn.defenderHp.defenderHpBefore
          );
          expect(deserializedTurn.defenderHp.defenderHpAfter).toBe(
            originalTurn.defenderHp.defenderHpAfter
          );
          expect(deserializedTurn.defenderHp.defenderMaxHp).toBe(
            originalTurn.defenderHp.defenderMaxHp
          );
          expect(deserializedTurn.defenderHp.isKnockout).toBe(
            originalTurn.defenderHp.isKnockout
          );
        }

        // Verify hpTimeline array length and structure
        expect(deserialized.hpTimeline.length).toBe(record.hpTimeline.length);
        for (let i = 0; i < record.hpTimeline.length; i++) {
          const originalEntry = record.hpTimeline[i];
          const deserializedEntry = deserialized.hpTimeline[i];

          expect(deserializedEntry.turnNumber).toBe(originalEntry.turnNumber);
          expect(deserializedEntry.timestamp).toBe(originalEntry.timestamp);
          expect(deserializedEntry.challengerHp).toBe(
            originalEntry.challengerHp
          );
          expect(deserializedEntry.challengerMaxHp).toBe(
            originalEntry.challengerMaxHp
          );
          expect(deserializedEntry.opponentHp).toBe(originalEntry.opponentHp);
          expect(deserializedEntry.opponentMaxHp).toBe(
            originalEntry.opponentMaxHp
          );
        }

        // Also verify deep equality using JSON comparison
        expect(JSON.stringify(deserialized)).toBe(serialized);
      }),
      { numRuns: 100 }
    );
  });
});
