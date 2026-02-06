/**
 * Matching Game Store - Zustand store for game state
 */

import { create } from "zustand";
import type {
  Sentence,
  GameCard,
  GameSession,
  MatchAttempt,
  GameConfig,
  GameReward,
  GameResult,
} from "../types";

interface MatchingGameState {
  // Session
  session: GameSession | null;
  config: GameConfig;

  // Selection
  selectedCards: string[];

  // Timer
  elapsedTime: number;
  timerInterval: ReturnType<typeof setInterval> | null;

  // Actions
  startGame: (sentences: Sentence[], config?: Partial<GameConfig>) => void;
  selectCard: (cardId: string) => void;
  resetSelection: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => GameResult | null;
  resetGame: () => void;

  // Timer actions
  startTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create game cards from sentences
 */
function createGameCards(sentences: Sentence[]): GameCard[] {
  const cards: GameCard[] = [];

  sentences.forEach((sentence) => {
    // English card
    cards.push({
      id: `${sentence.id}-en`,
      sentenceId: sentence.id,
      content: sentence.english,
      type: "english",
      isMatched: false,
      isSelected: false,
      isWrong: false,
    });

    // Vietnamese card
    cards.push({
      id: `${sentence.id}-vi`,
      sentenceId: sentence.id,
      content: sentence.vietnamese,
      type: "vietnamese",
      isMatched: false,
      isSelected: false,
      isWrong: false,
    });
  });

  return shuffleArray(cards);
}

/**
 * Calculate reward based on game result
 */
function calculateReward(
  session: GameSession,
  config: GameConfig,
  elapsedTime: number,
): GameReward {
  const wrongAttempts = session.attempts.filter((a) => !a.isCorrect).length;
  const isPerfect = wrongAttempts === 0;

  let bonusGems = 0;
  const messages: string[] = [];

  // Perfect bonus
  if (isPerfect && config.perfectBonus) {
    bonusGems += config.perfectBonus;
    messages.push("Perfect! No mistakes!");
  }

  // Speed bonus
  if (
    config.speedBonusThreshold &&
    elapsedTime <= config.speedBonusThreshold &&
    config.speedBonus
  ) {
    bonusGems += config.speedBonus;
    messages.push(`Speed bonus! Finished in ${elapsedTime}s`);
  }

  const gems = config.baseReward ?? 10;
  const message = messages.length > 0 ? messages.join(" ") : "Good job!";

  return { gems, bonusGems, message };
}

const defaultConfig: GameConfig = {
  pairsPerRound: 6,
  timeLimit: 120,
  difficulty: "mixed",
  baseReward: 10,
  perfectBonus: 20,
  speedBonusThreshold: 60,
  speedBonus: 10,
};

export const useMatchingGameStore = create<MatchingGameState>((set, get) => ({
  session: null,
  config: defaultConfig,
  selectedCards: [],
  elapsedTime: 0,
  timerInterval: null,

  startGame: (sentences, configOverrides) => {
    const config = { ...defaultConfig, ...configOverrides };
    const cards = createGameCards(sentences);

    const session: GameSession = {
      id: crypto.randomUUID(),
      sentences,
      cards,
      matchedPairs: 0,
      totalPairs: sentences.length,
      attempts: [],
      startTime: Date.now(),
      score: 0,
      status: "playing",
    };

    set({ session, config, selectedCards: [], elapsedTime: 0 });
    get().startTimer();
  },

  selectCard: (cardId) => {
    const { session, selectedCards } = get();
    if (!session || session.status !== "playing") return;

    const card = session.cards.find((c) => c.id === cardId);
    if (!card || card.isMatched || card.isSelected) return;

    // Update card selection
    const updatedCards = session.cards.map((c) =>
      c.id === cardId ? { ...c, isSelected: true, isWrong: false } : c,
    );

    const newSelectedCards = [...selectedCards, cardId];

    // Check if two cards selected
    if (newSelectedCards.length === 2) {
      const [firstId, secondId] = newSelectedCards;
      const firstCard = updatedCards.find((c) => c.id === firstId)!;
      const secondCard = updatedCards.find((c) => c.id === secondId)!;

      const isMatch =
        firstCard.sentenceId === secondCard.sentenceId &&
        firstCard.type !== secondCard.type;

      const attempt: MatchAttempt = {
        card1Id: firstId,
        card2Id: secondId,
        isCorrect: isMatch,
        timestamp: Date.now(),
      };

      if (isMatch) {
        // Mark as matched
        const matchedCards = updatedCards.map((c) =>
          c.sentenceId === firstCard.sentenceId
            ? { ...c, isMatched: true, isSelected: false }
            : c,
        );

        const newMatchedPairs = session.matchedPairs + 1;
        const isComplete = newMatchedPairs === session.totalPairs;

        set({
          session: {
            ...session,
            cards: matchedCards,
            matchedPairs: newMatchedPairs,
            attempts: [...session.attempts, attempt],
            status: isComplete ? "completed" : "playing",
            endTime: isComplete ? Date.now() : undefined,
          },
          selectedCards: [],
        });

        if (isComplete) {
          get().stopTimer();
        }
      } else {
        // Mark as wrong temporarily
        const wrongCards = updatedCards.map((c) =>
          c.id === firstId || c.id === secondId
            ? { ...c, isWrong: true, isSelected: true }
            : c,
        );

        set({
          session: {
            ...session,
            cards: wrongCards,
            attempts: [...session.attempts, attempt],
          },
          selectedCards: [],
        });

        // Reset wrong cards after delay
        setTimeout(() => {
          const { session: currentSession } = get();
          if (!currentSession) return;

          const resetCards = currentSession.cards.map((c) =>
            c.id === firstId || c.id === secondId
              ? { ...c, isWrong: false, isSelected: false }
              : c,
          );

          set({
            session: { ...currentSession, cards: resetCards },
          });
        }, 800);
      }
    } else {
      set({
        session: { ...session, cards: updatedCards },
        selectedCards: newSelectedCards,
      });
    }
  },

  resetSelection: () => {
    const { session } = get();
    if (!session) return;

    const resetCards = session.cards.map((c) => ({
      ...c,
      isSelected: false,
      isWrong: false,
    }));

    set({
      session: { ...session, cards: resetCards },
      selectedCards: [],
    });
  },

  pauseGame: () => {
    const { session } = get();
    if (!session || session.status !== "playing") return;

    get().stopTimer();
    set({ session: { ...session, status: "paused" } });
  },

  resumeGame: () => {
    const { session } = get();
    if (!session || session.status !== "paused") return;

    set({ session: { ...session, status: "playing" } });
    get().startTimer();
  },

  endGame: () => {
    const { session, config, elapsedTime } = get();
    if (!session) return null;

    get().stopTimer();

    const reward = calculateReward(session, config, elapsedTime);
    const wrongAttempts = session.attempts.filter((a) => !a.isCorrect).length;
    const totalAttempts = session.attempts.length;
    const accuracy =
      totalAttempts > 0
        ? Math.round((session.matchedPairs / totalAttempts) * 100)
        : 0;

    const result: GameResult = {
      session: { ...session, status: "completed", endTime: Date.now() },
      reward,
      accuracy,
      timeSpent: elapsedTime,
      isPerfect: wrongAttempts === 0,
    };

    set({
      session: { ...session, status: "completed", endTime: Date.now() },
    });

    return result;
  },

  resetGame: () => {
    get().stopTimer();
    set({
      session: null,
      selectedCards: [],
      elapsedTime: 0,
    });
  },

  startTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) return;

    const interval = setInterval(() => {
      get().tick();
    }, 1000);

    set({ timerInterval: interval });
  },

  stopTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
      set({ timerInterval: null });
    }
  },

  tick: () => {
    const { session, config, elapsedTime } = get();
    if (!session || session.status !== "playing") return;

    const newTime = elapsedTime + 1;

    // Check time limit
    if (config.timeLimit && newTime >= config.timeLimit) {
      get().endGame();
      return;
    }

    set({ elapsedTime: newTime });
  },
}));
