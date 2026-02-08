/**
 * PatternRegistry - Registry of all command patterns
 *
 * This service manages command patterns with regex matching for both
 * Vietnamese and English commands. Patterns are prioritized to handle
 * overlapping matches correctly.
 *
 * Requirements: 2.1, 2.3, 11.1, 11.2
 */

import type {
  CommandPattern,
  CommandPatternRegistry as ICommandPatternRegistry,
  CommandType,
} from "../types";

/**
 * CommandPatternRegistry implementation
 */
export class CommandPatternRegistry implements ICommandPatternRegistry {
  patterns: CommandPattern[] = [];

  constructor() {
    // Register all patterns during initialization
    this.registerAllPatterns();
  }

  /**
   * Register a new command pattern
   */
  register(pattern: CommandPattern): void {
    this.patterns.push(pattern);
    // Sort by priority (descending) to ensure highest priority patterns are checked first
    this.patterns.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Unregister a pattern by ID
   */
  unregister(id: string): void {
    this.patterns = this.patterns.filter((p) => p.id !== id);
  }

  /**
   * Get all registered patterns
   */
  getAll(): CommandPattern[] {
    return [...this.patterns];
  }

  /**
   * Get patterns by command type
   */
  getByType(type: CommandType): CommandPattern[] {
    return this.patterns.filter((p) => p.commandType === type);
  }

  /**
   * Register all command patterns
   */
  private registerAllPatterns(): void {
    // ========================================================================
    // Card Commands
    // ========================================================================

    this.register({
      id: "create_card",
      regex: /^(?:create|make|add|tạo|thêm)\s+(?:card|thẻ)\s+(.+)$/i,
      commandType: "create_card",
      priority: 10,
      examples: {
        en: "create card Dragon Warrior",
        vi: "tạo thẻ Rồng Chiến",
      },
    });

    this.register({
      id: "list_cards",
      regex: /^(?:list|show|display|danh sách|hiển thị)\s+(?:cards|thẻ)$/i,
      commandType: "list_cards",
      priority: 10,
      examples: {
        en: "list cards",
        vi: "danh sách thẻ",
      },
    });

    this.register({
      id: "show_card",
      regex: /^(?:show|display|view|hiển thị|xem)\s+(?:card|thẻ)\s+(.+)$/i,
      commandType: "show_card",
      priority: 8,
      examples: {
        en: "show card Dragon",
        vi: "hiển thị thẻ Rồng",
      },
    });

    this.register({
      id: "delete_card",
      regex: /^(?:delete|remove|xóa|gỡ)\s+(?:card|thẻ)\s+(.+)$/i,
      commandType: "delete_card",
      priority: 10,
      examples: {
        en: "delete card Dragon",
        vi: "xóa thẻ Rồng",
      },
    });

    // ========================================================================
    // Battle Commands
    // ========================================================================

    this.register({
      id: "start_battle",
      regex:
        /^(?:battle|fight|trận đấu|đánh)\s+(.+?)\s+(?:vs|versus|against|với)\s+(.+)$/i,
      commandType: "start_battle",
      priority: 10,
      examples: {
        en: "battle Dragon vs Phoenix",
        vi: "trận đấu Rồng với Phượng",
      },
    });

    this.register({
      id: "battle_history",
      regex: /^(?:battle|fight|trận đấu)\s+(?:history|lịch sử|danh sách)$/i,
      commandType: "battle_history",
      priority: 10,
      examples: {
        en: "battle history",
        vi: "trận đấu lịch sử",
      },
    });

    this.register({
      id: "replay_battle",
      regex: /^(?:replay|xem lại)\s+(?:battle|trận đấu)\s+(.+)$/i,
      commandType: "replay_battle",
      priority: 10,
      examples: {
        en: "replay battle 123",
        vi: "xem lại trận đấu 123",
      },
    });

    // ========================================================================
    // Equipment Commands - Weapons
    // ========================================================================

    this.register({
      id: "equip_weapon",
      regex:
        /^(?:equip|trang bị)\s+(?:weapon\s+)?(.+?)\s+(?:to|on|cho)\s+(.+)$/i,
      commandType: "equip_weapon",
      priority: 10,
      examples: {
        en: "equip Fire Sword to Dragon",
        vi: "trang bị Kiếm Lửa cho Rồng",
      },
    });

    this.register({
      id: "unequip_weapon",
      regex:
        /^(?:unequip|remove|gỡ)\s+(?:weapon|vũ khí)\s+(?:from|của|khỏi)\s+(.+)$/i,
      commandType: "unequip_weapon",
      priority: 10,
      examples: {
        en: "unequip weapon from Dragon",
        vi: "gỡ vũ khí của Rồng",
      },
    });

    // ========================================================================
    // Equipment Commands - Gems
    // ========================================================================

    this.register({
      id: "equip_gem",
      regex:
        /^(?:equip|trang bị)\s+(?:gem|ngọc)\s+(.+?)\s+(?:to|on|cho)\s+(.+)$/i,
      commandType: "equip_gem",
      priority: 11, // Higher priority than equip_weapon since it's more specific
      examples: {
        en: "equip gem Fire Ruby to Dragon",
        vi: "trang bị ngọc Hồng Ngọc Lửa cho Rồng",
      },
    });

    this.register({
      id: "unequip_gem",
      regex:
        /^(?:unequip|remove|gỡ)\s+(?:gem|ngọc)\s+(?:from|của|khỏi)\s+(.+)$/i,
      commandType: "unequip_gem",
      priority: 11, // Higher priority than unequip_weapon since it's more specific
      examples: {
        en: "unequip gem from Dragon",
        vi: "gỡ ngọc của Rồng",
      },
    });

    // ========================================================================
    // Query Commands
    // ========================================================================

    this.register({
      id: "list_weapons",
      regex: /^(?:list|show|display|danh sách|hiển thị)\s+(?:weapons|vũ khí)$/i,
      commandType: "list_weapons",
      priority: 10,
      examples: {
        en: "list weapons",
        vi: "danh sách vũ khí",
      },
    });

    this.register({
      id: "list_gems",
      regex: /^(?:list|show|display|danh sách|hiển thị)\s+(?:gems|ngọc)$/i,
      commandType: "list_gems",
      priority: 10,
      examples: {
        en: "list gems",
        vi: "danh sách ngọc",
      },
    });

    this.register({
      id: "show_stats",
      regex: /^(?:stats|statistics|thống kê)$/i,
      commandType: "show_stats",
      priority: 10,
      examples: {
        en: "stats",
        vi: "thống kê",
      },
    });

    // ========================================================================
    // Help Commands
    // ========================================================================

    this.register({
      id: "help_category",
      regex:
        /^(?:help|trợ giúp)\s+(cards|battle|equipment|weapons|gems|thẻ|trận đấu|trang bị|vũ khí|ngọc)$/i,
      commandType: "help_category",
      priority: 10,
      examples: {
        en: "help cards",
        vi: "trợ giúp thẻ",
      },
    });

    this.register({
      id: "help",
      regex: /^(?:help|trợ giúp|\?)$/i,
      commandType: "help",
      priority: 9,
      examples: {
        en: "help",
        vi: "trợ giúp",
      },
    });
  }
}

/**
 * Singleton instance for convenience
 */
export const patternRegistry = new CommandPatternRegistry();
