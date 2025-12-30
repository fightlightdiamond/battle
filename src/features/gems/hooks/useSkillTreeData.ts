// ============================================================================
// USE SKILL TREE DATA HOOK
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { SkillType } from "../types/gem";
import type { TieredGem } from "../types/gemTier";
import type { EvolutionPath } from "../types/evolutionPath";
import type {
  GemFlowNode,
  EvolutionFlowEdge,
  PlayerResources,
} from "../types/skillTree";
import { useSkillTreeConfig } from "./useSkillTreeConfig";
import {
  gemsToNodes,
  pathsToEdges,
  buildAvailableEvolutionsSet,
} from "../components/skillTree/layoutEngine";

// API base URL from environment variable with fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

/**
 * Query keys for skill tree data
 */
export const skillTreeKeys = {
  all: ["skillTree"] as const,
  gems: () => [...skillTreeKeys.all, "gems"] as const,
  paths: () => [...skillTreeKeys.all, "paths"] as const,
  playerGems: (playerId: string) =>
    [...skillTreeKeys.all, "playerGems", playerId] as const,
  playerResources: (playerId: string) =>
    [...skillTreeKeys.all, "playerResources", playerId] as const,
};

/**
 * Fetch all tiered gems from the API
 */
async function fetchTieredGems(): Promise<TieredGem[]> {
  const response = await fetch(`${API_BASE_URL}/gems`);
  if (!response.ok) {
    throw new Error("Failed to fetch gems");
  }
  const gems = await response.json();
  // Ensure all gems have a tier (default to "basic" if missing)
  return gems.map((gem: TieredGem) => ({
    ...gem,
    tier: gem.tier || "basic",
  }));
}

/**
 * Fetch all evolution paths from the API
 */
async function fetchEvolutionPaths(): Promise<EvolutionPath[]> {
  const response = await fetch(`${API_BASE_URL}/evolutionPaths`);
  if (!response.ok) {
    throw new Error("Failed to fetch evolution paths");
  }
  return response.json();
}

/**
 * Fetch player's owned gem IDs
 */
async function fetchPlayerGems(playerId: string): Promise<string[]> {
  const response = await fetch(
    `${API_BASE_URL}/playerGems?playerId=${playerId}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch player gems");
  }
  const data = await response.json();
  if (data.length === 0) {
    return [];
  }
  return data[0].gemIds || [];
}

/**
 * Fetch player's resources (gold and materials)
 */
async function fetchPlayerResources(
  playerId: string,
): Promise<PlayerResources> {
  const response = await fetch(
    `${API_BASE_URL}/playerResources?playerId=${playerId}`,
  );
  if (!response.ok) {
    // Return default resources if not found
    return { gold: 0, materials: {} };
  }
  const data = await response.json();
  if (data.length === 0) {
    return { gold: 0, materials: {} };
  }
  return {
    gold: data[0].gold || 0,
    materials: data[0].materials || {},
  };
}

/**
 * Return type for useSkillTreeData hook
 */
export interface SkillTreeData {
  nodes: GemFlowNode[];
  edges: EvolutionFlowEdge[];
  gems: TieredGem[];
  paths: EvolutionPath[];
  ownedGemIds: Set<string>;
  playerResources: PlayerResources;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * useSkillTreeData - Hook to fetch and transform skill tree data
 *
 * Fetches gems, evolution paths, and player data from json-server,
 * then transforms them into React Flow nodes and edges.
 *
 * Features:
 * - Fetches all tiered gems and evolution paths
 * - Fetches player ownership and resources
 * - Applies skill type filtering
 * - Generates React Flow nodes and edges
 *
 * Requirements: 6.1, 6.2, 6.3, 8.3
 *
 * @param filterSkillType - Optional skill type to filter/highlight
 * @param playerId - Player ID for ownership and resource data (defaults to "player-1")
 */
export function useSkillTreeData(
  filterSkillType: SkillType | null = null,
  playerId: string = "player-1",
): SkillTreeData {
  const config = useSkillTreeConfig();

  // Fetch gems
  const gemsQuery = useQuery({
    queryKey: skillTreeKeys.gems(),
    queryFn: fetchTieredGems,
  });

  // Fetch evolution paths
  const pathsQuery = useQuery({
    queryKey: skillTreeKeys.paths(),
    queryFn: fetchEvolutionPaths,
  });

  // Fetch player gems
  const playerGemsQuery = useQuery({
    queryKey: skillTreeKeys.playerGems(playerId),
    queryFn: () => fetchPlayerGems(playerId),
  });

  // Fetch player resources
  const playerResourcesQuery = useQuery({
    queryKey: skillTreeKeys.playerResources(playerId),
    queryFn: () => fetchPlayerResources(playerId),
  });

  // Combine loading and error states
  const isLoading =
    gemsQuery.isLoading ||
    pathsQuery.isLoading ||
    playerGemsQuery.isLoading ||
    playerResourcesQuery.isLoading;

  const isError =
    gemsQuery.isError ||
    pathsQuery.isError ||
    playerGemsQuery.isError ||
    playerResourcesQuery.isError;

  const error =
    gemsQuery.error ||
    pathsQuery.error ||
    playerGemsQuery.error ||
    playerResourcesQuery.error;

  // Extract data with stable references
  const gems = useMemo<TieredGem[]>(
    () => gemsQuery.data || [],
    [gemsQuery.data],
  );
  const paths = useMemo<EvolutionPath[]>(
    () => pathsQuery.data || [],
    [pathsQuery.data],
  );
  const ownedGemIds = useMemo(
    () => new Set(playerGemsQuery.data || []),
    [playerGemsQuery.data],
  );
  const playerResources = useMemo<PlayerResources>(
    () => playerResourcesQuery.data || { gold: 0, materials: {} },
    [playerResourcesQuery.data],
  );

  // Build available evolutions set (gems that have evolution paths from them)
  const availableEvolutions = useMemo(
    () => buildAvailableEvolutionsSet(paths),
    [paths],
  );

  // Generate React Flow nodes
  const nodes = useMemo(() => {
    if (gems.length === 0) {
      return [];
    }
    return gemsToNodes(
      gems,
      ownedGemIds,
      availableEvolutions,
      paths,
      config,
      filterSkillType,
    );
  }, [gems, ownedGemIds, availableEvolutions, paths, config, filterSkillType]);

  // Generate React Flow edges
  const edges = useMemo(() => {
    if (paths.length === 0) {
      return [];
    }
    return pathsToEdges(paths, playerResources.gold, playerResources.materials);
  }, [paths, playerResources.gold, playerResources.materials]);

  // Refetch all data
  const refetch = () => {
    gemsQuery.refetch();
    pathsQuery.refetch();
    playerGemsQuery.refetch();
    playerResourcesQuery.refetch();
  };

  return {
    nodes,
    edges,
    gems,
    paths,
    ownedGemIds,
    playerResources,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Apply skill type filter to nodes
 * Updates isHighlighted property based on filter
 *
 * Requirements: 6.1, 6.2, 6.3
 */
export function applySkillTypeFilter(
  nodes: GemFlowNode[],
  filterSkillType: SkillType | null,
): GemFlowNode[] {
  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      isHighlighted:
        filterSkillType === null || node.data.gem.skillType === filterSkillType,
    },
  }));
}
