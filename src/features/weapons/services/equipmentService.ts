import { getDB, type CardEquipment } from "../../cards/services/db";
import type { Card } from "../../cards/types/card";
import type { Weapon, WeaponStats } from "../types/weapon";
import type { EffectiveCardStats } from "../types/equipment";
import { DEFAULT_WEAPON_STATS } from "../types/weapon";

/**
 * Default attack range for cards without weapons
 * Cards can attack adjacent cells (distance 1) by default
 *
 * Requirements: 2.1
 */
export const DEFAULT_ATTACK_RANGE = 1;

/**
 * Calculate effective attack range for a card
 * Effective range = weapon attack range (or default 1 if no weapon)
 * Attack range is the absolute distance: |attacker_pos - target_pos|
 *
 * Requirements: 2.1, 2.2
 *
 * @param weapon - The equipped weapon or weapon stats (null if no weapon)
 * @returns The effective attack range (minimum 1)
 */
export function calculateEffectiveRange(
  weapon: Weapon | WeaponStats | null,
): number {
  const weaponRange = weapon?.attackRange ?? 0;
  // If weapon has attackRange, use it directly; otherwise use default (1)
  return weaponRange > 0 ? weaponRange : DEFAULT_ATTACK_RANGE;
}

/**
 * Calculate effective stats by adding weapon bonuses to card base stats
 * Weapon bonuses are additive for offensive stats: atk, critChance, critDamage, armorPen, lifesteal
 *
 * Requirements: 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export function calculateEffectiveStats(
  card: Card,
  weapon: Weapon | WeaponStats | null,
): EffectiveCardStats {
  const weaponStats = weapon ?? DEFAULT_WEAPON_STATS;

  return {
    hp: card.hp,
    atk: card.atk + weaponStats.atk,
    def: card.def,
    spd: card.spd,
    critChance: card.critChance + weaponStats.critChance,
    critDamage: card.critDamage + weaponStats.critDamage,
    armorPen: card.armorPen + weaponStats.armorPen,
    lifesteal: card.lifesteal + weaponStats.lifesteal,
  };
}

/**
 * Serialize equipment state to JSON string
 * Used for persistence and data transfer
 */
export function serializeEquipment(equipment: CardEquipment): string {
  return JSON.stringify(equipment);
}

/**
 * Deserialize a JSON string to a CardEquipment object
 * Used for loading persisted data
 */
export function deserializeEquipment(json: string): CardEquipment {
  return JSON.parse(json) as CardEquipment;
}

/**
 * EquipmentService - Manages card-weapon equipment relationships
 *
 * Requirements:
 * - 3.2: Associate weapon with card and persist relationship
 * - 3.3: Calculate effective stats (base + weapon bonus)
 * - 3.4: Remove association and revert to base stats on unequip
 * - 3.5: Unequip from previous card when equipping to new card
 */
export const EquipmentService = {
  /**
   * Get equipment state for a card
   * Returns null if no equipment record exists
   */
  async getEquipment(cardId: string): Promise<CardEquipment | null> {
    const db = await getDB();
    const equipment = await db.get("cardEquipment", cardId);
    return equipment ?? null;
  },

  /**
   * Equip a weapon to a card
   * If weapon is already equipped to another card, unequips it first (Requirement 3.5)
   *
   * Requirements: 3.2, 3.5
   */
  async equipWeapon(cardId: string, weaponId: string): Promise<CardEquipment> {
    const db = await getDB();
    const now = Date.now();

    // Check if weapon is already equipped to another card (Requirement 3.5)
    const existingCardId = await this.findCardByWeaponId(weaponId);
    if (existingCardId && existingCardId !== cardId) {
      // Unequip from previous card
      await this.unequipWeapon(existingCardId);
    }

    const equipment: CardEquipment = {
      cardId,
      weaponId,
      equippedAt: now,
    };

    await db.put("cardEquipment", equipment);
    return equipment;
  },

  /**
   * Unequip weapon from a card
   * Sets weaponId to null and clears equippedAt
   *
   * Requirement: 3.4
   */
  async unequipWeapon(cardId: string): Promise<void> {
    const db = await getDB();

    const equipment: CardEquipment = {
      cardId,
      weaponId: null,
      equippedAt: null,
    };

    await db.put("cardEquipment", equipment);
  },

  /**
   * Find which card has a specific weapon equipped
   * Used for reverse lookup and weapon exclusivity check
   *
   * Requirement: 3.5
   */
  async findCardByWeaponId(weaponId: string): Promise<string | null> {
    const db = await getDB();
    const equipment = await db.getFromIndex(
      "cardEquipment",
      "by-weapon",
      weaponId,
    );
    return equipment?.cardId ?? null;
  },

  /**
   * Delete equipment record for a card
   * Used when a card is deleted
   */
  async deleteEquipment(cardId: string): Promise<void> {
    const db = await getDB();
    await db.delete("cardEquipment", cardId);
  },

  /**
   * Clear all equipment records (useful for testing)
   */
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear("cardEquipment");
  },
};
