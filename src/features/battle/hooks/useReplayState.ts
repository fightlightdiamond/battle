/**
 * useReplayState Hook
 *
 * Manages replay state for battle replay player including:
 * - Current turn tracking
 * - Play/pause state
 * - Speed control (1x, 2x, 4x)
 * - Turn progression timing
 *
 * Requirements: 6.1, 6.4, 6.5
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { BattleRecord, TurnRecord } from "../types/battleHistoryTypes";

/** Supported replay speeds */
export type ReplaySpeed = 1 | 2 | 4;

/** Base delay between turns in milliseconds (at 1x speed) */
const BASE_TURN_DELAY = 4500;

/**
 * Replay state interface
 *
 * Requirements: 6.1, 6.4, 6.5
 */
export interface ReplayState {
  /** Whether replay is currently playing */
  isPlaying: boolean;
  /** Current turn number (0 = initial state, 1+ = turn records) */
  currentTurn: number;
  /** Playback speed multiplier */
  speed: ReplaySpeed;
  /** Current challenger HP based on timeline */
  challengerHp: number;
  /** Current opponent HP based on timeline */
  opponentHp: number;
  /** Whether replay has completed */
  isComplete: boolean;
}

/**
 * Replay controls interface
 *
 * Requirements: 6.4, 6.5
 */
export interface ReplayControls {
  /** Start or resume playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Reset to beginning */
  reset: () => void;
  /** Set playback speed */
  setSpeed: (speed: ReplaySpeed) => void;
  /** Jump to specific turn */
  goToTurn: (turn: number) => void;
  /** Advance to next turn manually */
  nextTurn: () => void;
  /** Go back to previous turn */
  prevTurn: () => void;
}

/**
 * Hook return type
 */
export interface UseReplayStateReturn {
  state: ReplayState;
  controls: ReplayControls;
  /** Current turn record (null if at initial state) */
  currentTurnRecord: TurnRecord | null;
  /** Total number of turns */
  totalTurns: number;
}

/**
 * useReplayState Hook
 *
 * Manages battle replay state and provides controls for playback.
 *
 * @param battleRecord - The battle record to replay
 * @param onComplete - Optional callback when replay finishes
 * @returns Replay state and controls
 *
 * Requirements: 6.1, 6.4, 6.5
 */
export function useReplayState(
  battleRecord: BattleRecord,
  onComplete?: () => void
): UseReplayStateReturn {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);

  // Refs for timer management
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Derived state
  const totalTurns = battleRecord.totalTurns;
  const isComplete = currentTurn >= totalTurns;

  // Get HP values from timeline
  const getHpAtTurn = useCallback(
    (turn: number) => {
      const timelineEntry = battleRecord.hpTimeline.find(
        (entry) => entry.turnNumber === turn
      );
      if (timelineEntry) {
        return {
          challengerHp: timelineEntry.challengerHp,
          opponentHp: timelineEntry.opponentHp,
        };
      }
      // Fallback to initial state
      return {
        challengerHp: battleRecord.challenger.maxHp,
        opponentHp: battleRecord.opponent.maxHp,
      };
    },
    [battleRecord]
  );

  const { challengerHp, opponentHp } = getHpAtTurn(currentTurn);

  // Get current turn record
  const currentTurnRecord =
    currentTurn > 0 ? battleRecord.turns[currentTurn - 1] ?? null : null;

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Handle auto-progression when playing
  useEffect(() => {
    if (!isPlaying || isComplete) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const delay = BASE_TURN_DELAY / speed;

    timerRef.current = setTimeout(() => {
      setCurrentTurn((prev) => {
        const next = prev + 1;
        if (next >= totalTurns) {
          setIsPlaying(false);
          onCompleteRef.current?.();
          return totalTurns;
        }
        return next;
      });
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentTurn, speed, totalTurns, isComplete]);

  // Controls
  const play = useCallback(() => {
    if (isComplete) {
      // Reset and play from beginning if complete
      setCurrentTurn(0);
    }
    setIsPlaying(true);
  }, [isComplete]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTurn(0);
  }, []);

  const handleSetSpeed = useCallback((newSpeed: ReplaySpeed) => {
    setSpeed(newSpeed);
  }, []);

  const goToTurn = useCallback(
    (turn: number) => {
      const clampedTurn = Math.max(0, Math.min(turn, totalTurns));
      setCurrentTurn(clampedTurn);
      if (clampedTurn >= totalTurns) {
        setIsPlaying(false);
      }
    },
    [totalTurns]
  );

  const nextTurn = useCallback(() => {
    if (currentTurn < totalTurns) {
      setCurrentTurn((prev) => prev + 1);
    }
  }, [currentTurn, totalTurns]);

  const prevTurn = useCallback(() => {
    if (currentTurn > 0) {
      setCurrentTurn((prev) => prev - 1);
    }
  }, [currentTurn]);

  return {
    state: {
      isPlaying,
      currentTurn,
      speed,
      challengerHp,
      opponentHp,
      isComplete,
    },
    controls: {
      play,
      pause,
      reset,
      setSpeed: handleSetSpeed,
      goToTurn,
      nextTurn,
      prevTurn,
    },
    currentTurnRecord,
    totalTurns,
  };
}
