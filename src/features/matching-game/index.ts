/**
 * Matching Game Feature
 *
 * Mini game: Match English sentences with Vietnamese translations
 *
 * Features:
 * - Multiple game templates (e.g., "Cặp đôi trời sinh - Ẩm thực")
 * - Admin CRUD for managing game templates and sentences
 * - Player page with matching game
 * - Reward system with gems
 * - Visual effects on match/mismatch
 *
 * Usage:
 * ```tsx
 * // Admin: Manage game templates
 * <Route path="/admin/matching-game/templates" element={<GameTemplatesAdminPage />} />
 *
 * // Admin: Manage sentences for a template
 * <Route path="/admin/matching-game/templates/:templateId/sentences" element={<SentencesAdminPage />} />
 *
 * // Player: Select a game
 * <Route path="/matching-game" element={<GameSelectionPage />} />
 *
 * // Player: Play a specific game
 * <Route path="/matching-game/play/:templateId" element={<MatchingGamePage />} />
 * ```
 */

// Types
export type {
  Sentence,
  SentenceFormInput,
  SentenceDifficulty,
  SentenceFilters,
  PaginatedSentences,
  GameTemplate,
  GameTemplateFormInput,
  GameCard as GameCardType,
  GameSession,
  GameStatus,
  MatchAttempt,
  GameConfig,
  GameReward,
  GameResult,
} from "./types";

export { DEFAULT_GAME_CONFIG } from "./types";

// Services
export { SentenceService } from "./services";
export { GameTemplateService } from "./services/gameTemplateService";

// Hooks
export {
  useSentences,
  usePaginatedSentences,
  useSentence,
  useCreateSentence,
  useUpdateSentence,
  useDeleteSentence,
  useRandomSentences,
} from "./hooks";

export {
  useGameTemplates,
  useGameTemplate,
  useGameTemplatesWithCounts,
  useCreateGameTemplate,
  useUpdateGameTemplate,
  useDeleteGameTemplate,
  useToggleGameTemplateActive,
} from "./hooks/useGameTemplates";

// Store
export { useMatchingGameStore } from "./store";

// Components
export {
  GameCard,
  MatchingBoard,
  GameStats,
  GameResultModal,
  SentenceForm,
  SentenceList,
} from "./components";

export { GameTemplateForm } from "./components/GameTemplateForm";
export { GameTemplateList } from "./components/GameTemplateList";

// Pages
export { MatchingGamePage, SentencesAdminPage } from "./pages";
export { GameTemplatesAdminPage } from "./pages/GameTemplatesAdminPage";
export { GameSelectionPage } from "./pages/GameSelectionPage";
