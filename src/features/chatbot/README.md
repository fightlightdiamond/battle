# Chatbot Command System

A conversational interface for interacting with the game application using natural language commands in Vietnamese and English.

## Directory Structure

```
src/features/chatbot/
├── components/          # React UI components
│   ├── Chatbot.tsx     # Main chatbot component
│   └── ChatMessage.tsx # Individual message display
├── services/           # Core business logic
│   ├── InputNormalizer.ts    # Text preprocessing
│   ├── PatternMatcher.ts     # Command pattern matching
│   ├── EntityResolver.ts     # Entity name resolution with fuzzy matching
│   ├── CommandExecutor.ts    # Command execution and service calls
│   ├── ResponseFormatter.ts  # Response formatting
│   └── CommandParser.ts      # Main parsing pipeline
├── store/              # State management
│   ├── chatbotStore.ts # Main chatbot store (messages, processing state)
│   └── contextStore.ts # Command context store (last entities, language)
├── utils/              # Utility functions and helpers
│   ├── patternRegistry.ts # Command pattern registry
│   ├── entityCache.ts     # Entity caching for performance
│   └── messageTemplates.ts # Bilingual message templates
├── types/              # TypeScript type definitions
│   └── index.ts        # All core types and interfaces
├── __tests__/          # Test files (to be created)
│   ├── unit/          # Unit tests
│   ├── property/      # Property-based tests
│   └── integration/   # Integration tests
├── index.ts           # Barrel exports
└── README.md          # This file
```

## Features

- **Bilingual Support**: Commands in Vietnamese and English
- **Fuzzy Matching**: Typo-tolerant entity name resolution
- **Context Awareness**: Remember recent entities for follow-up commands
- **Pattern Matching**: Flexible command recognition with synonyms
- **Service Integration**: Reuses existing game services
- **Help System**: Discoverable commands with examples

## Command Types

### Card Commands

- Create card: `create card [name]` / `tạo thẻ [tên]`
- List cards: `list cards` / `danh sách thẻ`
- Show card: `show card [name]` / `hiển thị thẻ [tên]`
- Delete card: `delete card [name]` / `xóa thẻ [tên]`

### Battle Commands

- Start battle: `battle [card1] vs [card2]` / `trận đấu [thẻ1] vs [thẻ2]`
- Battle history: `battle history` / `lịch sử trận đấu`
- Replay battle: `replay battle [id]` / `xem lại trận đấu [id]`

### Equipment Commands

- Equip weapon: `equip [weapon] to [card]` / `trang bị [vũ khí] cho [thẻ]`
- Unequip weapon: `unequip weapon from [card]` / `gỡ vũ khí khỏi [thẻ]`
- Equip gem: `equip gem [gem] to [card]` / `trang bị ngọc [ngọc] cho [thẻ]`
- Unequip gem: `unequip gem from [card]` / `gỡ ngọc khỏi [thẻ]`

### Query Commands

- Show card with equipment: `show [card]` / `hiển thị [thẻ]`
- List weapons: `list weapons` / `danh sách vũ khí`
- List gems: `list gems` / `danh sách ngọc`
- Show stats: `stats` / `thống kê`

### Help Commands

- General help: `help` / `trợ giúp`
- Category help: `help [category]` / `trợ giúp [danh mục]`

## Architecture

The system follows a pipeline architecture:

```
User Input
    ↓
Input Normalizer (lowercase, trim, language detection)
    ↓
Pattern Matcher (regex matching, parameter extraction)
    ↓
Entity Resolver (fuzzy matching with Fuse.js)
    ↓
Command Executor (service calls, context updates)
    ↓
Response Formatter (bilingual message formatting)
    ↓
Chat Message Display
```

## Technology Stack

- **Fuzzy Matching**: Fuse.js
- **State Management**: Zustand
- **Testing**: Vitest (unit tests) + fast-check (property-based tests)
- **UI**: React + TypeScript

## Implementation Status

- [x] Task 1: Core types and directory structure
- [ ] Task 2: Input Normalizer
- [ ] Task 3: Pattern Matcher
- [ ] Task 5: Entity Resolver
- [ ] Task 6: Command Context Store
- [ ] Task 8: Response Formatter
- [ ] Task 9: Command Executor
- [ ] Task 11: Command Parser Pipeline
- [ ] Task 12: Chatbot Store
- [ ] Task 13: Chatbot UI Component
- [ ] Task 14: Integration into AppLayout

## Testing Strategy

The feature uses a dual testing approach:

1. **Unit Tests**: Specific examples, edge cases, error conditions
2. **Property-Based Tests**: Universal correctness properties (18 properties total)

All tests are located in `__tests__/` with subdirectories for unit, property, and integration tests.

## Requirements

See `.kiro/specs/chatbot-command-system/requirements.md` for detailed requirements.

## Design

See `.kiro/specs/chatbot-command-system/design.md` for detailed design documentation.
