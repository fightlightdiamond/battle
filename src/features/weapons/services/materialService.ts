// ============================================================================
// ENHANCEMENT MATERIAL SERVICE (JSON-SERVER API)
// ============================================================================

import type {
  EnhanceMaterial,
  EnhanceMaterialType,
} from "../types/enhancement";
import {
  DEFAULT_MATERIAL_QUANTITIES,
  MATERIAL_INFO,
} from "../types/enhancement";

const API_BASE_URL = "http://localhost:3001";
const PLAYER_ID = "player-1"; // Default player

/**
 * Player resources from API
 */
interface PlayerResources {
  id: string;
  playerId: string;
  gold: number;
  materials: Record<EnhanceMaterialType, number>;
}

/**
 * In-memory cache for materials (synced with API)
 */
const materialCache: Map<EnhanceMaterialType, EnhanceMaterial> = new Map();
let initialized = false;
let resourceId: string | null = null;

/**
 * Generate a unique ID for materials
 */
function generateMaterialId(): string {
  return `mat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Fetch player resources from API
 */
async function fetchPlayerResources(): Promise<PlayerResources | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/playerResources?playerId=${PLAYER_ID}`,
    );
    if (!response.ok) return null;
    const resources = (await response.json()) as PlayerResources[];
    return resources[0] ?? null;
  } catch (error) {
    console.error("[MaterialService] Failed to fetch resources:", error);
    return null;
  }
}

/**
 * Save player resources to API
 */
async function savePlayerResources(
  materials: Record<EnhanceMaterialType, number>,
): Promise<boolean> {
  try {
    if (!resourceId) {
      // Create new resource
      const response = await fetch(`${API_BASE_URL}/playerResources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `player-resources-${PLAYER_ID}`,
          playerId: PLAYER_ID,
          gold: 5000,
          materials,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        resourceId = data.id;
      }
      return response.ok;
    }

    // Update existing resource
    const response = await fetch(
      `${API_BASE_URL}/playerResources/${resourceId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materials }),
      },
    );
    return response.ok;
  } catch (error) {
    console.error("[MaterialService] Failed to save resources:", error);
    return false;
  }
}

/**
 * Convert cache to materials record for API
 */
function cacheToRecord(): Record<EnhanceMaterialType, number> {
  const record: Record<string, number> = {};
  for (const [type, material] of materialCache.entries()) {
    record[type] = material.quantity;
  }
  return record as Record<EnhanceMaterialType, number>;
}

/**
 * Sync materials to API (debounced)
 */
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
function syncMaterialsToAPI(): void {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    await savePlayerResources(cacheToRecord());
  }, 500);
}

/**
 * Initialize materials from API or create defaults
 */
export async function initializeDefaultMaterialsAsync(): Promise<void> {
  if (initialized) return;

  const resources = await fetchPlayerResources();
  const now = Date.now();

  if (
    resources &&
    resources.materials &&
    Object.keys(resources.materials).length > 0
  ) {
    // Load from API
    resourceId = resources.id;
    for (const [type, quantity] of Object.entries(resources.materials)) {
      const materialType = type as EnhanceMaterialType;
      const info = MATERIAL_INFO[materialType];
      if (info) {
        materialCache.set(materialType, {
          id: generateMaterialId(),
          type: materialType,
          name: info.name,
          description: info.description,
          quantity: quantity as number,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  } else {
    // Create defaults
    if (resources) {
      resourceId = resources.id;
    }
    for (const [type, quantity] of Object.entries(
      DEFAULT_MATERIAL_QUANTITIES,
    )) {
      const materialType = type as EnhanceMaterialType;
      const info = MATERIAL_INFO[materialType];

      materialCache.set(materialType, {
        id: generateMaterialId(),
        type: materialType,
        name: info.name,
        description: info.description,
        quantity,
        createdAt: now,
        updatedAt: now,
      });
    }
    // Save defaults to API
    await savePlayerResources(cacheToRecord());
  }

  initialized = true;
}

/**
 * Initialize default materials (sync version for compatibility)
 */
export function initializeDefaultMaterials(): void {
  if (initialized) return;

  // Start async initialization
  initializeDefaultMaterialsAsync().catch(console.error);

  // Also set defaults immediately for sync access
  const now = Date.now();
  for (const [type, quantity] of Object.entries(DEFAULT_MATERIAL_QUANTITIES)) {
    const materialType = type as EnhanceMaterialType;
    const info = MATERIAL_INFO[materialType];

    if (!materialCache.has(materialType)) {
      materialCache.set(materialType, {
        id: generateMaterialId(),
        type: materialType,
        name: info.name,
        description: info.description,
        quantity,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

/**
 * Get all materials
 */
export function getAllMaterials(): EnhanceMaterial[] {
  initializeDefaultMaterials();
  return Array.from(materialCache.values());
}

/**
 * Get material by type
 */
export function getMaterial(type: EnhanceMaterialType): EnhanceMaterial | null {
  initializeDefaultMaterials();
  return materialCache.get(type) ?? null;
}

/**
 * Get material quantity
 */
export function getMaterialQuantity(type: EnhanceMaterialType): number {
  const material = getMaterial(type);
  return material?.quantity ?? 0;
}

/**
 * Check if player has enough materials
 */
export function hasMaterial(
  type: EnhanceMaterialType,
  quantity: number,
): boolean {
  return getMaterialQuantity(type) >= quantity;
}

/**
 * Consume materials (reduce quantity)
 */
export function consumeMaterial(
  type: EnhanceMaterialType,
  quantity: number,
): boolean {
  initializeDefaultMaterials();

  const material = materialCache.get(type);
  if (!material || material.quantity < quantity) {
    return false;
  }

  materialCache.set(type, {
    ...material,
    quantity: material.quantity - quantity,
    updatedAt: Date.now(),
  });

  syncMaterialsToAPI();
  return true;
}

/**
 * Add materials (increase quantity)
 */
export function addMaterial(type: EnhanceMaterialType, quantity: number): void {
  initializeDefaultMaterials();

  const material = materialCache.get(type);
  if (!material) {
    const info = MATERIAL_INFO[type];
    const now = Date.now();
    materialCache.set(type, {
      id: generateMaterialId(),
      type,
      name: info.name,
      description: info.description,
      quantity,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    materialCache.set(type, {
      ...material,
      quantity: material.quantity + quantity,
      updatedAt: Date.now(),
    });
  }
  syncMaterialsToAPI();
}

/**
 * Reset materials to default (for testing)
 */
export function resetMaterials(): void {
  materialCache.clear();
  initialized = false;
  initializeDefaultMaterials();
  syncMaterialsToAPI();
}

/**
 * Clear all materials (for testing)
 */
export function clearMaterials(): void {
  materialCache.clear();
  initialized = false;
}

/**
 * Material Service object for easier imports
 */
export const MaterialService = {
  initialize: initializeDefaultMaterials,
  initializeAsync: initializeDefaultMaterialsAsync,
  getAll: getAllMaterials,
  get: getMaterial,
  getQuantity: getMaterialQuantity,
  has: hasMaterial,
  consume: consumeMaterial,
  add: addMaterial,
  reset: resetMaterials,
  clear: clearMaterials,
};
