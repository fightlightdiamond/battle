import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  createCombatant,
  createInitialState,
  updateChallenger,
  updateOpponent,
  updateCombatant,
  setPhase,
  addLogEntry,
  setResult,
  toggleAutoBattle,
  advanceTurn,
  applyDamage,
  cloneState,
} from "./BattleState";
import type {
  BattleState,
  Combatant,
  CombatantStats,
  BattleLogEntry,
  BattleResult,
} from "./types";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

const combatantStatsArb: fc.Arbitrary<CombatantStats> = fc.record({
  atk: fc.integer({ min: 1, max: 9999 }),
  def: fc.integer({ min: 0, max: 9999 }),
  critRate: fc.float({ min: 0, max: 1, noNaN: true }),
  critDamage: fc.float({ min: 1, max: 5, noNaN: true }),
});

const combatantArb: fc.Arbitrary<Combatant> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  imageUrl: fc.option(fc.webUrl(), { nil: null }),
  baseStats: combatantStatsArb,
  currentHp: fc.integer({ min: 1, max: 9999 }),
  maxHp: fc.integer({ min: 1, max: 9999 }),
  buffs: fc.constant([]),
  isDefeated: fc.constant(false),
});

const battleLogEntryArb: fc.Arbitrary<BattleLogEntry> = fc.record({
  id: fc.uuid(),
  timestamp: fc.integer({ min: 0 }),
  type: fc.constant("attack" as const),
  message: fc.string({ minLength: 1, maxLength: 200 }),
});

const battleResultArb: fc.Arbitrary<BattleResult> = fc.record({
  winner: fc.constantFrom("challenger", "opponent") as fc.Arbitrary<
    "challenger" | "opponent"
  >,
  winnerName: fc.string({ minLength: 1, maxLength: 100 }),
  totalTurns: fc.integer({ min: 1, max: 1000 }),
});

// Generate a valid initial battle state
const initialBattleStateArb: fc.Arbitrary<BattleState> = fc
  .tuple(combatantArb, combatantArb)
  .map(([challenger, opponent]) => createInitialState(challenger, opponent));

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("BattleState", () => {
  /**
   * **Feature: battle-engine-refactor, Property 2: State Immutability**
   *
   * For any combat action executed on a state S, the original state S
   * SHALL remain unchanged and a new state S' SHALL be returned.
   *
   * **Validates: Requirements 1.2**
   */
  describe("Property 2: State Immutability", () => {
    it("updateChallenger does not mutate original state", () => {
      fc.assert(
        fc.property(initialBattleStateArb, (originalState) => {
          const originalClone = cloneState(originalState);
          const newState = updateChallenger(originalState, { currentHp: 50 });

          // Original state should be unchanged
          expect(originalState).toEqual(originalClone);
          // New state should be different object
          expect(newState).not.toBe(originalState);
          expect(newState.challenger).not.toBe(originalState.challenger);
        }),
        { numRuns: 100 }
      );
    });

    it("updateOpponent does not mutate original state", () => {
      fc.assert(
        fc.property(initialBattleStateArb, (originalState) => {
          const originalClone = cloneState(originalState);
          const newState = updateOpponent(originalState, { currentHp: 50 });

          expect(originalState).toEqual(originalClone);
          expect(newState).not.toBe(originalState);
          expect(newState.opponent).not.toBe(originalState.opponent);
        }),
        { numRuns: 100 }
      );
    });

    it("setPhase does not mutate original state", () => {
      fc.assert(
        fc.property(initialBattleStateArb, (originalState) => {
          const originalClone = cloneState(originalState);
          const newState = setPhase(originalState, "fighting");

          expect(originalState).toEqual(originalClone);
          expect(newState).not.toBe(originalState);
        }),
        { numRuns: 100 }
      );
    });

    it("addLogEntry does not mutate original state", () => {
      fc.assert(
        fc.property(
          initialBattleStateArb,
          battleLogEntryArb,
          (originalState, logEntry) => {
            const originalClone = cloneState(originalState);
            const newState = addLogEntry(originalState, logEntry);

            expect(originalState).toEqual(originalClone);
            expect(newState).not.toBe(originalState);
            expect(newState.battleLog).not.toBe(originalState.battleLog);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("setResult does not mutate original state", () => {
      fc.assert(
        fc.property(
          initialBattleStateArb,
          battleResultArb,
          (originalState, result) => {
            const originalClone = cloneState(originalState);
            const newState = setResult(originalState, result);

            expect(originalState).toEqual(originalClone);
            expect(newState).not.toBe(originalState);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("toggleAutoBattle does not mutate original state", () => {
      fc.assert(
        fc.property(initialBattleStateArb, (originalState) => {
          const originalClone = cloneState(originalState);
          const newState = toggleAutoBattle(originalState);

          expect(originalState).toEqual(originalClone);
          expect(newState).not.toBe(originalState);
        }),
        { numRuns: 100 }
      );
    });

    it("advanceTurn does not mutate original state", () => {
      fc.assert(
        fc.property(initialBattleStateArb, (originalState) => {
          const originalClone = cloneState(originalState);
          const newState = advanceTurn(originalState);

          expect(originalState).toEqual(originalClone);
          expect(newState).not.toBe(originalState);
        }),
        { numRuns: 100 }
      );
    });

    it("applyDamage does not mutate original state", () => {
      fc.assert(
        fc.property(
          initialBattleStateArb,
          fc.integer({ min: 1, max: 100 }),
          (originalState, damage) => {
            const originalClone = cloneState(originalState);
            const newState = applyDamage(originalState, "challenger", damage);

            expect(originalState).toEqual(originalClone);
            expect(newState).not.toBe(originalState);
            expect(newState.challenger).not.toBe(originalState.challenger);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("updateCombatant does not mutate original state for either role", () => {
      fc.assert(
        fc.property(
          initialBattleStateArb,
          fc.constantFrom("challenger", "opponent") as fc.Arbitrary<
            "challenger" | "opponent"
          >,
          (originalState, role) => {
            const originalClone = cloneState(originalState);
            const newState = updateCombatant(originalState, role, {
              currentHp: 25,
            });

            expect(originalState).toEqual(originalClone);
            expect(newState).not.toBe(originalState);
            expect(newState[role]).not.toBe(originalState[role]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // UNIT TESTS
  // ============================================================================

  describe("createCombatant", () => {
    it("creates combatant with required fields", () => {
      const combatant = createCombatant({
        id: "test-id",
        name: "Test Hero",
        hp: 100,
      });

      expect(combatant.id).toBe("test-id");
      expect(combatant.name).toBe("Test Hero");
      expect(combatant.currentHp).toBe(100);
      expect(combatant.maxHp).toBe(100);
      expect(combatant.isDefeated).toBe(false);
      expect(combatant.buffs).toEqual([]);
    });

    it("uses default stats when not provided", () => {
      const combatant = createCombatant({
        id: "test-id",
        name: "Test Hero",
        hp: 100,
      });

      expect(combatant.baseStats.atk).toBe(10);
      expect(combatant.baseStats.def).toBe(0);
      expect(combatant.baseStats.critRate).toBe(0);
      expect(combatant.baseStats.critDamage).toBe(1.5);
    });

    it("uses provided stats when given", () => {
      const combatant = createCombatant({
        id: "test-id",
        name: "Test Hero",
        hp: 100,
        atk: 50,
        def: 20,
        critRate: 0.1,
        critDamage: 2.0,
      });

      expect(combatant.baseStats.atk).toBe(50);
      expect(combatant.baseStats.def).toBe(20);
      expect(combatant.baseStats.critRate).toBe(0.1);
      expect(combatant.baseStats.critDamage).toBe(2.0);
    });
  });

  describe("createInitialState", () => {
    it("creates state in ready phase", () => {
      const challenger = createCombatant({
        id: "c1",
        name: "Challenger",
        hp: 100,
      });
      const opponent = createCombatant({ id: "o1", name: "Opponent", hp: 100 });
      const state = createInitialState(challenger, opponent);

      expect(state.phase).toBe("ready");
      expect(state.turn).toBe(1);
      expect(state.currentAttacker).toBe("challenger");
      expect(state.battleLog).toEqual([]);
      expect(state.result).toBeNull();
      expect(state.isAutoBattle).toBe(false);
    });
  });

  describe("applyDamage", () => {
    it("reduces HP correctly", () => {
      const challenger = createCombatant({
        id: "c1",
        name: "Challenger",
        hp: 100,
      });
      const opponent = createCombatant({ id: "o1", name: "Opponent", hp: 100 });
      const state = createInitialState(challenger, opponent);

      const newState = applyDamage(state, "challenger", 30);

      expect(newState.challenger.currentHp).toBe(70);
      expect(newState.challenger.isDefeated).toBe(false);
    });

    it("clamps HP to 0 and marks defeated", () => {
      const challenger = createCombatant({
        id: "c1",
        name: "Challenger",
        hp: 50,
      });
      const opponent = createCombatant({ id: "o1", name: "Opponent", hp: 100 });
      const state = createInitialState(challenger, opponent);

      const newState = applyDamage(state, "challenger", 100);

      expect(newState.challenger.currentHp).toBe(0);
      expect(newState.challenger.isDefeated).toBe(true);
    });
  });

  describe("advanceTurn", () => {
    it("increments turn and alternates attacker", () => {
      const challenger = createCombatant({
        id: "c1",
        name: "Challenger",
        hp: 100,
      });
      const opponent = createCombatant({ id: "o1", name: "Opponent", hp: 100 });
      const state = createInitialState(challenger, opponent);

      expect(state.turn).toBe(1);
      expect(state.currentAttacker).toBe("challenger");

      const state2 = advanceTurn(state);
      expect(state2.turn).toBe(2);
      expect(state2.currentAttacker).toBe("opponent");

      const state3 = advanceTurn(state2);
      expect(state3.turn).toBe(3);
      expect(state3.currentAttacker).toBe("challenger");
    });
  });

  describe("setResult", () => {
    it("sets result and changes phase to finished", () => {
      const challenger = createCombatant({
        id: "c1",
        name: "Challenger",
        hp: 100,
      });
      const opponent = createCombatant({ id: "o1", name: "Opponent", hp: 100 });
      const state = createInitialState(challenger, opponent);

      const result: BattleResult = {
        winner: "challenger",
        winnerName: "Challenger",
        totalTurns: 5,
      };

      const newState = setResult(state, result);

      expect(newState.result).toEqual(result);
      expect(newState.phase).toBe("finished");
    });
  });
});
