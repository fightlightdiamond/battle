import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { Serializer } from "./Serializer";
import type {
  BattleState,
  BattlePhase,
  Combatant,
  CombatantStats,
  ActiveBuff,
  BattleLogEntry,
  BattleResult,
  AttackLogData,
} from "../core/types";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

const combatantStatsArb: fc.Arbitrary<CombatantStats> = fc.record({
  atk: fc.integer({ min: 1, max: 9999 }),
  def: fc.integer({ min: 0, max: 9999 }),
  critRate: fc.float({ min: 0, max: 1, noNaN: true }),
  critDamage: fc.float({ min: 1, max: 5, noNaN: true }),
});

const activeBuffArb: fc.Arbitrary<ActiveBuff> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom("buff", "debuff") as fc.Arbitrary<"buff" | "debuff">,
  stat: fc.constantFrom("atk", "def", "critRate", "critDamage") as fc.Arbitrary<
    keyof CombatantStats
  >,
  value: fc.integer({ min: 1, max: 1000 }),
  isPercentage: fc.boolean(),
  remainingDuration: fc.integer({ min: 0, max: 100 }),
  stackRule: fc.constantFrom("replace", "add", "max") as fc.Arbitrary<
    "replace" | "add" | "max"
  >,
  stacks: fc.integer({ min: 1, max: 10 }),
});

const combatantArb: fc.Arbitrary<Combatant> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  imageUrl: fc.option(fc.webUrl(), { nil: null }),
  baseStats: combatantStatsArb,
  currentHp: fc.integer({ min: 0, max: 9999 }),
  maxHp: fc.integer({ min: 1, max: 9999 }),
  buffs: fc.array(activeBuffArb, { maxLength: 5 }),
  isDefeated: fc.boolean(),
});

const attackLogDataArb: fc.Arbitrary<AttackLogData> = fc.record({
  attackerId: fc.uuid(),
  defenderId: fc.uuid(),
  damage: fc.integer({ min: 0, max: 9999 }),
  isCritical: fc.boolean(),
  defenderRemainingHp: fc.integer({ min: 0, max: 9999 }),
});

const battleLogEntryArb: fc.Arbitrary<BattleLogEntry> = fc.oneof(
  // Attack log entry with data
  fc.record({
    id: fc.uuid(),
    timestamp: fc.integer({ min: 0 }),
    type: fc.constant("attack" as const),
    message: fc.string({ minLength: 1, maxLength: 200 }),
    data: attackLogDataArb,
  }),
  // Victory log entry without data
  fc.record({
    id: fc.uuid(),
    timestamp: fc.integer({ min: 0 }),
    type: fc.constant("victory" as const),
    message: fc.string({ minLength: 1, maxLength: 200 }),
  }),
  // Buff log entry without data
  fc.record({
    id: fc.uuid(),
    timestamp: fc.integer({ min: 0 }),
    type: fc.constant("buff" as const),
    message: fc.string({ minLength: 1, maxLength: 200 }),
  })
);

const battleResultArb: fc.Arbitrary<BattleResult> = fc.record({
  winner: fc.constantFrom("challenger", "opponent") as fc.Arbitrary<
    "challenger" | "opponent"
  >,
  winnerName: fc.string({ minLength: 1, maxLength: 100 }),
  totalTurns: fc.integer({ min: 1, max: 1000 }),
});

const battlePhaseArb: fc.Arbitrary<BattlePhase> = fc.constantFrom(
  "setup",
  "ready",
  "fighting",
  "finished"
);

const battleStateArb: fc.Arbitrary<BattleState> = fc.record({
  phase: battlePhaseArb,
  turn: fc.integer({ min: 0, max: 1000 }),
  challenger: combatantArb,
  opponent: combatantArb,
  currentAttacker: fc.constantFrom("challenger", "opponent") as fc.Arbitrary<
    "challenger" | "opponent"
  >,
  battleLog: fc.array(battleLogEntryArb, { maxLength: 50 }),
  result: fc.option(battleResultArb, { nil: null }),
  isAutoBattle: fc.boolean(),
});

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("Serializer", () => {
  /**
   * **Feature: battle-engine-refactor, Property 1: State Serialization Round-Trip**
   *
   * For any valid BattleState, serializing to JSON and then deserializing
   * SHALL produce an equivalent state object.
   *
   * **Validates: Requirements 1.3, 1.4**
   */
  it("Property 1: serialize then deserialize produces equivalent state (round-trip)", () => {
    fc.assert(
      fc.property(battleStateArb, (originalState) => {
        const serialized = Serializer.serialize(originalState);
        const deserialized = Serializer.deserialize(serialized);

        // Deep equality check
        expect(deserialized).toEqual(originalState);
      }),
      { numRuns: 100 }
    );
  });

  // Unit tests for edge cases and error handling
  describe("deserialize validation", () => {
    it("throws on invalid JSON", () => {
      expect(() => Serializer.deserialize("not valid json")).toThrow(
        "Invalid JSON string"
      );
    });

    it("throws on non-object input", () => {
      expect(() => Serializer.deserialize('"string"')).toThrow(
        "BattleState must be an object"
      );
      expect(() => Serializer.deserialize("123")).toThrow(
        "BattleState must be an object"
      );
      expect(() => Serializer.deserialize("null")).toThrow(
        "BattleState must be an object"
      );
    });

    it("throws on invalid phase", () => {
      const invalidState = { phase: "invalid" };
      expect(() =>
        Serializer.deserialize(JSON.stringify(invalidState))
      ).toThrow("Invalid phase");
    });

    it("throws on missing required fields", () => {
      const incompleteState = { phase: "setup" };
      expect(() =>
        Serializer.deserialize(JSON.stringify(incompleteState))
      ).toThrow();
    });
  });
});
