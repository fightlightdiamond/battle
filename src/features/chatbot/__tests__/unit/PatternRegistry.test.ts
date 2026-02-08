/**
 * Unit tests for PatternRegistry
 *
 * Tests command pattern registration, retrieval, and matching capabilities
 * for both Vietnamese and English commands.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CommandPatternRegistry } from "../../services/PatternRegistry";
import type { CommandPattern } from "../../types";

describe("PatternRegistry", () => {
  let registry: CommandPatternRegistry;

  beforeEach(() => {
    registry = new CommandPatternRegistry();
  });

  describe("Pattern Registration", () => {
    it("should register all default patterns on initialization", () => {
      const patterns = registry.getAll();
      expect(patterns.length).toBeGreaterThan(0);
    });

    it("should register patterns for all command types", () => {
      const patterns = registry.getAll();
      const commandTypes = new Set(patterns.map((p) => p.commandType));

      // Verify all expected command types are registered
      expect(commandTypes).toContain("create_card");
      expect(commandTypes).toContain("list_cards");
      expect(commandTypes).toContain("show_card");
      expect(commandTypes).toContain("delete_card");
      expect(commandTypes).toContain("start_battle");
      expect(commandTypes).toContain("battle_history");
      expect(commandTypes).toContain("replay_battle");
      expect(commandTypes).toContain("equip_weapon");
      expect(commandTypes).toContain("unequip_weapon");
      expect(commandTypes).toContain("equip_gem");
      expect(commandTypes).toContain("unequip_gem");
      expect(commandTypes).toContain("list_weapons");
      expect(commandTypes).toContain("list_gems");
      expect(commandTypes).toContain("show_stats");
      expect(commandTypes).toContain("help");
      expect(commandTypes).toContain("help_category");
    });

    it("should sort patterns by priority (descending)", () => {
      const patterns = registry.getAll();
      for (let i = 0; i < patterns.length - 1; i++) {
        expect(patterns[i].priority).toBeGreaterThanOrEqual(
          patterns[i + 1].priority,
        );
      }
    });

    it("should allow registering custom patterns", () => {
      const customPattern: CommandPattern = {
        id: "custom_test",
        regex: /^test\s+(.+)$/i,
        commandType: "create_card",
        priority: 5,
        examples: { en: "test example", vi: "test ví dụ" },
      };

      registry.register(customPattern);
      const patterns = registry.getAll();
      expect(patterns.some((p) => p.id === "custom_test")).toBe(true);
    });

    it("should allow unregistering patterns", () => {
      const initialCount = registry.getAll().length;
      registry.unregister("create_card");
      expect(registry.getAll().length).toBe(initialCount - 1);
      expect(registry.getAll().some((p) => p.id === "create_card")).toBe(false);
    });
  });

  describe("Pattern Retrieval", () => {
    it("should get patterns by command type", () => {
      const cardPatterns = registry.getByType("create_card");
      expect(cardPatterns.length).toBeGreaterThan(0);
      expect(cardPatterns.every((p) => p.commandType === "create_card")).toBe(
        true,
      );
    });

    it("should return empty array for non-existent command type", () => {
      // @ts-expect-error Testing with invalid command type
      const patterns = registry.getByType("non_existent");
      expect(patterns).toEqual([]);
    });
  });

  describe("Card Command Patterns", () => {
    it("should match English create card command", () => {
      const pattern = registry.getAll().find((p) => p.id === "create_card")!;
      expect(pattern).toBeDefined();

      const match1 = pattern.regex.exec("create card Dragon");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("Dragon");

      const match2 = pattern.regex.exec("make card Phoenix Warrior");
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("Phoenix Warrior");

      const match3 = pattern.regex.exec("add card Fire Spirit");
      expect(match3).toBeTruthy();
      expect(match3![1]).toBe("Fire Spirit");
    });

    it("should match Vietnamese create card command", () => {
      const pattern = registry.getAll().find((p) => p.id === "create_card")!;

      const match1 = pattern.regex.exec("tạo thẻ Rồng Lửa");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("Rồng Lửa");

      const match2 = pattern.regex.exec("thêm thẻ Phượng Hoàng");
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("Phượng Hoàng");
    });

    it("should match list cards command", () => {
      const pattern = registry.getAll().find((p) => p.id === "list_cards")!;

      expect(pattern.regex.test("list cards")).toBe(true);
      expect(pattern.regex.test("show cards")).toBe(true);
      expect(pattern.regex.test("display cards")).toBe(true);
      expect(pattern.regex.test("danh sách thẻ")).toBe(true);
      expect(pattern.regex.test("hiển thị thẻ")).toBe(true);
    });

    it("should match show card command", () => {
      const pattern = registry.getAll().find((p) => p.id === "show_card")!;

      const match1 = pattern.regex.exec("show card Dragon");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("Dragon");

      const match2 = pattern.regex.exec("display card Phoenix");
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("Phoenix");

      const match3 = pattern.regex.exec("hiển thị thẻ Rồng");
      expect(match3).toBeTruthy();
      expect(match3![1]).toBe("Rồng");
    });

    it("should match delete card command", () => {
      const pattern = registry.getAll().find((p) => p.id === "delete_card")!;

      const match1 = pattern.regex.exec("delete card Dragon");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("Dragon");

      const match2 = pattern.regex.exec("remove card Phoenix");
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("Phoenix");

      const match3 = pattern.regex.exec("xóa thẻ Rồng");
      expect(match3).toBeTruthy();
      expect(match3![1]).toBe("Rồng");
    });
  });

  describe("Battle Command Patterns", () => {
    it("should match English battle command", () => {
      const pattern = registry.getAll().find((p) => p.id === "start_battle")!;

      const match1 = pattern.regex.exec("battle Dragon vs Phoenix");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("Dragon");
      expect(match1![2]).toBe("Phoenix");

      const match2 = pattern.regex.exec(
        "fight Fire Spirit versus Water Spirit",
      );
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("Fire Spirit");
      expect(match2![2]).toBe("Water Spirit");

      const match3 = pattern.regex.exec("battle Warrior against Mage");
      expect(match3).toBeTruthy();
      expect(match3![1]).toBe("Warrior");
      expect(match3![2]).toBe("Mage");
    });

    it("should match Vietnamese battle command", () => {
      const pattern = registry.getAll().find((p) => p.id === "start_battle")!;

      const match1 = pattern.regex.exec("trận đấu Rồng với Phượng");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("Rồng");
      expect(match1![2]).toBe("Phượng");

      const match2 = pattern.regex.exec("đánh Chiến Binh với Pháp Sư");
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("Chiến Binh");
      expect(match2![2]).toBe("Pháp Sư");
    });

    it("should match battle history command", () => {
      const pattern = registry.getAll().find((p) => p.id === "battle_history")!;

      expect(pattern.regex.test("battle history")).toBe(true);
      expect(pattern.regex.test("fight history")).toBe(true);
      expect(pattern.regex.test("trận đấu lịch sử")).toBe(true);
      expect(pattern.regex.test("trận đấu danh sách")).toBe(true);
    });

    it("should match replay battle command", () => {
      const pattern = registry.getAll().find((p) => p.id === "replay_battle")!;

      const match1 = pattern.regex.exec("replay battle 123");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("123");

      const match2 = pattern.regex.exec("xem lại trận đấu 456");
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("456");
    });
  });

  describe("Equipment Command Patterns", () => {
    it("should match English equip weapon command", () => {
      const pattern = registry.getAll().find((p) => p.id === "equip_weapon")!;

      const match1 = pattern.regex.exec("equip Fire Sword to Dragon");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("Fire Sword");
      expect(match1![2]).toBe("Dragon");

      const match2 = pattern.regex.exec("equip weapon Ice Blade on Phoenix");
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("Ice Blade");
      expect(match2![2]).toBe("Phoenix");
    });

    it("should match Vietnamese equip weapon command", () => {
      const pattern = registry.getAll().find((p) => p.id === "equip_weapon")!;

      const match = pattern.regex.exec("trang bị Kiếm Lửa cho Rồng");
      expect(match).toBeTruthy();
      expect(match![1]).toBe("Kiếm Lửa");
      expect(match![2]).toBe("Rồng");
    });

    it("should match unequip weapon command", () => {
      const pattern = registry.getAll().find((p) => p.id === "unequip_weapon")!;

      const match1 = pattern.regex.exec("unequip weapon from Dragon");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("Dragon");

      const match2 = pattern.regex.exec("remove weapon from Phoenix");
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("Phoenix");

      const match3 = pattern.regex.exec("gỡ vũ khí của Rồng");
      expect(match3).toBeTruthy();
      expect(match3![1]).toBe("Rồng");
    });

    it("should match equip gem command", () => {
      const pattern = registry.getAll().find((p) => p.id === "equip_gem")!;

      const match1 = pattern.regex.exec("equip gem Fire Ruby to Dragon");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("Fire Ruby");
      expect(match1![2]).toBe("Dragon");

      const match2 = pattern.regex.exec("trang bị ngọc Hồng Ngọc cho Rồng");
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("Hồng Ngọc");
      expect(match2![2]).toBe("Rồng");
    });

    it("should match unequip gem command", () => {
      const pattern = registry.getAll().find((p) => p.id === "unequip_gem")!;

      const match1 = pattern.regex.exec("unequip gem from Dragon");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("Dragon");

      const match2 = pattern.regex.exec("gỡ ngọc của Rồng");
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("Rồng");
    });
  });

  describe("Query Command Patterns", () => {
    it("should match list weapons command", () => {
      const pattern = registry.getAll().find((p) => p.id === "list_weapons")!;

      expect(pattern.regex.test("list weapons")).toBe(true);
      expect(pattern.regex.test("show weapons")).toBe(true);
      expect(pattern.regex.test("display weapons")).toBe(true);
      expect(pattern.regex.test("danh sách vũ khí")).toBe(true);
    });

    it("should match list gems command", () => {
      const pattern = registry.getAll().find((p) => p.id === "list_gems")!;

      expect(pattern.regex.test("list gems")).toBe(true);
      expect(pattern.regex.test("show gems")).toBe(true);
      expect(pattern.regex.test("danh sách ngọc")).toBe(true);
    });

    it("should match show stats command", () => {
      const pattern = registry.getAll().find((p) => p.id === "show_stats")!;

      expect(pattern.regex.test("stats")).toBe(true);
      expect(pattern.regex.test("statistics")).toBe(true);
      expect(pattern.regex.test("thống kê")).toBe(true);
    });
  });

  describe("Help Command Patterns", () => {
    it("should match help command", () => {
      const pattern = registry.getAll().find((p) => p.id === "help")!;

      expect(pattern.regex.test("help")).toBe(true);
      expect(pattern.regex.test("trợ giúp")).toBe(true);
      expect(pattern.regex.test("?")).toBe(true);
    });

    it("should match help category command", () => {
      const pattern = registry.getAll().find((p) => p.id === "help_category")!;

      const match1 = pattern.regex.exec("help cards");
      expect(match1).toBeTruthy();
      expect(match1![1]).toBe("cards");

      const match2 = pattern.regex.exec("help battle");
      expect(match2).toBeTruthy();
      expect(match2![1]).toBe("battle");

      const match3 = pattern.regex.exec("trợ giúp thẻ");
      expect(match3).toBeTruthy();
      expect(match3![1]).toBe("thẻ");

      const match4 = pattern.regex.exec("help equipment");
      expect(match4).toBeTruthy();
      expect(match4![1]).toBe("equipment");
    });
  });

  describe("Pattern Priority", () => {
    it("should prioritize specific patterns over general ones", () => {
      const patterns = registry.getAll();

      // help_category should have higher priority than help
      const helpCategory = patterns.find((p) => p.id === "help_category")!;
      const help = patterns.find((p) => p.id === "help")!;
      expect(helpCategory.priority).toBeGreaterThan(help.priority);
    });
  });

  describe("Pattern Examples", () => {
    it("should have both Vietnamese and English examples for all patterns", () => {
      const patterns = registry.getAll();

      for (const pattern of patterns) {
        expect(pattern.examples.en).toBeDefined();
        expect(pattern.examples.en.length).toBeGreaterThan(0);
        expect(pattern.examples.vi).toBeDefined();
        expect(pattern.examples.vi.length).toBeGreaterThan(0);
      }
    });

    it("should have examples that match their own regex", () => {
      const patterns = registry.getAll();

      for (const pattern of patterns) {
        // English example should match
        expect(
          pattern.regex.test(pattern.examples.en),
          `Pattern ${pattern.id} English example "${pattern.examples.en}" should match`,
        ).toBe(true);
        // Vietnamese example should match
        expect(
          pattern.regex.test(pattern.examples.vi),
          `Pattern ${pattern.id} Vietnamese example "${pattern.examples.vi}" should match`,
        ).toBe(true);
      }
    });
  });
});
