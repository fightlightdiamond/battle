// ============================================================================
// GEM NODE COMPONENT
// ============================================================================

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { GemNodeData } from "../../types/skillTree";
import { useSkillTreeConfig } from "../../hooks/useSkillTreeConfig";

/**
 * GemNode - Custom React Flow node component for displaying gems in the skill tree
 *
 * Features:
 * - Displays tier badge with tier-specific color
 * - Shows gem name, skill type icon/label, and activation chance
 * - Applies styling based on node state (owned, available, locked, unowned)
 * - Handles highlighting for skill type filtering
 * - Includes React Flow handles for edge connections
 *
 * Requirements: 3.1, 4.1, 4.2, 4.3, 4.4
 */
export const GemNode = memo(({ data }: NodeProps<GemNodeData>) => {
  const config = useSkillTreeConfig();
  const { gem, state, isHighlighted } = data;
  const stateStyle = config.nodeStyle.states[state];
  const tierConfig = config.tiers[gem.tier];
  const skillConfig = config.skillTypes[gem.skillType];

  return (
    <div
      style={{
        width: config.nodeStyle.width,
        height: config.nodeStyle.height,
        borderRadius: config.nodeStyle.borderRadius,
        border: `${config.nodeStyle.borderWidth}px solid ${stateStyle.borderColor}`,
        backgroundColor: stateStyle.backgroundColor,
        opacity: isHighlighted ? stateStyle.opacity : 0.3,
        boxShadow: stateStyle.glow,
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}
    >
      {/* Input handle (left side) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: tierConfig.color,
          width: 10,
          height: 10,
        }}
      />

      {/* Tier badge */}
      <div
        style={{
          backgroundColor: tierConfig.color,
          color: "white",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "10px",
          fontWeight: "bold",
          alignSelf: "flex-start",
          textTransform: "uppercase",
        }}
      >
        {tierConfig.name}
      </div>

      {/* Gem name */}
      <div
        style={{
          fontWeight: "bold",
          marginTop: "4px",
          fontSize: "14px",
          color: "#1F2937",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {gem.name}
      </div>

      {/* Skill type */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          color: skillConfig.color,
          fontSize: "12px",
          marginTop: "4px",
        }}
      >
        <span>{skillConfig.icon}</span>
        <span>{skillConfig.label}</span>
      </div>

      {/* Activation chance */}
      <div
        style={{
          fontSize: "11px",
          color: "#6B7280",
          marginTop: "auto",
        }}
      >
        {gem.activationChance}% chance
      </div>

      {/* Output handle (right side) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: tierConfig.color,
          width: 10,
          height: 10,
        }}
      />
    </div>
  );
});

GemNode.displayName = "GemNode";
