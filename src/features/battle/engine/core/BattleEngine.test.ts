import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { BattleEngine } from "./BattleEngine";
import { createCombatant } from "./BattleState";
import type { Combatant, CombatantStats, GameEvent } from "./types";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

const combatantStatsArb: fc.Arbitrary<CombatantStats> = fc.record({
  // Core Stats (Tier 1)
  atk: fc.integer({ min: 1, max: 100 }),
  def: fc.integer({ min: 0, max: 50 }),
  spd: fc.integer({ min: 1, max: 500 }),

  // Combat Stats (Tier 2)
  critChance: fc.integer({ min: 0, max: 100 }),
  critDamage: fc.integer({ min: 100, max: 300 }),
  armorPen: fc.integer({ min: 0, max: 100 }),
  lifesteal: fc.integer({ min: 0, max: 100 }),
});

const combatantArb: fc.Arbitrary<Combatant> = fc
  .record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    imageUrl: fc.option(fc.webUrl(), { nil: null }),
    baseStats: combatantStatsArb,
    currentHp: fc.integer({ min: 1, max: 500 }),
    maxHp: fc.integer({ min: 1, max: 500 }),
    buffs: fc.constant([] as const),
    isDefeated: fc.constant(false),
  })
  .map((c) => ({
    ...c,
    maxHp: Math.max(c.maxHp, c.currentHp),
  }));

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("BattleEngine", () => {
  /**
   * **Feature: battle-engine-refactor, Property 8: Battle End Disables Attacks**
   *
   * For any battle in 'finished' phase, executeAttack() SHALL return null
   * and state SHALL remain unchanged.
   *
   * **Validates: Requirements 2.5**
   */
  describe("Property 8: Battle End Disables Attacks", () => {
    it("executeAttack returns null when battle is in finished phase", () => {
      fc.assert(
        fc.property(combatantArb, combatantArb, (challenger, opponent) => {
          const engine = new BattleEngine();

          // Initialize and start battle
          engine.initBattle(challenger, opponent);
          engine.startBattle();

          // Force battle to finished state by running until victory
          let attackCount = 0;
          const maxAttacks = 1000; // Safety limit
          while (
            engine.getState()?.phase === "fighting" &&
            attackCount < maxAttacks
          ) {
            engine.executeAttack();
            attackCount++;
          }

          // Verify battle is finished
          const finishedState = engine.getState();
          expect(finishedState?.phase).toBe("finished");

          // Store state before attempting attack
          const stateBeforeAttack = JSON.stringify(finishedState);

          // Attempt to execute attack on finished battle
          const result = engine.executeAttack();

          // Property 8: executeAttack SHALL return null
          expect(result).toBeNull();

          // Property 8: state SHALL remain unchanged
          const stateAfterAttack = JSON.stringify(engine.getState());
          expect(stateAfterAttack).toBe(stateBeforeAttack);
        }),
        { numRuns: 100 }
      );
    });

    it("executeAttack returns null when battle is not started (ready phase)", () => {
      fc.assert(
        fc.property(combatantArb, combatantArb, (challenger, opponent) => {
          const engine = new BattleEngine();

          // Initialize but don't start
          engine.initBattle(challenger, opponent);

          // Verify battle is in ready phase
          expect(engine.getState()?.phase).toBe("ready");

          // Attempt to execute attack
          const result = engine.executeAttack();

          // Should return null since not in fighting phase
          expect(result).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it("executeAttack returns null when no battle initialized", () => {
      const engine = new BattleEngine();

      // No battle initialized
      expect(engine.getState()).toBeNull();

      // Attempt to execute attack
      const result = engine.executeAttack();

      // Should return null
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe("Integration: Complete Battle Flow", () => {
    let engine: BattleEngine;
    let challenger: Combatant;
    let opponent: Combatant;

    beforeEach(() => {
      engine = new BattleEngine();
      challenger = createCombatant({
        id: "challenger-1",
        name: "Hero",
        hp: 100,
        atk: 25,
      });
      opponent = createCombatant({
        id: "opponent-1",
        name: "Monster",
        hp: 100,
        atk: 20,
      });
    });

    it("completes a full battle from init to victory", () => {
      // Initialize
      const initState = engine.initBattle(challenger, opponent);
      expect(initState.phase).toBe("ready");
      expect(initState.challenger.name).toBe("Hero");
      expect(initState.opponent.name).toBe("Monster");

      // Start battle
      const startState = engine.startBattle();
      expect(startState?.phase).toBe("fighting");
      expect(startState?.currentAttacker).toBe("challenger");

      // Execute attacks until victory
      let attackCount = 0;
      const maxAttacks = 100;
      while (
        engine.getState()?.phase === "fighting" &&
        attackCount < maxAttacks
      ) {
        const result = engine.executeAttack();
        expect(result).not.toBeNull();
        attackCount++;
      }

      // Verify victory
      const finalState = engine.getState();
      expect(finalState?.phase).toBe("finished");
      expect(finalState?.result).not.toBeNull();
      expect(["challenger", "opponent"]).toContain(finalState?.result?.winner);
    });

    it("alternates attackers correctly", () => {
      engine.initBattle(challenger, opponent);
      engine.startBattle();

      // First attack by challenger
      expect(engine.getState()?.currentAttacker).toBe("challenger");
      engine.executeAttack();

      // Check if battle continues (opponent might be defeated)
      if (engine.getState()?.phase === "fighting") {
        expect(engine.getState()?.currentAttacker).toBe("opponent");
        engine.executeAttack();

        if (engine.getState()?.phase === "fighting") {
          expect(engine.getState()?.currentAttacker).toBe("challenger");
        }
      }
    });

    it("logs attacks in battle log", () => {
      engine.initBattle(challenger, opponent);
      engine.startBattle();

      engine.executeAttack();

      const state = engine.getState();
      expect(state?.battleLog.length).toBeGreaterThan(0);
      expect(state?.battleLog[0].type).toBe("attack");
    });

    it("emits events during battle", () => {
      const events: GameEvent[] = [];

      engine.subscribe("battle_start", (e) => events.push(e));
      engine.subscribe("attack", (e) => events.push(e));
      engine.subscribe("state_changed", (e) => events.push(e));

      engine.initBattle(challenger, opponent);
      engine.startBattle();
      engine.executeAttack();

      const eventTypes = events.map((e) => e.type);
      expect(eventTypes).toContain("battle_start");
      expect(eventTypes).toContain("attack");
      expect(eventTypes).toContain("state_changed");
    });
  });

  describe("Integration: Auto-Battle", () => {
    let engine: BattleEngine;

    beforeEach(() => {
      engine = new BattleEngine();
      const challenger = createCombatant({
        id: "c1",
        name: "Hero",
        hp: 100,
        atk: 20,
      });
      const opponent = createCombatant({
        id: "o1",
        name: "Monster",
        hp: 100,
        atk: 15,
      });
      engine.initBattle(challenger, opponent);
    });

    it("toggles auto-battle mode", () => {
      expect(engine.getState()?.isAutoBattle).toBe(false);

      engine.toggleAutoBattle();
      expect(engine.getState()?.isAutoBattle).toBe(true);

      engine.toggleAutoBattle();
      expect(engine.getState()?.isAutoBattle).toBe(false);
    });

    it("returns null when toggling without initialized battle", () => {
      const newEngine = new BattleEngine();
      const result = newEngine.toggleAutoBattle();
      expect(result).toBeNull();
    });
  });

  describe("Integration: Reset Battle", () => {
    let engine: BattleEngine;

    beforeEach(() => {
      engine = new BattleEngine();
      const challenger = createCombatant({
        id: "c1",
        name: "Hero",
        hp: 100,
        atk: 50,
      });
      const opponent = createCombatant({
        id: "o1",
        name: "Monster",
        hp: 50,
        atk: 30,
      });
      engine.initBattle(challenger, opponent);
      engine.startBattle();
    });

    it("resets battle to initial state", () => {
      // Deal some damage
      engine.executeAttack();
      const damagedState = engine.getState();
      expect(damagedState?.opponent.currentHp).toBeLessThan(50);

      // Reset
      const resetState = engine.resetBattle();

      expect(resetState?.phase).toBe("ready");
      expect(resetState?.challenger.currentHp).toBe(100);
      expect(resetState?.opponent.currentHp).toBe(50);
      expect(resetState?.battleLog).toHaveLength(0);
      expect(resetState?.result).toBeNull();
    });

    it("returns null when resetting without initialized battle", () => {
      const newEngine = new BattleEngine();
      const result = newEngine.resetBattle();
      expect(result).toBeNull();
    });
  });

  describe("Integration: Serialization", () => {
    let engine: BattleEngine;

    beforeEach(() => {
      engine = new BattleEngine();
      const challenger = createCombatant({
        id: "c1",
        name: "Hero",
        hp: 100,
        atk: 20,
      });
      const opponent = createCombatant({
        id: "o1",
        name: "Monster",
        hp: 100,
        atk: 15,
      });
      engine.initBattle(challenger, opponent);
    });

    it("serializes and deserializes battle state", () => {
      engine.startBattle();
      engine.executeAttack();

      const originalState = engine.getState();
      const json = engine.serialize();

      // Create new engine and deserialize
      const newEngine = new BattleEngine();
      const restoredState = newEngine.deserialize(json);

      expect(restoredState.phase).toBe(originalState?.phase);
      expect(restoredState.turn).toBe(originalState?.turn);
      expect(restoredState.challenger.currentHp).toBe(
        originalState?.challenger.currentHp
      );
      expect(restoredState.opponent.currentHp).toBe(
        originalState?.opponent.currentHp
      );
    });

    it("throws error when serializing without initialized battle", () => {
      const newEngine = new BattleEngine();
      expect(() => newEngine.serialize()).toThrow(
        "No battle state to serialize"
      );
    });
  });

  // ============================================================================
  // UNIT TESTS
  // ============================================================================

  describe("initBattle()", () => {
    it("creates initial state with combatants", () => {
      const engine = new BattleEngine();
      const challenger = createCombatant({ id: "c1", name: "Hero", hp: 100 });
      const opponent = createCombatant({ id: "o1", name: "Monster", hp: 80 });

      const state = engine.initBattle(challenger, opponent);

      expect(state.phase).toBe("ready");
      expect(state.turn).toBe(1);
      expect(state.challenger.id).toBe("c1");
      expect(state.opponent.id).toBe("o1");
      expect(state.currentAttacker).toBe("challenger");
    });
  });

  describe("startBattle()", () => {
    it("transitions from ready to fighting phase", () => {
      const engine = new BattleEngine();
      const challenger = createCombatant({ id: "c1", name: "Hero", hp: 100 });
      const opponent = createCombatant({ id: "o1", name: "Monster", hp: 80 });

      engine.initBattle(challenger, opponent);
      const state = engine.startBattle();

      expect(state?.phase).toBe("fighting");
    });

    it("returns null if not in ready phase", () => {
      const engine = new BattleEngine();

      // No battle initialized
      expect(engine.startBattle()).toBeNull();
    });
  });

  describe("clearSubscriptions()", () => {
    it("removes all event subscriptions", () => {
      const engine = new BattleEngine();
      const handler = vi.fn();

      engine.subscribe("state_changed", handler);
      engine.clearSubscriptions();

      const challenger = createCombatant({ id: "c1", name: "Hero", hp: 100 });
      const opponent = createCombatant({ id: "o1", name: "Monster", hp: 80 });
      engine.initBattle(challenger, opponent);

      // Handler should not be called after clearing
      // Note: initBattle emits state_changed, but subscription was cleared
      // We need to verify by checking the handler wasn't called after clear
      handler.mockClear();
      engine.clearSubscriptions();
      engine.initBattle(challenger, opponent);

      // Since we cleared before init, handler should not be called
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
