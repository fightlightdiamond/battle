// Weapon Equipment feature barrel export

// Types
export type {
  Weapon,
  WeaponStats,
  WeaponFormInput,
  WeaponStatKey,
  WeaponSchemaType,
  WeaponFormSchemaType,
  WeaponStatsSchemaType,
  CardEquipment,
  EffectiveCardStats,
  WeaponBonusStats,
} from "./types";

export {
  DEFAULT_WEAPON_STATS,
  WEAPON_STAT_RANGES,
  applyDefaultWeaponStats,
  weaponSchema,
  weaponFormSchema,
  weaponStatsSchema,
  imageSchema,
  validateWeaponName,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_IMAGE_SIZE_MB,
  WEAPON_NAME_MAX_LENGTH,
} from "./types";

// Services
export * from "./services";

// Store
export * from "./store";

// Hooks
export * from "./hooks";

// Components
export * from "./components";

// Pages
export * from "./pages";
