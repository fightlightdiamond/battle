import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createCombatSystem, combatSystem } from "./CombatSystem";
import type { Combatant, CombatantStats } from "../core/types";

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
    // Ensure currentHp <= maxHp
    currentHp: Math.min(c.currentHp, c.maxHp),
  }));

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("CombatSystem", () => {
  /**
   * **Feature: battle-engine-refactor, Property 7: HP Reduction Correctness**
   *
   * For any attack dealing damage D to a combatant with HP H,
   * the new HP SHALL equal max(0, H - D).
   *
   * **Validates: Requirements 2.3**
   */
  it("Property 7: HP reduction equals max(0, currentHp - damage)", () => {
    fc.assert(
      fc.property(
        combatantArb,
        fc.integer({ min: 0, max: 9999 }),
        (combatant, damage) => {
          const result = combatSystem.applyDamage(combatant, damage);
          const expectedHp = Math.max(0, combatant.currentHp - damage);

          expect(result.currentHp).toBe(expectedHp);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 extension: isDefeated flag is correctly set when HP reaches 0
   */
  it("Property 7 extension: isDefeated is true when HP reaches 0", () => {
    fc.assert(
      fc.property(
        combatantArb,
        fc.integer({ min: 0, max: 9999 }),
        (combatant, damage) => {
          const result = combatSystem.applyDamage(combatant, damage);
          const expectedHp = Math.max(0, combatant.currentHp - damage);

          if (expectedHp <= 0) {
            expect(result.isDefeated).toBe(true);
          } else {
            expect(result.isDefeated).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // UNIT TESTS
  // ============================================================================

  describe("applyDamage()", () => {
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

    it("reduces HP by damage amount", () => {
      const result = combatSystem.applyDamage(baseCombatant, 30);
      expect(result.currentHp).toBe(70);
      expect(result.isDefeated).toBe(false);
    });

    it("clamps HP to 0 when damage exceeds current HP", () => {
      const result = combatSystem.applyDamage(baseCombatant, 150);
      expect(result.currentHp).toBe(0);
      expect(result.isDefeated).toBe(true);
    });

    it("sets isDefeated when HP reaches exactly 0", () => {
      const result = combatSystem.applyDamage(baseCombatant, 100);
      expect(result.currentHp).toBe(0);
      expect(result.isDefeated).toBe(true);
    });

    it("does not mutate original combatant (immutability)", () => {
      const original = { ...baseCombatant };
      combatSystem.applyDamage(baseCombatant, 50);
      expect(baseCombatant.currentHp).toBe(original.currentHp);
      expect(baseCombatant.isDefeated).toBe(original.isDefeated);
    });
  });

  describe("calculateAttack()", () => {
    const attacker: Combatant = {
      id: "attacker-1",
      name: "Attacker",
      imageUrl: null,
      baseStats: { atk: 50, def: 30, critRate: 0.1, critDamage: 1.5 },
      currentHp: 100,
      maxHp: 100,
      buffs: [],
      isDefeated: false,
    };

    const defender: Combatant = {
      id: "defender-1",
      name: "Defender",
      imageUrl: null,
      baseStats: { atk: 40, def: 40, critRate: 0.1, critDamage: 1.5 },
      currentHp: 100,
      maxHp: 100,
      buffs: [],
      isDefeated: false,
    };

    it("returns AttackResult with correct damage", () => {
      const result = combatSystem.calculateAttack(attacker, defender);
      // Damage should equal attacker's ATK (50)
      expect(result.damage).toBe(50);
    });

    it("calculates correct defenderNewHp", () => {
      const result = combatSystem.calculateAttack(attacker, defender);
      // 100 - 50 = 50
      expect(result.defenderNewHp).toBe(50);
    });

    it("marks knockout when damage exceeds defender HP", () => {
      const weakDefender: Combatant = { ...defender, currentHp: 30 };
      const result = combatSystem.calculateAttack(attacker, weakDefender);
      expect(result.isKnockout).toBe(true);
      expect(result.defenderNewHp).toBe(0);
    });

    it("marks critical when damage exceeds 30% of maxHp", () => {
      // 50 damage > 100 * 0.3 = 30, so should be critical
      const result = combatSystem.calculateAttack(attacker, defender);
      expect(result.isCritical).toBe(true);
    });

    it("does not mark critical when damage is below threshold", () => {
      const weakAttacker: Combatant = {
        ...attacker,
        baseStats: { ...attacker.baseStats, atk: 20 },
      };
      // 20 damage <= 100 * 0.3 = 30, so should not be critical
      const result = combatSystem.calculateAttack(weakAttacker, defender);
      expect(result.isCritical).toBe(false);
    });

    it("returns updated defender in result", () => {
      const result = combatSystem.calculateAttack(attacker, defender);
      expect(result.defender.currentHp).toBe(50);
      expect(result.defender.isDefeated).toBe(false);
    });
  });

  describe("createCombatSystem()", () => {
    it("creates independent combat system instances", () => {
      const system1 = createCombatSystem();
      const system2 = createCombatSystem();
      expect(system1).not.toBe(system2);
    });
  });
});
