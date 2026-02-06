import { getDB, type StoredWeapon } from "../../cards/services/db";
import {
  saveImage,
  deleteImage,
  getImageUrl,
} from "../../cards/services/imageStorage";
import type { Weapon, WeaponFormInput } from "../types/weapon";
import { applyDefaultWeaponStats } from "../types/weapon";
import { WEAPON_TYPE_CONFIGS } from "../types/weaponType";
import { EquipmentService } from "./equipmentService";

/**
 * Convert a stored weapon to a Weapon with imageUrl
 * Ensures enhanceLevel and enhanceHistory have default values
 */
async function toWeapon(stored: StoredWeapon): Promise<Weapon> {
  const imageUrl = stored.imagePath
    ? await getImageUrl(stored.imagePath)
    : null;
  return {
    ...stored,
    imageUrl,
    // Ensure enhancement fields have defaults for old data
    enhanceLevel: stored.enhanceLevel ?? 0,
    enhanceHistory: stored.enhanceHistory ?? [],
  };
}

/**
 * Generate a UUID v4
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Revoke object URLs to prevent memory leaks
 */
export function revokeWeaponImageUrl(weapon: Weapon): void {
  if (weapon.imageUrl) {
    URL.revokeObjectURL(weapon.imageUrl);
  }
}

/**
 * Revoke object URLs for multiple weapons
 */
export function revokeWeaponImageUrls(weapons: Weapon[]): void {
  weapons.forEach(revokeWeaponImageUrl);
}

/**
 * Serialize a weapon to JSON string
 * Used for persistence and data transfer
 */
export function serializeWeapon(weapon: Weapon): string {
  return JSON.stringify(weapon);
}

/**
 * Deserialize a JSON string to a Weapon object
 * Used for loading persisted data
 */
export function deserializeWeapon(json: string): Weapon {
  return JSON.parse(json) as Weapon;
}

/**
 * WeaponService - CRUD operations for weapons in IndexedDB
 * Images are stored separately in OPFS
 *
 * Requirements:
 * - 1.1: Create weapons with offensive stats
 * - 1.3: Apply default values of 0 for all offensive stats when not specified
 * - 1.4: Assign unique identifier and timestamp to weapons
 * - 2.3: Persist changes and update timestamp on update
 */
export const WeaponService = {
  /**
   * Get all weapons from the database
   */
  async getAll(): Promise<Weapon[]> {
    const db = await getDB();
    const storedWeapons = await db.getAll("weapons");
    return Promise.all(storedWeapons.map(toWeapon));
  },

  /**
   * Get a single weapon by ID
   */
  async getById(id: string): Promise<Weapon | null> {
    const db = await getDB();
    const stored = await db.get("weapons", id);
    return stored ? toWeapon(stored) : null;
  },

  /**
   * Create a new weapon
   * Applies default stats (0) for any stats not provided
   * Generates unique ID with crypto.randomUUID()
   *
   * Requirements: 1.1, 1.3, 1.4
   */
  async create(input: WeaponFormInput): Promise<Weapon> {
    const db = await getDB();
    const now = Date.now();
    const id = generateId();

    // Save image to OPFS if provided
    let imagePath: string | null = null;
    if (input.image) {
      imagePath = await saveImage(id, input.image);
    }

    // Get base stats from weapon type config
    const weaponTypeConfig = WEAPON_TYPE_CONFIGS[input.weaponType];
    const baseStats = weaponTypeConfig.baseStats;

    // Apply default stats based on weapon type, override with user input if provided
    const stats = applyDefaultWeaponStats({
      atk: input.atk ?? baseStats.atk,
      critChance: input.critChance ?? baseStats.critChance,
      critDamage: input.critDamage ?? baseStats.critDamage,
      armorPen: input.armorPen ?? baseStats.armorPen,
      lifesteal: input.lifesteal ?? baseStats.lifesteal,
      attackRange: input.attackRange ?? baseStats.attackRange,
    });

    const storedWeapon: StoredWeapon = {
      id,
      name: input.name,
      weaponType: input.weaponType,
      ...stats,
      imagePath,
      enhanceLevel: 0,
      enhanceHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.add("weapons", storedWeapon);
    return toWeapon(storedWeapon);
  },

  /**
   * Update an existing weapon
   * Updates timestamp on successful update
   *
   * Requirements: 2.3
   */
  async update(id: string, input: WeaponFormInput): Promise<Weapon | null> {
    const db = await getDB();
    const existing = await db.get("weapons", id);

    if (!existing) {
      return null;
    }

    const now = Date.now();
    let imagePath = existing.imagePath;

    // Handle image update
    if (input.image) {
      // Delete old image if exists
      if (existing.imagePath) {
        await deleteImage(existing.imagePath);
      }
      // Save new image
      imagePath = await saveImage(id, input.image);
    }

    // Apply default stats for any missing values, preserving existing values
    const stats = applyDefaultWeaponStats({
      atk: input.atk ?? existing.atk,
      critChance: input.critChance ?? existing.critChance,
      critDamage: input.critDamage ?? existing.critDamage,
      armorPen: input.armorPen ?? existing.armorPen,
      lifesteal: input.lifesteal ?? existing.lifesteal,
      attackRange: input.attackRange ?? existing.attackRange,
    });

    const updatedWeapon: StoredWeapon = {
      ...existing,
      name: input.name,
      weaponType: input.weaponType,
      ...stats,
      imagePath,
      updatedAt: now,
    };

    await db.put("weapons", updatedWeapon);
    return toWeapon(updatedWeapon);
  },

  /**
   * Delete a weapon by ID
   * Automatically unequips the weapon from any card before deletion
   *
   * Requirement: 2.4
   */
  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get("weapons", id);

    if (!existing) {
      return false;
    }

    // Check if weapon is equipped to any card and unequip first (Requirement 2.4)
    const equippedCardId = await EquipmentService.findCardByWeaponId(id);
    if (equippedCardId) {
      await EquipmentService.unequipWeapon(equippedCardId);
    }

    // Delete image from OPFS if exists
    if (existing.imagePath) {
      await deleteImage(existing.imagePath);
    }

    await db.delete("weapons", id);
    return true;
  },

  /**
   * Clear all weapons from the database (useful for testing)
   */
  async clear(): Promise<void> {
    const db = await getDB();

    // Delete all images from OPFS
    const weapons = await db.getAll("weapons");
    await Promise.all(
      weapons
        .filter((weapon) => weapon.imagePath)
        .map((weapon) => deleteImage(weapon.imagePath!)),
    );

    await db.clear("weapons");
  },

  /**
   * Enhance a weapon
   * Updates the weapon's enhancement level and history
   */
  async enhance(
    id: string,
    newEnhanceLevel: number,
    attempt: {
      fromLevel: number;
      toLevel: number;
      success: boolean;
      timestamp: number;
      materialId: string | null;
      protectionUsed: boolean;
    },
  ): Promise<Weapon | null> {
    const db = await getDB();
    const existing = await db.get("weapons", id);

    if (!existing) {
      return null;
    }

    const updatedWeapon: StoredWeapon = {
      ...existing,
      enhanceLevel: newEnhanceLevel,
      enhanceHistory: [...(existing.enhanceHistory || []), attempt],
      updatedAt: Date.now(),
    };

    await db.put("weapons", updatedWeapon);
    return toWeapon(updatedWeapon);
  },

  /**
   * Reset weapon enhancement (for testing or special items)
   */
  async resetEnhancement(id: string): Promise<Weapon | null> {
    const db = await getDB();
    const existing = await db.get("weapons", id);

    if (!existing) {
      return null;
    }

    const updatedWeapon: StoredWeapon = {
      ...existing,
      enhanceLevel: 0,
      enhanceHistory: [],
      updatedAt: Date.now(),
    };

    await db.put("weapons", updatedWeapon);
    return toWeapon(updatedWeapon);
  },
};
