/**
 * Matching Game Types
 * Mini game: Match English sentences with Vietnamese translations
 */

// ============================================================================
// SENTENCE TYPES
// ============================================================================

/**
 * Sentence pair for matching game
 */
export interface Sentence {
  id: string;
  gameTemplateId: string; // Link to game template
  english: string;
  vietnamese: string;
  difficulty: SentenceDifficulty;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

export type SentenceDifficulty = "easy" | "medium" | "hard";

export interface SentenceFormInput {
  gameTemplateId?: string;
  english: string;
  vietnamese: string;
  difficulty: SentenceDifficulty;
  category?: string;
}

// ============================================================================
// GAME SESSION TYPES
// ============================================================================

/**
 * A card in the matching game board
 */
export interface GameCard {
  id: string;
  sentenceId: string;
  content: string;
  type: "english" | "vietnamese";
  isMatched: boolean;
  isSelected: boolean;
  isWrong: boolean;
}

/**
 * Match attempt result
 */
export interface MatchAttempt {
  card1Id: string;
  card2Id: string;
  isCorrect: boolean;
  timestamp: number;
}

/**
 * Game session state
 */
export interface GameSession {
  id: string;
  sentences: Sentence[];
  cards: GameCard[];
  matchedPairs: number;
  totalPairs: number;
  attempts: MatchAttempt[];
  startTime: number;
  endTime?: number;
  score: number;
  status: GameStatus;
}

export type GameStatus = "idle" | "playing" | "paused" | "completed";

// ============================================================================
// REWARD TYPES
// ============================================================================

export interface GameReward {
  gems: number;
  bonusGems: number; // Extra for perfect score, speed bonus, etc.
  message: string;
}

export interface GameResult {
  session: GameSession;
  reward: GameReward;
  accuracy: number; // Percentage of correct matches
  timeSpent: number; // In seconds
  isPerfect: boolean; // No wrong attempts
}

// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface GameConfig {
  pairsPerRound: number;
  timeLimit: number; // In seconds
  difficulty?: SentenceDifficulty | "mixed";
  showHints?: boolean;
  allowRetry?: boolean;
  shuffleCards?: boolean;
  baseReward?: number;
  perfectBonus?: number;
  speedBonusThreshold?: number; // Seconds to get speed bonus
  speedBonus?: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  pairsPerRound: 6,
  timeLimit: 120,
  difficulty: "mixed",
  showHints: true,
  allowRetry: true,
  shuffleCards: true,
  baseReward: 10,
  perfectBonus: 20,
  speedBonusThreshold: 60,
  speedBonus: 10,
};

// ============================================================================
// API TYPES
// ============================================================================

export interface SentenceFilters {
  gameTemplateId?: string;
  difficulty?: SentenceDifficulty;
  category?: string;
  search?: string;
}

export interface PaginatedSentences {
  data: Sentence[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// GAME TEMPLATE TYPES
// ============================================================================

/**
 * Game Template - Defines a specific matching game instance
 * Each template has its own name, description, sentences, and config
 */
export interface GameTemplate {
  id: string;
  name: string; // e.g. "Cặp đôi trời sinh - Ẩm thực"
  description?: string;
  coverImage?: string;
  config: GameConfig;
  isActive: boolean;
  sentenceCount?: number; // Computed from sentences
  createdAt: number;
  updatedAt: number;
}

export interface GameTemplateFormInput {
  name: string;
  description?: string;
  coverImage?: string;
  config: GameConfig;
  isActive: boolean;
}
