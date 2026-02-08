/**
 * Message Templates for Chatbot Command System
 *
 * This module defines all message templates for success, error, and help messages
 * in both Vietnamese and English. Templates support parameter interpolation using
 * the {paramName} syntax.
 *
 * Requirements: 10.1, 10.2, 11.3, 11.4
 */

import type { CommandType, Language } from "../types";

// ============================================================================
// Template Types
// ============================================================================

/**
 * Bilingual template with Vietnamese and English versions
 */
export interface BilingualTemplate {
  vi: string;
  en: string;
}

/**
 * Template collection for a command type
 */
export interface CommandTemplates {
  success: BilingualTemplate;
  error?: BilingualTemplate;
}

// ============================================================================
// Success Templates
// ============================================================================

/**
 * Success message templates for all command types
 */
export const successTemplates: Record<CommandType, BilingualTemplate> = {
  // Card Commands
  create_card: {
    en: 'Created card "{name}" (ID: {id})',
    vi: 'Đã tạo thẻ "{name}" (ID: {id})',
  },
  list_cards: {
    en: "Found {count} card(s)",
    vi: "Tìm thấy {count} thẻ",
  },
  show_card: {
    en: "Card: {name} (ID: {id})\nHP: {hp} | ATK: {atk} | DEF: {def} | SPD: {spd}",
    vi: "Thẻ: {name} (ID: {id})\nHP: {hp} | ATK: {atk} | DEF: {def} | SPD: {spd}",
  },
  delete_card: {
    en: 'Deleted card "{name}"',
    vi: 'Đã xóa thẻ "{name}"',
  },

  // Battle Commands
  start_battle: {
    en: "Battle started: {card1} vs {card2}",
    vi: "Trận đấu bắt đầu: {card1} vs {card2}",
  },
  battle_history: {
    en: "Found {count} battle(s) in history",
    vi: "Tìm thấy {count} trận đấu trong lịch sử",
  },
  replay_battle: {
    en: "Opening battle replay (ID: {id})",
    vi: "Đang mở lại trận đấu (ID: {id})",
  },

  // Equipment Commands
  equip_weapon: {
    en: 'Equipped weapon "{weapon}" to card "{card}"',
    vi: 'Đã trang bị vũ khí "{weapon}" cho thẻ "{card}"',
  },
  unequip_weapon: {
    en: 'Unequipped weapon from card "{card}"',
    vi: 'Đã gỡ vũ khí khỏi thẻ "{card}"',
  },
  equip_gem: {
    en: 'Equipped gem "{gem}" to card "{card}"',
    vi: 'Đã trang bị ngọc "{gem}" cho thẻ "{card}"',
  },
  unequip_gem: {
    en: 'Unequipped gem from card "{card}"',
    vi: 'Đã gỡ ngọc khỏi thẻ "{card}"',
  },

  // Query Commands
  list_weapons: {
    en: "Found {count} weapon(s)",
    vi: "Tìm thấy {count} vũ khí",
  },
  list_gems: {
    en: "Found {count} gem(s)",
    vi: "Tìm thấy {count} ngọc",
  },
  show_stats: {
    en: "Game Stats:\nCards: {cards} | Weapons: {weapons} | Gems: {gems}",
    vi: "Thống kê:\nThẻ: {cards} | Vũ khí: {weapons} | Ngọc: {gems}",
  },

  // Help Commands
  help: {
    en: "Available commands:\n{commands}\n\nType 'help [category]' for more details",
    vi: "Các lệnh có sẵn:\n{commands}\n\nGõ 'help [danh mục]' để xem chi tiết",
  },
  help_category: {
    en: "{category} commands:\n{commands}",
    vi: "Lệnh {category}:\n{commands}",
  },
};

// ============================================================================
// Error Templates
// ============================================================================

/**
 * Error message templates for common error scenarios
 */
export const errorTemplates = {
  // Input Validation Errors
  empty_input: {
    en: "Please enter a command. Type 'help' to see available commands.",
    vi: "Vui lòng nhập lệnh. Gõ 'help' để xem các lệnh có sẵn.",
  },
  input_too_long: {
    en: "Command is too long (max 500 characters).",
    vi: "Lệnh quá dài (tối đa 500 ký tự).",
  },

  // Pattern Matching Errors
  command_not_recognized: {
    en: "I didn't understand that command. Type 'help' for available commands.",
    vi: "Tôi không hiểu lệnh đó. Gõ 'help' để xem các lệnh có sẵn.",
  },
  ambiguous_command: {
    en: "That command is ambiguous. Did you mean:\n{suggestions}",
    vi: "Lệnh đó không rõ ràng. Ý bạn là:\n{suggestions}",
  },

  // Entity Resolution Errors
  entity_not_found: {
    en: 'Could not find {type} "{name}". Did you mean: {suggestions}?',
    vi: 'Không tìm thấy {type} "{name}". Ý bạn là: {suggestions}?',
  },
  multiple_matches: {
    en: 'Multiple {type}s match "{name}":\n{matches}\nPlease be more specific.',
    vi: 'Nhiều {type} khớp với "{name}":\n{matches}\nVui lòng chỉ rõ hơn.',
  },
  no_suggestions: {
    en: 'Could not find {type} "{name}". No similar {type}s found.',
    vi: 'Không tìm thấy {type} "{name}". Không có {type} tương tự.',
  },

  // Service Execution Errors
  service_error: {
    en: "Error: {message}",
    vi: "Lỗi: {message}",
  },
  missing_parameter: {
    en: "Missing required parameter: {parameter}. Example: {example}",
    vi: "Thiếu tham số bắt buộc: {parameter}. Ví dụ: {example}",
  },
  invalid_parameter: {
    en: "Invalid {parameter}: {value}. Expected: {expected}",
    vi: "{parameter} không hợp lệ: {value}. Mong đợi: {expected}",
  },

  // Context Errors
  insufficient_context: {
    en: "Please specify which {type} you mean.",
    vi: "Vui lòng chỉ rõ {type} nào.",
  },
  context_type_mismatch: {
    en: "Expected a {expected}, but last reference was a {actual}.",
    vi: "Mong đợi {expected}, nhưng tham chiếu cuối là {actual}.",
  },

  // Battle Errors
  battle_card_not_found: {
    en: 'Could not find card "{name}" for battle. Please check the name.',
    vi: 'Không tìm thấy thẻ "{name}" cho trận đấu. Vui lòng kiểm tra tên.',
  },
  battle_initialization_failed: {
    en: "Failed to start battle: {reason}",
    vi: "Không thể bắt đầu trận đấu: {reason}",
  },

  // Equipment Errors
  equipment_failed: {
    en: "Failed to equip {item}: {reason}",
    vi: "Không thể trang bị {item}: {reason}",
  },
  unequipment_failed: {
    en: "Failed to unequip {item}: {reason}",
    vi: "Không thể gỡ {item}: {reason}",
  },
  no_equipment: {
    en: 'Card "{card}" has no {type} equipped.',
    vi: 'Thẻ "{card}" không có {type} nào được trang bị.',
  },
};

// ============================================================================
// Help Templates
// ============================================================================

/**
 * Help text templates organized by category
 */
export const helpTemplates = {
  // Main help overview
  overview: {
    en: `🎮 **GAME ASSISTANT - Quick Guide**

Welcome! I can help you manage cards, battles, and equipment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **QUICK START - Try these now:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → list cards        - See all your cards
  → list weapons      - See all weapons
  → stats             - View game statistics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 **COMMAND CATEGORIES:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• **Cards** (help cards)
  Create, view, delete cards
  Ex: create card Dragon, show card Fire Dragon

• **Battle** (help battle)  
  Start battles between cards
  Ex: battle Dragon vs Phoenix

• **Equipment** (help equipment)
  Equip weapons & gems to cards
  Ex: equip Fire Sword to Dragon

• **Query** (help query)
  List items and view statistics
  Ex: list gems, stats

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 **TIPS:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Commands work in both English and Vietnamese
• Type "help cards" for detailed card commands
• Card names can be partial (Dragon matches Fire Dragon)

Type **help [category]** for detailed commands.`,
    vi: `🎮 **GAME ASSISTANT - Hướng Dẫn Nhanh**

Xin chào! Tôi có thể giúp bạn quản lý thẻ, trận đấu và trang bị.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **BẮT ĐẦU NHANH - Thử ngay:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → danh sách thẻ     - Xem tất cả thẻ của bạn
  → danh sách vũ khí  - Xem tất cả vũ khí  
  → thống kê          - Xem thống kê trò chơi

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 **DANH MỤC LỆNH:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• **Thẻ** (help thẻ)
  Tạo, xem, xóa thẻ
  VD: tạo thẻ Rồng, xem thẻ Fire Dragon

• **Trận đấu** (help trận đấu)
  Bắt đầu trận đấu giữa các thẻ
  VD: trận đấu Rồng vs Phượng

• **Trang bị** (help trang bị)
  Trang bị vũ khí & ngọc cho thẻ
  VD: trang bị Kiếm Lửa cho Rồng

• **Truy vấn** (help query)
  Liệt kê vật phẩm và xem thống kê
  VD: danh sách ngọc, thống kê

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 **MẸO:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Lệnh hoạt động bằng cả tiếng Việt và tiếng Anh
• Gõ "help thẻ" để xem lệnh thẻ chi tiết
• Tên thẻ có thể viết một phần (Rồng khớp với Rồng Lửa)

Gõ **help [danh mục]** để xem lệnh chi tiết.`,
  },

  // Card commands help
  cards: {
    en: `🃏 **CARD COMMANDS**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **VIEW CARDS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  list cards          - Show all cards
  show card [name]    - Show card details
  
  Examples:
  → list cards
  → show card Fire Dragon
  → xem thẻ Rồng

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
➕ **CREATE CARD**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  create card [name]  - Create a new card
  tạo thẻ [tên]       - Tạo thẻ mới
  
  Examples:
  → create card Fire Dragon
  → tạo thẻ Rồng Lửa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗑️ **DELETE CARD**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  delete card [name]  - Delete a card
  xóa thẻ [tên]       - Xóa thẻ
  
  Examples:
  → delete card Fire Dragon
  → xóa thẻ Rồng

💡 Tip: You can use partial names - "Dragon" will match "Fire Dragon"`,
    vi: `🃏 **LỆNH THẺ**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **XEM THẺ**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  danh sách thẻ       - Xem tất cả thẻ
  xem thẻ [tên]       - Xem chi tiết thẻ
  
  Ví dụ:
  → danh sách thẻ
  → xem thẻ Rồng Lửa
  → show card Dragon

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
➕ **TẠO THẺ**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tạo thẻ [tên]       - Tạo thẻ mới
  create card [name]  - Create new card
  
  Ví dụ:
  → tạo thẻ Rồng Lửa
  → create card Fire Dragon

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗑️ **XÓA THẺ**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  xóa thẻ [tên]       - Xóa thẻ
  delete card [name]  - Delete card
  
  Ví dụ:
  → xóa thẻ Rồng
  → delete card Fire Dragon

💡 Mẹo: Bạn có thể dùng tên một phần - "Rồng" sẽ khớp với "Rồng Lửa"`,
  },

  // Battle commands help
  battle: {
    en: `⚔️ **BATTLE COMMANDS**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 **START A BATTLE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  battle [card1] vs [card2]
  fight [card1] against [card2]
  trận đấu [thẻ1] vs [thẻ2]
  
  Examples:
  → battle Fire Dragon vs Ice Wizard
  → trận đấu Rồng vs Phượng
  → fight Dragon against Phoenix

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 **VIEW BATTLE HISTORY**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  battle history      - Show all battles
  lịch sử trận đấu    - Xem tất cả trận đấu
  
  Examples:
  → battle history
  → lịch sử trận đấu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 **REPLAY A BATTLE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  replay battle [id]  - Watch battle again
  xem lại trận [id]   - Xem lại trận đấu

💡 Tip: Cards need to exist before you can battle them!`,
    vi: `⚔️ **LỆNH TRẬN ĐẤU**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 **BẮT ĐẦU TRẬN ĐẤU**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  trận đấu [thẻ1] vs [thẻ2]
  battle [card1] vs [card2]
  
  Ví dụ:
  → trận đấu Rồng Lửa vs Phượng Băng
  → battle Fire Dragon vs Ice Wizard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 **XEM LỊCH SỬ TRẬN ĐẤU**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  lịch sử trận đấu    - Xem tất cả trận đấu
  battle history      - Show all battles
  
  Ví dụ:
  → lịch sử trận đấu
  → battle history

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 **XEM LẠI TRẬN ĐẤU**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  xem lại trận [id]   - Xem lại trận đấu
  replay battle [id]  - Watch battle again

💡 Mẹo: Thẻ cần tồn tại trước khi bạn có thể cho đấu!`,
  },

  // Equipment commands help
  equipment: {
    en: `🛡️ **EQUIPMENT COMMANDS**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ **WEAPONS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Equip:
  → equip [weapon] to [card]
  → trang bị [vũ khí] cho [thẻ]
  
  Unequip:
  → unequip weapon from [card]
  → gỡ vũ khí khỏi [thẻ]
  
  Examples:
  → equip Fire Sword to Dragon
  → trang bị Kiếm Lửa cho Rồng

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 **GEMS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Equip:
  → equip gem [gem] to [card]
  → trang bị ngọc [ngọc] cho [thẻ]
  
  Unequip:
  → unequip gem from [card]
  → gỡ ngọc khỏi [thẻ]
  
  Examples:
  → equip gem Ruby to Dragon
  → gỡ ngọc khỏi Rồng

💡 Tip: Use "list weapons" or "list gems" to see available items!`,
    vi: `🛡️ **LỆNH TRANG BỊ**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ **VŨ KHÍ**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Trang bị:
  → trang bị [vũ khí] cho [thẻ]
  → equip [weapon] to [card]
  
  Gỡ trang bị:
  → gỡ vũ khí khỏi [thẻ]
  → unequip weapon from [card]
  
  Ví dụ:
  → trang bị Kiếm Lửa cho Rồng
  → equip Fire Sword to Dragon

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 **NGỌC**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Trang bị:
  → trang bị ngọc [ngọc] cho [thẻ]
  → equip gem [gem] to [card]
  
  Gỡ trang bị:
  → gỡ ngọc khỏi [thẻ]
  → unequip gem from [card]
  
  Ví dụ:
  → trang bị ngọc Hồng Ngọc cho Rồng
  → gỡ ngọc khỏi Rồng

💡 Mẹo: Dùng "danh sách vũ khí" hoặc "danh sách ngọc" để xem vật phẩm!`,
  },

  // Query commands help
  query: {
    en: `📊 **QUERY COMMANDS**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **LIST ITEMS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  list cards          - Show all cards
  list weapons        - Show all weapons
  list gems           - Show all gems
  
  Examples:
  → list cards
  → danh sách vũ khí
  → list gems

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 **STATISTICS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  stats               - View game statistics
  thống kê            - Xem thống kê trò chơi
  
  Shows: Total cards, weapons, gems, battles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 **VIEW DETAILS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  show card [name]    - View card details + equipment
  xem thẻ [tên]       - Xem chi tiết thẻ + trang bị
  
  Examples:
  → show card Fire Dragon
  → xem thẻ Rồng

💡 Tip: Start with "list cards" to see what you have!`,
    vi: `📊 **LỆNH TRUY VẤN**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **LIỆT KÊ VẬT PHẨM**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  danh sách thẻ       - Xem tất cả thẻ
  danh sách vũ khí    - Xem tất cả vũ khí
  danh sách ngọc      - Xem tất cả ngọc
  
  Ví dụ:
  → danh sách thẻ
  → list weapons
  → danh sách ngọc

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 **THỐNG KÊ**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  thống kê            - Xem thống kê trò chơi
  stats               - View game statistics
  
  Hiển thị: Tổng thẻ, vũ khí, ngọc, trận đấu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 **XEM CHI TIẾT**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  xem thẻ [tên]       - Xem chi tiết thẻ + trang bị
  show card [name]    - View card details + equipment
  
  Ví dụ:
  → xem thẻ Rồng Lửa
  → show card Fire Dragon

💡 Mẹo: Bắt đầu với "danh sách thẻ" để xem những gì bạn có!`,
  },
};

// ============================================================================
// Entity Type Names (for error messages)
// ============================================================================

/**
 * Bilingual entity type names for error messages
 */
export const entityTypeNames = {
  card: {
    en: "card",
    vi: "thẻ",
  },
  weapon: {
    en: "weapon",
    vi: "vũ khí",
  },
  gem: {
    en: "gem",
    vi: "ngọc",
  },
  battle: {
    en: "battle",
    vi: "trận đấu",
  },
};

// ============================================================================
// Template Interpolation
// ============================================================================

/**
 * Interpolate parameters into a template string
 *
 * Replaces {paramName} placeholders with values from the params object.
 * If a parameter is missing, the placeholder is left unchanged.
 *
 * @param template - Template string with {param} placeholders
 * @param params - Object with parameter values
 * @returns Interpolated string
 *
 * @example
 * interpolate('Hello {name}!', { name: 'World' })
 * // Returns: 'Hello World!'
 */
export function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in params ? String(params[key]) : match;
  });
}

/**
 * Get a template in the specified language
 *
 * @param template - Bilingual template
 * @param language - Target language
 * @returns Template string in the specified language
 */
export function getTemplate(
  template: BilingualTemplate,
  language: Language,
): string {
  // Default to English for mixed language
  return language === "vi" ? template.vi : template.en;
}

/**
 * Get and interpolate a template
 *
 * @param template - Bilingual template
 * @param language - Target language
 * @param params - Parameters for interpolation
 * @returns Interpolated message in the specified language
 */
export function formatMessage(
  template: BilingualTemplate,
  language: Language,
  params: Record<string, string | number> = {},
): string {
  const text = getTemplate(template, language);
  return interpolate(text, params);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a list of entity names for display
 *
 * @param names - Array of entity names
 * @param language - Target language
 * @returns Formatted list string
 */
export function formatEntityList(names: string[], language: Language): string {
  if (names.length === 0) {
    return language === "vi" ? "(không có)" : "(none)";
  }
  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    const and = language === "vi" ? "và" : "and";
    return `${names[0]} ${and} ${names[1]}`;
  }
  const and = language === "vi" ? "và" : "and";
  const lastItem = names[names.length - 1];
  const otherItems = names.slice(0, -1).join(", ");
  return `${otherItems}, ${and} ${lastItem}`;
}

/**
 * Format a pagination hint for long lists
 *
 * @param total - Total number of items
 * @param shown - Number of items shown
 * @param language - Target language
 * @returns Pagination hint string
 */
export function formatPaginationHint(
  total: number,
  shown: number,
  language: Language,
): string {
  if (total <= shown) {
    return "";
  }
  const remaining = total - shown;
  if (language === "vi") {
    return `\n\n(Hiển thị ${shown}/${total}. Còn ${remaining} mục nữa.)`;
  }
  return `\n\n(Showing ${shown}/${total}. ${remaining} more item(s) remaining.)`;
}

/**
 * Get entity type name in the specified language
 *
 * @param type - Entity type key
 * @param language - Target language
 * @returns Entity type name
 */
export function getEntityTypeName(
  type: keyof typeof entityTypeNames,
  language: Language,
): string {
  return language === "vi"
    ? entityTypeNames[type].vi
    : entityTypeNames[type].en;
}
