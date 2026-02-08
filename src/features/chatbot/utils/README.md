# Chatbot Utilities

This directory contains utility modules for the chatbot command system.

## Message Templates

The `messageTemplates.ts` module provides comprehensive bilingual message templates for all chatbot responses.

### Features

- **Bilingual Support**: All templates available in Vietnamese and English
- **Parameter Interpolation**: Dynamic content insertion using `{paramName}` syntax
- **Type Safety**: Full TypeScript support with proper typing
- **Helper Functions**: Utilities for formatting lists, pagination, and entity names

### Template Categories

#### Success Templates

Success messages for all command types:

- Card commands (create, list, show, delete)
- Battle commands (start, history, replay)
- Equipment commands (equip/unequip weapons and gems)
- Query commands (list items, show stats)
- Help commands

Example:

```typescript
import { successTemplates, formatMessage } from "./messageTemplates";

const message = formatMessage(successTemplates.create_card, "en", {
  name: "Fire Dragon",
  id: "card-123",
});
// Result: 'Created card "Fire Dragon" (ID: card-123)'
```

#### Error Templates

Error messages for common failure scenarios:

- Input validation errors (empty, too long)
- Pattern matching errors (unrecognized command)
- Entity resolution errors (not found, multiple matches)
- Service execution errors
- Context errors (insufficient context)

Example:

```typescript
import { errorTemplates, formatMessage } from "./messageTemplates";

const message = formatMessage(errorTemplates.entity_not_found, "vi", {
  type: "thẻ",
  name: "Dragn",
  suggestions: "Dragon, Drake",
});
// Result: 'Không tìm thấy thẻ "Dragn". Ý bạn là: Dragon, Drake?'
```

#### Help Templates

Comprehensive help text organized by category:

- Overview (all categories)
- Cards (card management commands)
- Battle (battle commands)
- Equipment (equipment commands)
- Query (query commands)

Each help template includes:

- Command syntax
- Synonyms in both languages
- Usage examples

Example:

```typescript
import { helpTemplates, getTemplate } from "./messageTemplates";

const helpText = getTemplate(helpTemplates.cards, "en");
// Returns full card commands help text with examples
```

### Core Functions

#### `interpolate(template, params)`

Replaces `{paramName}` placeholders with values from the params object.

```typescript
interpolate("Hello {name}!", { name: "World" });
// Returns: 'Hello World!'
```

#### `getTemplate(template, language)`

Gets a template string in the specified language.

```typescript
const template = { en: "Hello", vi: "Xin chào" };
getTemplate(template, "vi");
// Returns: 'Xin chào'
```

#### `formatMessage(template, language, params)`

Combines template selection and parameter interpolation.

```typescript
const template = {
  en: "Created {name}",
  vi: "Đã tạo {name}",
};
formatMessage(template, "en", { name: "Dragon" });
// Returns: 'Created Dragon'
```

### Helper Functions

#### `formatEntityList(names, language)`

Formats an array of entity names as a natural language list.

```typescript
formatEntityList(["Dragon", "Phoenix", "Tiger"], "en");
// Returns: 'Dragon, Phoenix, and Tiger'

formatEntityList(["Rồng", "Phượng"], "vi");
// Returns: 'Rồng và Phượng'
```

#### `formatPaginationHint(total, shown, language)`

Creates a pagination hint for long lists.

```typescript
formatPaginationHint(20, 10, "en");
// Returns: '\n\n(Showing 10/20. 10 more item(s) remaining.)'
```

#### `getEntityTypeName(type, language)`

Gets the localized name for an entity type.

```typescript
getEntityTypeName("card", "vi");
// Returns: 'thẻ'

getEntityTypeName("weapon", "en");
// Returns: 'weapon'
```

### Usage in Response Formatter

The message templates are designed to be used by the ResponseFormatter service:

```typescript
import {
  successTemplates,
  errorTemplates,
  formatMessage,
  formatEntityList,
} from "../utils/messageTemplates";

class ResponseFormatter {
  formatSuccess(result: ExecutionResult, language: Language): ChatMessage {
    const template = successTemplates[result.commandType];
    const content = formatMessage(template, language, result.data);

    return {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
      data: result.data,
    };
  }

  formatError(error: string, language: Language): ChatMessage {
    const template = errorTemplates.service_error;
    const content = formatMessage(template, language, { message: error });

    return {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now(),
    };
  }
}
```

### Adding New Templates

To add a new command type:

1. Add the command type to `CommandType` in `types/index.ts`
2. Add success template to `successTemplates` with both `en` and `vi` keys
3. Add any specific error templates to `errorTemplates`
4. Update help templates if needed
5. Add tests for the new templates

Example:

```typescript
export const successTemplates: Record<CommandType, BilingualTemplate> = {
  // ... existing templates
  new_command: {
    en: "Success message with {param}",
    vi: "Thông báo thành công với {param}",
  },
};
```

### Testing

All templates and helper functions are thoroughly tested in `__tests__/unit/messageTemplates.test.ts`.

Run tests:

```bash
npm test -- messageTemplates.test.ts
```

### Requirements Coverage

This module satisfies the following requirements:

- **Requirement 10.1**: Success message formatting with details
- **Requirement 10.2**: Error message formatting
- **Requirement 11.3**: Vietnamese response support
- **Requirement 11.4**: English response support

### Design Principles

1. **Consistency**: All templates follow the same structure and naming conventions
2. **Completeness**: Every command type has corresponding templates
3. **Clarity**: Messages are clear and actionable
4. **Localization**: Full support for both languages without mixing
5. **Extensibility**: Easy to add new templates and command types
