import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { CombatLogger } from "./CombatLogger";
import type { Combatant, CombatantStats, AttackLogData } from "../core/types";

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
  currentHp: fc.integer({ min: 0, max: 9999 }),
  maxHp: fc.integer({ min: 1, max: 9999 }),
  buffs: fc.constant([]),
  isDefeated: fc.boolean(),
});

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("CombatLogger", () => {
  /**
   * **Feature: battle-engine-refactor, Property 9: Combat Log Contains Attack Data**
   *
   * For any attack action, the battle log SHALL contain an entry with
   * attacker ID, defender ID, damage amount, and defender's remaining HP.
   *
   * **Validates: Requirements 9.2**
   */
  it("Property 9: logAttack contains all required attack data", () => {
    fc.assert(
      fc.property(
        combatantArb,
        combatantArb,
        fc.integer({ min: 0, max: 9999 }),
        fc.integer({ min: 0, max: 9999 }),
        (attacker, defender, damage, remainingHp) => {
          const logEntry = CombatLogger.logAttack(
            attacker,
            defender,
            damage,
            remainingHp
          );

          // Verify log entry has required structure
          expect(logEntry.id).toBeDefined();
          expect(typeof logEntry.id).toBe("string");
          expect(logEntry.id.length).toBeGreaterThan(0);

          expect(logEntry.timestamp).toBeDefined();
          expect(typeof logEntry.timestamp).toBe("number");

          expect(logEntry.type).toBe("attack");
          expect(typeof logEntry.message).toBe("string");

          // Verify attack data contains all required fields
          expect(logEntry.data).toBeDefined();
          const attackData = logEntry.data as AttackLogData;

          expect(attackData.attackerId).toBe(attacker.id);
          expect(attackData.defenderId).toBe(defender.id);
          expect(attackData.damage).toBe(damage);
          expect(attackData.defenderRemainingHp).toBe(remainingHp);
          expect(typeof attackData.isCritical).toBe("boolean");
        }
      ),
      { numRuns: 100 }
    );
  });

  // Unit tests for specific behaviors
  describe("logAttack", () => {
    it("generates unique IDs for each log entry", () => {
      const attacker: Combatant = {
        id: "attacker-1",
        name: "Attacker",
        imageUrl: null,
        baseStats: { atk: 100, def: 50, critRate: 0.1, critDamage: 1.5 },
        currentHp: 100,
        maxHp: 100,
        buffs: [],
        isDefeated: false,
      };

      const defender: Combatant = {
        id: "defender-1",
        name: "Defender",
        imageUrl: null,
        baseStats: { atk: 80, def: 40, critRate: 0.1, critDamage: 1.5 },
        currentHp: 100,
        maxHp: 100,
        buffs: [],
        isDefeated: false,
      };

      const log1 = CombatLogger.logAttack(attacker, defender, 50, 50);
      const log2 = CombatLogger.logAttack(attacker, defender, 50, 50);

      expect(log1.id).not.toBe(log2.id);
    });

    it("marks attack as critical when damage exceeds 30% of defender maxHp", () => {
      const attacker: Combatant = {
        id: "attacker-1",
        name: "Attacker",
        imageUrl: null,
        baseStats: { atk: 100, def: 50, critRate: 0.1, critDamage: 1.5 },
        currentHp: 100,
        maxHp: 100,
        buffs: [],
        isDefeated: false,
      };

      const defender: Combatant = {
        id: "defender-1",
        name: "Defender",
        imageUrl: null,
        baseStats: { atk: 80, def: 40, critRate: 0.1, critDamage: 1.5 },
        currentHp: 100,
        maxHp: 100,
        buffs: [],
        isDefeated: false,
      };

      // Damage > 30% of maxHp (100 * 0.3 = 30)
      const criticalLog = CombatLogger.logAttack(attacker, defender, 31, 69);
      expect((criticalLog.data as AttackLogData).isCritical).toBe(true);

      // Damage <= 30% of maxHp
      const normalLog = CombatLogger.logAttack(attacker, defender, 30, 70);
      expect((normalLog.data as AttackLogData).isCritical).toBe(false);
    });

    it("includes attacker and defender names in message", () => {
      const attacker: Combatant = {
        id: "attacker-1",
        name: "Dragon",
        imageUrl: null,
        baseStats: { atk: 100, def: 50, critRate: 0.1, critDamage: 1.5 },
        currentHp: 100,
        maxHp: 100,
        buffs: [],
        isDefeated: false,
      };

      const defender: Combatant = {
        id: "defender-1",
        name: "Knight",
        imageUrl: null,
        baseStats: { atk: 80, def: 40, critRate: 0.1, critDamage: 1.5 },
        currentHp: 100,
        maxHp: 100,
        buffs: [],
        isDefeated: false,
      };

      const log = CombatLogger.logAttack(attacker, defender, 50, 50);

      expect(log.message).toContain("Dragon");
      expect(log.message).toContain("Knight");
      expect(log.message).toContain("50");
    });
  });

  describe("logVictory", () => {
    it("creates victory log entry with winner name", () => {
      const log = CombatLogger.logVictory("Champion");

      expect(log.id).toBeDefined();
      expect(log.timestamp).toBeDefined();
      expect(log.type).toBe("victory");
      expect(log.message).toContain("Champion");
      expect(log.message).toContain("wins");
    });

    it("generates unique IDs for victory logs", () => {
      const log1 = CombatLogger.logVictory("Winner1");
      const log2 = CombatLogger.logVictory("Winner2");

      expect(log1.id).not.toBe(log2.id);
    });
  });
});
