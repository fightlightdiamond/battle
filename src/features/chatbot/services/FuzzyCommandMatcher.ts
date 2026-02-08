/**
 * FuzzyCommandMatcher - Fuzzy matching for command recognition
 *
 * Uses Fuse.js to match user input against command keywords even when
 * there are typos or spelling errors. This makes the chatbot more
 * user-friendly and forgiving of input mistakes.
 *
 * Requirements: 2.1, 11.1, 11.2
 */

import Fuse from "fuse.js";
import type { IFuseOptions } from "fuse.js";
import type { CommandType, MatchResult, NormalizedInput } from "../types";
import { patternRegistry } from "./PatternRegistry";

/**
 * Command keyword definition for fuzzy matching
 */
interface CommandKeyword {
  /** Keywords that trigger this command */
  keywords: string[];
  /** The command type */
  commandType: CommandType;
  /** Whether this command requires parameters */
  requiresParams: boolean;
  /** Parameter extraction pattern */
  paramPattern?: RegExp;
  /** Parameter names in order */
  paramNames?: string[];
  /** Priority for matching */
  priority: number;
  /** Example commands */
  examples: string[];
}

/**
 * Fuzzy match result
 */
interface FuzzyMatchResult {
  commandType: CommandType;
  confidence: number;
  parameters: Record<string, string>;
  suggestion?: string;
}

/**
 * All command keywords for fuzzy matching
 */
const commandKeywords: CommandKeyword[] = [
  // Card Commands
  {
    keywords: [
      "create card",
      "make card",
      "add card",
      "tạo thẻ",
      "thêm thẻ",
      "new card",
      "tao the",
      "them the",
    ],
    commandType: "create_card",
    requiresParams: true,
    paramPattern:
      /(?:create|make|add|tạo|thêm|new|tao|them)\s*(?:card|thẻ|the)?\s+(.+)/i,
    paramNames: ["cardName"],
    priority: 10,
    examples: ["create card Dragon", "tạo thẻ Rồng"],
  },
  {
    keywords: [
      "list cards",
      "show cards",
      "display cards",
      "danh sách thẻ",
      "hiển thị thẻ",
      "xem thẻ",
      "cards",
      "danh sach the",
      "hien thi the",
    ],
    commandType: "list_cards",
    requiresParams: false,
    priority: 10,
    examples: ["list cards", "danh sách thẻ"],
  },
  {
    keywords: [
      "show card",
      "view card",
      "display card",
      "xem thẻ",
      "hiển thị thẻ",
      "thông tin thẻ",
      "hien thi the",
      "thong tin the",
    ],
    commandType: "show_card",
    requiresParams: true,
    paramPattern:
      /(?:show|view|display|xem|hiển thị|thông tin|hien thi|thong tin)\s*(?:card|thẻ|the)?\s+(.+)/i,
    paramNames: ["cardName"],
    priority: 8,
    examples: ["show card Dragon", "xem thẻ Rồng"],
  },
  {
    keywords: [
      "delete card",
      "remove card",
      "xóa thẻ",
      "gỡ thẻ",
      "xoa the",
      "go the",
    ],
    commandType: "delete_card",
    requiresParams: true,
    paramPattern: /(?:delete|remove|xóa|gỡ|xoa|go)\s*(?:card|thẻ|the)?\s+(.+)/i,
    paramNames: ["cardName"],
    priority: 10,
    examples: ["delete card Dragon", "xóa thẻ Rồng"],
  },

  // Battle Commands
  {
    keywords: [
      "battle",
      "fight",
      "trận đấu",
      "đánh",
      "tran dau",
      "danh",
      "vs",
      "versus",
    ],
    commandType: "start_battle",
    requiresParams: true,
    paramPattern:
      /(?:battle|fight|trận đấu|đánh|tran dau|danh)?\s*(.+?)\s+(?:vs|versus|against|với|voi)\s+(.+)/i,
    paramNames: ["card1Name", "card2Name"],
    priority: 10,
    examples: ["battle Dragon vs Phoenix", "trận đấu Rồng với Phượng"],
  },
  {
    keywords: [
      "battle history",
      "fight history",
      "lịch sử trận đấu",
      "lich su tran dau",
      "history battles",
    ],
    commandType: "battle_history",
    requiresParams: false,
    priority: 11,
    examples: ["battle history", "lịch sử trận đấu"],
  },
  {
    keywords: [
      "replay battle",
      "xem lại trận đấu",
      "replay",
      "xem lai tran dau",
    ],
    commandType: "replay_battle",
    requiresParams: true,
    paramPattern:
      /(?:replay|xem lại|xem lai)\s*(?:battle|trận đấu|tran dau)?\s+(.+)/i,
    paramNames: ["battleId"],
    priority: 10,
    examples: ["replay battle 123", "xem lại trận đấu 123"],
  },

  // Equipment Commands - Weapons
  {
    keywords: [
      "equip weapon",
      "trang bị vũ khí",
      "equip",
      "trang bi vu khi",
      "trang bi",
    ],
    commandType: "equip_weapon",
    requiresParams: true,
    paramPattern:
      /(?:equip|trang bị|trang bi)\s*(?:weapon|vũ khí|vu khi)?\s*(.+?)\s+(?:to|on|cho)\s+(.+)/i,
    paramNames: ["weaponName", "cardName"],
    priority: 10,
    examples: ["equip Fire Sword to Dragon", "trang bị Kiếm Lửa cho Rồng"],
  },
  {
    keywords: [
      "unequip weapon",
      "remove weapon",
      "gỡ vũ khí",
      "go vu khi",
      "bo vu khi",
    ],
    commandType: "unequip_weapon",
    requiresParams: true,
    paramPattern:
      /(?:unequip|remove|gỡ|go|bỏ|bo)\s*(?:weapon|vũ khí|vu khi)\s*(?:from|của|khỏi|cua|khoi)?\s*(.+)/i,
    paramNames: ["cardName"],
    priority: 10,
    examples: ["unequip weapon from Dragon", "gỡ vũ khí của Rồng"],
  },

  // Equipment Commands - Gems
  {
    keywords: ["equip gem", "trang bị ngọc", "trang bi ngoc", "add gem"],
    commandType: "equip_gem",
    requiresParams: true,
    paramPattern:
      /(?:equip|trang bị|trang bi|add)\s*(?:gem|ngọc|ngoc)\s*(.+?)\s+(?:to|on|cho)\s+(.+)/i,
    paramNames: ["gemName", "cardName"],
    priority: 11,
    examples: ["equip gem Ruby to Dragon", "trang bị ngọc Hồng Ngọc cho Rồng"],
  },
  {
    keywords: ["unequip gem", "remove gem", "gỡ ngọc", "go ngoc", "bo ngoc"],
    commandType: "unequip_gem",
    requiresParams: true,
    paramPattern:
      /(?:unequip|remove|gỡ|go|bỏ|bo)\s*(?:gem|ngọc|ngoc)\s*(?:from|của|khỏi|cua|khoi)?\s*(.+)/i,
    paramNames: ["cardName"],
    priority: 11,
    examples: ["unequip gem from Dragon", "gỡ ngọc của Rồng"],
  },

  // Query Commands
  {
    keywords: [
      "list weapons",
      "show weapons",
      "danh sách vũ khí",
      "weapons",
      "danh sach vu khi",
      "vu khi",
    ],
    commandType: "list_weapons",
    requiresParams: false,
    priority: 10,
    examples: ["list weapons", "danh sách vũ khí"],
  },
  {
    keywords: [
      "list gems",
      "show gems",
      "danh sách ngọc",
      "gems",
      "danh sach ngoc",
      "ngoc",
    ],
    commandType: "list_gems",
    requiresParams: false,
    priority: 10,
    examples: ["list gems", "danh sách ngọc"],
  },
  {
    keywords: ["stats", "statistics", "thống kê", "thong ke", "stat"],
    commandType: "show_stats",
    requiresParams: false,
    priority: 10,
    examples: ["stats", "thống kê"],
  },

  // Help Commands
  {
    keywords: ["help cards", "trợ giúp thẻ", "tro giup the", "help card"],
    commandType: "help_category",
    requiresParams: false,
    priority: 11,
    examples: ["help cards"],
  },
  {
    keywords: [
      "help battle",
      "trợ giúp trận đấu",
      "tro giup tran dau",
      "help fight",
    ],
    commandType: "help_category",
    requiresParams: false,
    priority: 11,
    examples: ["help battle"],
  },
  {
    keywords: ["help equipment", "trợ giúp trang bị", "tro giup trang bi"],
    commandType: "help_category",
    requiresParams: false,
    priority: 11,
    examples: ["help equipment"],
  },
  {
    keywords: ["help", "trợ giúp", "tro giup", "?", "huong dan", "hướng dẫn"],
    commandType: "help",
    requiresParams: false,
    priority: 9,
    examples: ["help", "trợ giúp"],
  },
];

/**
 * Build search items from keywords for Fuse.js
 */
interface SearchItem {
  keyword: string;
  commandType: CommandType;
  index: number;
}

const searchItems: SearchItem[] = commandKeywords.flatMap((cmd, index) =>
  cmd.keywords.map((keyword) => ({
    keyword,
    commandType: cmd.commandType,
    index,
  })),
);

/**
 * Fuse.js options for fuzzy matching
 */
const fuseOptions: IFuseOptions<SearchItem> = {
  keys: ["keyword"],
  threshold: 0.4, // 0 = exact match, 1 = match anything
  distance: 100,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
};

const fuse = new Fuse(searchItems, fuseOptions);

/**
 * FuzzyCommandMatcher class
 */
export class FuzzyCommandMatcher {
  /**
   * Try to match input using fuzzy matching
   * Returns null if ambiguous (multiple similar matches)
   *
   * @param input - Normalized user input
   * @returns Fuzzy match result or null if no good match or ambiguous
   */
  match(input: NormalizedInput): FuzzyMatchResult | null {
    const text = input.normalized.toLowerCase().trim();

    if (!text) return null;

    // Search for matching commands
    const results = fuse.search(text, { limit: 10 });

    if (results.length === 0) {
      return null;
    }

    // Get the best match
    const bestMatch = results[0];
    const score = bestMatch.score ?? 1;

    // Check if there are multiple ambiguous matches
    // If there are multiple results with similar scores, don't auto-match
    if (results.length > 1) {
      const secondBestScore = results[1].score ?? 1;
      const scoreDifference = secondBestScore - score;

      // Get unique command types in the top results
      const topResults = results.filter((r) => (r.score ?? 1) < 0.5);
      const uniqueCommandTypes = new Set(
        topResults.map((r) => r.item.commandType),
      );

      // If there are multiple different command types with similar scores,
      // it's ambiguous - don't auto-match, show suggestions instead
      if (uniqueCommandTypes.size > 1 && scoreDifference < 0.15) {
        return null; // Ambiguous - let CommandParser show suggestions
      }
    }

    // Only accept if score is good enough (lower is better in Fuse.js)
    if (score > 0.5) {
      // Try to find a suggestion even if we can't confidently match
      return {
        commandType: bestMatch.item.commandType,
        confidence: 1 - score,
        parameters: {},
        suggestion: this.getSuggestion(bestMatch.item.commandType),
      };
    }

    // Get the command definition
    const cmdDef = commandKeywords[bestMatch.item.index];

    // Extract parameters if needed
    const parameters: Record<string, string> = {};
    if (cmdDef.requiresParams && cmdDef.paramPattern && cmdDef.paramNames) {
      const paramMatch = cmdDef.paramPattern.exec(input.original);
      if (paramMatch) {
        cmdDef.paramNames.forEach((name, i) => {
          if (paramMatch[i + 1]) {
            parameters[name] = paramMatch[i + 1].trim();
          }
        });
      }
    }

    // Handle special cases for category help
    if (cmdDef.commandType === "help_category") {
      const categoryMatch = text.match(/help\s+(\w+)/i);
      if (categoryMatch) {
        parameters.category = categoryMatch[1];
      }
    }

    return {
      commandType: cmdDef.commandType,
      confidence: 1 - score,
      parameters,
    };
  }

  /**
   * Get a suggestion for a command type
   */
  private getSuggestion(commandType: CommandType): string {
    const cmdDef = commandKeywords.find((c) => c.commandType === commandType);
    if (cmdDef && cmdDef.examples.length > 0) {
      return cmdDef.examples[0];
    }
    return "";
  }

  /**
   * Get suggestions for unrecognized input
   * Returns unique suggestions by command type
   *
   * @param input - User input that wasn't recognized
   * @returns Array of suggested commands (unique by command type)
   */
  getSuggestions(input: string): string[] {
    const text = input.toLowerCase().trim();
    const results = fuse.search(text, { limit: 10 });

    // Get unique suggestions by command type
    const seenCommandTypes = new Set<CommandType>();
    const suggestions: string[] = [];

    for (const result of results) {
      if ((result.score ?? 1) > 0.7) continue; // Skip poor matches

      const cmdDef = commandKeywords[result.item.index];

      // Only add if we haven't seen this command type yet
      if (!seenCommandTypes.has(cmdDef.commandType)) {
        seenCommandTypes.add(cmdDef.commandType);
        suggestions.push(cmdDef.examples[0]);
      }

      // Limit to 5 unique suggestions
      if (suggestions.length >= 5) break;
    }

    return suggestions;
  }

  /**
   * Convert fuzzy match to standard MatchResult format
   */
  toMatchResult(fuzzyResult: FuzzyMatchResult): MatchResult {
    const patterns = patternRegistry.getAll();
    const pattern = patterns.find(
      (p) => p.commandType === fuzzyResult.commandType,
    );

    return {
      commandType: fuzzyResult.commandType,
      confidence: fuzzyResult.confidence,
      parameters: fuzzyResult.parameters,
      pattern: pattern || {
        id: fuzzyResult.commandType,
        regex: new RegExp(""),
        commandType: fuzzyResult.commandType,
        priority: 5,
        examples: { en: "", vi: "" },
      },
    };
  }
}

/**
 * Singleton instance
 */
export const fuzzyCommandMatcher = new FuzzyCommandMatcher();
