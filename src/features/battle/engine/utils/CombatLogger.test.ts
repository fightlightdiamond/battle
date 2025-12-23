import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  CombatLogger,
  getSkillEffectDescription,
  type SkillActivationInput,
} from "./CombatLogger";
import type {
  Combatant,
  CombatantStats,
  AttackLogData,
  GemSkillLogData,
} from "../core/types";
import type { SkillType } from "../../../gems/types/gem";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

const combatantStatsArb: fc.Arbitrary<CombatantStats> = fc.record({
  atk: fc.integer({ min: 1, max: 9999 }),
  def: fc.integer({ min: 0, max: 9999 }),
  spd: fc.integer({ min: 1, max: 999 }),
  critChance: fc.integer({ min: 0, max: 100 }),
  critDamage: fc.integer({ min: 100, max: 500 }),
  armorPen: fc.integer({ min: 0, max: 100 }),
  lifesteal: fc.integer({ min: 0, max: 100 }),
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
  effectiveRange: fc.integer({ min: 1, max: 5 }),
});

// Valid skill types for gem skill logging
const skillTypeArb: fc.Arbitrary<SkillType> = fc.constantFrom(
  "knockback",
  "retreat",
  "double_move",
  "double_attack",
  "execute",
  "leap_strike",
);

// Skill activation input generator
const skillActivationInputArb: fc.Arbitrary<SkillActivationInput> = fc.record({
  gemId: fc.uuid(),
  gemName: fc.string({ minLength: 1, maxLength: 50 }),
  skillType: skillTypeArb,
  cardId: fc.uuid(),
  cardName: fc.string({ minLength: 1, maxLength: 100 }),
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
            remainingHp,
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
        },
      ),
      { numRuns: 100 },
    );
  });

  // Unit tests for specific behaviors
  describe("logAttack", () => {
    const defaultStats: CombatantStats = {
      atk: 100,
      def: 50,
      spd: 10,
      critChance: 10,
      critDamage: 150,
      armorPen: 0,
      lifesteal: 0,
    };

    it("generates unique IDs for each log entry", () => {
      const attacker: Combatant = {
        id: "attacker-1",
        name: "Attacker",
        imageUrl: null,
        baseStats: defaultStats,
        currentHp: 100,
        maxHp: 100,
        buffs: [],
        isDefeated: false,
      };

      const defender: Combatant = {
        id: "defender-1",
        name: "Defender",
        imageUrl: null,
        baseStats: { ...defaultStats, atk: 80, def: 40 },
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
        baseStats: defaultStats,
        currentHp: 100,
        maxHp: 100,
        buffs: [],
        isDefeated: false,
      };

      const defender: Combatant = {
        id: "defender-1",
        name: "Defender",
        imageUrl: null,
        baseStats: { ...defaultStats, atk: 80, def: 40 },
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
        baseStats: defaultStats,
        currentHp: 100,
        maxHp: 100,
        buffs: [],
        isDefeated: false,
      };

      const defender: Combatant = {
        id: "defender-1",
        name: "Knight",
        imageUrl: null,
        baseStats: { ...defaultStats, atk: 80, def: 40 },
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

  /**
   * **Feature: gem-skill-system, Property 15: Skill Activation Logging**
   *
   * For any skill that activates, the battle log should contain an entry
   * with the skill name and card name.
   *
   * **Validates: Requirements 11.1, 11.3**
   */
  describe("logSkillActivation", () => {
    it("Property 15: skill activation log contains skill name and card name", () => {
      fc.assert(
        fc.property(skillActivationInputArb, (input) => {
          const logEntry = CombatLogger.logSkillActivation(input);

          // Verify log entry has required structure
          expect(logEntry.id).toBeDefined();
          expect(typeof logEntry.id).toBe("string");
          expect(logEntry.id.length).toBeGreaterThan(0);

          expect(logEntry.timestamp).toBeDefined();
          expect(typeof logEntry.timestamp).toBe("number");

          expect(logEntry.type).toBe("gem_skill");
          expect(typeof logEntry.message).toBe("string");

          // Verify message contains card name and gem name (Requirements 11.1)
          expect(logEntry.message).toContain(input.cardName);
          expect(logEntry.message).toContain(input.gemName);

          // Verify skill data contains all required fields
          expect(logEntry.data).toBeDefined();
          const skillData = logEntry.data as GemSkillLogData;

          expect(skillData.gemId).toBe(input.gemId);
          expect(skillData.gemName).toBe(input.gemName);
          expect(skillData.skillType).toBe(input.skillType);
          expect(skillData.cardId).toBe(input.cardId);
          expect(skillData.cardName).toBe(input.cardName);
          expect(typeof skillData.effect).toBe("string");
          expect(skillData.effect.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 },
      );
    });

    it("generates unique IDs for each skill log entry", () => {
      const input: SkillActivationInput = {
        gemId: "gem-1",
        gemName: "Knockback Stone",
        skillType: "knockback",
        cardId: "card-1",
        cardName: "Dragon",
      };

      const log1 = CombatLogger.logSkillActivation(input);
      const log2 = CombatLogger.logSkillActivation(input);

      expect(log1.id).not.toBe(log2.id);
    });

    it("includes effect description in log data", () => {
      const skillTypes: SkillType[] = [
        "knockback",
        "retreat",
        "double_move",
        "double_attack",
        "execute",
        "leap_strike",
      ];

      for (const skillType of skillTypes) {
        const input: SkillActivationInput = {
          gemId: "gem-1",
          gemName: "Test Gem",
          skillType,
          cardId: "card-1",
          cardName: "Test Card",
        };

        const log = CombatLogger.logSkillActivation(input);
        const skillData = log.data as GemSkillLogData;

        // Effect should be a non-empty string
        expect(skillData.effect).toBeDefined();
        expect(skillData.effect.length).toBeGreaterThan(0);

        // Effect should match the expected description
        const expectedEffect = getSkillEffectDescription(skillType);
        expect(skillData.effect).toBe(expectedEffect);
      }
    });

    it("creates correct message format", () => {
      const input: SkillActivationInput = {
        gemId: "gem-1",
        gemName: "Double Strike",
        skillType: "double_attack",
        cardId: "card-1",
        cardName: "Warrior",
      };

      const log = CombatLogger.logSkillActivation(input);

      // Message should follow format: "{cardName}'s {gemName} activated: {effect}!"
      expect(log.message).toContain("Warrior");
      expect(log.message).toContain("Double Strike");
      expect(log.message).toContain("activated");
    });
  });

  describe("getSkillEffectDescription", () => {
    it("returns correct descriptions for all skill types", () => {
      expect(getSkillEffectDescription("knockback")).toBe("pushed enemy back");
      expect(getSkillEffectDescription("retreat")).toBe(
        "retreated after attack",
      );
      expect(getSkillEffectDescription("double_move")).toBe("moved 2 cells");
      expect(getSkillEffectDescription("double_attack")).toBe("attacked twice");
      expect(getSkillEffectDescription("execute")).toBe(
        "executed low HP enemy",
      );
      expect(getSkillEffectDescription("leap_strike")).toBe(
        "leaped to enemy and knocked back",
      );
    });

    it("returns fallback for unknown skill types", () => {
      // Cast to SkillType to test fallback behavior
      const unknownType = "unknown_skill" as SkillType;
      expect(getSkillEffectDescription(unknownType)).toBe("activated skill");
    });
  });
});
