/**
 * Unit tests for message templates
 *
 * Tests template interpolation, language selection, and helper functions
 * for formatting messages in both Vietnamese and English.
 */

import { describe, it, expect } from "vitest";
import {
  successTemplates,
  errorTemplates,
  helpTemplates,
  entityTypeNames,
  interpolate,
  getTemplate,
  formatMessage,
  formatEntityList,
  formatPaginationHint,
  getEntityTypeName,
} from "../../utils/messageTemplates";

describe("Message Templates", () => {
  describe("Template Structure", () => {
    it("should have success templates for all command types", () => {
      const commandTypes = [
        "create_card",
        "list_cards",
        "show_card",
        "delete_card",
        "start_battle",
        "battle_history",
        "replay_battle",
        "equip_weapon",
        "unequip_weapon",
        "equip_gem",
        "unequip_gem",
        "list_weapons",
        "list_gems",
        "show_stats",
        "help",
        "help_category",
      ];

      commandTypes.forEach((type) => {
        expect(successTemplates).toHaveProperty(type);
        expect(
          successTemplates[type as keyof typeof successTemplates],
        ).toHaveProperty("en");
        expect(
          successTemplates[type as keyof typeof successTemplates],
        ).toHaveProperty("vi");
      });
    });

    it("should have error templates for common scenarios", () => {
      const errorScenarios = [
        "empty_input",
        "input_too_long",
        "command_not_recognized",
        "entity_not_found",
        "multiple_matches",
        "service_error",
        "missing_parameter",
        "insufficient_context",
      ];

      errorScenarios.forEach((scenario) => {
        expect(errorTemplates).toHaveProperty(scenario);
        expect(
          errorTemplates[scenario as keyof typeof errorTemplates],
        ).toHaveProperty("en");
        expect(
          errorTemplates[scenario as keyof typeof errorTemplates],
        ).toHaveProperty("vi");
      });
    });

    it("should have help templates for all categories", () => {
      const categories = ["overview", "cards", "battle", "equipment", "query"];

      categories.forEach((category) => {
        expect(helpTemplates).toHaveProperty(category);
        expect(
          helpTemplates[category as keyof typeof helpTemplates],
        ).toHaveProperty("en");
        expect(
          helpTemplates[category as keyof typeof helpTemplates],
        ).toHaveProperty("vi");
      });
    });

    it("should have entity type names for all entity types", () => {
      const entityTypes = ["card", "weapon", "gem", "battle"];

      entityTypes.forEach((type) => {
        expect(entityTypeNames).toHaveProperty(type);
        expect(
          entityTypeNames[type as keyof typeof entityTypeNames],
        ).toHaveProperty("en");
        expect(
          entityTypeNames[type as keyof typeof entityTypeNames],
        ).toHaveProperty("vi");
      });
    });
  });

  describe("interpolate", () => {
    it("should replace single parameter", () => {
      const result = interpolate("Hello {name}!", { name: "World" });
      expect(result).toBe("Hello World!");
    });

    it("should replace multiple parameters", () => {
      const result = interpolate("Card: {name} (ID: {id})", {
        name: "Dragon",
        id: "123",
      });
      expect(result).toBe("Card: Dragon (ID: 123)");
    });

    it("should handle numeric parameters", () => {
      const result = interpolate("Found {count} items", { count: 42 });
      expect(result).toBe("Found 42 items");
    });

    it("should leave missing parameters unchanged", () => {
      const result = interpolate("Hello {name}, you have {count} items", {
        name: "User",
      });
      expect(result).toBe("Hello User, you have {count} items");
    });

    it("should handle empty parameters object", () => {
      const result = interpolate("Hello {name}!", {});
      expect(result).toBe("Hello {name}!");
    });

    it("should handle template with no parameters", () => {
      const result = interpolate("Hello World!", { name: "Test" });
      expect(result).toBe("Hello World!");
    });

    it("should handle multiple occurrences of same parameter", () => {
      const result = interpolate("{name} loves {name}", { name: "Alice" });
      expect(result).toBe("Alice loves Alice");
    });
  });

  describe("getTemplate", () => {
    const template = {
      en: "Hello",
      vi: "Xin chào",
    };

    it("should return English template for 'en' language", () => {
      expect(getTemplate(template, "en")).toBe("Hello");
    });

    it("should return Vietnamese template for 'vi' language", () => {
      expect(getTemplate(template, "vi")).toBe("Xin chào");
    });

    it("should return English template for 'mixed' language", () => {
      expect(getTemplate(template, "mixed")).toBe("Hello");
    });
  });

  describe("formatMessage", () => {
    const template = {
      en: "Created card {name} (ID: {id})",
      vi: "Đã tạo thẻ {name} (ID: {id})",
    };

    it("should format English message with parameters", () => {
      const result = formatMessage(template, "en", {
        name: "Dragon",
        id: "123",
      });
      expect(result).toBe("Created card Dragon (ID: 123)");
    });

    it("should format Vietnamese message with parameters", () => {
      const result = formatMessage(template, "vi", {
        name: "Rồng",
        id: "123",
      });
      expect(result).toBe("Đã tạo thẻ Rồng (ID: 123)");
    });

    it("should handle missing parameters", () => {
      const result = formatMessage(template, "en", { name: "Dragon" });
      expect(result).toBe("Created card Dragon (ID: {id})");
    });

    it("should handle empty parameters", () => {
      const result = formatMessage(template, "en");
      expect(result).toBe("Created card {name} (ID: {id})");
    });
  });

  describe("formatEntityList", () => {
    it("should format empty list in English", () => {
      expect(formatEntityList([], "en")).toBe("(none)");
    });

    it("should format empty list in Vietnamese", () => {
      expect(formatEntityList([], "vi")).toBe("(không có)");
    });

    it("should format single item", () => {
      expect(formatEntityList(["Dragon"], "en")).toBe("Dragon");
      expect(formatEntityList(["Rồng"], "vi")).toBe("Rồng");
    });

    it("should format two items in English", () => {
      expect(formatEntityList(["Dragon", "Phoenix"], "en")).toBe(
        "Dragon and Phoenix",
      );
    });

    it("should format two items in Vietnamese", () => {
      expect(formatEntityList(["Rồng", "Phượng"], "vi")).toBe("Rồng và Phượng");
    });

    it("should format three items in English", () => {
      expect(formatEntityList(["Dragon", "Phoenix", "Tiger"], "en")).toBe(
        "Dragon, Phoenix, and Tiger",
      );
    });

    it("should format three items in Vietnamese", () => {
      expect(formatEntityList(["Rồng", "Phượng", "Hổ"], "vi")).toBe(
        "Rồng, Phượng, và Hổ",
      );
    });

    it("should format many items in English", () => {
      const items = ["A", "B", "C", "D", "E"];
      expect(formatEntityList(items, "en")).toBe("A, B, C, D, and E");
    });

    it("should format many items in Vietnamese", () => {
      const items = ["A", "B", "C", "D", "E"];
      expect(formatEntityList(items, "vi")).toBe("A, B, C, D, và E");
    });
  });

  describe("formatPaginationHint", () => {
    it("should return empty string when all items shown", () => {
      expect(formatPaginationHint(10, 10, "en")).toBe("");
      expect(formatPaginationHint(5, 10, "en")).toBe("");
    });

    it("should format pagination hint in English", () => {
      const result = formatPaginationHint(20, 10, "en");
      expect(result).toContain("Showing 10/20");
      expect(result).toContain("10 more item(s) remaining");
    });

    it("should format pagination hint in Vietnamese", () => {
      const result = formatPaginationHint(20, 10, "vi");
      expect(result).toContain("Hiển thị 10/20");
      expect(result).toContain("Còn 10 mục nữa");
    });

    it("should calculate remaining items correctly", () => {
      const result = formatPaginationHint(100, 10, "en");
      expect(result).toContain("90 more item(s) remaining");
    });
  });

  describe("getEntityTypeName", () => {
    it("should return English entity type names", () => {
      expect(getEntityTypeName("card", "en")).toBe("card");
      expect(getEntityTypeName("weapon", "en")).toBe("weapon");
      expect(getEntityTypeName("gem", "en")).toBe("gem");
      expect(getEntityTypeName("battle", "en")).toBe("battle");
    });

    it("should return Vietnamese entity type names", () => {
      expect(getEntityTypeName("card", "vi")).toBe("thẻ");
      expect(getEntityTypeName("weapon", "vi")).toBe("vũ khí");
      expect(getEntityTypeName("gem", "vi")).toBe("ngọc");
      expect(getEntityTypeName("battle", "vi")).toBe("trận đấu");
    });

    it("should default to English for mixed language", () => {
      expect(getEntityTypeName("card", "mixed")).toBe("card");
    });
  });

  describe("Success Templates Content", () => {
    it("should have card creation template with name and id placeholders", () => {
      expect(successTemplates.create_card.en).toContain("{name}");
      expect(successTemplates.create_card.en).toContain("{id}");
      expect(successTemplates.create_card.vi).toContain("{name}");
      expect(successTemplates.create_card.vi).toContain("{id}");
    });

    it("should have battle start template with card placeholders", () => {
      expect(successTemplates.start_battle.en).toContain("{card1}");
      expect(successTemplates.start_battle.en).toContain("{card2}");
      expect(successTemplates.start_battle.vi).toContain("{card1}");
      expect(successTemplates.start_battle.vi).toContain("{card2}");
    });

    it("should have equipment template with weapon and card placeholders", () => {
      expect(successTemplates.equip_weapon.en).toContain("{weapon}");
      expect(successTemplates.equip_weapon.en).toContain("{card}");
      expect(successTemplates.equip_weapon.vi).toContain("{weapon}");
      expect(successTemplates.equip_weapon.vi).toContain("{card}");
    });

    it("should have stats template with count placeholders", () => {
      expect(successTemplates.show_stats.en).toContain("{cards}");
      expect(successTemplates.show_stats.en).toContain("{weapons}");
      expect(successTemplates.show_stats.en).toContain("{gems}");
      expect(successTemplates.show_stats.vi).toContain("{cards}");
      expect(successTemplates.show_stats.vi).toContain("{weapons}");
      expect(successTemplates.show_stats.vi).toContain("{gems}");
    });
  });

  describe("Error Templates Content", () => {
    it("should have entity not found template with placeholders", () => {
      expect(errorTemplates.entity_not_found.en).toContain("{type}");
      expect(errorTemplates.entity_not_found.en).toContain("{name}");
      expect(errorTemplates.entity_not_found.en).toContain("{suggestions}");
      expect(errorTemplates.entity_not_found.vi).toContain("{type}");
      expect(errorTemplates.entity_not_found.vi).toContain("{name}");
      expect(errorTemplates.entity_not_found.vi).toContain("{suggestions}");
    });

    it("should have service error template with message placeholder", () => {
      expect(errorTemplates.service_error.en).toContain("{message}");
      expect(errorTemplates.service_error.vi).toContain("{message}");
    });

    it("should have missing parameter template with placeholders", () => {
      expect(errorTemplates.missing_parameter.en).toContain("{parameter}");
      expect(errorTemplates.missing_parameter.en).toContain("{example}");
      expect(errorTemplates.missing_parameter.vi).toContain("{parameter}");
      expect(errorTemplates.missing_parameter.vi).toContain("{example}");
    });
  });

  describe("Help Templates Content", () => {
    it("should have overview help in both languages", () => {
      expect(helpTemplates.overview.en).toContain("Cards");
      expect(helpTemplates.overview.en).toContain("Battle");
      expect(helpTemplates.overview.en).toContain("Equipment");
      expect(helpTemplates.overview.vi).toContain("Thẻ");
      expect(helpTemplates.overview.vi).toContain("Trận đấu");
      expect(helpTemplates.overview.vi).toContain("Trang bị");
    });

    it("should have card commands help with examples", () => {
      expect(helpTemplates.cards.en).toContain("create card");
      expect(helpTemplates.cards.en).toContain("list cards");
      expect(helpTemplates.cards.en).toContain("Examples");
      expect(helpTemplates.cards.vi).toContain("tạo thẻ");
      expect(helpTemplates.cards.vi).toContain("danh sách thẻ");
      expect(helpTemplates.cards.vi).toContain("Ví dụ");
    });

    it("should have battle commands help with examples", () => {
      expect(helpTemplates.battle.en).toContain("battle");
      expect(helpTemplates.battle.en).toContain("vs");
      expect(helpTemplates.battle.vi).toContain("trận đấu");
      expect(helpTemplates.battle.vi).toContain("vs");
    });

    it("should have equipment commands help with examples", () => {
      expect(helpTemplates.equipment.en).toContain("equip");
      expect(helpTemplates.equipment.en).toContain("weapon");
      expect(helpTemplates.equipment.en).toContain("gem");
      expect(helpTemplates.equipment.vi).toContain("trang bị");
      expect(helpTemplates.equipment.vi).toContain("vũ khí");
      expect(helpTemplates.equipment.vi).toContain("ngọc");
    });
  });

  describe("Real-world Usage Examples", () => {
    it("should format card creation success message", () => {
      const message = formatMessage(successTemplates.create_card, "en", {
        name: "Fire Dragon",
        id: "card-123",
      });
      expect(message).toBe('Created card "Fire Dragon" (ID: card-123)');
    });

    it("should format battle start success message in Vietnamese", () => {
      const message = formatMessage(successTemplates.start_battle, "vi", {
        card1: "Rồng Lửa",
        card2: "Phượng Hoàng",
      });
      expect(message).toBe("Trận đấu bắt đầu: Rồng Lửa vs Phượng Hoàng");
    });

    it("should format entity not found error", () => {
      const message = formatMessage(errorTemplates.entity_not_found, "en", {
        type: "card",
        name: "Dragn",
        suggestions: "Dragon, Drake, Dragonfly",
      });
      expect(message).toContain('Could not find card "Dragn"');
      expect(message).toContain("Dragon, Drake, Dragonfly");
    });

    it("should format equipment success message", () => {
      const message = formatMessage(successTemplates.equip_weapon, "en", {
        weapon: "Fire Sword",
        card: "Dragon",
      });
      expect(message).toBe('Equipped weapon "Fire Sword" to card "Dragon"');
    });

    it("should format stats display", () => {
      const message = formatMessage(successTemplates.show_stats, "vi", {
        cards: 10,
        weapons: 5,
        gems: 3,
      });
      expect(message).toContain("Thẻ: 10");
      expect(message).toContain("Vũ khí: 5");
      expect(message).toContain("Ngọc: 3");
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in parameters", () => {
      const result = interpolate("Name: {name}", {
        name: "Dragon's Fury",
      });
      expect(result).toBe("Name: Dragon's Fury");
    });

    it("should handle Vietnamese diacritics in parameters", () => {
      const result = interpolate("Tên: {name}", {
        name: "Rồng Lửa",
      });
      expect(result).toBe("Tên: Rồng Lửa");
    });

    it("should handle numbers with decimals", () => {
      const result = interpolate("Value: {value}", { value: 3.14 });
      expect(result).toBe("Value: 3.14");
    });

    it("should handle zero values", () => {
      const result = interpolate("Count: {count}", { count: 0 });
      expect(result).toBe("Count: 0");
    });

    it("should handle empty string parameters", () => {
      const result = interpolate("Name: {name}", { name: "" });
      expect(result).toBe("Name: ");
    });
  });
});
