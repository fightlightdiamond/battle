/**
 * Unit tests for PatternMatcher
 *
 * Tests pattern matching, parameter extraction, priority-based selection,
 * and command synonym handling for both Vietnamese and English commands.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PatternMatcher } from "../../services/PatternMatcher";
import { InputNormalizer } from "../../services/InputNormalizer";

describe("PatternMatcher", () => {
  let matcher: PatternMatcher;
  let normalizer: InputNormalizer;

  beforeEach(() => {
    matcher = new PatternMatcher();
    normalizer = new InputNormalizer();
  });

  describe("Basic Pattern Matching", () => {
    it("should match create card command and extract card name", () => {
      const input = normalizer.normalize("create card Dragon Warrior");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("create_card");
      expect(result!.parameters.cardName).toBe("Dragon Warrior");
      expect(result!.confidence).toBeGreaterThan(0);
    });

    it("should match list cards command", () => {
      const input = normalizer.normalize("list cards");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("list_cards");
      expect(Object.keys(result!.parameters).length).toBe(0);
    });

    it("should match battle command and extract both card names", () => {
      const input = normalizer.normalize("battle Dragon vs Phoenix");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("start_battle");
      expect(result!.parameters.card1Name).toBe("Dragon");
      expect(result!.parameters.card2Name).toBe("Phoenix");
    });

    it("should match equip weapon command and extract weapon and card names", () => {
      const input = normalizer.normalize("equip Fire Sword to Dragon");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("equip_weapon");
      expect(result!.parameters.weaponName).toBe("Fire Sword");
      expect(result!.parameters.cardName).toBe("Dragon");
    });

    it("should return null for unrecognized commands", () => {
      const input = normalizer.normalize("this is not a valid command");
      const result = matcher.match(input);

      expect(result).toBeNull();
    });
  });

  describe("Command Synonyms", () => {
    it("should recognize create/make/add synonyms for card creation", () => {
      const inputs = ["create card Test", "make card Test", "add card Test"];

      for (const inputStr of inputs) {
        const input = normalizer.normalize(inputStr);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe("create_card");
        expect(result!.parameters.cardName).toBe("Test");
      }
    });

    it("should recognize delete/remove synonyms for card deletion", () => {
      const inputs = ["delete card Test", "remove card Test"];

      for (const inputStr of inputs) {
        const input = normalizer.normalize(inputStr);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe("delete_card");
        expect(result!.parameters.cardName).toBe("Test");
      }
    });

    it("should recognize show/display/view synonyms for showing cards", () => {
      const inputs = ["show card Test", "display card Test", "view card Test"];

      for (const inputStr of inputs) {
        const input = normalizer.normalize(inputStr);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe("show_card");
        expect(result!.parameters.cardName).toBe("Test");
      }
    });

    it("should recognize list/show/display synonyms for listing", () => {
      const inputs = ["list cards", "show cards", "display cards"];

      for (const inputStr of inputs) {
        const input = normalizer.normalize(inputStr);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe("list_cards");
      }
    });

    it("should recognize battle/fight synonyms", () => {
      const inputs = ["battle A vs B", "fight A vs B"];

      for (const inputStr of inputs) {
        const input = normalizer.normalize(inputStr);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe("start_battle");
        expect(result!.parameters.card1Name).toBe("A");
        expect(result!.parameters.card2Name).toBe("B");
      }
    });

    it("should recognize vs/versus/against synonyms in battle commands", () => {
      const inputs = [
        "battle Dragon vs Phoenix",
        "battle Dragon versus Phoenix",
        "battle Dragon against Phoenix",
      ];

      for (const inputStr of inputs) {
        const input = normalizer.normalize(inputStr);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe("start_battle");
        expect(result!.parameters.card1Name).toBe("Dragon");
        expect(result!.parameters.card2Name).toBe("Phoenix");
      }
    });
  });

  describe("Vietnamese Command Support", () => {
    it("should match Vietnamese create card command", () => {
      const input = normalizer.normalize("tạo thẻ Rồng Lửa");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("create_card");
      expect(result!.parameters.cardName).toBe("Rồng Lửa");
    });

    it("should match Vietnamese battle command", () => {
      const input = normalizer.normalize("trận đấu Rồng với Phượng");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("start_battle");
      expect(result!.parameters.card1Name).toBe("Rồng");
      expect(result!.parameters.card2Name).toBe("Phượng");
    });

    it("should match Vietnamese equip weapon command", () => {
      const input = normalizer.normalize("trang bị Kiếm Lửa cho Rồng");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("equip_weapon");
      expect(result!.parameters.weaponName).toBe("Kiếm Lửa");
      expect(result!.parameters.cardName).toBe("Rồng");
    });

    it("should match Vietnamese list cards command", () => {
      const input = normalizer.normalize("danh sách thẻ");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("list_cards");
    });

    it("should match Vietnamese help command", () => {
      const input = normalizer.normalize("trợ giúp");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("help");
    });

    it("should recognize Vietnamese synonyms (tạo/thêm)", () => {
      const inputs = ["tạo thẻ Test", "thêm thẻ Test"];

      for (const inputStr of inputs) {
        const input = normalizer.normalize(inputStr);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe("create_card");
        expect(result!.parameters.cardName).toBe("Test");
      }
    });
  });

  describe("Priority-Based Selection", () => {
    it("should select help_category over help when category is specified", () => {
      const input = normalizer.normalize("help cards");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("help_category");
      expect(result!.parameters.category).toBe("cards");
    });

    it("should select help when no category is specified", () => {
      const input = normalizer.normalize("help");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("help");
    });

    it("should match the first pattern when multiple patterns could match", () => {
      // Both show_card and list_cards could potentially match similar inputs
      // but show_card requires a card name, so they shouldn't conflict
      const input1 = normalizer.normalize("show cards");
      const result1 = matcher.match(input1);
      expect(result1!.commandType).toBe("list_cards");

      const input2 = normalizer.normalize("show card Dragon");
      const result2 = matcher.match(input2);
      expect(result2!.commandType).toBe("show_card");
    });
  });

  describe("Parameter Extraction", () => {
    it("should extract single parameter correctly", () => {
      const input = normalizer.normalize("create card My Awesome Card");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.parameters.cardName).toBe("My Awesome Card");
    });

    it("should extract multiple parameters correctly", () => {
      const input = normalizer.normalize("battle Fire Dragon vs Ice Phoenix");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.parameters.card1Name).toBe("Fire Dragon");
      expect(result!.parameters.card2Name).toBe("Ice Phoenix");
    });

    it("should trim whitespace from extracted parameters", () => {
      const input = normalizer.normalize("create card   Dragon   ");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.parameters.cardName).toBe("Dragon");
    });

    it("should handle parameters with special characters", () => {
      const input = normalizer.normalize("create card Dragon-123");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.parameters.cardName).toBe("Dragon-123");
    });

    it("should handle Vietnamese diacritics in parameters", () => {
      const input = normalizer.normalize("tạo thẻ Rồng Phượng Hoàng");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.parameters.cardName).toBe("Rồng Phượng Hoàng");
    });
  });

  describe("Confidence Calculation", () => {
    it("should return high confidence for exact matches", () => {
      const input = normalizer.normalize("list cards");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.confidence).toBeGreaterThan(0.9);
    });

    it("should return confidence between 0 and 1", () => {
      const inputs = [
        "create card Test",
        "battle A vs B",
        "list cards",
        "help",
      ];

      for (const inputStr of inputs) {
        const input = normalizer.normalize(inputStr);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.confidence).toBeGreaterThanOrEqual(0);
        expect(result!.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty parameters gracefully", () => {
      // This shouldn't match because card name is required
      const input = normalizer.normalize("create card");
      const result = matcher.match(input);

      // Should not match or should handle gracefully
      expect(result).toBeNull();
    });

    it("should handle case-insensitive matching", () => {
      const inputs = [
        "CREATE CARD Dragon",
        "Create Card Dragon",
        "create card dragon",
      ];

      for (const inputStr of inputs) {
        const input = normalizer.normalize(inputStr);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe("create_card");
      }
    });

    it("should handle extra whitespace", () => {
      const input = normalizer.normalize("create   card   Dragon");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("create_card");
      expect(result!.parameters.cardName).toBe("Dragon");
    });

    it("should match help with question mark", () => {
      const input = normalizer.normalize("?");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("help");
    });

    it("should handle mixed language entity names", () => {
      // Vietnamese command with English entity name
      const input = normalizer.normalize("tạo thẻ Dragon");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.commandType).toBe("create_card");
      expect(result!.parameters.cardName).toBe("Dragon");
    });
  });

  describe("All Command Types", () => {
    it("should match all card commands", () => {
      const commands = [
        { input: "create card Test", type: "create_card" },
        { input: "list cards", type: "list_cards" },
        { input: "show card Test", type: "show_card" },
        { input: "delete card Test", type: "delete_card" },
      ];

      for (const cmd of commands) {
        const input = normalizer.normalize(cmd.input);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe(cmd.type);
      }
    });

    it("should match all battle commands", () => {
      const commands = [
        { input: "battle A vs B", type: "start_battle" },
        { input: "battle history", type: "battle_history" },
        { input: "replay battle 123", type: "replay_battle" },
      ];

      for (const cmd of commands) {
        const input = normalizer.normalize(cmd.input);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe(cmd.type);
      }
    });

    it("should match all equipment commands", () => {
      const commands = [
        { input: "equip Sword to Card", type: "equip_weapon" },
        { input: "unequip weapon from Card", type: "unequip_weapon" },
        { input: "equip gem Ruby to Card", type: "equip_gem" },
        { input: "unequip gem from Card", type: "unequip_gem" },
      ];

      for (const cmd of commands) {
        const input = normalizer.normalize(cmd.input);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe(cmd.type);
      }
    });

    it("should match all query commands", () => {
      const commands = [
        { input: "list weapons", type: "list_weapons" },
        { input: "list gems", type: "list_gems" },
        { input: "stats", type: "show_stats" },
      ];

      for (const cmd of commands) {
        const input = normalizer.normalize(cmd.input);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe(cmd.type);
      }
    });

    it("should match all help commands", () => {
      const commands = [
        { input: "help", type: "help" },
        { input: "help cards", type: "help_category" },
      ];

      for (const cmd of commands) {
        const input = normalizer.normalize(cmd.input);
        const result = matcher.match(input);

        expect(result).not.toBeNull();
        expect(result!.commandType).toBe(cmd.type);
      }
    });
  });

  describe("Pattern Metadata", () => {
    it("should include pattern in match result", () => {
      const input = normalizer.normalize("create card Test");
      const result = matcher.match(input);

      expect(result).not.toBeNull();
      expect(result!.pattern).toBeDefined();
      expect(result!.pattern.id).toBe("create_card");
      expect(result!.pattern.commandType).toBe("create_card");
      expect(result!.pattern.examples).toBeDefined();
      expect(result!.pattern.examples.en).toBeDefined();
      expect(result!.pattern.examples.vi).toBeDefined();
    });
  });
});
