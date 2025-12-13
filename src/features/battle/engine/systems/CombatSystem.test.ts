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
  spd: fc.integer({ min: 1, max: 9999 }),
  critChance: fc.integer({ min: 0, max: 100 }),
  critDamage: fc.integer({ min: 100, max: 500 }),
  armorPen: fc.integer({ min: 0, max: 100 }),
  lifesteal: fc.integer({ min: 0, max: 100 }),
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

  /**
   * **Feature: tier-stat-system, Property 4: Lifesteal Healing**
   *
   * For any final damage D and lifesteal value L, the heal amount SHALL equal
   * floor(D × (L/100)), capped at maxHp.
   *
   * **Validates: Requirements 2.4, 5.1, 5.2, 5.3**
   */
  it("Property 4: Lifesteal heals attacker by damage × (lifesteal/100), capped at maxHp", () => {
    // Create combatant with specific lifesteal value for testing
    const combatantWithLifestealArb = fc
      .record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        imageUrl: fc.constant(null),
        baseStats: fc.record({
          atk: fc.integer({ min: 1, max: 500 }),
          def: fc.integer({ min: 0, max: 500 }),
          spd: fc.integer({ min: 1, max: 500 }),
          critChance: fc.constant(0), // Disable crit for predictable damage
          critDamage: fc.constant(150),
          armorPen: fc.constant(0), // Disable armor pen for predictable damage
          lifesteal: fc.integer({ min: 0, max: 100 }),
        }),
        currentHp: fc.integer({ min: 1, max: 1000 }),
        maxHp: fc.integer({ min: 1, max: 1000 }),
        buffs: fc.constant([]),
        isDefeated: fc.constant(false),
      })
      .map((c) => ({
        ...c,
        // Ensure currentHp <= maxHp
        currentHp: Math.min(c.currentHp, c.maxHp),
      }));

    const defenderArb = fc
      .record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        imageUrl: fc.constant(null),
        baseStats: fc.record({
          atk: fc.integer({ min: 1, max: 500 }),
          def: fc.constant(0), // Zero defense for predictable damage
          spd: fc.integer({ min: 1, max: 500 }),
          critChance: fc.constant(0),
          critDamage: fc.constant(150),
          armorPen: fc.constant(0),
          lifesteal: fc.constant(0),
        }),
        currentHp: fc.integer({ min: 1, max: 9999 }),
        maxHp: fc.integer({ min: 1, max: 9999 }),
        buffs: fc.constant([]),
        isDefeated: fc.constant(false),
      })
      .map((c) => ({
        ...c,
        currentHp: Math.min(c.currentHp, c.maxHp),
      }));

    fc.assert(
      fc.property(
        combatantWithLifestealArb,
        defenderArb,
        (attacker, defender) => {
          const result = combatSystem.calculateAttack(attacker, defender);

          // Calculate expected lifesteal heal: floor(damage × (lifesteal/100))
          const expectedRawHeal =
            result.damage * (attacker.baseStats.lifesteal / 100);
          const expectedHeal = Math.floor(expectedRawHeal);

          // Verify lifestealHeal is calculated correctly
          expect(result.lifestealHeal).toBe(expectedHeal);

          // Verify attacker's new HP is capped at maxHp (Requirement 5.3)
          const expectedAttackerHp = Math.min(
            attacker.maxHp,
            attacker.currentHp + expectedHeal
          );
          expect(result.attackerNewHp).toBe(expectedAttackerHp);

          // Verify attacker HP never exceeds maxHp
          expect(result.attackerNewHp).toBeLessThanOrEqual(attacker.maxHp);
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
      baseStats: {
        atk: 100,
        def: 50,
        spd: 100,
        critChance: 5,
        critDamage: 150,
        armorPen: 0,
        lifesteal: 0,
      },
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
    // Use 0% crit chance for deterministic tests
    const attacker: Combatant = {
      id: "attacker-1",
      name: "Attacker",
      imageUrl: null,
      baseStats: {
        atk: 50,
        def: 30,
        spd: 100,
        critChance: 0, // 0% crit for deterministic damage
        critDamage: 150,
        armorPen: 0,
        lifesteal: 0,
      },
      currentHp: 100,
      maxHp: 100,
      buffs: [],
      isDefeated: false,
    };

    const defender: Combatant = {
      id: "defender-1",
      name: "Defender",
      imageUrl: null,
      baseStats: {
        atk: 40,
        def: 40,
        spd: 100,
        critChance: 0, // 0% crit for deterministic damage
        critDamage: 150,
        armorPen: 0,
        lifesteal: 0,
      },
      currentHp: 100,
      maxHp: 100,
      buffs: [],
      isDefeated: false,
    };

    it("returns AttackResult with correct damage", () => {
      const result = combatSystem.calculateAttack(attacker, defender);
      // Damage should equal attacker's ATK (50) when useDefense is false and no crit
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
      // 50 damage > 100 * 0.3 = 30, so should be critical (based on damage threshold)
      // Note: isCritical is true if damage > 30% of maxHp OR if crit was rolled
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
