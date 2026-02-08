/**
 * ResponseFormatter - Formats execution results for user display
 *
 * Handles success messages, error messages, help text, and entity lists
 * with bilingual support (Vietnamese/English)
 *
 * Requirements: 10.1, 10.2, 11.3, 11.4, 9.5
 */

import type {
  ResponseFormatter as IResponseFormatter,
  ExecutionResult,
  ChatMessage,
  Language,
} from "../types";
import {
  successTemplates,
  errorTemplates,
  helpTemplates,
  formatMessage,
  getTemplate,
  formatEntityList,
  formatPaginationHint,
  getEntityTypeName,
} from "../utils/messageTemplates";
import type { Card } from "@/features/cards/types/card";
import type { Weapon } from "@/features/weapons/types/weapon";
import type { Gem } from "@/features/gems/types/gem";

/**
 * Generate unique message ID
 */
function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * ResponseFormatter implementation
 */
export class ResponseFormatter implements IResponseFormatter {
  /**
   * Format successful execution result
   */
  formatSuccess(result: ExecutionResult, language: Language): ChatMessage {
    const commandType =
      result.data &&
      typeof result.data === "object" &&
      "commandType" in result.data
        ? (result.data.commandType as keyof typeof successTemplates | undefined)
        : undefined;

    // Handle help commands specially - use helpTemplates instead of successTemplates
    if (commandType === "help") {
      return this.formatHelp(undefined, language);
    }

    if (commandType === "help_category") {
      const category =
        result.data &&
        typeof result.data === "object" &&
        "category" in result.data
          ? (result.data.category as string)
          : undefined;
      return this.formatHelp(category, language);
    }

    const template = commandType ? successTemplates[commandType] : undefined;

    let content: string;
    if (template && result.data) {
      content = formatMessage(
        template,
        language,
        result.data as Record<string, string | number>,
      );
    } else {
      content = result.message;
    }

    return {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
      data: result.data,
    };
  }

  /**
   * Format error message
   */
  formatError(error: string, language: Language): ChatMessage {
    const template = errorTemplates.service_error;
    const content = formatMessage(template, language, { message: error });

    return {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
    };
  }

  /**
   * Format help text
   */
  formatHelp(category?: string, language: Language = "en"): ChatMessage {
    let content: string;

    if (!category) {
      // General help - show overview
      content = getTemplate(helpTemplates.overview, language);
    } else {
      // Category-specific help
      const normalizedCategory = category.toLowerCase();

      // Map Vietnamese categories to English keys
      const categoryMap: Record<string, keyof typeof helpTemplates> = {
        cards: "cards",
        thẻ: "cards",
        battle: "battle",
        "trận đấu": "battle",
        equipment: "equipment",
        "trang bị": "equipment",
        weapons: "query",
        "vũ khí": "query",
        gems: "query",
        ngọc: "query",
        query: "query",
      };

      const helpKey = categoryMap[normalizedCategory];

      if (helpKey && helpTemplates[helpKey]) {
        content = getTemplate(helpTemplates[helpKey], language);
      } else {
        // Unknown category - show overview
        content = getTemplate(helpTemplates.overview, language);
      }
    }

    return {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
    };
  }

  /**
   * Format entity list (cards, weapons, gems)
   */
  formatEntityList(
    entities: Array<Card | Weapon | Gem>,
    type: string,
    language: Language,
  ): ChatMessage {
    const maxDisplay = 10;
    const total = entities.length;
    const displayed = entities.slice(0, maxDisplay);

    // Get entity type name in correct language
    const typeName = getEntityTypeName(
      type as keyof typeof import("../utils/messageTemplates").entityTypeNames,
      language,
    );

    // Format entity names
    const names = displayed.map((entity) => `• ${entity.name}`).join("\n");

    // Build content
    let content =
      language === "vi"
        ? `Tìm thấy ${total} ${typeName}:\n\n${names}`
        : `Found ${total} ${typeName}(s):\n\n${names}`;

    // Add pagination hint if needed
    if (total > maxDisplay) {
      content += formatPaginationHint(total, maxDisplay, language);
    }

    return {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
      data: { entities: displayed, total, type },
    };
  }

  /**
   * Format entity not found error with suggestions
   */
  formatEntityNotFound(
    entityType: string,
    query: string,
    suggestions: string[],
    language: Language,
  ): ChatMessage {
    const template = errorTemplates.entity_not_found;
    const typeName = getEntityTypeName(
      entityType as keyof typeof import("../utils/messageTemplates").entityTypeNames,
      language,
    );

    const suggestionText =
      suggestions.length > 0
        ? formatEntityList(suggestions, language)
        : language === "vi"
          ? "(không có gợi ý)"
          : "(no suggestions)";

    const content = formatMessage(template, language, {
      type: typeName,
      name: query,
      suggestions: suggestionText,
    });

    return {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
    };
  }

  /**
   * Format multiple matches error
   */
  formatMultipleMatches(
    entityType: string,
    query: string,
    matches: Array<{ name: string; id: string }>,
    language: Language,
  ): ChatMessage {
    const template = errorTemplates.multiple_matches;
    const typeName = getEntityTypeName(
      entityType as keyof typeof import("../utils/messageTemplates").entityTypeNames,
      language,
    );

    const matchList = matches
      .map((m) => `• ${m.name} (ID: ${m.id})`)
      .join("\n");

    const content = formatMessage(template, language, {
      type: typeName,
      name: query,
      matches: matchList,
    });

    return {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
    };
  }

  /**
   * Format command not recognized error with suggestions
   */
  formatCommandNotRecognized(
    language: Language,
    input?: string,
    suggestions?: string[],
  ): ChatMessage {
    let content: string;
    const clickableSuggestions: { label: string; command: string }[] = [];

    if (suggestions && suggestions.length > 0) {
      // Build clickable suggestions
      suggestions.forEach((s) => {
        clickableSuggestions.push({
          label: s,
          command: s,
        });
      });

      if (language === "vi") {
        content = `❓ Tôi không hiểu lệnh đó.\n\n**Có phải bạn muốn nói:**`;
      } else {
        content = `❓ I didn't understand that command.\n\n**Did you mean:**`;
      }
    } else {
      // Default suggestions when no fuzzy match found
      const defaultSuggestions = [
        { label: "list cards", command: "list cards" },
        { label: "help", command: "help" },
        { label: "stats", command: "stats" },
      ];
      clickableSuggestions.push(...defaultSuggestions);

      if (language === "vi") {
        content = `❓ Tôi không hiểu lệnh "${input || ""}".\n\n**Thử các lệnh sau:**`;
      } else {
        content = `❓ I didn't understand "${input || ""}".\n\n**Try these commands:**`;
      }
    }

    return {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
      suggestions: clickableSuggestions,
    };
  }

  /**
   * Format empty input error
   */
  formatEmptyInput(language: Language): ChatMessage {
    const template = errorTemplates.empty_input;
    const content = getTemplate(template, language);

    return {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
    };
  }

  /**
   * Format input too long error
   */
  formatInputTooLong(language: Language): ChatMessage {
    const template = errorTemplates.input_too_long;
    const content = getTemplate(template, language);

    return {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
    };
  }
}

/**
 * Singleton instance for convenience
 */
export const responseFormatter = new ResponseFormatter();
