/**
 * PatternMatcher - Matches user input against command patterns
 *
 * This service takes normalized input and matches it against all registered
 * command patterns, extracting parameters and selecting the best match based
 * on priority. Handles command synonyms and bilingual support.
 *
 * Now includes fuzzy matching as fallback when exact regex doesn't match,
 * making the chatbot more forgiving of typos and spelling errors.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import type {
  PatternMatcher as IPatternMatcher,
  NormalizedInput,
  MatchResult,
  CommandPattern,
} from "../types";
import { patternRegistry } from "./PatternRegistry";
import { fuzzyCommandMatcher } from "./FuzzyCommandMatcher";

/**
 * PatternMatcher implementation
 */
export class PatternMatcher implements IPatternMatcher {
  /**
   * Match normalized input against all registered patterns
   * Falls back to fuzzy matching if exact regex doesn't match
   *
   * @param input - Normalized user input
   * @returns Match result with command type and parameters, or null if no match
   */
  match(input: NormalizedInput): MatchResult | null {
    const patterns = patternRegistry.getAll();

    // First, try exact regex matching (highest accuracy)
    for (const pattern of patterns) {
      const match = pattern.regex.exec(input.normalized);

      if (match) {
        // Extract parameters from capture groups, using original input to preserve case
        const parameters = this.extractParameters(
          match,
          pattern,
          input.original,
        );

        // Calculate confidence based on match quality
        const confidence = this.calculateConfidence(match, input.normalized);

        return {
          commandType: pattern.commandType,
          confidence,
          parameters,
          pattern,
        };
      }
    }

    // Fallback: Try fuzzy matching for typo tolerance
    const fuzzyResult = fuzzyCommandMatcher.match(input);
    if (fuzzyResult && fuzzyResult.confidence >= 0.5) {
      return fuzzyCommandMatcher.toMatchResult(fuzzyResult);
    }

    // No pattern matched
    return null;
  }

  /**
   * Get command suggestions for unrecognized input
   *
   * @param input - User input that wasn't recognized
   * @returns Array of suggested commands
   */
  getSuggestions(input: string): string[] {
    return fuzzyCommandMatcher.getSuggestions(input);
  }

  /**
   * Extract parameters from regex match
   *
   * @param match - Regex match result from normalized input
   * @param pattern - Command pattern
   * @param originalInput - Original input to preserve case
   * @returns Parameters object with extracted values
   */
  private extractParameters(
    match: RegExpExecArray,
    pattern: CommandPattern,
    originalInput: string,
  ): Record<string, string> {
    const parameters: Record<string, string> = {};

    // Re-execute the pattern on the original input to get case-preserved matches
    const originalMatch = pattern.regex.exec(originalInput);

    if (!originalMatch) {
      // Fallback to normalized match if original doesn't match (shouldn't happen)
      for (let i = 1; i < match.length; i++) {
        const value = match[i];
        if (value !== undefined) {
          const paramName = this.getParameterName(pattern.commandType, i - 1);
          parameters[paramName] = value.trim();
        }
      }
      return parameters;
    }

    // Extract capture groups from original match (skip index 0 which is the full match)
    for (let i = 1; i < originalMatch.length; i++) {
      const value = originalMatch[i];
      if (value !== undefined) {
        // Use generic parameter names based on command type
        const paramName = this.getParameterName(pattern.commandType, i - 1);
        parameters[paramName] = value.trim();
      }
    }

    return parameters;
  }

  /**
   * Get parameter name based on command type and capture group index
   *
   * @param commandType - Type of command
   * @param index - Capture group index (0-based)
   * @returns Parameter name
   */
  private getParameterName(commandType: string, index: number): string {
    // Define parameter names for each command type
    const parameterMappings: Record<string, string[]> = {
      create_card: ["cardName"],
      show_card: ["cardName"],
      delete_card: ["cardName"],
      start_battle: ["card1Name", "card2Name"],
      replay_battle: ["battleId"],
      equip_weapon: ["weaponName", "cardName"],
      unequip_weapon: ["cardName"],
      equip_gem: ["gemName", "cardName"],
      unequip_gem: ["cardName"],
      help_category: ["category"],
    };

    const mapping = parameterMappings[commandType];
    if (mapping && index < mapping.length) {
      return mapping[index];
    }

    // Fallback to generic parameter name
    return `param${index + 1}`;
  }

  /**
   * Calculate confidence score for a match
   *
   * Confidence is based on:
   * - How much of the input was matched (coverage)
   * - Pattern priority
   *
   * @param match - Regex match result
   * @param input - Normalized input string
   * @returns Confidence score (0-1)
   */
  private calculateConfidence(match: RegExpExecArray, input: string): number {
    // Calculate coverage: how much of the input was matched
    const matchedLength = match[0].length;
    const inputLength = input.length;
    const coverage = matchedLength / inputLength;

    // Base confidence on coverage
    // If the entire input was matched, confidence is 1.0
    // If only part was matched, confidence is proportional
    return Math.min(coverage, 1.0);
  }
}

/**
 * Singleton instance for convenience
 */
export const patternMatcher = new PatternMatcher();
