/**
 * CommandExecutor - Executes parsed commands by calling appropriate handlers
 *
 * Maps command types to handler functions and manages execution flow,
 * including error handling and context updates.
 *
 * Requirements: 4.1, 5.1, 6.1, 10.2
 */

import type {
  CommandExecutor as ICommandExecutor,
  ParsedCommand,
  ExecutionResult,
} from "../types";
import { commandHandlers } from "./commandHandlers";

/**
 * CommandExecutor implementation
 */
export class CommandExecutor implements ICommandExecutor {
  /**
   * Execute a parsed command
   *
   * @param command - Parsed command with type, parameters, entities, and context
   * @returns Execution result with success status and data
   */
  async execute(command: ParsedCommand): Promise<ExecutionResult> {
    try {
      // Get handler for command type
      const handler = commandHandlers[command.type];

      if (!handler) {
        return {
          success: false,
          message: `Unknown command type: ${command.type}`,
          error: `No handler registered for command type: ${command.type}`,
        };
      }

      // Merge parameters and resolved entities for handler
      const handlerParams = {
        ...command.parameters,
        ...command.resolvedEntities,
      };

      // Execute handler with parameters and context
      const result = await handler(handlerParams, command.context);

      return result;
    } catch (error) {
      // Handle unexpected errors during execution
      return {
        success: false,
        message: "Command execution failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Singleton instance for convenience
 */
export const commandExecutor = new CommandExecutor();
