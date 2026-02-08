/**
 * Unit tests for InputNormalizer
 *
 * Tests normalization, language detection, tokenization, and Vietnamese diacritics preservation
 */

import { describe, it, expect } from "vitest";
import { InputNormalizer } from "../../services/InputNormalizer";

describe("InputNormalizer", () => {
  const normalizer = new InputNormalizer();

  describe("normalize", () => {
    it("should convert text to lowercase", () => {
      const result = normalizer.normalize("CREATE CARD Dragon");
      expect(result.normalized).toBe("create card dragon");
    });

    it("should trim leading and trailing whitespace", () => {
      const result = normalizer.normalize("  create card dragon  ");
      expect(result.normalized).toBe("create card dragon");
    });

    it("should preserve original input", () => {
      const input = "  CREATE CARD Dragon  ";
      const result = normalizer.normalize(input);
      expect(result.original).toBe(input);
    });

    it("should tokenize by whitespace", () => {
      const result = normalizer.normalize("create card dragon");
      expect(result.tokens).toEqual(["create", "card", "dragon"]);
    });

    it("should handle multiple spaces between words", () => {
      const result = normalizer.normalize("create   card    dragon");
      expect(result.tokens).toEqual(["create", "card", "dragon"]);
    });

    it("should handle tabs and newlines as whitespace", () => {
      const result = normalizer.normalize("create\tcard\ndragon");
      expect(result.tokens).toEqual(["create", "card", "dragon"]);
    });
  });

  describe("Vietnamese diacritics preservation", () => {
    it("should preserve Vietnamese diacritics in lowercase conversion", () => {
      const result = normalizer.normalize("Tạo thẻ Rồng Lửa");
      expect(result.normalized).toBe("tạo thẻ rồng lửa");
      expect(result.normalized).toContain("ạ");
      expect(result.normalized).toContain("ẻ");
      expect(result.normalized).toContain("ồ");
      expect(result.normalized).toContain("ử");
    });

    it("should preserve all Vietnamese tone marks", () => {
      const input =
        "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
      const result = normalizer.normalize(input);
      expect(result.normalized).toBe(input);
    });

    it("should preserve diacritics in uppercase Vietnamese text", () => {
      const result = normalizer.normalize("TẠO THẺ RỒNG LỬA");
      expect(result.normalized).toBe("tạo thẻ rồng lửa");
    });

    it("should preserve diacritics in mixed case", () => {
      const result = normalizer.normalize("Tạo Thẻ RỒNG lửa");
      expect(result.normalized).toBe("tạo thẻ rồng lửa");
    });
  });

  describe("language detection", () => {
    it("should detect English input", () => {
      const result = normalizer.normalize("create card dragon");
      expect(result.language).toBe("en");
    });

    it("should detect Vietnamese input with diacritics", () => {
      const result = normalizer.normalize("tạo thẻ rồng");
      expect(result.language).toBe("vi");
    });

    it("should detect Vietnamese input without diacritics but with Vietnamese keywords", () => {
      const result = normalizer.normalize("tao the rong");
      expect(result.language).toBe("vi");
    });

    it("should detect mixed language input (Vietnamese command with English entity)", () => {
      const result = normalizer.normalize("tạo thẻ Dragon");
      expect(result.language).toBe("vi");
    });

    it("should detect mixed language input (English command with Vietnamese entity)", () => {
      const result = normalizer.normalize("create card Rồng Lửa");
      expect(result.language).toBe("mixed");
    });

    it("should detect mixed language with both Vietnamese and English keywords", () => {
      const result = normalizer.normalize("tao card rong");
      expect(result.language).toBe("mixed");
    });

    it("should default to English for ambiguous input", () => {
      const result = normalizer.normalize("xyz abc 123");
      expect(result.language).toBe("en");
    });

    it('should detect Vietnamese for "trận đấu" command', () => {
      const result = normalizer.normalize("trận đấu rồng với phượng");
      expect(result.language).toBe("vi");
    });

    it('should detect English for "battle" command', () => {
      const result = normalizer.normalize("battle dragon vs phoenix");
      expect(result.language).toBe("en");
    });

    it('should detect Vietnamese for "trang bị" command', () => {
      const result = normalizer.normalize("trang bị kiếm cho rồng");
      expect(result.language).toBe("vi");
    });

    it('should detect English for "equip" command', () => {
      const result = normalizer.normalize("equip sword to dragon");
      expect(result.language).toBe("en");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = normalizer.normalize("");
      expect(result.normalized).toBe("");
      expect(result.tokens).toEqual([]);
      expect(result.language).toBe("en");
    });

    it("should handle whitespace-only input", () => {
      const result = normalizer.normalize("   ");
      expect(result.normalized).toBe("");
      expect(result.tokens).toEqual([]);
    });

    it("should handle single word", () => {
      const result = normalizer.normalize("help");
      expect(result.normalized).toBe("help");
      expect(result.tokens).toEqual(["help"]);
      expect(result.language).toBe("en");
    });

    it("should handle single Vietnamese word with diacritics", () => {
      const result = normalizer.normalize("tạo");
      expect(result.normalized).toBe("tạo");
      expect(result.tokens).toEqual(["tạo"]);
      expect(result.language).toBe("vi");
    });

    it("should handle numbers", () => {
      const result = normalizer.normalize("create card 123");
      expect(result.normalized).toBe("create card 123");
      expect(result.tokens).toEqual(["create", "card", "123"]);
    });

    it("should handle special characters", () => {
      const result = normalizer.normalize('create card "Dragon"');
      expect(result.normalized).toBe('create card "dragon"');
      expect(result.tokens).toEqual(["create", "card", '"dragon"']);
    });

    it("should handle very long input", () => {
      const longInput = "create card " + "dragon ".repeat(100);
      const result = normalizer.normalize(longInput);
      expect(result.normalized).toBe(longInput.toLowerCase().trim());
      expect(result.tokens.length).toBeGreaterThan(100);
    });

    it("should handle mixed punctuation", () => {
      const result = normalizer.normalize("create card, dragon!");
      expect(result.normalized).toBe("create card, dragon!");
      expect(result.tokens).toEqual(["create", "card,", "dragon!"]);
    });
  });

  describe("complete normalization flow", () => {
    it("should normalize English command correctly", () => {
      const result = normalizer.normalize("  CREATE CARD Dragon Warrior  ");
      expect(result.original).toBe("  CREATE CARD Dragon Warrior  ");
      expect(result.normalized).toBe("create card dragon warrior");
      expect(result.language).toBe("en");
      expect(result.tokens).toEqual(["create", "card", "dragon", "warrior"]);
    });

    it("should normalize Vietnamese command correctly", () => {
      const result = normalizer.normalize("  TẠO THẺ Rồng Lửa  ");
      expect(result.original).toBe("  TẠO THẺ Rồng Lửa  ");
      expect(result.normalized).toBe("tạo thẻ rồng lửa");
      expect(result.language).toBe("vi");
      expect(result.tokens).toEqual(["tạo", "thẻ", "rồng", "lửa"]);
    });

    it("should normalize mixed language command correctly", () => {
      const result = normalizer.normalize("  TẠO CARD Dragon  ");
      expect(result.original).toBe("  TẠO CARD Dragon  ");
      expect(result.normalized).toBe("tạo card dragon");
      expect(result.language).toBe("mixed");
      expect(result.tokens).toEqual(["tạo", "card", "dragon"]);
    });
  });
});
