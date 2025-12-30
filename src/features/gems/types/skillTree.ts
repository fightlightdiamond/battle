// ============================================================================
// SKILL TREE TYPES
// ============================================================================

import type { Node, Edge } from "reactflow";
import { type TieredGem } from "./gemTier";
import { type EvolutionPath } from "./evolutionPath";
import { type SkillType } from "./gem";

/**
 * Node state for styling - determines visual appearance based on ownership and availability
 */
export type NodeState = "owned" | "available" | "locked" | "unowned";

/**
 * Custom node data for React Flow gem nodes
 */
export interface GemNodeData {
  gem: TieredGem;
  state: NodeState;
  isHighlighted: boolean; // For filtering by skill type
}

/**
 * Custom edge data for React Flow evolution edges
 */
export interface EvolutionEdgeData {
  evolutionPath: EvolutionPath;
  canAfford: boolean;
}

/**
 * React Flow node type for gems
 */
export type GemFlowNode = Node<GemNodeData>;

/**
 * React Flow edge type for evolution paths
 */
export type EvolutionFlowEdge = Edge<EvolutionEdgeData>;

/**
 * Skill tree state - complete state for the skill tree visualization
 */
export interface SkillTreeState {
  nodes: GemFlowNode[];
  edges: EvolutionFlowEdge[];
  selectedNodeId: string | null;
  filterSkillType: SkillType | null;
}

/**
 * Player gem ownership data
 */
export interface PlayerGems {
  playerId: string;
  gemIds: string[];
}

/**
 * Player resources for evolution
 */
export interface PlayerResources {
  gold: number;
  materials: Record<string, number>;
}
