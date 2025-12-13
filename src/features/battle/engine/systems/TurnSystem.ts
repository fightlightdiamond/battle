import type { BattleState, Combatant, CombatantRole } from "../core/types";
import { getOppositeRole } from "../core/config";

// ============================================================================
// TURN SYSTEM INTERFACE
// ============================================================================

export interface TurnSystem {
  getNextAttacker(currentAttacker: CombatantRole): CombatantRole;
  advanceTurn(state: BattleState): BattleState;
  determineFirstAttacker(
    challenger: Combatant,
    opponent: Combatant
  ): CombatantRole;
}

// ============================================================================
// TURN SYSTEM IMPLEMENTATION
// ============================================================================

/**
 * Creates a TurnSystem instance for managing turn alternation.
 *
 * Responsibilities:
 * - Determine first attacker based on speed (Property 5)
 * - Alternate between challenger and opponent (Property 4)
 * - Advance turn counter immutably
 *
 * Requirements: 2.3, 3.1, 3.2, 3.3
 */
export function createTurnSystem(): TurnSystem {
  return {
    /**
     * Determine the first attacker based on speed comparison.
     * Higher speed attacks first. Random selection on equal speed.
     *
     * **Feature: tier-stat-system, Property 5: Speed Determines First Attacker**
     * **Validates: Requirements 3.1, 3.2, 3.3**
     *
     * @param challenger - The challenger combatant
     * @param opponent - The opponent combatant
     * @returns The role of the combatant who attacks first
     */
    determineFirstAttacker(
      challenger: Combatant,
      opponent: Combatant
    ): CombatantRole {
      const challengerSpeed = challenger.baseStats.spd;
      const opponentSpeed = opponent.baseStats.spd;

      if (challengerSpeed > opponentSpeed) {
        return "challenger";
      } else if (opponentSpeed > challengerSpeed) {
        return "opponent";
      } else {
        // Equal speed: random selection
        return Math.random() < 0.5 ? "challenger" : "opponent";
      }
    },

    /**
     * Get the next attacker based on current attacker.
     * Alternates between challenger and opponent (Property 4).
     *
     * @param currentAttacker - The current attacker role
     * @returns The next attacker role (opposite of current)
     */
    getNextAttacker(currentAttacker: CombatantRole): CombatantRole {
      return getOppositeRole(currentAttacker);
    },

    /**
     * Advance the turn, switching the current attacker and incrementing turn count.
     * This is an immutable operation - the original state is not modified.
     *
     * @param state - The current battle state
     * @returns New BattleState with updated turn and currentAttacker
     */
    advanceTurn(state: BattleState): BattleState {
      const nextAttacker = this.getNextAttacker(state.currentAttacker);

      return {
        ...state,
        turn: state.turn + 1,
        currentAttacker: nextAttacker,
      };
    },
  };
}

// Default singleton instance
export const turnSystem = createTurnSystem();
