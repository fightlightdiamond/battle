// ============================================================================
// EVOLUTION EDGE COMPONENT
// ============================================================================

import { memo } from "react";
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from "reactflow";
import type { EvolutionEdgeData } from "../../types/skillTree";
import { useSkillTreeConfig } from "../../hooks/useSkillTreeConfig";

/**
 * EvolutionEdge - Custom React Flow edge component for displaying evolution paths
 *
 * Features:
 * - Renders bezier path between source and target nodes
 * - Displays evolution cost label on the edge
 * - Colors edge based on whether player can afford the evolution
 * - Uses config-driven styling
 *
 * Requirements: 3.3, 7.1, 7.3, 7.4
 */
export const EvolutionEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
  }: EdgeProps<EvolutionEdgeData>) => {
    const config = useSkillTreeConfig();

    // Handle case where data might be undefined
    if (!data) {
      return null;
    }

    const { evolutionPath, canAfford } = data;

    // Calculate bezier path
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    // Determine edge color based on affordability
    const strokeColor = canAfford ? "#10B981" : config.edgeStyle.strokeColor;
    const labelColor = canAfford ? "#10B981" : "#EF4444";

    return (
      <>
        {/* Edge path */}
        <path
          id={id}
          d={edgePath}
          stroke={strokeColor}
          strokeWidth={config.edgeStyle.strokeWidth}
          fill="none"
          markerEnd={markerEnd}
          style={{
            transition: "stroke 0.2s ease-in-out",
          }}
        />

        {/* Animated path overlay for available evolutions */}
        {canAfford && config.edgeStyle.animated && (
          <path
            d={edgePath}
            stroke={strokeColor}
            strokeWidth={config.edgeStyle.strokeWidth}
            fill="none"
            strokeDasharray="5,5"
            style={{
              animation: "dash 1s linear infinite",
            }}
          />
        )}

        {/* Cost label */}
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: config.edgeStyle.labelBackground,
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
              color: labelColor,
              border: `1px solid ${canAfford ? "#10B981" : "#E5E7EB"}`,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              pointerEvents: "all",
              cursor: "default",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            className="nodrag nopan"
          >
            <span>💰</span>
            <span>{evolutionPath.cost.gold}</span>
          </div>
        </EdgeLabelRenderer>

        {/* CSS animation for dashed line */}
        <style>
          {`
            @keyframes dash {
              to {
                stroke-dashoffset: -10;
              }
            }
          `}
        </style>
      </>
    );
  },
);

EvolutionEdge.displayName = "EvolutionEdge";
