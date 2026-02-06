# Design Document: Chatbot Command System

## Overview

The Chatbot Command System provides a conversational interface for the game application using rule-based NLP techniques. The system processes natural language input in Vietnamese and English, matches commands against patterns, resolves entity references with fuzzy matching, and executes actions through existing game services.

The architecture follows a pipeline approach: Input Normalization → Pattern Matching → Entity Resolution → Command Execution → Response Formatting. This design emphasizes simplicity, maintainability, and extensibility while avoiding AI-based solutions in favor of deterministic rule-based processing.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Chatbot UI Component                    │
│                    (Input + Message Display)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Command Parser Pipeline                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Normalizer   │→ │   Pattern    │→ │   Entity     │     │
│  │              │  │   Matcher    │  │  Resolver    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Command Executor                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Command    │→ │   Service    │→ │  Response    │     │
│  │   Handlers   │  │   Calls      │  │  Formatter   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Game Services Layer                       │
│  CardService │ BattleService │ EquipmentService │ etc.      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Fuzzy Matching**: Fuse.js (lightweight, no dependencies, excellent for entity name matching)
- **String Similarity**: string-similarity (for typo tolerance)
- **Pattern Matching**: Custom regex-based patterns with named capture groups
- **State Management**: Zustand store for command context
- **UI**: React component integrated into existing layout

### Design Principles

1. **Rule-Based Processing**: No AI/ML models, only deterministic pattern matching
2. **Service Integration**: Reuse all existing game services without modification
3. **Bilingual Support**: Equal support for Vietnamese and English
4. **Graceful Degradation**: Helpful error messages when commands fail
5. **Context Awareness**: Remember recent entities for follow-up commands

## Components and Interfaces

### 1. Input Normalizer

**Purpose**: Preprocess user input for consistent parsing

**Interface**:

```typescript
interface InputNormalizer {
  normalize(input: string): NormalizedInput;
}

interface NormalizedInput {
  original: string;
  normalized: string; // lowercase, trimmed
  language: "vi" | "en" | "mixed";
  tokens: string[]; // split by whitespace
}
```

**Responsibilities**:

- Convert to lowercase
- Trim whitespace
- Detect language (Vietnamese vs English)
- Tokenize into words
- Preserve diacritics for Vietnamese

### 2. Pattern Matcher

**Purpose**: Match normalized input against command patterns

**Interface**:

```typescript
interface PatternMatcher {
  match(input: NormalizedInput): MatchResult | null;
}

interface MatchResult {
  commandType: CommandType;
  confidence: number;
  parameters: Record<string, string>;
  pattern: CommandPattern;
}

interface CommandPattern {
  id: string;
  regex: RegExp;
  commandType: CommandType;
  priority: number;
  examples: { vi: string; en: string };
}

type CommandType =
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
```

**Pattern Examples**:

```typescript
const patterns: CommandPattern[] = [
  {
    id: "create_card",
    regex: /^(?:create|make|add|tạo|thêm)\s+(?:card|thẻ)\s+(.+)$/i,
    commandType: "create_card",
    priority: 10,
    examples: {
      en: "create card Dragon",
      vi: "tạo thẻ Rồng Lửa",
    },
  },
  {
    id: "start_battle",
    regex:
      /^(?:battle|fight|trận đấu|đánh)\s+(.+?)\s+(?:vs|versus|against|với)\s+(.+)$/i,
    commandType: "start_battle",
    priority: 10,
    examples: {
      en: "battle Dragon vs Phoenix",
      vi: "trận đấu Rồng vs Phượng",
    },
  },
  {
    id: "equip_weapon",
    regex: /^(?:equip|trang bị)\s+(?:weapon\s+)?(.+?)\s+(?:to|on|cho)\s+(.+)$/i,
    commandType: "equip_weapon",
    priority: 10,
    examples: {
      en: "equip Fire Sword to Dragon",
      vi: "trang bị Kiếm Lửa cho Rồng",
    },
  },
];
```

**Responsibilities**:

- Match input against all registered patterns
- Extract parameters using named capture groups
- Select best match based on priority and specificity
- Handle command synonyms

### 3. Entity Resolver

**Purpose**: Resolve entity names to IDs using fuzzy matching

**Interface**:

```typescript
interface EntityResolver {
  resolveCard(name: string): Promise<ResolveResult<Card>>;
  resolveWeapon(name: string): Promise<ResolveResult<Weapon>>;
  resolveGem(name: string): Promise<ResolveResult<Gem>>;
}

interface ResolveResult<T> {
  status: "exact" | "fuzzy" | "multiple" | "none";
  entity?: T;
  matches?: Array<{ entity: T; score: number }>;
  query: string;
}
```

**Fuzzy Matching Configuration**:

```typescript
const fuseOptions = {
  keys: ["name"],
  threshold: 0.3, // Lower = stricter (0.3 means 70% similarity required)
  distance: 100,
  includeScore: true,
  minMatchCharLength: 2,
};
```

**Resolution Logic**:

1. Try exact match (case-insensitive)
2. If no exact match, use Fuse.js fuzzy search
3. If single match with score > 0.7, return as fuzzy match
4. If multiple matches with score > 0.7, return as multiple
5. If no matches > 0.7, return top 3 as suggestions

**Responsibilities**:

- Load entities from services
- Perform fuzzy matching with Fuse.js
- Handle exact vs fuzzy vs multiple matches
- Cache entity lists for performance

### 4. Command Executor

**Purpose**: Execute commands by calling game services

**Interface**:

```typescript
interface CommandExecutor {
  execute(command: ParsedCommand): Promise<ExecutionResult>;
}

interface ParsedCommand {
  type: CommandType;
  parameters: Record<string, any>;
  resolvedEntities: Record<string, any>;
  context: CommandContext;
}

interface ExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
```

**Command Handlers**:

```typescript
type CommandHandler = (
  params: Record<string, any>,
  context: CommandContext,
) => Promise<ExecutionResult>;

const handlers: Record<CommandType, CommandHandler> = {
  create_card: async (params, context) => {
    const card = await CardService.create({
      name: params.cardName,
      ...DEFAULT_CARD_STATS,
    });
    context.setLastCard(card);
    return {
      success: true,
      message: `Created card "${card.name}" (ID: ${card.id})`,
      data: card,
    };
  },

  start_battle: async (params, context) => {
    const { card1, card2 } = params;
    const battleCard1 =
      await battleService.cardToBattleCardWithEquipment(card1);
    const battleCard2 =
      await battleService.cardToBattleCardWithEquipment(card2);

    // Initialize battle through battle store
    useBattleStore.getState().initializeBattle(battleCard1, battleCard2);

    return {
      success: true,
      message: `Battle started: ${card1.name} vs ${card2.name}`,
      data: { card1, card2 },
    };
  },

  equip_weapon: async (params, context) => {
    const { weapon, card } = params;
    await EquipmentService.equipWeapon(card.id, weapon.id);
    return {
      success: true,
      message: `Equipped ${weapon.name} to ${card.name}`,
      data: { weapon, card },
    };
  },
};
```

**Responsibilities**:

- Map command types to handler functions
- Call appropriate game services
- Handle service errors gracefully
- Update command context with results

### 5. Response Formatter

**Purpose**: Format execution results for user display

**Interface**:

```typescript
interface ResponseFormatter {
  formatSuccess(result: ExecutionResult, language: Language): ChatMessage;
  formatError(error: string, language: Language): ChatMessage;
  formatHelp(category?: string, language?: Language): ChatMessage;
  formatEntityList(
    entities: any[],
    type: string,
    language: Language,
  ): ChatMessage;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  data?: any; // Structured data for rich display
}

type Language = "vi" | "en";
```

**Message Templates**:

```typescript
const templates = {
  success: {
    create_card: {
      en: 'Created card "{name}" (ID: {id})',
      vi: 'Đã tạo thẻ "{name}" (ID: {id})',
    },
    start_battle: {
      en: "Battle started: {card1} vs {card2}",
      vi: "Trận đấu bắt đầu: {card1} vs {card2}",
    },
    equip_weapon: {
      en: "Equipped {weapon} to {card}",
      vi: "Đã trang bị {weapon} cho {card}",
    },
  },
  error: {
    entity_not_found: {
      en: 'Could not find {type} "{name}". Did you mean: {suggestions}?',
      vi: 'Không tìm thấy {type} "{name}". Ý bạn là: {suggestions}?',
    },
    command_not_recognized: {
      en: 'I didn\'t understand that command. Type "help" for available commands.',
      vi: 'Tôi không hiểu lệnh đó. Gõ "help" để xem các lệnh có sẵn.',
    },
  },
};
```

**Responsibilities**:

- Format success messages with data interpolation
- Format error messages with suggestions
- Generate help text with examples
- Support bilingual output

### 6. Command Context Store

**Purpose**: Track conversation context for follow-up commands

**Interface**:

```typescript
interface CommandContext {
  lastCard?: Card;
  lastWeapon?: Weapon;
  lastGem?: Gem;
  lastBattle?: BattleRecord;
  language: Language;

  setLastCard(card: Card): void;
  setLastWeapon(weapon: Weapon): void;
  setLastGem(gem: Gem): void;
  setLastBattle(battle: BattleRecord): void;
  setLanguage(lang: Language): void;
  clear(): void;
}
```

**Zustand Store**:

```typescript
interface ChatbotStore {
  messages: ChatMessage[];
  context: CommandContext;
  isProcessing: boolean;

  addMessage(message: ChatMessage): void;
  processCommand(input: string): Promise<void>;
  clearMessages(): void;
  clearContext(): void;
}

const useChatbotStore = create<ChatbotStore>((set, get) => ({
  messages: [],
  context: {
    language: "en",
  },
  isProcessing: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  processCommand: async (input) => {
    // Pipeline execution
    set({ isProcessing: true });
    try {
      const normalized = normalizer.normalize(input);
      const match = patternMatcher.match(normalized);

      if (!match) {
        // Handle unrecognized command
        return;
      }

      // Resolve entities
      const resolved = await resolveEntities(match.parameters);

      // Execute command
      const result = await executor.execute({
        type: match.commandType,
        parameters: match.parameters,
        resolvedEntities: resolved,
        context: get().context,
      });

      // Format and add response
      const response = formatter.formatSuccess(result, normalized.language);
      get().addMessage(response);
    } finally {
      set({ isProcessing: false });
    }
  },
}));
```

**Responsibilities**:

- Store conversation history
- Track last referenced entities
- Manage processing state
- Provide context to command handlers

### 7. Chatbot UI Component

**Purpose**: User interface for chatbot interaction

**Interface**:

```typescript
interface ChatbotProps {
  initialOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

const Chatbot: React.FC<ChatbotProps> = ({ initialOpen, position }) => {
  const { messages, isProcessing, processCommand } = useChatbotStore();
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    // Add user message
    useChatbotStore.getState().addMessage({
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    });

    // Process command
    await processCommand(input);
    setInput('');
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command..."
          disabled={isProcessing}
        />
        <button type="submit" disabled={isProcessing}>
          Send
        </button>
      </form>
    </div>
  );
};
```

**Features**:

- Message history display
- Input field with submit
- Loading state during processing
- Collapsible/expandable panel
- Keyboard shortcuts (Enter to send)

## Data Models

### Command Pattern Registry

```typescript
interface CommandPatternRegistry {
  patterns: CommandPattern[];

  register(pattern: CommandPattern): void;
  unregister(id: string): void;
  getAll(): CommandPattern[];
  getByType(type: CommandType): CommandPattern[];
}

// Singleton instance
const patternRegistry = createPatternRegistry();

// Register all patterns at initialization
patternRegistry.register({
  id: "create_card",
  regex: /^(?:create|make|add|tạo|thêm)\s+(?:card|thẻ)\s+(.+)$/i,
  commandType: "create_card",
  priority: 10,
  examples: { en: "create card Dragon", vi: "tạo thẻ Rồng" },
});

// ... register all other patterns
```

### Entity Cache

```typescript
interface EntityCache {
  cards: Map<string, Card>;
  weapons: Map<string, Weapon>;
  gems: Map<string, Gem>;
  lastUpdated: number;
  ttl: number; // Time to live in ms

  refresh(): Promise<void>;
  isStale(): boolean;
}

const entityCache: EntityCache = {
  cards: new Map(),
  weapons: new Map(),
  gems: new Map(),
  lastUpdated: 0,
  ttl: 60000, // 1 minute

  async refresh() {
    const [cards, weapons, gems] = await Promise.all([
      CardService.getAll(),
      WeaponService.getAll(),
      GemService.getAll(),
    ]);

    this.cards = new Map(cards.map((c) => [c.id, c]));
    this.weapons = new Map(weapons.map((w) => [w.id, w]));
    this.gems = new Map(gems.map((g) => [g.id, g]));
    this.lastUpdated = Date.now();
  },

  isStale() {
    return Date.now() - this.lastUpdated > this.ttl;
  },
};
```

### Message History

```typescript
interface MessageHistory {
  messages: ChatMessage[];
  maxMessages: number;

  add(message: ChatMessage): void;
  clear(): void;
  getRecent(count: number): ChatMessage[];
}

const messageHistory: MessageHistory = {
  messages: [],
  maxMessages: 100,

  add(message) {
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  },

  clear() {
    this.messages = [];
  },

  getRecent(count) {
    return this.messages.slice(-count);
  },
};
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Input Normalization Preserves Content

_For any_ input string, normalizing it should produce lowercase text with no leading/trailing whitespace while preserving Vietnamese diacritics and accepting both Vietnamese and English characters.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Input Length Validation

_For any_ input string exceeding 500 characters, the system should reject it with a length limit message.

**Validates: Requirements 1.5**

### Property 3: Pattern Matching Extracts Command Type

_For any_ input that matches a registered command pattern, the Pattern_Matcher should extract the correct command type and parameters, selecting the highest priority match when multiple patterns apply.

**Validates: Requirements 2.1, 2.2**

### Property 4: Command Synonyms Are Equivalent

_For any_ command synonym (create/make/add, delete/remove, tạo/thêm), the Pattern_Matcher should produce the same command type.

**Validates: Requirements 2.3**

### Property 5: Entity Resolution with Fuzzy Matching

_For any_ entity name (with or without typos), the Entity_Resolver should find exact matches first, then use fuzzy matching with Fuse.js, returning the entity when similarity is above 0.7.

**Validates: Requirements 3.1, 3.2**

### Property 6: Card Command Execution

_For any_ card command (create, show, delete), the Command_Executor should resolve the card name and invoke the appropriate CardService method with correct parameters.

**Validates: Requirements 4.1, 4.3, 4.4**

### Property 7: Success Response Contains Details

_For any_ successful command execution, the Response_Formatter should display a success message containing relevant details (entity name, ID, or action summary).

**Validates: Requirements 4.5, 10.1**

### Property 8: Battle Command Execution

_For any_ two card names in a battle command, the Command_Executor should resolve both names and initiate a battle through the battle service.

**Validates: Requirements 5.1**

### Property 9: Equipment Command Execution

_For any_ equipment command (equip weapon, unequip weapon, equip gem, unequip gem), the Command_Executor should resolve entity names and invoke the appropriate equipment service method.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 10: Show Command Includes Equipment

_For any_ card shown through the show command, the display should include the card's equipped weapons and gems.

**Validates: Requirements 7.1**

### Property 11: List Pagination

_For any_ list command returning more than 10 items, the Response_Formatter should display the first 10 items with pagination hints.

**Validates: Requirements 7.5**

### Property 12: Context Tracking

_For any_ entity referenced in a command, the Command_Context should store it as the last referenced entity of that type, and subsequent commands using "it" or omitting the entity name should resolve to the contextual entity.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 13: Context Clearing on Category Switch

_For any_ command that switches to a different category (cards → battle → equipment), the Command_Context should clear previous context.

**Validates: Requirements 8.5**

### Property 14: Bilingual Help Examples

_For any_ help display, the Response_Formatter should show command examples in both Vietnamese and English.

**Validates: Requirements 9.5**

### Property 15: Service Error Propagation

_For any_ service call that fails, the Response_Formatter should display the error message from the service.

**Validates: Requirements 10.2**

### Property 16: Bilingual Pattern Recognition

_For any_ command keyword in Vietnamese or English, the Pattern_Matcher should recognize it and match the appropriate pattern.

**Validates: Requirements 11.1, 11.2**

### Property 17: Language-Matched Responses

_For any_ input detected as Vietnamese, the Response_Formatter should respond in Vietnamese; for any input detected as English, the Response_Formatter should respond in English.

**Validates: Requirements 11.3, 11.4**

### Property 18: Mixed Language Support

_For any_ input containing both Vietnamese and English (e.g., Vietnamese commands with English entity names), the Chatbot_System should process it successfully.

**Validates: Requirements 11.5**

## Error Handling

### Input Validation Errors

**Empty Input**:

- Detection: Input is empty or whitespace-only
- Response: "Please enter a command. Type 'help' to see available commands." / "Vui lòng nhập lệnh. Gõ 'help' để xem các lệnh có sẵn."

**Input Too Long**:

- Detection: Input exceeds 500 characters
- Response: "Command is too long (max 500 characters)." / "Lệnh quá dài (tối đa 500 ký tự)."

### Pattern Matching Errors

**No Pattern Match**:

- Detection: No registered pattern matches the input
- Response: "I didn't understand that command. Type 'help' for available commands." / "Tôi không hiểu lệnh đó. Gõ 'help' để xem các lệnh có sẵn."
- Include: Fuzzy match against command keywords to suggest similar commands

**Ambiguous Pattern**:

- Detection: Multiple patterns match with equal priority
- Response: Present options for user to clarify intent

### Entity Resolution Errors

**Entity Not Found**:

- Detection: No entity matches above 0.7 similarity threshold
- Response: "Could not find {type} '{name}'. Did you mean: {top 3 suggestions}?" / "Không tìm thấy {type} '{name}'. Ý bạn là: {top 3 suggestions}?"

**Multiple Exact Matches**:

- Detection: Multiple entities have the exact same name
- Response: "Multiple {type}s found with name '{name}'. Please specify by ID: {list IDs}"

**Ambiguous Fuzzy Match**:

- Detection: Multiple entities match with similarity > 0.7
- Response: "Multiple {type}s match '{name}': {list matches with scores}. Which one?"

### Service Execution Errors

**Service Call Failed**:

- Detection: Service method throws an error
- Response: Display the service error message directly
- Include: Suggestion to check entity existence or try again

**Missing Required Parameters**:

- Detection: Command handler cannot proceed without a parameter
- Response: "Missing required parameter: {parameter}. Example: {example command}"

**Invalid Parameter Value**:

- Detection: Parameter value is out of range or invalid format
- Response: "Invalid {parameter}: {value}. Expected: {expected format/range}"

### Context Errors

**Insufficient Context**:

- Detection: Command uses "it" or omits entity but no context exists
- Response: "Please specify which {type} you mean." / "Vui lòng chỉ rõ {type} nào."

**Context Type Mismatch**:

- Detection: Command expects a card but context has a weapon
- Response: "Expected a {expected type}, but last reference was a {actual type}."

### Error Recovery Strategies

1. **Fuzzy Suggestions**: Always provide suggestions when entity resolution fails
2. **Help Hints**: Include "Type 'help' for guidance" in error messages
3. **Example Commands**: Show example command format when pattern fails
4. **Graceful Degradation**: Never crash; always return a helpful message
5. **Error Context**: Include what was attempted and why it failed

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific examples and edge cases with property-based tests for universal correctness properties. Both approaches are complementary and necessary for comprehensive coverage.

**Unit Tests**:

- Specific command examples (e.g., "create card Dragon")
- Edge cases (empty input, whitespace-only, max length)
- Error conditions (entity not found, service failures)
- Integration points (service calls, store updates)
- UI interactions (message display, input handling)

**Property-Based Tests**:

- Universal properties across all inputs (normalization, pattern matching)
- Fuzzy matching behavior across entity names
- Command execution across all command types
- Context tracking across conversation flows
- Bilingual support across languages

### Property-Based Testing Configuration

**Library**: fast-check (TypeScript property-based testing library)

**Configuration**:

- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: chatbot-command-system, Property {number}: {property_text}`

**Example Property Test**:

```typescript
import * as fc from "fast-check";

/**
 * Feature: chatbot-command-system, Property 1: Input Normalization Preserves Content
 *
 * For any input string, normalizing it should produce lowercase text with no
 * leading/trailing whitespace while preserving Vietnamese diacritics.
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 */
it("Property 1: Input normalization preserves content", () => {
  fc.assert(
    fc.property(fc.string({ minLength: 1, maxLength: 500 }), (input) => {
      const normalized = normalizer.normalize(input);

      // Should be lowercase
      expect(normalized.normalized).toBe(normalized.normalized.toLowerCase());

      // Should have no leading/trailing whitespace
      expect(normalized.normalized).toBe(normalized.normalized.trim());

      // Should preserve Vietnamese diacritics
      const vietnameseDiacritics =
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi;
      const originalDiacritics = input.match(vietnameseDiacritics) || [];
      const normalizedDiacritics =
        normalized.normalized.match(vietnameseDiacritics) || [];
      expect(normalizedDiacritics.length).toBe(originalDiacritics.length);
    }),
    { numRuns: 100 },
  );
});
```

### Test Coverage Goals

- **Unit Test Coverage**: 80%+ for all components
- **Property Test Coverage**: All 18 correctness properties implemented
- **Integration Test Coverage**: All command types end-to-end
- **Edge Case Coverage**: All error conditions tested

### Testing Tools

- **Unit Testing**: Vitest (existing test framework)
- **Property Testing**: fast-check
- **Mocking**: Vitest mocks for service calls
- **Test Data**: Factories for generating test entities

### Test Organization

```
src/features/chatbot/
├── __tests__/
│   ├── unit/
│   │   ├── InputNormalizer.test.ts
│   │   ├── PatternMatcher.test.ts
│   │   ├── EntityResolver.test.ts
│   │   ├── CommandExecutor.test.ts
│   │   └── ResponseFormatter.test.ts
│   ├── property/
│   │   ├── normalization.property.test.ts
│   │   ├── patternMatching.property.test.ts
│   │   ├── entityResolution.property.test.ts
│   │   ├── commandExecution.property.test.ts
│   │   └── bilingual.property.test.ts
│   └── integration/
│       ├── cardCommands.integration.test.ts
│       ├── battleCommands.integration.test.ts
│       └── equipmentCommands.integration.test.ts
```

## Implementation Notes

### Performance Considerations

1. **Entity Cache**: Cache entity lists with 1-minute TTL to reduce service calls
2. **Fuzzy Matching**: Use Fuse.js with optimized threshold (0.3) for fast matching
3. **Pattern Matching**: Order patterns by priority to short-circuit matching
4. **Message History**: Limit to 100 messages to prevent memory growth
5. **Debouncing**: Debounce input processing to avoid excessive parsing

### Extensibility

**Adding New Commands**:

1. Register new pattern in pattern registry
2. Add command type to CommandType enum
3. Implement command handler function
4. Add response templates for success/error
5. Update help text with examples

**Adding New Entity Types**:

1. Add entity type to EntityResolver
2. Implement fuzzy matching for new type
3. Add to entity cache
4. Update context tracking
5. Add command patterns for new entity

### Localization

**Message Templates**:

- All user-facing messages stored in template objects
- Each template has `en` and `vi` keys
- Language detection based on input keywords
- Fallback to English if language unclear

**Command Keywords**:

- Maintain parallel keyword lists for Vietnamese and English
- Pattern regex includes both language variants
- Synonyms supported in both languages

### Integration Points

**Existing Services**:

- CardService: create, getAll, getById, delete
- BattleService: cardToBattleCardWithEquipment, initializeBattle
- EquipmentService: equipWeapon, unequipWeapon, getEquipment
- GemService: getAll, getById
- GemEquipmentService: equipGem, unequipGem, getCardGems
- WeaponService: getAll, getById

**Existing Stores**:

- useBattleStore: initializeBattle, battle state
- useEquipmentStore: equipment state
- useCardStore: card state (if needed)

**Navigation**:

- React Router: navigate to battle replay, card details, etc.
- Programmatic navigation from command handlers

### Security Considerations

1. **Input Sanitization**: Escape HTML in user input before display
2. **Command Injection**: No eval() or dynamic code execution
3. **Rate Limiting**: Limit commands per minute to prevent abuse
4. **XSS Prevention**: Use React's built-in XSS protection
5. **Data Validation**: Validate all parameters before service calls

### Accessibility

1. **Keyboard Navigation**: Full keyboard support (Enter to send, Esc to close)
2. **Screen Readers**: ARIA labels for all interactive elements
3. **Focus Management**: Proper focus handling for input and messages
4. **Color Contrast**: Ensure message colors meet WCAG standards
5. **Error Announcements**: Announce errors to screen readers

## Future Enhancements

### Phase 2 Features

1. **Voice Input**: Speech-to-text for hands-free commands
2. **Command History**: Arrow keys to navigate previous commands
3. **Auto-Complete**: Suggest completions as user types
4. **Batch Commands**: Execute multiple commands in sequence
5. **Command Macros**: Save frequently used command sequences

### Advanced NLP

1. **Intent Classification**: ML-based intent recognition (optional upgrade)
2. **Entity Extraction**: NER for better parameter extraction
3. **Sentiment Analysis**: Detect user frustration and offer help
4. **Conversation Memory**: Remember preferences across sessions
5. **Natural Responses**: More conversational response generation

### Analytics

1. **Command Usage**: Track most/least used commands
2. **Error Patterns**: Identify common user mistakes
3. **Performance Metrics**: Measure response times
4. **User Satisfaction**: Collect feedback on chatbot usefulness
5. **A/B Testing**: Test different response formats
