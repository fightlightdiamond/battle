// ============================================================================
// EVOLUTION SERVICE
// ============================================================================

import type {
  EvolutionPath,
  EvolutionPathInput,
  EvolutionValidationResult,
  EvolutionResult,
} from "../types/evolutionPath";
import type { TieredGem } from "../types/gemTier";
import { isTierHigher } from "../types/gemTier";

// API base URL from environment variable with fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

/**
 * Generate a UUID v4
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * EvolutionService - CRUD operations for evolution paths using json-server REST API
 *
 * Requirements:
 * - 2.1: Store source gem, target gem, and evolution cost
 * - 2.2: Validate that target gem tier is higher than source gem tier
 * - 2.3: Remove path without affecting gems
 * - 2.4: Allow multiple evolution paths from a single source gem
 * - 2.5: Prevent circular evolution paths
 * - 8.1: Persist to json-server database
 */
export const EvolutionService = {
  /**
   * Get all evolution paths from the database
   * Requirement: 8.1
   */
  async getAllPaths(): Promise<EvolutionPath[]> {
    const response = await fetch(`${API_BASE_URL}/evolutionPaths`);
    return handleResponse<EvolutionPath[]>(response);
  },

  /**
   * Get a single evolution path by ID
   */
  async getPathById(id: string): Promise<EvolutionPath | null> {
    const response = await fetch(`${API_BASE_URL}/evolutionPaths/${id}`);
    if (response.status === 404) {
      return null;
    }
    return handleResponse<EvolutionPath>(response);
  },

  /**
   * Get all evolution paths from a specific source gem
   * Requirement: 2.4 - Allow multiple paths from single source
   */
  async getPathsFromSource(sourceGemId: string): Promise<EvolutionPath[]> {
    const response = await fetch(
      `${API_BASE_URL}/evolutionPaths?sourceGemId=${sourceGemId}`,
    );
    return handleResponse<EvolutionPath[]>(response);
  },

  /**
   * Get all evolution paths to a specific target gem
   */
  async getPathsToTarget(targetGemId: string): Promise<EvolutionPath[]> {
    const response = await fetch(
      `${API_BASE_URL}/evolutionPaths?targetGemId=${targetGemId}`,
    );
    return handleResponse<EvolutionPath[]>(response);
  },

  /**
   * Validate that an evolution path has valid tier progression
   * Requirement: 2.2 - Target tier must be higher than source tier
   */
  validatePath(
    sourceGem: TieredGem,
    targetGem: TieredGem,
  ): EvolutionValidationResult {
    // Check that target tier is strictly higher than source tier
    if (!isTierHigher(targetGem.tier, sourceGem.tier)) {
      return {
        valid: false,
        error: `Target gem tier (${targetGem.tier}) must be higher than source gem tier (${sourceGem.tier})`,
      };
    }

    return { valid: true };
  },

  /**
   * Check if adding a path would create a circular evolution path
   * Requirement: 2.5 - Prevent circular paths
   *
   * Uses DFS to detect if targetGemId can reach sourceGemId through existing paths
   */
  checkCircularPath(
    sourceGemId: string,
    targetGemId: string,
    existingPaths: EvolutionPath[],
  ): boolean {
    // Build adjacency list from existing paths
    const adjacencyList = new Map<string, string[]>();
    for (const path of existingPaths) {
      const targets = adjacencyList.get(path.sourceGemId) || [];
      targets.push(path.targetGemId);
      adjacencyList.set(path.sourceGemId, targets);
    }

    // Add the proposed new edge temporarily
    const targetsFromTarget = adjacencyList.get(targetGemId) || [];

    // DFS to check if we can reach sourceGemId from targetGemId
    const visited = new Set<string>();
    const stack = [...targetsFromTarget];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current === sourceGemId) {
        // Found a path back to source - this would create a cycle
        return true;
      }

      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      const neighbors = adjacencyList.get(current) || [];
      stack.push(...neighbors);
    }

    return false;
  },

  /**
   * Create a new evolution path
   * Validates tier progression before creating
   *
   * Requirement: 2.1, 2.2, 2.5, 8.1
   */
  async createPath(
    input: EvolutionPathInput,
    sourceGem: TieredGem,
    targetGem: TieredGem,
  ): Promise<EvolutionPath> {
    // Validate tier progression
    const validation = EvolutionService.validatePath(sourceGem, targetGem);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check for circular paths
    const existingPaths = await EvolutionService.getAllPaths();
    if (
      EvolutionService.checkCircularPath(
        input.sourceGemId,
        input.targetGemId,
        existingPaths,
      )
    ) {
      throw new Error(
        "Cannot create evolution path: would create a circular evolution chain",
      );
    }

    const now = getTimestamp();
    const newPath: EvolutionPath = {
      id: generateId(),
      sourceGemId: input.sourceGemId,
      targetGemId: input.targetGemId,
      cost: input.cost,
      createdAt: now,
      updatedAt: now,
    };

    const response = await fetch(`${API_BASE_URL}/evolutionPaths`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newPath),
    });

    return handleResponse<EvolutionPath>(response);
  },

  /**
   * Update an existing evolution path
   * Only allows updating the cost - source and target cannot be changed
   *
   * Requirement: 8.1
   */
  async updatePath(
    id: string,
    input: Partial<Pick<EvolutionPathInput, "cost">>,
  ): Promise<EvolutionPath | null> {
    const existing = await EvolutionService.getPathById(id);
    if (!existing) {
      return null;
    }

    const updatedPath: EvolutionPath = {
      ...existing,
      cost: input.cost ?? existing.cost,
      updatedAt: getTimestamp(),
    };

    const response = await fetch(`${API_BASE_URL}/evolutionPaths/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedPath),
    });

    return handleResponse<EvolutionPath>(response);
  },

  /**
   * Delete an evolution path by ID
   * Requirement: 2.3 - Remove path without affecting gems
   */
  async deletePath(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/evolutionPaths/${id}`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.ok;
  },

  /**
   * Check if a player can evolve a gem
   * Requirement: 5.4
   *
   * Validates:
   * - Player owns the source gem
   * - Player has sufficient gold
   * - Player has sufficient materials (if required)
   */
  canEvolve(
    path: EvolutionPath,
    playerGold: number,
    playerMaterials: Record<string, number>,
    playerGemIds: string[],
  ): boolean {
    // Check if player owns the source gem
    if (!playerGemIds.includes(path.sourceGemId)) {
      return false;
    }

    // Check gold
    if (playerGold < path.cost.gold) {
      return false;
    }

    // Check materials if required
    if (path.cost.materials) {
      for (const [materialId, required] of Object.entries(
        path.cost.materials,
      )) {
        const available = playerMaterials[materialId] || 0;
        if (available < required) {
          return false;
        }
      }
    }

    return true;
  },

  /**
   * Execute an evolution - deduct resources and update player inventory
   * Requirements: 5.1, 5.2, 5.3
   *
   * Note: This is a simplified implementation. In a real app, this would
   * be a transaction that updates multiple resources atomically.
   */
  async executeEvolution(
    pathId: string,
    playerId: string,
    playerGold: number,
    playerMaterials: Record<string, number>,
    playerGemIds: string[],
  ): Promise<EvolutionResult> {
    // Get the evolution path
    const path = await EvolutionService.getPathById(pathId);
    if (!path) {
      return { success: false, error: "Evolution path not found" };
    }

    // Check if player can evolve (owns source gem and has resources)
    if (
      !EvolutionService.canEvolve(
        path,
        playerGold,
        playerMaterials,
        playerGemIds,
      )
    ) {
      // Determine specific error message
      if (!playerGemIds.includes(path.sourceGemId)) {
        return { success: false, error: "Player does not own the source gem" };
      }
      return { success: false, error: "Insufficient resources for evolution" };
    }

    // Calculate new gold and materials
    const newGold = playerGold - path.cost.gold;
    const newMaterials = { ...playerMaterials };
    if (path.cost.materials) {
      for (const [materialId, required] of Object.entries(
        path.cost.materials,
      )) {
        newMaterials[materialId] = (newMaterials[materialId] || 0) - required;
      }
    }

    // Update player gems: remove source, add target
    const newGemIds = playerGemIds.filter((id) => id !== path.sourceGemId);
    newGemIds.push(path.targetGemId);

    // Update player data in database
    try {
      // Update player gems
      const playerGemsResponse = await fetch(
        `${API_BASE_URL}/playerGems?playerId=${playerId}`,
      );
      const playerGemsData =
        await handleResponse<
          Array<{ id: string; playerId: string; gemIds: string[] }>
        >(playerGemsResponse);

      if (playerGemsData.length > 0) {
        const playerGems = playerGemsData[0];
        await fetch(`${API_BASE_URL}/playerGems/${playerGems.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...playerGems,
            gemIds: newGemIds,
          }),
        });
      }

      // Update player resources (if playerResources collection exists)
      const resourcesResponse = await fetch(
        `${API_BASE_URL}/playerResources?playerId=${playerId}`,
      );
      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json();
        if (resourcesData.length > 0) {
          const resources = resourcesData[0];
          await fetch(`${API_BASE_URL}/playerResources/${resources.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...resources,
              gold: newGold,
              materials: newMaterials,
            }),
          });
        }
      }

      return { success: true, newGemId: path.targetGemId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Evolution failed",
      };
    }
  },

  /**
   * Clear all evolution paths from the database (useful for testing)
   */
  async clear(): Promise<void> {
    const paths = await EvolutionService.getAllPaths();
    await Promise.all(
      paths.map((path) => EvolutionService.deletePath(path.id)),
    );
  },
};
