/**
 * CommandParser - Orchestrates the command processing pipeline
 *
 * This service coordinates the entire command processing flow:
 * 1. Input Normalization
 * 2. Pattern Matching
 * 3. Entity Resolution
 * 4. Command Execution
 * 5. Response Formatting
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import type { ChatMessage, CommandContext, ParsedCommand } from "../types";
import { inputNormalizer } from "./InputNormalizer";
import { patternMatcher } from "./PatternMatcher";
import { commandExecutor } from "./CommandExecutor";
import { responseFormatter } from "./ResponseFormatter";
import { cardCache, weaponCache, gemCache } from "./entityCacheInstances";
import type { Card } from "@/features/cards/types/card";
import type { Weapon } from "@/features/weapons/types/weapon";
import type { Gem } from "@/features/gems/types/gem";

/**
 * CommandParser orchestrates the command processing pipeline
 */
export class CommandParser {
  /**
   * Process a user command through the entire pipeline
   *
   * @param input - Raw user input string
   * @param context - Command context for contextual references
   * @returns Chat message with formatted response
   */
  async processCommand(
    input: string,
    context: CommandContext,
  ): Promise<ChatMessage> {
    try {
      // Step 1: Validate input
      if (!input || !input.trim()) {
        return responseFormatter.formatEmptyInput(context.language);
      }

      if (input.length > 500) {
        return responseFormatter.formatInputTooLong(context.language);
      }

      // Step 2: Normalize input
      const normalized = inputNormalizer.normalize(input);

      // Update context language based on detected language
      if (normalized.language !== "mixed") {
        context.setLanguage(normalized.language);
      }

      // Step 3: Match pattern (includes fuzzy matching fallback)
      const match = patternMatcher.match(normalized);

      if (!match) {
        // Get suggestions for the unrecognized input
        const suggestions = patternMatcher.getSuggestions(input);
        return responseFormatter.formatCommandNotRecognized(
          normalized.language,
          input,
          suggestions,
        );
      }

      // Step 4: Resolve entities
      const resolvedEntities = await this.resolveEntities(
        match.parameters,
        match.commandType,
      );

      // Check if entity resolution failed
      if (resolvedEntities instanceof Error) {
        return responseFormatter.formatError(
          resolvedEntities.message,
          normalized.language,
        );
      }

      // Step 5: Build parsed command
      const parsedCommand: ParsedCommand = {
        type: match.commandType,
        parameters: match.parameters,
        resolvedEntities,
        context,
      };

      // Step 6: Execute command
      const result = await commandExecutor.execute(parsedCommand);

      // Step 7: Format response
      if (result.success) {
        return responseFormatter.formatSuccess(result, normalized.language);
      } else {
        return responseFormatter.formatError(
          result.error || result.message,
          normalized.language,
        );
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return responseFormatter.formatError(errorMessage, context.language);
    }
  }

  /**
   * Resolve entity names to actual entities
   *
   * @param parameters - Parameters from pattern matching
   * @param commandType - Type of command being executed
   * @param language - Language for error messages
   * @returns Resolved entities or Error if resolution failed
   */
  private async resolveEntities(
    parameters: Record<string, string>,
    commandType: string,
  ): Promise<Record<string, Card | Weapon | Gem> | Error> {
    const resolved: Record<string, Card | Weapon | Gem> = {};

    // Refresh entity cache if stale
    // (Caches auto-refresh on access, so no explicit check needed)

    // Resolve entities based on command type
    try {
      switch (commandType) {
        case "create_card":
        case "list_cards":
        case "list_weapons":
        case "list_gems":
        case "show_stats":
        case "battle_history":
        case "help":
        case "help_category":
          // These commands don't need entity resolution
          break;

        case "show_card":
        case "delete_card": {
          // Resolve single card
          if (parameters.cardName) {
            const card = await this.resolveCard(parameters.cardName);
            if (card instanceof Error) return card;
            resolved.card = card;
          }
          break;
        }

        case "start_battle": {
          // Resolve two cards
          if (parameters.card1Name) {
            const card1 = await this.resolveCard(parameters.card1Name);
            if (card1 instanceof Error) return card1;
            resolved.card1 = card1;
          }
          if (parameters.card2Name) {
            const card2 = await this.resolveCard(parameters.card2Name);
            if (card2 instanceof Error) return card2;
            resolved.card2 = card2;
          }
          break;
        }

        case "equip_weapon": {
          // Resolve weapon and card
          if (parameters.weaponName) {
            const weapon = await this.resolveWeapon(parameters.weaponName);
            if (weapon instanceof Error) return weapon;
            resolved.weapon = weapon;
          }
          if (parameters.cardName) {
            const card = await this.resolveCard(parameters.cardName);
            if (card instanceof Error) return card;
            resolved.card = card;
          }
          break;
        }

        case "unequip_weapon": {
          // Resolve card
          if (parameters.cardName) {
            const card = await this.resolveCard(parameters.cardName);
            if (card instanceof Error) return card;
            resolved.card = card;
          }
          break;
        }

        case "equip_gem": {
          // Resolve gem and card
          if (parameters.gemName) {
            const gem = await this.resolveGem(parameters.gemName);
            if (gem instanceof Error) return gem;
            resolved.gem = gem;
          }
          if (parameters.cardName) {
            const card = await this.resolveCard(parameters.cardName);
            if (card instanceof Error) return card;
            resolved.card = card;
          }
          break;
        }

        case "unequip_gem": {
          // Resolve card and gem
          if (parameters.cardName) {
            const card = await this.resolveCard(parameters.cardName);
            if (card instanceof Error) return card;
            resolved.card = card;
          }
          if (parameters.gemName) {
            const gem = await this.resolveGem(parameters.gemName);
            if (gem instanceof Error) return gem;
            resolved.gem = gem;
          }
          break;
        }
      }

      return resolved;
    } catch (error) {
      return new Error(
        error instanceof Error ? error.message : "Entity resolution failed",
      );
    }
  }

  /**
   * Resolve a card name to a Card entity
   */
  private async resolveCard(name: string): Promise<Card | Error> {
    const resolver = await cardCache.getResolver();
    const result = resolver.resolve(name);

    switch (result.status) {
      case "exact":
      case "fuzzy":
        return result.entity!;

      case "multiple":
        return new Error(
          `Multiple cards match "${name}": ${result.matches?.map((m) => m.entity.name).join(", ")}`,
        );

      case "none": {
        const suggestions =
          result.matches?.map((m) => m.entity.name).slice(0, 3) || [];
        return new Error(
          `Card "${name}" not found. ${suggestions.length > 0 ? `Did you mean: ${suggestions.join(", ")}?` : ""}`,
        );
      }
    }
  }

  /**
   * Resolve a weapon name to a Weapon entity
   */
  private async resolveWeapon(name: string): Promise<Weapon | Error> {
    const resolver = await weaponCache.getResolver();
    const result = resolver.resolve(name);

    switch (result.status) {
      case "exact":
      case "fuzzy":
        return result.entity!;

      case "multiple":
        return new Error(
          `Multiple weapons match "${name}": ${result.matches?.map((m) => m.entity.name).join(", ")}`,
        );

      case "none": {
        const suggestions =
          result.matches?.map((m) => m.entity.name).slice(0, 3) || [];
        return new Error(
          `Weapon "${name}" not found. ${suggestions.length > 0 ? `Did you mean: ${suggestions.join(", ")}?` : ""}`,
        );
      }
    }
  }

  /**
   * Resolve a gem name to a Gem entity
   */
  private async resolveGem(name: string): Promise<Gem | Error> {
    const resolver = await gemCache.getResolver();
    const result = resolver.resolve(name);

    switch (result.status) {
      case "exact":
      case "fuzzy":
        return result.entity!;

      case "multiple":
        return new Error(
          `Multiple gems match "${name}": ${result.matches?.map((m) => m.entity.name).join(", ")}`,
        );

      case "none": {
        const suggestions =
          result.matches?.map((m) => m.entity.name).slice(0, 3) || [];
        return new Error(
          `Gem "${name}" not found. ${suggestions.length > 0 ? `Did you mean: ${suggestions.join(", ")}?` : ""}`,
        );
      }
    }
  }
}

/**
 * Singleton instance for convenience
 */
export const commandParser = new CommandParser();
