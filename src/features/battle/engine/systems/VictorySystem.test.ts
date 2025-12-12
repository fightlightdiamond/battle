import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createVictorySystem, victorySystem } from "./VictorySystem";
import type { Combatant, CombatantStats, BattleState } from "../core/types";

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
    currentHp: fc.integer({ min: -100, max: 9999 }),
    maxHp: fc.integer({ min: 1, max: 9999 }),
    buffs: fc.constant([]),
    isDefeated: fc.boolean(),
  })
  .map((c) => ({
    ...c,
    // Ensure maxHp is at least 1
    maxHp: Math.max(1, c.maxHp),
  }));

// Combatant with HP > 0 (alive)
const aliveCombatantArb: fc.Arbitrary<Combatant> = combatantArb
  .filter((c) => c.maxHp > 0)
  .map((c) => ({
    ...c,
    currentHp: Math.min(Math.max(1, Math.abs(c.currentHp) || 1), c.maxHp),
  }));

// Battle state generator
const battleStateArb = (
  challengerArb: fc.Arbitrary<Combatant>,
  opponentArb: fc.Arbitrary<Combatant>
): fc.Arbitrary<BattleState> =>
  fc.record({
    phase: fc.constant("fighting" as const),
    turn: fc.integer({ min: 1, max: 100 }),
    challenger: challengerArb,
    opponent: opponentArb,
    currentAttacker: fc.constantFrom("challenger", "opponent") as fc.Arbitrary<
      "challenger" | "opponent"
    >,
    battleLog: fc.constant([]),
    result: fc.constant(null),
    isAutoBattle: fc.boolean(),
  });

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("VictorySystem", () => {
  /**
   * **Feature: battle-engine-refactor, Property 5: Defeated Combatant Detection**
   *
   * For any combatant with currentHp <= 0, isDefeated SHALL be true.
   *
   * **Validates: Requirements 2.4**
   */
  it("Property 5: Combatant with HP <= 0 is detected as defeated", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 0 }),
        combatantStatsArb,
        (hp, stats) => {
          const combatant: Combatant = {
            id: "test-id",
            name: "Test",
            imageUrl: null,
            baseStats: stats,
            currentHp: hp,
            maxHp: 100,
            buffs: [],
            isDefeated: false,
          };

          expect(victorySystem.isDefeated(combatant)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5 extension: Combatant with HP > 0 is NOT defeated
   */
  it("Property 5 extension: Combatant with HP > 0 is not defeated", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        combatantStatsArb,
        (hp, stats) => {
          const combatant: Combatant = {
            id: "test-id",
            name: "Test",
            imageUrl: null,
            baseStats: stats,
            currentHp: hp,
            maxHp: Math.max(hp, 100),
            buffs: [],
            isDefeated: false,
          };

          expect(victorySystem.isDefeated(combatant)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: battle-engine-refactor, Property 6: Victory Determination**
   *
   * For any battle state where challenger.currentHp <= 0,
   * result SHALL be opponent_wins.
   * For opponent.currentHp <= 0, result SHALL be challenger_wins.
   *
   * **Validates: Requirements 2.5**
   */
  it("Property 6: Challenger HP <= 0 means opponent wins", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 0 }),
        aliveCombatantArb,
        fc.integer({ min: 1, max: 100 }),
        (challengerHp, opponent, turn) => {
          const challenger: Combatant = {
            id: "challenger-id",
            name: "Challenger",
            imageUrl: null,
            baseStats: { atk: 100, def: 50, critRate: 0.1, critDamage: 1.5 },
            currentHp: challengerHp,
            maxHp: 100,
            buffs: [],
            isDefeated: true,
          };

          const state: BattleState = {
            phase: "fighting",
            turn,
            challenger,
            opponent,
            currentAttacker: "challenger",
            battleLog: [],
            result: null,
            isAutoBattle: false,
          };

          const result = victorySystem.checkVictory(state);

          expect(result).not.toBeNull();
          expect(result!.winner).toBe("opponent");
          expect(result!.winnerName).toBe(opponent.name);
          expect(result!.totalTurns).toBe(turn);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 6: Opponent HP <= 0 means challenger wins", () => {
    fc.assert(
      fc.property(
        aliveCombatantArb,
        fc.integer({ min: -1000, max: 0 }),
        fc.integer({ min: 1, max: 100 }),
        (challenger, opponentHp, turn) => {
          const opponent: Combatant = {
            id: "opponent-id",
            name: "Opponent",
            imageUrl: null,
            baseStats: { atk: 100, def: 50, critRate: 0.1, critDamage: 1.5 },
            currentHp: opponentHp,
            maxHp: 100,
            buffs: [],
            isDefeated: true,
          };

          const state: BattleState = {
            phase: "fighting",
            turn,
            challenger,
            opponent,
            currentAttacker: "opponent",
            battleLog: [],
            result: null,
            isAutoBattle: false,
          };

          const result = victorySystem.checkVictory(state);

          expect(result).not.toBeNull();
          expect(result!.winner).toBe("challenger");
          expect(result!.winnerName).toBe(challenger.name);
          expect(result!.totalTurns).toBe(turn);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6 extension: Both combatants alive means no victory yet
   */
  it("Property 6 extension: Both combatants alive means no victory", () => {
    fc.assert(
      fc.property(
        battleStateArb(aliveCombatantArb, aliveCombatantArb),
        (state) => {
          const result = victorySystem.checkVictory(state);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // UNIT TESTS
  // ============================================================================

  describe("isDefeated()", () => {
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

    it("returns true when HP is 0", () => {
      const defeated = { ...baseCombatant, currentHp: 0 };
      expect(victorySystem.isDefeated(defeated)).toBe(true);
    });

    it("returns true when HP is negative", () => {
      const defeated = { ...baseCombatant, currentHp: -10 };
      expect(victorySystem.isDefeated(defeated)).toBe(true);
    });

    it("returns false when HP is positive", () => {
      expect(victorySystem.isDefeated(baseCombatant)).toBe(false);
    });

    it("returns false when HP is 1", () => {
      const almostDead = { ...baseCombatant, currentHp: 1 };
      expect(victorySystem.isDefeated(almostDead)).toBe(false);
    });
  });

  describe("checkVictory()", () => {
    const challenger: Combatant = {
      id: "challenger-1",
      name: "Hero",
      imageUrl: null,
      baseStats: { atk: 100, def: 50, critRate: 0.1, critDamage: 1.5 },
      currentHp: 100,
      maxHp: 100,
      buffs: [],
      isDefeated: false,
    };

    const opponent: Combatant = {
      id: "opponent-1",
      name: "Monster",
      imageUrl: null,
      baseStats: { atk: 80, def: 40, critRate: 0.1, critDamage: 1.5 },
      currentHp: 100,
      maxHp: 100,
      buffs: [],
      isDefeated: false,
    };

    const baseState: BattleState = {
      phase: "fighting",
      turn: 5,
      challenger,
      opponent,
      currentAttacker: "challenger",
      battleLog: [],
      result: null,
      isAutoBattle: false,
    };

    it("returns null when both combatants are alive", () => {
      const result = victorySystem.checkVictory(baseState);
      expect(result).toBeNull();
    });

    it("returns opponent wins when challenger HP is 0", () => {
      const state: BattleState = {
        ...baseState,
        challenger: { ...challenger, currentHp: 0 },
      };
      const result = victorySystem.checkVictory(state);

      expect(result).not.toBeNull();
      expect(result!.winner).toBe("opponent");
      expect(result!.winnerName).toBe("Monster");
      expect(result!.totalTurns).toBe(5);
    });

    it("returns challenger wins when opponent HP is 0", () => {
      const state: BattleState = {
        ...baseState,
        opponent: { ...opponent, currentHp: 0 },
      };
      const result = victorySystem.checkVictory(state);

      expect(result).not.toBeNull();
      expect(result!.winner).toBe("challenger");
      expect(result!.winnerName).toBe("Hero");
      expect(result!.totalTurns).toBe(5);
    });

    it("returns opponent wins when challenger HP is negative", () => {
      const state: BattleState = {
        ...baseState,
        challenger: { ...challenger, currentHp: -50 },
      };
      const result = victorySystem.checkVictory(state);

      expect(result).not.toBeNull();
      expect(result!.winner).toBe("opponent");
    });

    it("prioritizes challenger defeat when both are defeated", () => {
      // Edge case: if both are defeated, challenger is checked first
      const state: BattleState = {
        ...baseState,
        challenger: { ...challenger, currentHp: 0 },
        opponent: { ...opponent, currentHp: 0 },
      };
      const result = victorySystem.checkVictory(state);

      expect(result).not.toBeNull();
      expect(result!.winner).toBe("opponent");
    });
  });

  describe("createVictorySystem()", () => {
    it("creates independent victory system instances", () => {
      const system1 = createVictorySystem();
      const system2 = createVictorySystem();
      expect(system1).not.toBe(system2);
    });
  });
});
