/**
 * Arena Battle Store - Zustand state management for Arena Mode battles
 * Requirements: 2.2, 2.3, 3.1, 3.2, 3.4, 4.1, 4.2
 */

import { create } from "zustand";
import type {
  BattleCard,
  BattleLogEntry,
  BattleResult,
  AttackResult,
} from "../types";
import { BATTLE_RESULTS, COMBAT_CONSTANTS } from "../types/battle";
import { calculateAttack, checkBattleEnd } from "../services/battleService";
import type { CellIndex, ArenaPhase } from "../../arena1d/types/arena";
import {
  LEFT_BOUNDARY_INDEX,
  RIGHT_BOUNDARY_INDEX,
  PHASE_SETUP,
  PHASE_MOVING,
  PHASE_COMBAT,
  PHASE_FINISHED,
} from "../../arena1d/types/arena";

/**
 * Arena Battle store state interface
 */
export interface ArenaBattleState {
  readonly challenger: Readonly<BattleCard> | null;
  readonly opponent: Readonly<BattleCard> | null;
  readonly leftPosition: CellIndex;
  readonly rightPosition: CellIndex;
  readonly arenaPhase: ArenaPhase;
  readonly currentTurn: "challenger" | "opponent";
  readonly battleLog: ReadonlyArray<Readonly<BattleLogEntry>>;
  readonly result: BattleResult;
  readonly isAutoBattle: boolean;
}

/**
 * Arena Battle store actions interface
 */
export interface ArenaBattleActions {
  initArena: (challenger: BattleCard, opponent: BattleCard) => void;
  executeMove: () => void;
  executeAttack: () => AttackResult | null;
  toggleAutoBattle: () => void;
  resetArena: () => void;
}

/**
 * Combined store interface
 */
export type ArenaBattleStoreState = ArenaBattleState & ArenaBattleActions;

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
 * Determine arena phase based on distance
 * Property 3: Phase determination by distance
 * - distance > 1 → 'moving'
 * - distance = 1 → 'combat'
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
 * Initial state factory
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
     */
    initArena: (challenger: BattleCard, opponent: BattleCard): void => {
      const leftPos = LEFT_BOUNDARY_INDEX as CellIndex;
      const rightPos = RIGHT_BOUNDARY_INDEX as CellIndex;
      const phase = determinePhase(leftPos, rightPos);

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
      });
    },

    /**
     * Execute movement for current turn's card
     * Property 4: Movement is exactly 1 cell toward opponent
     * Property 5: Turn alternates after movement
     * NEW: If adjacent after move, immediately attack in same turn
     */
    executeMove: (): void => {
      const {
        arenaPhase,
        challenger,
        opponent,
        currentTurn,
        leftPosition,
        rightPosition,
      } = get();

      // Guards
      if (arenaPhase !== PHASE_MOVING || !challenger || !opponent) {
        return;
      }

      const isChallenger = currentTurn === "challenger";
      const currentPos = isChallenger ? leftPosition : rightPosition;
      const targetPos = isChallenger ? rightPosition : leftPosition;
      const mover = isChallenger ? challenger : opponent;

      // Calculate new position (exactly 1 cell toward opponent)
      const newPos = getNextPosition(currentPos, targetPos);

      // Create log entry
      const moveLog = createMoveLogEntry(mover.name, currentPos, newPos);

      // Calculate new positions
      const newLeftPos = isChallenger ? newPos : leftPosition;
      const newRightPos = isChallenger ? rightPosition : newPos;

      // Determine new phase based on new positions
      const newPhase = determinePhase(newLeftPos, newRightPos);

      // Check if now adjacent - will attack immediately
      const nowAdjacent = areAdjacent(newLeftPos, newRightPos);

      if (nowAdjacent) {
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

          return {
            leftPosition: newLeftPos,
            rightPosition: newRightPos,
            challenger: newChallenger,
            opponent: newOpponent,
            arenaPhase: battleResult ? PHASE_FINISHED : PHASE_COMBAT,
            currentTurn: getNextTurn(state.currentTurn),
            battleLog: newBattleLog,
            result: battleResult,
            isAutoBattle: battleResult ? false : state.isAutoBattle,
          };
        });
      } else {
        // Just move, no attack yet
        set((state) => ({
          leftPosition: newLeftPos,
          rightPosition: newRightPos,
          arenaPhase: newPhase,
          currentTurn: getNextTurn(state.currentTurn),
          battleLog: [...state.battleLog, moveLog],
        }));
      }
    },

    /**
     * Execute attack in combat phase
     * Property 6: Combat executes attacks correctly
     * Property 7: Battle ends when HP reaches 0
     */
    executeAttack: (): AttackResult | null => {
      const { arenaPhase, challenger, opponent, currentTurn } = get();

      // Guards
      if (arenaPhase !== PHASE_COMBAT || !challenger || !opponent) {
        return null;
      }

      const isChallenger = currentTurn === "challenger";
      const attacker = isChallenger ? challenger : opponent;
      const defender = isChallenger ? opponent : challenger;

      // Calculate attack using existing battleService
      const attackResult = calculateAttack(attacker, defender);

      // Create updated defender with new HP
      const updatedDefender: Readonly<BattleCard> = {
        ...defender,
        currentHp: attackResult.defenderNewHp,
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

      // Create log entry
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

        return {
          challenger: newChallenger,
          opponent: newOpponent,
          currentTurn: getNextTurn(state.currentTurn),
          battleLog: newBattleLog,
          arenaPhase: battleResult ? PHASE_FINISHED : PHASE_COMBAT,
          result: battleResult,
          isAutoBattle: battleResult ? false : state.isAutoBattle,
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

export const selectCanAttack = (state: ArenaBattleState): boolean =>
  state.arenaPhase === PHASE_COMBAT &&
  state.challenger !== null &&
  state.opponent !== null;

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
