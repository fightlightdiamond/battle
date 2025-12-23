/**
 * Arena Battle Store - Zustand state management for Arena Mode battles
 * Requirements: 2.2, 2.3, 3.1, 3.2, 3.4, 4.1, 4.2
 * Gem Skill System Requirements: 2.4, 5.1, 8.1, 3.1, 4.1, 6.1, 7.1, 9.2
 */

import { create } from "zustand";
import type {
  BattleCard,
  BattleLogEntry,
  BattleResult,
  AttackResult,
} from "../types";
import { BATTLE_RESULTS, COMBAT_CONSTANTS } from "../types/battle";
import {
  calculateAttack,
  checkBattleEnd,
  cardToBattleCardWithEquipment,
  loadCardGems,
} from "../services/battleService";
import type { Card } from "../../cards/types";
import type { CellIndex, ArenaPhase } from "../../arena1d/types/arena";
import {
  LEFT_BOUNDARY_INDEX,
  RIGHT_BOUNDARY_INDEX,
  PHASE_SETUP,
  PHASE_MOVING,
  PHASE_COMBAT,
  PHASE_FINISHED,
} from "../../arena1d/types/arena";
import type { BattleCardGems } from "../../gems/types";
import { createSkillSystem } from "../engine/systems/SkillSystem";
import type {
  ArenaBattleState,
  ArenaBattleActions,
  ArenaBattleStoreState,
} from "./types";

// Re-export types for convenience
export type { ArenaBattleState, ArenaBattleActions, ArenaBattleStoreState };

/**
 * Generate a unique ID for battle log entries
 */
function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Calculate distance between two positions
 */
export function getDistance(pos1: CellIndex, pos2: CellIndex): number {
  return Math.abs(pos1 - pos2);
}

/**
 * Check if positions are adjacent (distance = 1)
 */
export function areAdjacent(pos1: CellIndex, pos2: CellIndex): boolean {
  return getDistance(pos1, pos2) === 1;
}

/**
 * Check if target is within attack range
 * Property 6: In-range determination using absolute distance
 * Returns true if |attackerPos - targetPos| <= effectiveRange
 * Requirements: 3.1, 3.3
 */
export function isInAttackRange(
  attackerPos: CellIndex,
  targetPos: CellIndex,
  effectiveRange: number,
): boolean {
  const distance = Math.abs(attackerPos - targetPos);
  return distance <= effectiveRange;
}

/**
 * Check if a card can move (enemy is NOT in attack range)
 * Property 7 & 8: Movement blocked when enemy in range, allowed when out of range
 * Requirements: 4.1, 4.2
 */
export function canCardMove(
  cardPos: CellIndex,
  enemyPos: CellIndex,
  effectiveRange: number,
): boolean {
  return !isInAttackRange(cardPos, enemyPos, effectiveRange);
}

/**
 * Calculate next position toward opponent
 * Property 4: Movement is exactly 1 cell toward opponent
 */
export function getNextPosition(
  currentPos: CellIndex,
  targetPos: CellIndex,
): CellIndex {
  if (currentPos < targetPos) {
    return (currentPos + 1) as CellIndex;
  }
  return (currentPos - 1) as CellIndex;
}

/**
 * Determine arena phase based on distance (legacy - uses default range of 1)
 * Property 3: Phase determination by distance
 * - distance > 1 → 'moving'
 * - distance = 1 → 'combat'
 * @deprecated Use determinePhaseWithRange for range-aware phase determination
 */
export function determinePhase(
  leftPos: CellIndex,
  rightPos: CellIndex,
): ArenaPhase {
  const distance = getDistance(leftPos, rightPos);
  if (distance > 1) {
    return PHASE_MOVING;
  }
  return PHASE_COMBAT;
}

/**
 * Determine arena phase based on effective ranges
 * Property 3: Phase determination by distance and effective range
 * - If either card is in range of the other → 'combat'
 * - Otherwise → 'moving'
 * Requirements: 3.1, 4.1
 */
export function determinePhaseWithRange(
  leftPos: CellIndex,
  rightPos: CellIndex,
  leftEffectiveRange: number,
  rightEffectiveRange: number,
): ArenaPhase {
  const distance = getDistance(leftPos, rightPos);

  // If either card is in range of the other, enter combat
  if (distance <= leftEffectiveRange || distance <= rightEffectiveRange) {
    return PHASE_COMBAT;
  }

  return PHASE_MOVING;
}

/**
 * Create a battle log entry for movement
 */
function createMoveLogEntry(
  moverName: string,
  fromPos: CellIndex,
  toPos: CellIndex,
): Readonly<BattleLogEntry> {
  return {
    id: generateLogId(),
    timestamp: Date.now(),
    type: "attack", // reuse type for log display
    message: `[${moverName}] moves from cell ${fromPos} to cell ${toPos}`,
  };
}

/**
 * Create a battle log entry for an attack
 */
function createAttackLogEntry(
  attackerName: string,
  defenderName: string,
  damage: number,
  defenderRemainingHp: number,
  isCrit?: boolean,
  lifestealAmount?: number,
): Readonly<BattleLogEntry> {
  return {
    id: generateLogId(),
    timestamp: Date.now(),
    type: "attack",
    message: `[${attackerName}] attacks [${defenderName}] for [${damage}] damage. [${defenderName}] has [${defenderRemainingHp}] HP remaining`,
    isCrit,
    hasLifesteal: lifestealAmount !== undefined && lifestealAmount > 0,
    lifestealAmount,
  };
}

/**
 * Create a battle log entry for victory
 */
function createVictoryLogEntry(winnerName: string): Readonly<BattleLogEntry> {
  return {
    id: generateLogId(),
    timestamp: Date.now(),
    type: "victory",
    message: `[${winnerName}] wins the battle!`,
  };
}

/**
 * Create a battle log entry for skill activation
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
function createSkillLogEntry(
  cardName: string,
  skillName: string,
  effect: string,
  skillType?: string,
): Readonly<BattleLogEntry> {
  return {
    id: generateLogId(),
    timestamp: Date.now(),
    type: "skill",
    message: `[${cardName}] activates [${skillName}]: ${effect}`,
    skillActivation: {
      skillType: skillType ?? "unknown",
      gemName: skillName,
      cardName,
      effect,
    },
  };
}

// Create skill system instance for the store
const skillSystem = createSkillSystem();

/**
 * Initial state factory
 * Updated for Gem Skill System Requirements: 2.4, 9.4
 */
const createInitialState = (): ArenaBattleState => ({
  challenger: null,
  opponent: null,
  leftPosition: LEFT_BOUNDARY_INDEX as CellIndex,
  rightPosition: RIGHT_BOUNDARY_INDEX as CellIndex,
  arenaPhase: PHASE_SETUP,
  currentTurn: "challenger",
  battleLog: [],
  result: null,
  isAutoBattle: false,
  challengerGems: null,
  opponentGems: null,
});

/**
 * Get next turn (alternates between challenger and opponent)
 * Property 5: Turn alternates after movement
 */
const getNextTurn = (
  current: "challenger" | "opponent",
): "challenger" | "opponent" =>
  current === "challenger" ? "opponent" : "challenger";

/**
 * Get winner name from result
 */
const getWinnerName = (
  result: BattleResult,
  challenger: Readonly<BattleCard>,
  opponent: Readonly<BattleCard>,
): string =>
  result === BATTLE_RESULTS.CHALLENGER_WINS ? challenger.name : opponent.name;

/**
 * Arena Battle store using Zustand
 */
export const useArenaBattleStore = create<ArenaBattleStoreState>(
  (set, get) => ({
    ...createInitialState(),

    /**
     * Initialize arena with selected cards
     * Property 2: Initial positions are at boundaries
     * - Challenger at position 0 (left boundary)
     * - Opponent at position 7 (right boundary)
     * Updated to use effective range for phase determination
     * Updated for Gem Skill System Requirements: 2.4, 9.4
     * Requirements: 3.1, 4.1
     */
    initArena: (
      challenger: BattleCard,
      opponent: BattleCard,
      challengerGems?: BattleCardGems | null,
      opponentGems?: BattleCardGems | null,
    ): void => {
      const leftPos = LEFT_BOUNDARY_INDEX as CellIndex;
      const rightPos = RIGHT_BOUNDARY_INDEX as CellIndex;
      const phase = determinePhaseWithRange(
        leftPos,
        rightPos,
        challenger.effectiveRange,
        opponent.effectiveRange,
      );

      set({
        challenger,
        opponent,
        leftPosition: leftPos,
        rightPosition: rightPos,
        arenaPhase: phase,
        currentTurn: "challenger",
        battleLog: [],
        result: null,
        isAutoBattle: false,
        challengerGems: challengerGems ?? null,
        opponentGems: opponentGems ?? null,
      });
    },

    /**
     * Initialize arena with Card entities, loading equipment automatically
     * Converts Cards to BattleCards with weapon bonuses applied
     * Updated to use effective range for phase determination
     * Updated for Gem Skill System Requirements: 2.4, 9.4
     *
     * Requirements: 2.2, 3.1, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
     */
    initArenaWithCards: async (
      challenger: Card,
      opponent: Card,
    ): Promise<void> => {
      // Load equipment and convert to battle cards with weapon bonuses
      // Also load gem equipment for both cards (Requirements: 2.4, 9.4)
      const [
        challengerBattleCard,
        opponentBattleCard,
        challengerGems,
        opponentGems,
      ] = await Promise.all([
        cardToBattleCardWithEquipment(challenger),
        cardToBattleCardWithEquipment(opponent),
        loadCardGems(challenger.id),
        loadCardGems(opponent.id),
      ]);

      const leftPos = LEFT_BOUNDARY_INDEX as CellIndex;
      const rightPos = RIGHT_BOUNDARY_INDEX as CellIndex;
      const phase = determinePhaseWithRange(
        leftPos,
        rightPos,
        challengerBattleCard.effectiveRange,
        opponentBattleCard.effectiveRange,
      );

      set({
        challenger: challengerBattleCard,
        opponent: opponentBattleCard,
        leftPosition: leftPos,
        rightPosition: rightPos,
        arenaPhase: phase,
        currentTurn: "challenger",
        battleLog: [],
        result: null,
        isAutoBattle: false,
        challengerGems,
        opponentGems,
      });
    },

    /**
     * Execute movement for current turn's card
     * Property 4: Movement is exactly 1 cell toward opponent
     * Property 5: Turn alternates after movement
     * Property 7 & 8: Movement blocked when enemy in range, allowed when out of range
     * NEW: If enemy is in range, skip movement and proceed to attack
     * NEW: If in range after move, immediately attack in same turn
     * Updated for Gem Skill System Requirements: 5.1, 8.1
     * Requirements: 4.1, 4.3, 4.4
     */
    executeMove: (): void => {
      const {
        arenaPhase,
        challenger,
        opponent,
        currentTurn,
        leftPosition,
        rightPosition,
        challengerGems,
        opponentGems,
      } = get();

      // Guards
      if (arenaPhase !== PHASE_MOVING || !challenger || !opponent) {
        return;
      }

      const isChallenger = currentTurn === "challenger";
      const currentPos = isChallenger ? leftPosition : rightPosition;
      const targetPos = isChallenger ? rightPosition : leftPosition;
      const mover = isChallenger ? challenger : opponent;
      const moverGems = isChallenger ? challengerGems : opponentGems;

      // Check if enemy is already in attack range - if so, skip movement and attack
      // Requirements: 4.1, 4.3, 4.4
      if (!canCardMove(currentPos, targetPos, mover.effectiveRange)) {
        // Enemy is in range - cannot move, must attack instead
        // Transition to combat phase and execute attack
        const attacker = mover;
        const defender = isChallenger ? opponent : challenger;

        // Calculate attack
        const attackResult = calculateAttack(attacker, defender);

        // Create updated cards
        const updatedDefender: Readonly<BattleCard> = {
          ...defender,
          currentHp: attackResult.defenderNewHp,
        };
        const updatedAttacker: Readonly<BattleCard> = {
          ...attacker,
          currentHp: attackResult.attackerNewHp,
        };

        const newChallenger = isChallenger ? updatedAttacker : updatedDefender;
        const newOpponent = isChallenger ? updatedDefender : updatedAttacker;

        // Check battle end
        const battleResult = checkBattleEnd(newChallenger, newOpponent);

        // Create attack log (no move log since movement was blocked)
        const attackLog = createAttackLogEntry(
          attacker.name,
          defender.name,
          attackResult.damage,
          attackResult.defenderNewHp,
          attackResult.damageResult?.isCrit,
          attackResult.lifestealHeal,
        );

        set((state) => {
          const newBattleLog: Readonly<BattleLogEntry>[] = [
            ...state.battleLog,
            attackLog,
          ];

          if (battleResult) {
            newBattleLog.push(
              createVictoryLogEntry(
                getWinnerName(battleResult, newChallenger, newOpponent),
              ),
            );
          }

          // Decrement cooldowns for both cards at turn end (Requirement 9.2)
          const finalChallengerGems = state.challengerGems
            ? skillSystem.decrementCooldowns(state.challengerGems)
            : null;
          const finalOpponentGems = state.opponentGems
            ? skillSystem.decrementCooldowns(state.opponentGems)
            : null;

          return {
            challenger: newChallenger,
            opponent: newOpponent,
            arenaPhase: battleResult ? PHASE_FINISHED : PHASE_COMBAT,
            currentTurn: getNextTurn(state.currentTurn),
            battleLog: newBattleLog,
            result: battleResult,
            isAutoBattle: battleResult ? false : state.isAutoBattle,
            // Update gem states with decremented cooldowns
            challengerGems: finalChallengerGems,
            opponentGems: finalOpponentGems,
          };
        });
        return;
      }

      // Calculate normal new position (exactly 1 cell toward opponent)
      const normalNewPos = getNextPosition(currentPos, targetPos);

      // Process movement skills if mover has gems equipped (Requirements: 5.1, 8.1)
      let finalMoverPos = normalNewPos;
      let finalEnemyPos = targetPos;
      const skillLogs: Readonly<BattleLogEntry>[] = [];
      let updatedMoverGems = moverGems;

      if (moverGems && moverGems.equippedGems.length > 0) {
        // Create a mutable copy for skill processing
        const mutableMoverGems: BattleCardGems = {
          ...moverGems,
          equippedGems: moverGems.equippedGems.map((gs) => ({ ...gs })),
        };

        const movementResult = skillSystem.processMovementSkills(
          mutableMoverGems,
          currentPos,
          normalNewPos,
          targetPos,
        );

        finalMoverPos = movementResult.finalPosition;

        // Handle leap_strike knockback on enemy
        if (movementResult.enemyNewPosition !== undefined) {
          finalEnemyPos = movementResult.enemyNewPosition;
        }

        // Log skill activations (Requirements: 11.1, 11.2, 11.3)
        for (const skill of movementResult.skillsActivated) {
          let effectDescription = "";
          switch (skill.skillType) {
            case "double_move":
              effectDescription = `moves 2 cells to position ${finalMoverPos}`;
              break;
            case "leap_strike":
              effectDescription = `leaps to position ${finalMoverPos} and knocks enemy to position ${finalEnemyPos}`;
              break;
            default:
              effectDescription = `activates ${skill.skillType}`;
          }
          skillLogs.push(
            createSkillLogEntry(
              mover.name,
              skill.gemName,
              effectDescription,
              skill.skillType,
            ),
          );
        }

        // Update gem states with new cooldowns
        updatedMoverGems = mutableMoverGems;
      }

      // Create move log entry
      const moveLog = createMoveLogEntry(mover.name, currentPos, finalMoverPos);

      // Calculate new positions based on who moved
      const newLeftPos = isChallenger ? finalMoverPos : leftPosition;
      const newRightPos = isChallenger ? rightPosition : finalMoverPos;

      // Update enemy position if leap_strike knocked them back
      const finalLeftPos = isChallenger ? newLeftPos : finalEnemyPos;
      const finalRightPos = isChallenger ? finalEnemyPos : newRightPos;

      // Determine new phase based on new positions and effective ranges
      const newPhase = determinePhaseWithRange(
        finalLeftPos,
        finalRightPos,
        challenger.effectiveRange,
        opponent.effectiveRange,
      );

      // Check if now in range - will attack immediately
      const nowInRange = isInAttackRange(
        isChallenger ? finalLeftPos : finalRightPos,
        isChallenger ? finalRightPos : finalLeftPos,
        mover.effectiveRange,
      );

      if (nowInRange) {
        // Move + Attack in same turn
        const attacker = mover;
        const defender = isChallenger ? opponent : challenger;

        // Calculate attack
        const attackResult = calculateAttack(attacker, defender);

        // Create updated cards
        const updatedDefender: Readonly<BattleCard> = {
          ...defender,
          currentHp: attackResult.defenderNewHp,
        };
        const updatedAttacker: Readonly<BattleCard> = {
          ...attacker,
          currentHp: attackResult.attackerNewHp,
        };

        const newChallenger = isChallenger ? updatedAttacker : updatedDefender;
        const newOpponent = isChallenger ? updatedDefender : updatedAttacker;

        // Check battle end
        const battleResult = checkBattleEnd(newChallenger, newOpponent);

        // Create attack log
        const attackLog = createAttackLogEntry(
          attacker.name,
          defender.name,
          attackResult.damage,
          attackResult.defenderNewHp,
          attackResult.damageResult?.isCrit,
          attackResult.lifestealHeal,
        );

        set((state) => {
          const newBattleLog: Readonly<BattleLogEntry>[] = [
            ...state.battleLog,
            ...skillLogs,
            moveLog,
            attackLog,
          ];

          if (battleResult) {
            newBattleLog.push(
              createVictoryLogEntry(
                getWinnerName(battleResult, newChallenger, newOpponent),
              ),
            );
          }

          // Decrement cooldowns for both cards at turn end (Requirement 9.2)
          const updatedChallengerGems = isChallenger
            ? updatedMoverGems
            : state.challengerGems;
          const updatedOpponentGems = isChallenger
            ? state.opponentGems
            : updatedMoverGems;

          const finalChallengerGems = updatedChallengerGems
            ? skillSystem.decrementCooldowns(updatedChallengerGems)
            : null;
          const finalOpponentGems = updatedOpponentGems
            ? skillSystem.decrementCooldowns(updatedOpponentGems)
            : null;

          return {
            leftPosition: finalLeftPos,
            rightPosition: finalRightPos,
            challenger: newChallenger,
            opponent: newOpponent,
            arenaPhase: battleResult ? PHASE_FINISHED : PHASE_COMBAT,
            currentTurn: getNextTurn(state.currentTurn),
            battleLog: newBattleLog,
            result: battleResult,
            isAutoBattle: battleResult ? false : state.isAutoBattle,
            // Update gem states with decremented cooldowns
            challengerGems: finalChallengerGems,
            opponentGems: finalOpponentGems,
          };
        });
      } else {
        // Just move, no attack yet
        set((state) => {
          // Decrement cooldowns for both cards at turn end (Requirement 9.2)
          const updatedChallengerGems = isChallenger
            ? updatedMoverGems
            : state.challengerGems;
          const updatedOpponentGems = isChallenger
            ? state.opponentGems
            : updatedMoverGems;

          const finalChallengerGems = updatedChallengerGems
            ? skillSystem.decrementCooldowns(updatedChallengerGems)
            : null;
          const finalOpponentGems = updatedOpponentGems
            ? skillSystem.decrementCooldowns(updatedOpponentGems)
            : null;

          return {
            leftPosition: finalLeftPos,
            rightPosition: finalRightPos,
            arenaPhase: newPhase,
            currentTurn: getNextTurn(state.currentTurn),
            battleLog: [...state.battleLog, ...skillLogs, moveLog],
            // Update gem states with decremented cooldowns
            challengerGems: finalChallengerGems,
            opponentGems: finalOpponentGems,
          };
        });
      }
    },

    /**
     * Execute attack in combat phase
     * Property 6: Combat executes attacks correctly
     * Property 7: Battle ends when HP reaches 0
     * Property 9: Attack execution within effective range
     * Updated for Gem Skill System Requirements: 3.1, 4.1, 6.1, 7.1
     * Requirements: 3.2, 5.1, 5.2
     *
     * If attacker is not in range but we're in combat phase (because opponent is in range),
     * the attacker moves 1 step closer and passes turn.
     */
    executeAttack: (): AttackResult | null => {
      const {
        arenaPhase,
        challenger,
        opponent,
        currentTurn,
        leftPosition,
        rightPosition,
        challengerGems,
        opponentGems,
      } = get();

      // Guards
      if (arenaPhase !== PHASE_COMBAT || !challenger || !opponent) {
        return null;
      }

      const isChallenger = currentTurn === "challenger";
      const attacker = isChallenger ? challenger : opponent;
      const defender = isChallenger ? opponent : challenger;
      const attackerPos = isChallenger ? leftPosition : rightPosition;
      const defenderPos = isChallenger ? rightPosition : leftPosition;
      const attackerGems = isChallenger ? challengerGems : opponentGems;
      const defenderGems = isChallenger ? opponentGems : challengerGems;

      // If attacker is not in range, move 1 step closer and pass turn
      // This handles asymmetric range situations (e.g., one card has range 3, other has range 1)
      if (!isInAttackRange(attackerPos, defenderPos, attacker.effectiveRange)) {
        const newPos = getNextPosition(attackerPos, defenderPos);
        const moveLog = createMoveLogEntry(attacker.name, attackerPos, newPos);

        const newLeftPos = isChallenger ? newPos : leftPosition;
        const newRightPos = isChallenger ? rightPosition : newPos;

        set((state) => ({
          leftPosition: newLeftPos,
          rightPosition: newRightPos,
          currentTurn: getNextTurn(state.currentTurn),
          battleLog: [...state.battleLog, moveLog],
        }));
        return null;
      }

      // Calculate attack using existing battleService
      const attackResult = calculateAttack(attacker, defender);

      // Process combat skills if attacker has gems equipped (Requirements: 3.1, 4.1, 6.1, 7.1)
      let finalAttackerPos = attackerPos;
      let finalDefenderPos = defenderPos;
      let finalDefenderHp = attackResult.defenderNewHp;
      const skillLogs: Readonly<BattleLogEntry>[] = [];
      let updatedAttackerGems = attackerGems;
      const additionalAttackLogs: Readonly<BattleLogEntry>[] = [];

      if (attackerGems && attackerGems.equippedGems.length > 0) {
        // Create mutable copies for skill processing
        const mutableAttackerGems: BattleCardGems = {
          ...attackerGems,
          equippedGems: attackerGems.equippedGems.map((gs) => ({ ...gs })),
        };
        const mutableDefenderGems: BattleCardGems = defenderGems
          ? {
              ...defenderGems,
              equippedGems: defenderGems.equippedGems.map((gs) => ({ ...gs })),
            }
          : { cardId: defender.id, equippedGems: [] };

        // Create a performAttack callback for double_attack skill
        const performAttack = () => {
          const secondAttackResult = calculateAttack(attacker, {
            ...defender,
            currentHp: finalDefenderHp,
          });
          // Log the additional attack
          additionalAttackLogs.push(
            createAttackLogEntry(
              attacker.name,
              defender.name,
              secondAttackResult.damage,
              secondAttackResult.defenderNewHp,
              secondAttackResult.damageResult?.isCrit,
              secondAttackResult.lifestealHeal,
            ),
          );
          return secondAttackResult;
        };

        const combatResult = skillSystem.processCombatSkills(
          mutableAttackerGems,
          mutableDefenderGems,
          attackerPos,
          defenderPos,
          attackResult,
          performAttack,
        );

        finalAttackerPos = combatResult.attackerNewPosition;
        finalDefenderPos = combatResult.defenderNewPosition;
        finalDefenderHp = combatResult.defenderNewHp;

        // Log skill activations (Requirements: 11.1, 11.2, 11.3)
        for (const skill of combatResult.skillsActivated) {
          let effectDescription = "";
          switch (skill.skillType) {
            case "knockback":
              effectDescription = `knocks enemy back to position ${finalDefenderPos}`;
              break;
            case "retreat":
              effectDescription = `retreats to position ${finalAttackerPos}`;
              break;
            case "double_attack":
              effectDescription = `attacks twice!`;
              break;
            case "execute":
              effectDescription = `executes the enemy!`;
              break;
            default:
              effectDescription = `activates ${skill.skillType}`;
          }
          skillLogs.push(
            createSkillLogEntry(
              attacker.name,
              skill.gemName,
              effectDescription,
              skill.skillType,
            ),
          );
        }

        // Update gem states with new cooldowns
        updatedAttackerGems = mutableAttackerGems;
      }

      // Create updated defender with final HP
      const updatedDefender: Readonly<BattleCard> = {
        ...defender,
        currentHp: finalDefenderHp,
      };

      // Create updated attacker with lifesteal healing
      const updatedAttacker: Readonly<BattleCard> = {
        ...attacker,
        currentHp: attackResult.attackerNewHp,
      };

      // Determine new cards
      const newChallenger = isChallenger ? updatedAttacker : updatedDefender;
      const newOpponent = isChallenger ? updatedDefender : updatedAttacker;

      // Check battle end
      const battleResult = checkBattleEnd(newChallenger, newOpponent);

      // Create log entry for the initial attack
      const attackLog = createAttackLogEntry(
        attacker.name,
        defender.name,
        attackResult.damage,
        attackResult.defenderNewHp,
        attackResult.damageResult?.isCrit,
        attackResult.lifestealHeal,
      );

      // Calculate final positions
      const finalLeftPos = isChallenger ? finalAttackerPos : finalDefenderPos;
      const finalRightPos = isChallenger ? finalDefenderPos : finalAttackerPos;

      set((state) => {
        const newBattleLog: Readonly<BattleLogEntry>[] = [
          ...state.battleLog,
          attackLog,
          ...skillLogs,
          ...additionalAttackLogs,
        ];

        if (battleResult) {
          newBattleLog.push(
            createVictoryLogEntry(
              getWinnerName(battleResult, newChallenger, newOpponent),
            ),
          );
        }

        // Decrement cooldowns for both cards at turn end (Requirement 9.2)
        // First apply skill activation cooldowns, then decrement all cooldowns
        const updatedChallengerGems = isChallenger
          ? updatedAttackerGems
          : state.challengerGems;
        const updatedOpponentGems = isChallenger
          ? state.opponentGems
          : updatedAttackerGems;

        // Decrement cooldowns at turn end
        const finalChallengerGems = updatedChallengerGems
          ? skillSystem.decrementCooldowns(updatedChallengerGems)
          : null;
        const finalOpponentGems = updatedOpponentGems
          ? skillSystem.decrementCooldowns(updatedOpponentGems)
          : null;

        return {
          leftPosition: finalLeftPos,
          rightPosition: finalRightPos,
          challenger: newChallenger,
          opponent: newOpponent,
          currentTurn: getNextTurn(state.currentTurn),
          battleLog: newBattleLog,
          arenaPhase: battleResult ? PHASE_FINISHED : PHASE_COMBAT,
          result: battleResult,
          isAutoBattle: battleResult ? false : state.isAutoBattle,
          // Update gem states with decremented cooldowns
          challengerGems: finalChallengerGems,
          opponentGems: finalOpponentGems,
        };
      });

      return attackResult;
    },

    /**
     * Toggle auto-battle mode
     */
    toggleAutoBattle: (): void => {
      const { arenaPhase } = get();
      if (arenaPhase === PHASE_SETUP || arenaPhase === PHASE_FINISHED) return;
      set((state) => ({ isAutoBattle: !state.isAutoBattle }));
    },

    /**
     * Reset arena to initial state
     */
    resetArena: (): void => {
      set(createInitialState());
    },
  }),
);

// ============================================================================
// SELECTORS - Derived state
// ============================================================================

export const selectCanMove = (state: ArenaBattleState): boolean =>
  state.arenaPhase === PHASE_MOVING &&
  state.challenger !== null &&
  state.opponent !== null;

/**
 * Check if the current turn's card can move based on effective range
 * Movement is blocked when enemy is within attack range
 * Requirements: 4.1, 4.2
 */
export const selectCanMoveWithRange = (state: ArenaBattleState): boolean => {
  if (
    state.arenaPhase !== PHASE_MOVING ||
    !state.challenger ||
    !state.opponent
  ) {
    return false;
  }

  const isChallenger = state.currentTurn === "challenger";
  const moverPos = isChallenger ? state.leftPosition : state.rightPosition;
  const enemyPos = isChallenger ? state.rightPosition : state.leftPosition;
  const moverRange = isChallenger
    ? state.challenger.effectiveRange
    : state.opponent.effectiveRange;

  return canCardMove(moverPos, enemyPos, moverRange);
};

/**
 * Check if the current turn's card can attack based on effective range
 * Attack is allowed when target is within effective range
 * Requirements: 4.1, 4.2, 5.1
 */
export const selectCanAttack = (state: ArenaBattleState): boolean => {
  if (!state.challenger || !state.opponent) {
    return false;
  }

  // In combat phase, always allow attack (already verified in range)
  if (state.arenaPhase === PHASE_COMBAT) {
    return true;
  }

  // In moving phase, check if enemy is in attack range
  if (state.arenaPhase === PHASE_MOVING) {
    const isChallenger = state.currentTurn === "challenger";
    const attackerPos = isChallenger ? state.leftPosition : state.rightPosition;
    const defenderPos = isChallenger ? state.rightPosition : state.leftPosition;
    const attackerRange = isChallenger
      ? state.challenger.effectiveRange
      : state.opponent.effectiveRange;

    return isInAttackRange(attackerPos, defenderPos, attackerRange);
  }

  return false;
};

export const selectIsArenaFinished = (state: ArenaBattleState): boolean =>
  state.arenaPhase === PHASE_FINISHED;

export const selectIsInCombat = (state: ArenaBattleState): boolean =>
  state.arenaPhase === PHASE_COMBAT;

export const selectIsMoving = (state: ArenaBattleState): boolean =>
  state.arenaPhase === PHASE_MOVING;

export const selectWinner = (
  state: ArenaBattleState,
): Readonly<BattleCard> | null => {
  if (state.arenaPhase !== PHASE_FINISHED || !state.result) return null;
  return state.result === BATTLE_RESULTS.CHALLENGER_WINS
    ? state.challenger
    : state.opponent;
};

export const selectLoser = (
  state: ArenaBattleState,
): Readonly<BattleCard> | null => {
  if (state.arenaPhase !== PHASE_FINISHED || !state.result) return null;
  return state.result === BATTLE_RESULTS.CHALLENGER_WINS
    ? state.opponent
    : state.challenger;
};

export const selectChallengerInDanger = (state: ArenaBattleState): boolean =>
  state.challenger
    ? state.challenger.currentHp / state.challenger.maxHp <
      COMBAT_CONSTANTS.DANGER_THRESHOLD
    : false;

export const selectOpponentInDanger = (state: ArenaBattleState): boolean =>
  state.opponent
    ? state.opponent.currentHp / state.opponent.maxHp <
      COMBAT_CONSTANTS.DANGER_THRESHOLD
    : false;
