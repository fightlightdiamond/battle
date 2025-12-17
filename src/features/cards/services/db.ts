import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";
import type { Card } from "../types";
import type { SyncQueueItem } from "./syncQueue";
import type { Weapon } from "../../weapons/types/weapon";

// Stored weapon type (without runtime imageUrl)
export type StoredWeapon = Omit<Weapon, "imageUrl">;

// Card-Weapon equipment relationship
export interface CardEquipment {
  cardId: string;
  weaponId: string | null;
  equippedAt: number | null;
}

// Database schema definition
interface CardGameDB extends DBSchema {
  cards: {
    key: string;
    value: Omit<Card, "imageUrl">; // imageUrl is generated at runtime
    indexes: {
      "by-name": string;
      "by-createdAt": number;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      "by-cardId": string;
      "by-timestamp": number;
    };
  };
  weapons: {
    key: string;
    value: StoredWeapon;
    indexes: {
      "by-name": string;
      "by-createdAt": number;
    };
  };
  cardEquipment: {
    key: string; // cardId
    value: CardEquipment;
    indexes: {
      "by-weapon": string;
    };
  };
}

const DB_NAME = "card-game-db";
const DB_VERSION = 3; // Bumped for weapons and cardEquipment stores

let dbInstance: IDBPDatabase<CardGameDB> | null = null;

/**
 * Initialize and get the IndexedDB database instance
 * Handles database versioning and migrations
 */
export async function getDB(): Promise<IDBPDatabase<CardGameDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<CardGameDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Version 1: Initial schema
      if (oldVersion < 1) {
        const cardStore = db.createObjectStore("cards", { keyPath: "id" });
        cardStore.createIndex("by-name", "name");
        cardStore.createIndex("by-createdAt", "createdAt");
      }
      // Version 2: Add syncQueue store
      if (oldVersion < 2) {
        const syncQueueStore = db.createObjectStore("syncQueue", {
          keyPath: "id",
        });
        syncQueueStore.createIndex("by-cardId", "cardId");
        syncQueueStore.createIndex("by-timestamp", "timestamp");
      }
      // Version 3: Add weapons and cardEquipment stores
      if (oldVersion < 3) {
        const weaponStore = db.createObjectStore("weapons", { keyPath: "id" });
        weaponStore.createIndex("by-name", "name");
        weaponStore.createIndex("by-createdAt", "createdAt");

        const equipmentStore = db.createObjectStore("cardEquipment", {
          keyPath: "cardId",
        });
        equipmentStore.createIndex("by-weapon", "weaponId");
      }
    },
    blocked() {
      console.warn("Database upgrade blocked. Please close other tabs.");
    },
    blocking() {
      // Close the database if another tab needs to upgrade
      dbInstance?.close();
      dbInstance = null;
    },
    terminated() {
      dbInstance = null;
    },
  });

  return dbInstance;
}

/**
 * Close the database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Delete the entire database (useful for testing)
 */
export async function deleteDB(): Promise<void> {
  await closeDB();
  const { deleteDB: idbDeleteDB } = await import("idb");
  await idbDeleteDB(DB_NAME);
}

export type { CardGameDB };
