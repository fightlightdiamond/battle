# Chatbot Services

This directory contains the core services for the chatbot command system.

## EntityResolver

The `EntityResolver` uses Fuse.js for fuzzy matching of entity names (cards, weapons, gems, etc.).

### Fuse.js Configuration

The following configuration is used for optimal entity name matching:

```typescript
{
  keys: ['name'],           // Search on the 'name' property
  threshold: 0.3,           // 70% similarity required (lower = stricter)
  includeScore: true,       // Include match scores in results
  distance: 100,            // Maximum distance for fuzzy matching
  minMatchCharLength: 2     // Minimum character length to match
}
```

### Usage Example

```typescript
import { EntityResolver } from "./EntityResolver";

// Create resolver with entities
const entities = [
  { id: "1", name: "Dragon" },
  { id: "2", name: "Phoenix" },
  { id: "3", name: "Tiger" },
];

const resolver = new EntityResolver(entities);

// Exact match
const result1 = resolver.resolve("Dragon");
// { status: 'exact', entity: { id: '1', name: 'Dragon' }, query: 'Dragon' }

// Fuzzy match with typo
const result2 = resolver.resolve("Draon");
// { status: 'fuzzy', entity: { id: '1', name: 'Dragon' }, query: 'Draon' }

// No match
const result3 = resolver.resolve("Unicorn");
// { status: 'none', query: 'Unicorn' }
```

## EntityCache

The `EntityCache` provides caching with TTL (Time To Live) for entity lists to reduce service calls.

### Usage Example

```typescript
import { EntityCache } from "./EntityCache";
import { CardService } from "../../cards/services";

// Create cache with 1-minute TTL
const cardCache = new EntityCache(
  () => CardService.getAll(),
  60000, // 1 minute
);

// Get resolver (automatically refreshes if stale)
const resolver = await cardCache.getResolver();
const result = resolver.resolve("Dragon");
```

## Resolution Logic

1. **Exact Match**: Try case-insensitive exact match first
2. **Fuzzy Search**: Use Fuse.js if no exact match
3. **Good Matches**: Filter results with score < 0.3 (70%+ similarity)
4. **Single Match**: Return as fuzzy match
5. **Multiple Matches**: Return all good matches for user selection
6. **No Good Matches**: Return top 3 suggestions

## Performance

- Entity lists are cached with 1-minute TTL
- Fuse.js provides fast fuzzy matching (O(n) complexity)
- Cache automatically refreshes when stale
- Minimal memory footprint
