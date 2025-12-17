// Weapon types and interfaces
export type {
  Weapon,
  WeaponStats,
  WeaponFormInput,
  WeaponStatKey,
} from "./weapon";

// Weapon constants
export {
  DEFAULT_WEAPON_STATS,
  WEAPON_STAT_RANGES,
  applyDefaultWeaponStats,
} from "./weapon";

// Schemas and validation
export {
  weaponSchema,
  weaponFormSchema,
  weaponStatsSchema,
  imageSchema,
  validateWeaponName,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_IMAGE_SIZE_MB,
  WEAPON_NAME_MAX_LENGTH,
} from "./schemas";

export type {
  WeaponSchemaType,
  WeaponFormSchemaType,
  WeaponStatsSchemaType,
} from "./schemas";

// Equipment types
export type {
  CardEquipment,
  EffectiveCardStats,
  WeaponBonusStats,
} from "./equipment";
