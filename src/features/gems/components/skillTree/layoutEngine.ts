// ============================================================================
// SKILL TREE LAYOUT ENGINE
// ============================================================================

import type { TieredGem, GemTier } from "../../types/gemTier";
import type { EvolutionPath } from "../../types/evolutionPath";
import type {
  GemFlowNode,
  EvolutionFlowEdge,
  NodeState,
  GemNodeData,
  EvolutionEdgeData,
} from "../../types/skillTree";
import type { SkillTreeConfig } from "../../config/skillTreeConfig";
import type { SkillType } from "../../types/gem";

// ============================================================================
// POSITION CALCULATION
// ============================================================================

/**
 * Calculate node positions based on tier grouping
 * - Groups gems by tier
 * - Calculates x-position based on tier (left to right: Basic → Legendary)
 * - Distributes y-positions evenly within each tier
 *
 * @param gems - Array of tiered gems to position
 * @param config - Skill tree configuration with layout parameters
 * @returns Map of gem ID to {x, y} position
 *
 * Requirements: 9.1, 9.2, 9.4
 */
export function calculateNodePositions(
  gems: TieredGem[],
  config: SkillTreeConfig,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Group gems by tier
  const gemsByTier = new Map<GemTier, TieredGem[]>();
  for (const gem of gems) {
    const tierGems = gemsByTier.get(gem.tier) || [];
    tierGems.push(gem);
    gemsByTier.set(gem.tier, tierGems);
  }

  // Calculate positions for each tier
  for (const [tier, tierGems] of gemsByTier) {
    const tierConfig = config.tiers[tier];
    const x =
      config.layout.padding + tierConfig.xPosition * config.layout.tierSpacing;

    // Distribute nodes vertically with even spacing
    const totalHeight = (tierGems.length - 1) * config.layout.nodeSpacing;
    const startY = (config.layout.canvasHeight - totalHeight) / 2;

    tierGems.forEach((gem, index) => {
      positions.set(gem.id, {
        x,
        y: startY + index * config.layout.nodeSpacing,
      });
    });
  }

  return positions;
}

// ============================================================================
// NODE STATE DETERMINATION
// ============================================================================

/**
 * Determine the visual state of a node based on ownership and evolution availability
 *
 * State logic:
 * - "available": Player owns the gem AND has available evolutions from it
 * - "owned": Player owns the gem but no available evolutions
 * - "locked": Player doesn't own the gem but owns a prerequisite (source gem in a path to this gem)
 * - "unowned": Player doesn't own the gem and has no owned prerequisite
 *
 * @param gemId - ID of the gem to check
 * @param ownedGemIds - Set of gem IDs the player owns
 * @param availableEvolutions - Set of gem IDs that have available evolution paths
 * @param pathTargetToSources - Map of target gem ID to source gem IDs (for prerequisite checking)
 * @returns NodeState indicating the visual state
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function getNodeState(
  gemId: string,
  ownedGemIds: Set<string>,
  availableEvolutions: Set<string>,
  pathTargetToSources: Map<string, string[]>,
): NodeState {
  const isOwned = ownedGemIds.has(gemId);

  if (isOwned) {
    // Player owns this gem
    if (availableEvolutions.has(gemId)) {
      return "available"; // Has evolutions available
    }
    return "owned"; // No evolutions available
  }

  // Player doesn't own this gem - check if they own a prerequisite
  const sourceGemIds = pathTargetToSources.get(gemId) || [];
  const hasOwnedPrerequisite = sourceGemIds.some((sourceId) =>
    ownedGemIds.has(sourceId),
  );

  if (hasOwnedPrerequisite) {
    return "locked"; // Has prerequisite but doesn't own this gem
  }

  return "unowned"; // No owned prerequisite
}

// ============================================================================
// GEMS TO NODES CONVERSION
// ============================================================================

/**
 * Convert TieredGem array to GemFlowNode array for React Flow
 *
 * @param gems - Array of tiered gems
 * @param ownedGemIds - Set of gem IDs the player owns
 * @param availableEvolutions - Set of gem IDs that have available evolution paths
 * @param paths - Evolution paths for prerequisite checking
 * @param config - Skill tree configuration
 * @param filterSkillType - Optional skill type filter (null = no filter)
 * @returns Array of React Flow nodes
 *
 * Requirements: 3.1, 3.2
 */
export function gemsToNodes(
  gems: TieredGem[],
  ownedGemIds: Set<string>,
  availableEvolutions: Set<string>,
  paths: EvolutionPath[],
  config: SkillTreeConfig,
  filterSkillType: SkillType | null = null,
): GemFlowNode[] {
  // Calculate positions for all gems
  const positions = calculateNodePositions(gems, config);

  // Build target-to-sources map for prerequisite checking
  const pathTargetToSources = new Map<string, string[]>();
  for (const path of paths) {
    const sources = pathTargetToSources.get(path.targetGemId) || [];
    sources.push(path.sourceGemId);
    pathTargetToSources.set(path.targetGemId, sources);
  }

  // Convert each gem to a React Flow node
  return gems.map((gem): GemFlowNode => {
    const position = positions.get(gem.id) || { x: 0, y: 0 };
    const state = getNodeState(
      gem.id,
      ownedGemIds,
      availableEvolutions,
      pathTargetToSources,
    );

    // Determine highlighting based on filter
    const isHighlighted =
      filterSkillType === null || gem.skillType === filterSkillType;

    const data: GemNodeData = {
      gem,
      state,
      isHighlighted,
    };

    return {
      id: gem.id,
      type: "gemNode",
      position,
      data,
    };
  });
}

// ============================================================================
// PATHS TO EDGES CONVERSION
// ============================================================================

/**
 * Check if player can afford an evolution cost
 *
 * @param cost - Evolution cost to check
 * @param playerGold - Player's current gold
 * @param playerMaterials - Player's current materials
 * @returns true if player can afford the evolution
 *
 * Requirements: 7.3, 7.4
 */
export function canAffordEvolution(
  cost: { gold: number; materials?: Record<string, number> },
  playerGold: number,
  playerMaterials: Record<string, number>,
): boolean {
  // Check gold requirement
  if (playerGold < cost.gold) {
    return false;
  }

  // Check material requirements if any
  if (cost.materials) {
    for (const [materialId, requiredAmount] of Object.entries(cost.materials)) {
      const playerAmount = playerMaterials[materialId] || 0;
      if (playerAmount < requiredAmount) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Convert EvolutionPath array to EvolutionFlowEdge array for React Flow
 *
 * @param paths - Array of evolution paths
 * @param playerGold - Player's current gold
 * @param playerMaterials - Player's current materials
 * @returns Array of React Flow edges
 *
 * Requirements: 3.3, 7.1, 7.3, 7.4
 */
export function pathsToEdges(
  paths: EvolutionPath[],
  playerGold: number,
  playerMaterials: Record<string, number>,
): EvolutionFlowEdge[] {
  return paths.map((path): EvolutionFlowEdge => {
    const canAfford = canAffordEvolution(
      path.cost,
      playerGold,
      playerMaterials,
    );

    const data: EvolutionEdgeData = {
      evolutionPath: path,
      canAfford,
    };

    return {
      id: path.id,
      source: path.sourceGemId,
      target: path.targetGemId,
      type: "evolutionEdge",
      data,
    };
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build a set of gem IDs that have available evolutions
 * (gems that are sources in evolution paths)
 *
 * @param paths - Array of evolution paths
 * @returns Set of gem IDs that have evolution paths from them
 */
export function buildAvailableEvolutionsSet(
  paths: EvolutionPath[],
): Set<string> {
  const availableEvolutions = new Set<string>();
  for (const path of paths) {
    availableEvolutions.add(path.sourceGemId);
  }
  return availableEvolutions;
}

/**
 * Build a map from target gem ID to source gem IDs
 * Used for prerequisite checking
 *
 * @param paths - Array of evolution paths
 * @returns Map of target gem ID to array of source gem IDs
 */
export function buildPathTargetToSourcesMap(
  paths: EvolutionPath[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const path of paths) {
    const sources = map.get(path.targetGemId) || [];
    sources.push(path.sourceGemId);
    map.set(path.targetGemId, sources);
  }
  return map;
}
