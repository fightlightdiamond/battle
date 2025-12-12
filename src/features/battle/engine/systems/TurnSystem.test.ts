import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createTurnSystem, turnSystem } from "./TurnSystem";
import type { BattleState, Combatant, CombatantStats } from "../core/types";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

const combatantStatsArb: fc.Arbitrary<CombatantStats> = fc.record({
  atk: fc.integer({ min: 1, max: 9999 }),
  def: fc.integer({ min: 0, max: 9999 }),
  critRate: fc.float({ min: 0, max: 1, noNaN: true }),
  critDamage: fc.float({ min: 1, max: 5, noNaN: true }),
});

const combatantArb: fc.Arbitrary<Combatant> = fc
  .record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    imageUrl: fc.option(fc.webUrl(), { nil: null }),
    baseStats: combatantStatsArb,
    currentHp: fc.integer({ min: 1, max: 9999 }),
    maxHp: fc.integer({ min: 1, max: 9999 }),
    buffs: fc.constant([]),
    isDefeated: fc.constant(false),
  })
  .map((c) => ({
    ...c,
    currentHp: Math.min(c.currentHp, c.maxHp),
  }));

const currentAttackerArb: fc.Arbitrary<"challenger" | "opponent"> =
  fc.constantFrom("challenger", "opponent");

const battleStateArb: fc.Arbitrary<BattleState> = fc
  .record({
    phase: fc.constantFrom("setup", "ready", "fighting", "finished"),
    turn: fc.integer({ min: 0, max: 9999 }),
    challenger: combatantArb,
    opponent: combatantArb,
    currentAttacker: currentAttackerArb,
    battleLog: fc.constant([]),
    result: fc.constant(null),
    isAutoBattle: fc.boolean(),
  })
  .map((s) => s as BattleState);

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("TurnSystem", () => {
  /**
   * **Feature: battle-engine-refactor, Property 4: Turn Alternation**
   *
   * For any sequence of N attacks, the attacker SHALL alternate between
   * challenger and opponent. If attack N is by challenger, attack N+1
   * SHALL be by opponent.
   *
   * **Validates: Requirements 2.3**
   */
  it("Property 4: Turn alternation - getNextAttacker alternates correctly", () => {
    fc.assert(
      fc.property(currentAttackerArb, (currentAttacker) => {
        const nextAttacker = turnSystem.getNextAttacker(currentAttacker);

        // If current is challenger, next should be opponent
        if (currentAttacker === "challenger") {
          expect(nextAttacker).toBe("opponent");
        } else {
          // If current is opponent, next should be challenger
          expect(nextAttacker).toBe("challenger");
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: battle-engine-refactor, Property 4: Turn Alternation**
   *
   * For any battle state, advanceTurn SHALL switch the currentAttacker
   * and increment the turn counter.
   *
   * **Validates: Requirements 2.3**
   */
  it("Property 4: advanceTurn switches attacker and increments turn", () => {
    fc.assert(
      fc.property(battleStateArb, (state) => {
        const newState = turnSystem.advanceTurn(state);

        // Turn should increment by 1
        expect(newState.turn).toBe(state.turn + 1);

        // Attacker should alternate
        if (state.currentAttacker === "challenger") {
          expect(newState.currentAttacker).toBe("opponent");
        } else {
          expect(newState.currentAttacker).toBe("challenger");
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4 extension: Multiple consecutive turns maintain alternation
   */
  it("Property 4 extension: Multiple turns maintain strict alternation", () => {
    fc.assert(
      fc.property(
        battleStateArb,
        fc.integer({ min: 1, max: 20 }),
        (initialState, numTurns) => {
          let state = initialState;
          const attackerSequence: Array<"challenger" | "opponent"> = [
            state.currentAttacker,
          ];

          // Advance multiple turns
          for (let i = 0; i < numTurns; i++) {
            state = turnSystem.advanceTurn(state);
            attackerSequence.push(state.currentAttacker);
          }

          // Verify alternation: no two consecutive attackers should be the same
          for (let i = 1; i < attackerSequence.length; i++) {
            expect(attackerSequence[i]).not.toBe(attackerSequence[i - 1]);
          }

          // Verify turn count
          expect(state.turn).toBe(initialState.turn + numTurns);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // UNIT TESTS
  // ============================================================================

  describe("getNextAttacker()", () => {
    it("returns opponent when current is challenger", () => {
      expect(turnSystem.getNextAttacker("challenger")).toBe("opponent");
    });

    it("returns challenger when current is opponent", () => {
      expect(turnSystem.getNextAttacker("opponent")).toBe("challenger");
    });
  });

  describe("advanceTurn()", () => {
    const baseCombatant: Combatant = {
      id: "test-1",
      name: "Test Fighter",
      imageUrl: null,
      baseStats: { atk: 100, def: 50, critRate: 0.1, critDamage: 1.5 },
      currentHp: 100,
      maxHp: 100,
      buffs: [],
      isDefeated: false,
    };

    const baseState: BattleState = {
      phase: "fighting",
      turn: 1,
      challenger: baseCombatant,
      opponent: { ...baseCombatant, id: "test-2", name: "Opponent" },
      currentAttacker: "challenger",
      battleLog: [],
      result: null,
      isAutoBattle: false,
    };

    it("increments turn counter by 1", () => {
      const newState = turnSystem.advanceTurn(baseState);
      expect(newState.turn).toBe(2);
    });

    it("switches from challenger to opponent", () => {
      const newState = turnSystem.advanceTurn(baseState);
      expect(newState.currentAttacker).toBe("opponent");
    });

    it("switches from opponent to challenger", () => {
      const opponentTurnState = {
        ...baseState,
        currentAttacker: "opponent" as const,
      };
      const newState = turnSystem.advanceTurn(opponentTurnState);
      expect(newState.currentAttacker).toBe("challenger");
    });

    it("does not mutate original state (immutability)", () => {
      const originalTurn = baseState.turn;
      const originalAttacker = baseState.currentAttacker;
      turnSystem.advanceTurn(baseState);
      expect(baseState.turn).toBe(originalTurn);
      expect(baseState.currentAttacker).toBe(originalAttacker);
    });

    it("preserves other state properties", () => {
      const newState = turnSystem.advanceTurn(baseState);
      expect(newState.phase).toBe(baseState.phase);
      expect(newState.challenger).toBe(baseState.challenger);
      expect(newState.opponent).toBe(baseState.opponent);
      expect(newState.battleLog).toBe(baseState.battleLog);
      expect(newState.result).toBe(baseState.result);
      expect(newState.isAutoBattle).toBe(baseState.isAutoBattle);
    });
  });

  describe("createTurnSystem()", () => {
    it("creates independent turn system instances", () => {
      const system1 = createTurnSystem();
      const system2 = createTurnSystem();
      expect(system1).not.toBe(system2);
    });
  });
});
