# Requirements Document: Chatbot Command System

## Introduction

The Chatbot Command System provides a conversational interface for interacting with the game application. Users can type natural language commands in Vietnamese or English to perform common actions like creating cards, starting battles, equipping items, and checking status - without navigating through multiple UI screens. The system uses rule-based NLP techniques (fuzzy matching, pattern matching, entity extraction) to understand user intent and execute commands against existing game services.

## Glossary

- **Chatbot_System**: The complete natural language command processing system
- **Command_Parser**: Component that analyzes user input and extracts structured command data
- **Command_Executor**: Component that maps parsed commands to game service calls
- **Fuzzy_Matcher**: Component using Fuse.js for typo-tolerant entity name matching
- **Pattern_Matcher**: Component that matches user input against command templates
- **Entity_Resolver**: Component that resolves entity references (card/gem/weapon names) to IDs
- **Command_Handler**: Function that executes a specific command type
- **Response_Formatter**: Component that formats execution results for user display
- **Input_Normalizer**: Component that preprocesses text (lowercase, trim, diacritics)
- **Command_Context**: State tracking the last referenced entities for follow-up commands
- **Entity_Reference**: A mention of a game object (card, gem, weapon) in user input

## Requirements

### Requirement 1: Text Input Processing

**User Story:** As a user, I want to type commands in Vietnamese or English, so that I can interact with the game conversationally.

#### Acceptance Criteria

1. WHEN a user submits text input, THE Chatbot_System SHALL accept input in both Vietnamese and English
2. WHEN input is received, THE Input_Normalizer SHALL convert text to lowercase and remove leading/trailing whitespace
3. WHEN input contains Vietnamese diacritics, THE Input_Normalizer SHALL preserve them for entity matching
4. WHEN input is empty or whitespace-only, THE Chatbot_System SHALL prompt the user to enter a command
5. WHEN input exceeds 500 characters, THE Chatbot_System SHALL reject it with a length limit message

### Requirement 2: Command Pattern Matching

**User Story:** As a user, I want the system to understand various phrasings of commands, so that I can use natural language.

#### Acceptance Criteria

1. WHEN input matches a command pattern, THE Pattern_Matcher SHALL extract the command type and parameters
2. WHEN input matches multiple patterns, THE Pattern_Matcher SHALL select the most specific match
3. WHEN input uses command synonyms (create/make/add, delete/remove, show/display/view), THE Pattern_Matcher SHALL recognize them as equivalent
4. WHEN input contains extra words (e.g., "please", "can you"), THE Pattern_Matcher SHALL ignore them
5. WHEN no pattern matches, THE Response_Formatter SHALL suggest similar commands or show help

### Requirement 3: Entity Name Resolution

**User Story:** As a user, I want to reference cards, gems, and weapons by name with typo tolerance, so that I don't need perfect spelling.

#### Acceptance Criteria

1. WHEN a command references an entity name, THE Entity_Resolver SHALL search for matching entities using fuzzy matching
2. WHEN an exact match is found, THE Entity_Resolver SHALL return that entity immediately
3. WHEN multiple entities match with similarity above 0.7, THE Response_Formatter SHALL present options for user selection
4. WHEN no entity matches above 0.7 similarity, THE Response_Formatter SHALL suggest the closest matches
5. WHEN an entity name is ambiguous (multiple exact matches), THE Response_Formatter SHALL ask for clarification with entity IDs

### Requirement 4: Card Commands

**User Story:** As a user, I want to manage cards through chat commands, so that I can quickly create and view cards.

#### Acceptance Criteria

1. WHEN a user commands "create card [name]", THE Command_Executor SHALL invoke CardService.create with the card name
2. WHEN a user commands "list cards", THE Command_Executor SHALL invoke CardService.getAll and display results
3. WHEN a user commands "show card [name]", THE Command_Executor SHALL resolve the card name and display its details
4. WHEN a user commands "delete card [name]", THE Command_Executor SHALL resolve the card name and invoke CardService.delete
5. WHEN card creation succeeds, THE Response_Formatter SHALL display the created card's name and ID

### Requirement 5: Battle Commands

**User Story:** As a user, I want to start battles through chat commands, so that I can quickly test card matchups.

#### Acceptance Criteria

1. WHEN a user commands "battle [card1] vs [card2]", THE Command_Executor SHALL resolve both card names and initiate a battle
2. WHEN a user commands "battle history", THE Command_Executor SHALL retrieve and display recent battle records
3. WHEN a user commands "replay battle [id]", THE Command_Executor SHALL navigate to the battle replay page
4. WHEN battle cards cannot be resolved, THE Response_Formatter SHALL indicate which card name failed to match
5. WHEN a battle completes, THE Response_Formatter SHALL display the winner and battle summary

### Requirement 6: Equipment Commands

**User Story:** As a user, I want to equip items through chat commands, so that I can quickly prepare cards for battle.

#### Acceptance Criteria

1. WHEN a user commands "equip [weapon] to [card]", THE Command_Executor SHALL resolve both names and invoke EquipmentService.equipWeapon
2. WHEN a user commands "unequip weapon from [card]", THE Command_Executor SHALL resolve the card and invoke EquipmentService.unequipWeapon
3. WHEN a user commands "equip gem [gem] to [card]", THE Command_Executor SHALL resolve both names and invoke GemEquipmentService.equipGem
4. WHEN a user commands "unequip gem from [card]", THE Command_Executor SHALL resolve the card and invoke GemEquipmentService.unequipGem
5. WHEN equipment succeeds, THE Response_Formatter SHALL confirm the equipment change

### Requirement 7: Status and Query Commands

**User Story:** As a user, I want to check game status through chat commands, so that I can quickly get information.

#### Acceptance Criteria

1. WHEN a user commands "show [card]", THE Command_Executor SHALL display the card with its equipped items
2. WHEN a user commands "list weapons", THE Command_Executor SHALL invoke WeaponService.getAll and display results
3. WHEN a user commands "list gems", THE Command_Executor SHALL invoke GemService.getAll and display results
4. WHEN a user commands "stats", THE Response_Formatter SHALL display total counts of cards, weapons, and gems
5. WHEN displaying lists, THE Response_Formatter SHALL show up to 10 items with pagination hints

### Requirement 8: Command Context Tracking

**User Story:** As a user, I want to use follow-up commands without repeating entity names, so that conversations feel natural.

#### Acceptance Criteria

1. WHEN a user references an entity, THE Command_Context SHALL store it as the last referenced entity of that type
2. WHEN a user says "it" or "that", THE Command_Context SHALL resolve to the last referenced entity
3. WHEN a user issues a command without an entity name, THE Command_Context SHALL attempt to use the contextual entity
4. WHEN context is insufficient, THE Response_Formatter SHALL ask the user to specify the entity
5. WHEN a user starts a new command category, THE Command_Context SHALL clear previous context

### Requirement 9: Help and Discovery

**User Story:** As a user, I want to discover available commands, so that I can learn what the chatbot can do.

#### Acceptance Criteria

1. WHEN a user commands "help", THE Response_Formatter SHALL display command categories with examples
2. WHEN a user commands "help cards", THE Response_Formatter SHALL display card-related commands
3. WHEN a user commands "help battle", THE Response_Formatter SHALL display battle-related commands
4. WHEN a user commands "help equipment", THE Response_Formatter SHALL display equipment-related commands
5. WHEN displaying help, THE Response_Formatter SHALL show examples in both Vietnamese and English

### Requirement 10: Error Handling and Feedback

**User Story:** As a user, I want clear feedback when commands fail, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN a command executes successfully, THE Response_Formatter SHALL display a success message with relevant details
2. WHEN a service call fails, THE Response_Formatter SHALL display the error message from the service
3. WHEN entity resolution fails, THE Response_Formatter SHALL suggest similar entity names
4. WHEN a command is malformed, THE Response_Formatter SHALL explain what was expected
5. WHEN an error occurs, THE Response_Formatter SHALL suggest the help command for guidance

### Requirement 11: Bilingual Command Support

**User Story:** As a Vietnamese user, I want to use Vietnamese commands, so that I can interact in my native language.

#### Acceptance Criteria

1. THE Pattern_Matcher SHALL recognize Vietnamese command keywords (tạo, xóa, hiển thị, trận đấu, trang bị)
2. THE Pattern_Matcher SHALL recognize English command keywords (create, delete, show, battle, equip)
3. WHEN Vietnamese input is detected, THE Response_Formatter SHALL respond in Vietnamese
4. WHEN English input is detected, THE Response_Formatter SHALL respond in English
5. THE Chatbot_System SHALL support mixed input (Vietnamese commands with English entity names)

### Requirement 12: Command Parsing Pipeline

**User Story:** As a developer, I want a clear parsing pipeline, so that the system is maintainable and extensible.

#### Acceptance Criteria

1. THE Command_Parser SHALL process input through: normalize → match pattern → resolve entities → execute
2. WHEN normalization completes, THE Command_Parser SHALL pass normalized text to Pattern_Matcher
3. WHEN pattern matching completes, THE Command_Parser SHALL pass extracted parameters to Entity_Resolver
4. WHEN entity resolution completes, THE Command_Parser SHALL pass resolved data to Command_Executor
5. WHEN execution completes, THE Command_Parser SHALL pass results to Response_Formatter
