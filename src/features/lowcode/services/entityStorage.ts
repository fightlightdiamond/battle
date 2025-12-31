import type { EntityDefinition } from "../types/entityDefinition";

/**
 * localStorage key for storing entities
 */
const STORAGE_KEY = "lowcode-entities";

/**
 * Storage format version for future migrations
 */
const STORAGE_VERSION = 1;

/**
 * Storage format interface
 */
interface StoredEntities {
  entities: EntityDefinition[];
  version: number;
}

/**
 * Gets the stored entities data from localStorage
 */
function getStoredData(): StoredEntities {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { entities: [], version: STORAGE_VERSION };
    }

    const parsed = JSON.parse(data) as StoredEntities;

    // Validate structure
    if (!parsed.entities || !Array.isArray(parsed.entities)) {
      console.warn("Invalid stored data structure, resetting to empty state");
      return { entities: [], version: STORAGE_VERSION };
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse stored entities:", error);
    return { entities: [], version: STORAGE_VERSION };
  }
}

/**
 * Saves the entities data to localStorage
 */
function setStoredData(data: StoredEntities): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError") {
      throw new Error(
        "localStorage is full. Please delete some entities or export your data.",
      );
    }
    throw new Error("Failed to save to localStorage");
  }
}

/**
 * Saves an entity definition to localStorage
 * If entity with same ID exists, it will be updated
 * Returns the saved entity with updated timestamp
 */
export function saveEntity(entity: EntityDefinition): EntityDefinition {
  const data = getStoredData();
  const now = Date.now();

  const entityToSave: EntityDefinition = {
    ...entity,
    updatedAt: now,
  };

  const existingIndex = data.entities.findIndex((e) => e.id === entity.id);

  if (existingIndex >= 0) {
    // Update existing entity
    data.entities[existingIndex] = entityToSave;
  } else {
    // Add new entity
    entityToSave.createdAt = now;
    data.entities.push(entityToSave);
  }

  setStoredData(data);
  return entityToSave;
}

/**
 * Loads an entity definition from localStorage by ID
 * Returns null if not found
 */
export function loadEntity(entityId: string): EntityDefinition | null {
  const data = getStoredData();
  return data.entities.find((e) => e.id === entityId) || null;
}

/**
 * Deletes an entity definition from localStorage by ID
 * Returns true if entity was found and deleted, false otherwise
 */
export function deleteEntity(entityId: string): boolean {
  const data = getStoredData();
  const initialLength = data.entities.length;

  data.entities = data.entities.filter((e) => e.id !== entityId);

  if (data.entities.length < initialLength) {
    setStoredData(data);
    return true;
  }

  return false;
}

/**
 * Lists all saved entity definitions from localStorage
 * Returns entities sorted by updatedAt (most recent first)
 */
export function listEntities(): EntityDefinition[] {
  const data = getStoredData();
  return [...data.entities].sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Clears all stored entities from localStorage
 * Use with caution!
 */
export function clearAllEntities(): void {
  setStoredData({ entities: [], version: STORAGE_VERSION });
}

/**
 * Checks if an entity with the given ID exists in storage
 */
export function entityExists(entityId: string): boolean {
  const data = getStoredData();
  return data.entities.some((e) => e.id === entityId);
}
