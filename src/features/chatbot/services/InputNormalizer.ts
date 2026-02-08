/**
 * InputNormalizer - Preprocesses user input for consistent parsing
 *
 * This service normalizes user input by:
 * - Converting to lowercase
 * - Trimming whitespace
 * - Detecting language (Vietnamese, English, or mixed)
 * - Tokenizing by whitespace
 * - Preserving Vietnamese diacritics
 *
 * Requirements: 1.1, 1.2, 1.3
 */

import type {
  InputNormalizer as IInputNormalizer,
  NormalizedInput,
  Language,
} from "../types";

/**
 * Vietnamese diacritics pattern for detection and preservation
 */
const VIETNAMESE_DIACRITICS =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

/**
 * Vietnamese command keywords for language detection
 * Includes both with and without diacritics for better detection
 */
const VIETNAMESE_KEYWORDS = [
  "tạo",
  "tao",
  "thêm",
  "them",
  "xóa",
  "xoa",
  "hiển thị",
  "hien thi",
  "hiện",
  "hien",
  "trận đấu",
  "tran dau",
  "đánh",
  "danh",
  "trang bị",
  "trang bi",
  "gỡ",
  "go",
  "danh sách",
  "thẻ",
  "the",
  "vũ khí",
  "vu khi",
  "ngọc",
  "ngoc",
  "với",
  "voi",
  "cho",
  "của",
  "cua",
  "và",
  "va",
  "hay",
  "hoặc",
  "hoac",
];

/**
 * English command keywords for language detection
 */
const ENGLISH_KEYWORDS = [
  "create",
  "make",
  "add",
  "delete",
  "remove",
  "show",
  "display",
  "view",
  "battle",
  "fight",
  "equip",
  "unequip",
  "list",
  "card",
  "weapon",
  "gem",
  "vs",
  "versus",
  "against",
  "to",
  "from",
  "with",
  "and",
  "or",
];

/**
 * InputNormalizer implementation
 */
export class InputNormalizer implements IInputNormalizer {
  /**
   * Normalize user input for consistent parsing
   *
   * @param input - Raw user input string
   * @returns Normalized input with language detection and tokenization
   */
  normalize(input: string): NormalizedInput {
    // Store original input
    const original = input;

    // Convert to lowercase and trim whitespace
    // This preserves Vietnamese diacritics while normalizing case
    const normalized = input.toLowerCase().trim();

    // Detect language
    const language = this.detectLanguage(normalized);

    // Tokenize by whitespace
    const tokens = this.tokenize(normalized);

    return {
      original,
      normalized,
      language,
      tokens,
    };
  }

  /**
   * Detect the language of the input
   *
   * @param text - Normalized text
   * @returns Detected language (vi, en, or mixed)
   */
  private detectLanguage(text: string): Language {
    // Check for Vietnamese diacritics
    const hasVietnameseDiacritics = VIETNAMESE_DIACRITICS.test(text);

    // Count Vietnamese and English keyword matches
    const vietnameseMatches = this.countKeywordMatches(
      text,
      VIETNAMESE_KEYWORDS,
    );
    const englishMatches = this.countKeywordMatches(text, ENGLISH_KEYWORDS);

    // If has Vietnamese diacritics, it's at least partially Vietnamese
    if (hasVietnameseDiacritics) {
      // If also has English keywords, it's mixed
      if (englishMatches > 0) {
        return "mixed";
      }
      return "vi";
    }

    // No diacritics - check keyword counts
    if (vietnameseMatches > 0 && englishMatches > 0) {
      return "mixed";
    }

    if (vietnameseMatches > englishMatches) {
      return "vi";
    }

    if (englishMatches > vietnameseMatches) {
      return "en";
    }

    // Default to English if no clear indicators
    return "en";
  }

  /**
   * Count how many keywords from a list appear in the text
   *
   * @param text - Text to search
   * @param keywords - Keywords to look for
   * @returns Number of keyword matches
   */
  private countKeywordMatches(text: string, keywords: string[]): number {
    let count = 0;
    for (const keyword of keywords) {
      // Use word boundary regex to match whole words
      const regex = new RegExp(`\\b${keyword}\\b`, "i");
      if (regex.test(text)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Tokenize text by whitespace
   *
   * @param text - Text to tokenize
   * @returns Array of tokens
   */
  private tokenize(text: string): string[] {
    // Split by whitespace and filter out empty strings
    return text.split(/\s+/).filter((token) => token.length > 0);
  }
}

/**
 * Singleton instance for convenience
 */
export const inputNormalizer = new InputNormalizer();
