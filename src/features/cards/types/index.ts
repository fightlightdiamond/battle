// Card types (from original card.ts - kept for backward compatibility)
export type { Card, CardFormInput } from "./card";

// Derived types from stat config
export type { StatKey, CardStats, StatName } from "./statTypes";
export type {
  Card as ConfigCard,
  CardFormInput as ConfigCardFormInput,
} from "./statTypes";

// Stat configuration (single source of truth)
export {
  STAT_REGISTRY,
  TIER_CONFIG,
  getStatsByTier,
  getCompactStats,
  getStatByKey,
  getStatKeys,
  getDefaultStats,
} from "./statConfig";
export type { StatDefinition, StatFormat, StatTier } from "./statConfig";

// Stat display utilities
export {
  getStatIcon,
  formatStatValue,
  formatStatFromDefinition,
  getStatIconFromDefinition,
} from "./statDisplay";

// Pagination types and constants
export type {
  CardListParams,
  PaginatedCards,
  SortField,
  SortOrder,
} from "./pagination";
export {
  SORT_FIELDS,
  SORT_ORDERS,
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
} from "./pagination";

// Schemas and constants
export * from "./schemas";

// Stat constants (kept for backward compatibility)
export { DEFAULT_STATS, STAT_RANGES } from "./constants";
