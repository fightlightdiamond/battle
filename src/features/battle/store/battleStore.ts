/**
 * Battle Store - Zustand state management for Card Battle System
 * Requirements: 1.2, 1.3, 1.4, 1.5, 3.3, 5.4, 7.4
 */

import { create } from "zustand";
import type {
  BattleCard,
  BattleLogEntry,
  BattlePhase,
  BattleResult,
  CurrentAttacker,
  AttackResult,
} from "../types";
import {
  BATTLE_PARTICIPANTS,
  BATTLE_PHASES,
  BATTLE_RESULTS,
} from "../types/battle";
import { calculateAttack, checkBattleEnd } from "../services/battleService";
import type { Card } from "../../cards/types";

/**
 * Battle store state interface (immutable via Readonly)
 */
export interface BattleState {
  readonly phase: BattlePhase;
  readonly challenger: Readonly<BattleCard> | null;
  readonly opponent: Readonly<BattleCard> | null;
  readonly currentAttacker: CurrentAttacker;
  readonly battleLog: ReadonlyArray<Readonly<BattleLogEntry>>;
  readonly result: BattleResult;
  readonly isAutoBattle: boolean;
}

/**
 * Battle store actions interface
 */
export interface BattleActions {
  selectChallenger: (card: Card) => boolean;
  selectOpponent: (card: Card) => boolean;
  startBattle: () => void;
  executeAttack: () => AttackResult | null;
  toggleAutoBattle: () => void;
  resetBattle: () => void;
}

/**
 * Combined store interface
 */
export type BattleStoreState = BattleState & BattleActions;

/**
 * Convert a Card to a BattleCard
 */
function cardToBattleCard(card: Card): Readonly<BattleCard> {
  return {
    id: card.id,
    name: card.name,
    atk: card.atk,
    maxHp: card.hp,
    currentHp: card.hp,
    imageUrl: card.imageUrl,
  };
}

/**
 * Generate a unique ID for battle log entries
 */
function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Create a battle log entry for an attack
 */
function createAttackLogEntry(
  attackerName: string,
  defenderName: string,
  damage: number,
  defenderRemainingHp: number
): Readonly<BattleLogEntry> {
  return {
    id: generateLogId(),
    timestamp: Date.now(),
    type: "attack",
    message: `[${attackerName}] attacks [${defenderName}] for [${damage}] damage. [${defenderName}] has [${defenderRemainingHp}] HP remaining`,
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
const createInitialState = (): BattleState => ({
  phase: BATTLE_PHASES.SETUP,
  challenger: null,
  opponent: null,
  currentAttacker: BATTLE_PARTICIPANTS.CHALLENGER,
  battleLog: [],
  result: null,
  isAutoBattle: false,
});

/**
 * Helper to get attacker and defender based on current turn
 */
function getParticipants(
  currentAttacker: CurrentAttacker,
  challenger: Readonly<BattleCard>,
  opponent: Readonly<BattleCard>
) {
  const isChallengerAttacking =
    currentAttacker === BATTLE_PARTICIPANTS.CHALLENGER;
  return {
    attacker: isChallengerAttacking ? challenger : opponent,
    defender: isChallengerAttacking ? opponent : challenger,
    isChallengerAttacking,
  } as const;
}

/**
 * Compute next attacker (pure function)
 */
const getNextAttacker = (current: CurrentAttacker): CurrentAttacker =>
  current === BATTLE_PARTICIPANTS.CHALLENGER
    ? BATTLE_PARTICIPANTS.OPPONENT
    : BATTLE_PARTICIPANTS.CHALLENGER;

/**
 * Get winner name from result (pure function)
 */
const getWinnerName = (
  result: BattleResult,
  challenger: Readonly<BattleCard>,
  opponent: Readonly<BattleCard>
): string =>
  result === BATTLE_RESULTS.CHALLENGER_WINS ? challenger.name : opponent.name;

/**
 * Battle store using Zustand
 */
export const useBattleStore = create<BattleStoreState>((set, get) => ({
  ...createInitialState(),

  selectChallenger: (card: Card): boolean => {
    const { opponent } = get();
    if (opponent?.id === card.id) return false;

    const battleCard = cardToBattleCard(card);
    set((state) => ({
      challenger: battleCard,
      phase: state.opponent ? BATTLE_PHASES.READY : BATTLE_PHASES.SETUP,
    }));
    return true;
  },

  selectOpponent: (card: Card): boolean => {
    const { challenger } = get();
    if (challenger?.id === card.id) return false;

    const battleCard = cardToBattleCard(card);
    set((state) => ({
      opponent: battleCard,
      phase: state.challenger ? BATTLE_PHASES.READY : BATTLE_PHASES.SETUP,
    }));
    return true;
  },

  startBattle: (): void => {
    const { phase, challenger, opponent } = get();
    if (phase !== BATTLE_PHASES.READY || !challenger || !opponent) return;

    set({
      phase: BATTLE_PHASES.FIGHTING,
      currentAttacker: BATTLE_PARTICIPANTS.CHALLENGER,
      battleLog: [],
      result: null,
    });
  },

  executeAttack: (): AttackResult | null => {
    const { phase, challenger, opponent, currentAttacker } = get();

    // Guards
    if (phase !== BATTLE_PHASES.FIGHTING || !challenger || !opponent) {
      return null;
    }

    const { attacker, defender, isChallengerAttacking } = getParticipants(
      currentAttacker,
      challenger,
      opponent
    );

    // Calculate attack (pure)
    const attackResult = calculateAttack(attacker, defender);

    // Create updated defender (immutable spread)
    const updatedDefender: Readonly<BattleCard> = {
      ...defender,
      currentHp: attackResult.defenderNewHp,
    };

    // Determine new cards
    const newChallenger = isChallengerAttacking ? challenger : updatedDefender;
    const newOpponent = isChallengerAttacking ? updatedDefender : opponent;

    // Check battle end
    const battleResult = checkBattleEnd(newChallenger, newOpponent);

    // Create log entry
    const attackLog = createAttackLogEntry(
      attacker.name,
      defender.name,
      attackResult.damage,
      attackResult.defenderNewHp
    );

    // Update state immutably
    set((state) => {
      const newBattleLog: Readonly<BattleLogEntry>[] = [
        ...state.battleLog,
        attackLog,
      ];

      if (battleResult) {
        newBattleLog.push(
          createVictoryLogEntry(
            getWinnerName(battleResult, newChallenger, newOpponent)
          )
        );
      }

      return {
        challenger: newChallenger,
        opponent: newOpponent,
        currentAttacker: getNextAttacker(state.currentAttacker),
        battleLog: newBattleLog,
        phase: battleResult ? BATTLE_PHASES.FINISHED : BATTLE_PHASES.FIGHTING,
        result: battleResult,
        isAutoBattle: battleResult ? false : state.isAutoBattle,
      };
    });

    return attackResult;
  },

  toggleAutoBattle: (): void => {
    const { phase } = get();
    if (phase !== BATTLE_PHASES.FIGHTING) return;
    set((state) => ({ isAutoBattle: !state.isAutoBattle }));
  },

  resetBattle: (): void => {
    set(createInitialState());
  },
}));

// ============================================================================
// SELECTORS - Derived state (type-safe with Readonly)
// ============================================================================

export const selectCanStartBattle = (state: BattleState): boolean =>
  state.phase === BATTLE_PHASES.READY &&
  state.challenger !== null &&
  state.opponent !== null;

export const selectCanAttack = (state: BattleState): boolean =>
  state.phase === BATTLE_PHASES.FIGHTING &&
  state.challenger !== null &&
  state.opponent !== null;

export const selectIsBattleFinished = (state: BattleState): boolean =>
  state.phase === BATTLE_PHASES.FINISHED;

export const selectIsBattleInProgress = (state: BattleState): boolean =>
  state.phase === BATTLE_PHASES.FIGHTING;

export const selectWinner = (
  state: BattleState
): Readonly<BattleCard> | null => {
  if (state.phase !== BATTLE_PHASES.FINISHED || !state.result) return null;
  return state.result === BATTLE_RESULTS.CHALLENGER_WINS
    ? state.challenger
    : state.opponent;
};

export const selectLoser = (
  state: BattleState
): Readonly<BattleCard> | null => {
  if (state.phase !== BATTLE_PHASES.FINISHED || !state.result) return null;
  return state.result === BATTLE_RESULTS.CHALLENGER_WINS
    ? state.opponent
    : state.challenger;
};

export const selectCurrentAttackerCard = (
  state: BattleState
): Readonly<BattleCard> | null => {
  if (!state.challenger || !state.opponent) return null;
  return state.currentAttacker === BATTLE_PARTICIPANTS.CHALLENGER
    ? state.challenger
    : state.opponent;
};

export const selectCurrentDefenderCard = (
  state: BattleState
): Readonly<BattleCard> | null => {
  if (!state.challenger || !state.opponent) return null;
  return state.currentAttacker === BATTLE_PARTICIPANTS.CHALLENGER
    ? state.opponent
    : state.challenger;
};

export const selectLatestLogEntry = (
  state: BattleState
): Readonly<BattleLogEntry> | null =>
  state.battleLog.length > 0
    ? state.battleLog[state.battleLog.length - 1]
    : null;

const DANGER_THRESHOLD = 0.25;

export const selectDangerStatus = (
  state: BattleState
): Readonly<{ challengerInDanger: boolean; opponentInDanger: boolean }> => ({
  challengerInDanger: state.challenger
    ? state.challenger.currentHp / state.challenger.maxHp < DANGER_THRESHOLD
    : false,
  opponentInDanger: state.opponent
    ? state.opponent.currentHp / state.opponent.maxHp < DANGER_THRESHOLD
    : false,
});
