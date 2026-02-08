/**
 * Core types for the Chatbot Command System
 *
 * This module defines all TypeScript interfaces and types used throughout
 * the chatbot feature, including command patterns, parsing results, execution
 * results, and message structures.
 */

// Import types from other features for proper typing
import type { Card } from "../../cards/types/card";
import type { Weapon } from "../../weapons/types/weapon";
import type { Gem } from "../../gems/types/gem";
import type { BattleRecord } from "../../battle/types";

// ============================================================================
// Command Types
// ============================================================================

/**
 * All supported command types in the chatbot system
 */
export type CommandType =
  | "create_card"
  | "list_cards"
  | "show_card"
  | "delete_card"
  | "start_battle"
  | "battle_history"
  | "replay_battle"
  | "equip_weapon"
  | "unequip_weapon"
  | "equip_gem"
  | "unequip_gem"
  | "list_weapons"
  | "list_gems"
  | "show_stats"
  | "help"
  | "help_category";

/**
 * Language support for bilingual commands
 */
export type Language = "vi" | "en" | "mixed";

// ============================================================================
// Input Processing Types
// ============================================================================

/**
 * Result of input normalization
 */
export interface NormalizedInput {
  /** Original user input */
  original: string;
  /** Normalized text (lowercase, trimmed) */
  normalized: string;
  /** Detected language */
  language: Language;
  /** Tokenized words */
  tokens: string[];
}

// ============================================================================
// Pattern Matching Types
// ============================================================================

/**
 * Command pattern definition with regex and metadata
 */
export interface CommandPattern {
  /** Unique pattern identifier */
  id: string;
  /** Regular expression for matching */
  regex: RegExp;
  /** Command type this pattern maps to */
  commandType: CommandType;
  /** Priority for pattern selection (higher = more specific) */
  priority: number;
  /** Example commands in both languages */
  examples: {
    vi: string;
    en: string;
  };
}

/**
 * Result of pattern matching
 */
export interface MatchResult {
  /** Matched command type */
  commandType: CommandType;
  /** Confidence score (0-1) */
  confidence: number;
  /** Extracted parameters from regex capture groups */
  parameters: Record<string, string>;
  /** The pattern that matched */
  pattern: CommandPattern;
}

// ============================================================================
// Entity Resolution Types
// ============================================================================

/**
 * Status of entity resolution
 */
export type ResolveStatus = "exact" | "fuzzy" | "multiple" | "none";

/**
 * Result of entity name resolution
 */
export interface ResolveResult<T> {
  /** Resolution status */
  status: ResolveStatus;
  /** Resolved entity (if exact or fuzzy match) */
  entity?: T;
  /** Multiple matches (if status is "multiple" or "none" with suggestions) */
  matches?: Array<{ entity: T; score: number }>;
  /** Original query string */
  query: string;
}

// ============================================================================
// Command Execution Types
// ============================================================================

/**
 * Parsed command ready for execution
 */
export interface ParsedCommand {
  /** Command type */
  type: CommandType;
  /** Raw parameters from pattern matching */
  parameters: Record<string, unknown>;
  /** Resolved entities (cards, weapons, gems) */
  resolvedEntities: Record<string, Card | Weapon | Gem>;
  /** Command context for contextual references */
  context: CommandContext;
}

/**
 * Result of command execution
 */
export interface ExecutionResult {
  /** Whether execution succeeded */
  success: boolean;
  /** Human-readable message */
  message: string;
  /** Optional data payload */
  data?: unknown;
  /** Error message if failed */
  error?: string;
}

/**
 * Command handler function signature
 */
export type CommandHandler = (
  params: Record<string, unknown>,
  context: CommandContext,
) => Promise<ExecutionResult>;

// ============================================================================
// Context Types
// ============================================================================

/**
 * Command context for tracking conversation state
 */
export interface CommandContext {
  /** Last referenced card */
  lastCard?: Card;
  /** Last referenced weapon */
  lastWeapon?: Weapon;
  /** Last referenced gem */
  lastGem?: Gem;
  /** Last battle reference */
  lastBattle?: BattleRecord;
  /** Current conversation language */
  language: Language;

  /** Update last referenced card */
  setLastCard(card: Card): void;
  /** Update last referenced weapon */
  setLastWeapon(weapon: Weapon): void;
  /** Update last referenced gem */
  setLastGem(gem: Gem): void;
  /** Update last battle reference */
  setLastBattle(battle: BattleRecord): void;
  /** Update conversation language */
  setLanguage(lang: Language): void;
  /** Clear all context */
  clear(): void;
}

// ============================================================================
// Message Types
// ============================================================================

/**
 * Clickable suggestion for command execution
 */
export interface CommandSuggestion {
  /** Display label */
  label: string;
  /** Command to execute when clicked */
  command: string;
}

/**
 * Chat message in conversation history
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Message role (user or assistant) */
  role: "user" | "assistant";
  /** Message content */
  content: string;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Optional structured data for rich display */
  data?: unknown;
  /** Optional clickable suggestions */
  suggestions?: CommandSuggestion[];
}

// ============================================================================
// Store Types
// ============================================================================

/**
 * Chatbot store state and actions
 */
export interface ChatbotStore {
  /** Message history */
  messages: ChatMessage[];
  /** Command context */
  context: CommandContext;
  /** Processing state */
  isProcessing: boolean;

  /** Add a message to history */
  addMessage(message: ChatMessage): void;
  /** Process a user command */
  processCommand(input: string): Promise<void>;
  /** Load message history from server */
  loadMessages(): Promise<void>;
  /** Clear message history */
  clearMessages(): Promise<void>;
  /** Clear command context */
  clearContext(): void;
}

// ============================================================================
// Service Interface Types
// ============================================================================

/**
 * Input normalizer interface
 */
export interface InputNormalizer {
  /** Normalize user input */
  normalize(input: string): NormalizedInput;
}

/**
 * Pattern matcher interface
 */
export interface PatternMatcher {
  /** Match input against registered patterns */
  match(input: NormalizedInput): MatchResult | null;
}

/**
 * Entity resolver interface
 */
export interface EntityResolver {
  /** Resolve card name to card entity */
  resolveCard(name: string): Promise<ResolveResult<Card>>;
  /** Resolve weapon name to weapon entity */
  resolveWeapon(name: string): Promise<ResolveResult<Weapon>>;
  /** Resolve gem name to gem entity */
  resolveGem(name: string): Promise<ResolveResult<Gem>>;
}

/**
 * Command executor interface
 */
export interface CommandExecutor {
  /** Execute a parsed command */
  execute(command: ParsedCommand): Promise<ExecutionResult>;
}

/**
 * Response formatter interface
 */
export interface ResponseFormatter {
  /** Format successful execution result */
  formatSuccess(result: ExecutionResult, language: Language): ChatMessage;
  /** Format error message */
  formatError(error: string, language: Language): ChatMessage;
  /** Format help text */
  formatHelp(category?: string, language?: Language): ChatMessage;
  /** Format entity list */
  formatEntityList(
    entities: Array<Card | Weapon | Gem>,
    type: string,
    language: Language,
  ): ChatMessage;
}

// ============================================================================
// Entity Cache Types
// ============================================================================

/**
 * Entity cache for performance optimization
 */
export interface EntityCache {
  /** Cached cards */
  cards: Map<string, Card>;
  /** Cached weapons */
  weapons: Map<string, Weapon>;
  /** Cached gems */
  gems: Map<string, Gem>;
  /** Last cache update timestamp */
  lastUpdated: number;
  /** Cache time-to-live in milliseconds */
  ttl: number;

  /** Refresh cache from services */
  refresh(): Promise<void>;
  /** Check if cache is stale */
  isStale(): boolean;
}

// ============================================================================
// Pattern Registry Types
// ============================================================================

/**
 * Command pattern registry interface
 */
export interface CommandPatternRegistry {
  /** All registered patterns */
  patterns: CommandPattern[];

  /** Register a new pattern */
  register(pattern: CommandPattern): void;
  /** Unregister a pattern by ID */
  unregister(id: string): void;
  /** Get all patterns */
  getAll(): CommandPattern[];
  /** Get patterns by command type */
  getByType(type: CommandType): CommandPattern[];
}

// ============================================================================
// Message History Types
// ============================================================================

/**
 * Message history management
 */
export interface MessageHistory {
  /** All messages */
  messages: ChatMessage[];
  /** Maximum messages to keep */
  maxMessages: number;

  /** Add a message */
  add(message: ChatMessage): void;
  /** Clear all messages */
  clear(): void;
  /** Get recent messages */
  getRecent(count: number): ChatMessage[];
}

// ============================================================================
// UI Component Props
// ============================================================================

/**
 * Chatbot component props
 */
export interface ChatbotProps {
  /** Whether chatbot is initially open */
  initialOpen?: boolean;
  /** Position on screen */
  position?: "bottom-right" | "bottom-left";
}

/**
 * Chat message component props
 */
export interface ChatMessageProps {
  /** Message to display */
  message: ChatMessage;
}
