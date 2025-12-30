// ============================================================================
// SKILL TREE CANVAS COMPONENT
// ============================================================================

import { useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import { GemNode } from "./GemNode";
import { EvolutionEdge } from "./EvolutionEdge";
import { useSkillTreeData } from "../../hooks/useSkillTreeData";
import type { SkillType } from "../../types/gem";

/**
 * Custom node types for React Flow
 */
const nodeTypes: NodeTypes = {
  gemNode: GemNode,
};

/**
 * Custom edge types for React Flow
 */
const edgeTypes: EdgeTypes = {
  evolutionEdge: EvolutionEdge,
};

/**
 * Default edge options with arrow marker
 */
const defaultEdgeOptions = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: "#9CA3AF",
  },
};

interface SkillTreeCanvasProps {
  filterSkillType: SkillType | null;
  onNodeClick: (gemId: string) => void;
  playerId?: string;
}

/**
 * SkillTreeCanvas - Main React Flow canvas for displaying the gem skill tree
 *
 * Features:
 * - Renders gems as custom nodes with tier-based positioning
 * - Renders evolution paths as custom edges with cost labels
 * - Supports pan and zoom interactions
 * - Includes Background, Controls, and MiniMap
 * - Handles node click events for gem selection
 *
 * Requirements: 3.1, 3.6
 */
export function SkillTreeCanvas({
  filterSkillType,
  onNodeClick,
  playerId = "player-1",
}: SkillTreeCanvasProps) {
  const {
    nodes: initialNodes,
    edges: initialEdges,
    isLoading,
    isError,
    error,
  } = useSkillTreeData(filterSkillType, playerId);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick(node.id);
    },
    [onNodeClick],
  );

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center w-full h-full min-h-[500px]"
        style={{
          backgroundColor: "#F9FAFB",
          borderRadius: "8px",
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skill tree...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div
        className="flex items-center justify-center w-full h-full min-h-[500px]"
        style={{
          backgroundColor: "#FEF2F2",
          borderRadius: "8px",
        }}
      >
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load skill tree</p>
          <p className="text-red-500 text-sm mt-2">
            {error?.message || "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full h-full min-h-[500px]"
        style={{
          backgroundColor: "#F9FAFB",
          borderRadius: "8px",
        }}
      >
        <div className="text-center">
          <p className="text-gray-600">No gems available</p>
          <p className="text-gray-500 text-sm mt-2">
            Create some gems to see the skill tree
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full min-h-[500px]"
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        minZoom={0.3}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#E5E7EB" gap={20} />
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="top-right"
        />
        <MiniMap
          nodeColor={(node) => {
            const state = node.data?.state;
            switch (state) {
              case "owned":
                return "#10B981";
              case "available":
                return "#F59E0B";
              case "locked":
                return "#6B7280";
              default:
                return "#D1D5DB";
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
}
