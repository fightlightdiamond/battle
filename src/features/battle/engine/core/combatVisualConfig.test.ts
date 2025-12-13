import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  COMBAT_VISUAL_CONFIG,
  getDamageTypeStyle,
  getAnimationConfig,
  getMessageTemplates,
  type DamageType,
  type DamageTypeStyle,
} from "./combatVisualConfig";

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

const damageTypeArb: fc.Arbitrary<DamageType> = fc.constantFrom(
  "normal",
  "crit",
  "heal"
);

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("CombatVisualConfig", () => {
  /**
   * **Feature: battle-combat-visuals, Property 1: Config Completeness**
   *
   * For any damage type in the config, the style definition SHALL contain
   * all required fields (color, fontSize, fontWeight).
   * For any message template, it SHALL contain the required placeholders for its type.
   *
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  describe("Property 1: Config Completeness", () => {
    it("all damage types have required style fields", () => {
      fc.assert(
        fc.property(damageTypeArb, (damageType) => {
          const style = getDamageTypeStyle(damageType);

          // Required fields must exist and be non-empty strings
          expect(style.color).toBeDefined();
          expect(typeof style.color).toBe("string");
          expect(style.color.length).toBeGreaterThan(0);

          expect(style.fontSize).toBeDefined();
          expect(typeof style.fontSize).toBe("string");
          expect(style.fontSize.length).toBeGreaterThan(0);

          expect(style.fontWeight).toBeDefined();
          expect(typeof style.fontWeight).toBe("string");
          expect(style.fontWeight.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("animation config has all required fields", () => {
      const animation = getAnimationConfig();

      expect(animation.duration).toBeDefined();
      expect(typeof animation.duration).toBe("number");
      expect(animation.duration).toBeGreaterThan(0);

      expect(animation.easing).toBeDefined();
      expect(typeof animation.easing).toBe("string");
      expect(animation.easing.length).toBeGreaterThan(0);

      expect(animation.direction).toBeDefined();
      expect(["up", "down"]).toContain(animation.direction);

      expect(animation.distance).toBeDefined();
      expect(typeof animation.distance).toBe("string");
      expect(animation.distance.length).toBeGreaterThan(0);
    });

    it("message templates contain required placeholders", () => {
      const templates = getMessageTemplates();

      // Basic attack template must have {attacker}, {defender}, {damage}
      expect(templates.attack).toContain("{attacker}");
      expect(templates.attack).toContain("{defender}");
      expect(templates.attack).toContain("{damage}");

      // Crit template must have {critBonus} in addition to basic placeholders
      expect(templates.attackWithCrit).toContain("{attacker}");
      expect(templates.attackWithCrit).toContain("{defender}");
      expect(templates.attackWithCrit).toContain("{damage}");
      expect(templates.attackWithCrit).toContain("{critBonus}");

      // Lifesteal template must have {healAmount} in addition to basic placeholders
      expect(templates.attackWithLifesteal).toContain("{attacker}");
      expect(templates.attackWithLifesteal).toContain("{defender}");
      expect(templates.attackWithLifesteal).toContain("{damage}");
      expect(templates.attackWithLifesteal).toContain("{healAmount}");

      // Combined template must have all placeholders
      expect(templates.attackWithCritAndLifesteal).toContain("{attacker}");
      expect(templates.attackWithCritAndLifesteal).toContain("{defender}");
      expect(templates.attackWithCritAndLifesteal).toContain("{damage}");
      expect(templates.attackWithCritAndLifesteal).toContain("{critBonus}");
      expect(templates.attackWithCritAndLifesteal).toContain("{healAmount}");
    });

    it("config covers all damage types", () => {
      const allDamageTypes: DamageType[] = ["normal", "crit", "heal"];

      fc.assert(
        fc.property(fc.constantFrom(...allDamageTypes), (damageType) => {
          // Each damage type must exist in config
          expect(COMBAT_VISUAL_CONFIG.damageStyles[damageType]).toBeDefined();

          // Helper function must return valid style
          const style = getDamageTypeStyle(damageType);
          expect(style).toBeDefined();
          expect(style).toEqual(COMBAT_VISUAL_CONFIG.damageStyles[damageType]);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: battle-combat-visuals, Property 3: Style Retrieval Correctness**
   *
   * For any damage type (normal, crit, heal), getDamageTypeStyle SHALL return
   * the corresponding style from config with correct color, fontSize, and fontWeight values.
   *
   * **Validates: Requirements 3.2, 3.3, 5.2, 5.3**
   */
  describe("Property 3: Style Retrieval Correctness", () => {
    it("getDamageTypeStyle returns correct style for each damage type", () => {
      fc.assert(
        fc.property(damageTypeArb, (damageType) => {
          const style = getDamageTypeStyle(damageType);
          const expectedStyle = COMBAT_VISUAL_CONFIG.damageStyles[damageType];

          // Style must match the config exactly
          expect(style.color).toBe(expectedStyle.color);
          expect(style.fontSize).toBe(expectedStyle.fontSize);
          expect(style.fontWeight).toBe(expectedStyle.fontWeight);

          // Optional fields should also match if present
          if (expectedStyle.label !== undefined) {
            expect(style.label).toBe(expectedStyle.label);
          }
          if (expectedStyle.prefix !== undefined) {
            expect(style.prefix).toBe(expectedStyle.prefix);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("normal damage type returns white color style", () => {
      const style = getDamageTypeStyle("normal");
      expect(style.color).toBe("#ffffff");
      expect(style.prefix).toBe("-");
    });

    it("crit damage type returns amber color style with CRIT label", () => {
      const style = getDamageTypeStyle("crit");
      expect(style.color).toBe("#f59e0b"); // amber-500
      expect(style.label).toBe("CRIT!");
      expect(style.prefix).toBe("-");
    });

    it("heal damage type returns green color style with + prefix", () => {
      const style = getDamageTypeStyle("heal");
      expect(style.color).toBe("#22c55e"); // green-500
      expect(style.prefix).toBe("+");
    });

    it("style retrieval is consistent across multiple calls", () => {
      fc.assert(
        fc.property(damageTypeArb, (damageType) => {
          const style1 = getDamageTypeStyle(damageType);
          const style2 = getDamageTypeStyle(damageType);

          // Multiple calls should return identical styles
          expect(style1).toEqual(style2);
        }),
        { numRuns: 100 }
      );
    });

    it("animation config retrieval is consistent", () => {
      const config1 = getAnimationConfig();
      const config2 = getAnimationConfig();

      expect(config1).toEqual(config2);
      expect(config1.duration).toBe(800);
      expect(config1.easing).toBe("ease-out");
      expect(config1.direction).toBe("up");
    });
  });
});
