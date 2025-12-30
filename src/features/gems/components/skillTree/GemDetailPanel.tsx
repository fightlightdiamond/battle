// ============================================================================
// GEM DETAIL PANEL COMPONENT
// ============================================================================

import { useMemo } from "react";
import { useSkillTreeConfig } from "../../hooks/useSkillTreeConfig";
import type { TieredGem } from "../../types/gemTier";
import type { EvolutionPath } from "../../types/evolutionPath";
import type { NodeState, PlayerResources } from "../../types/skillTree";

interface EvolutionOption {
  path: EvolutionPath;
  targetGem: TieredGem;
  canAfford: boolean;
}

interface GemDetailPanelProps {
  gem: TieredGem | null;
  state: NodeState | null;
  paths: EvolutionPath[];
  gems: TieredGem[];
  playerResources: PlayerResources;
  ownedGemIds: Set<string>;
  onEvolve?: (pathId: string) => void;
  onClose?: () => void;
}

/**
 * GemDetailPanel - Side panel showing selected gem details and evolution options
 *
 * Features:
 * - Displays gem name, tier, skill type, and stats
 * - Shows available evolution paths with costs
 * - Indicates which evolutions the player can afford
 * - Provides evolve button for available evolutions
 *
 * Requirements: 3.5
 */
export function GemDetailPanel({
  gem,
  state,
  paths,
  gems,
  playerResources,
  ownedGemIds,
  onEvolve,
  onClose,
}: GemDetailPanelProps) {
  const config = useSkillTreeConfig();

  // Find evolution options from this gem
  const evolutionOptions = useMemo<EvolutionOption[]>(() => {
    if (!gem) return [];

    return paths
      .filter((path) => path.sourceGemId === gem.id)
      .map((path) => {
        const targetGem = gems.find((g) => g.id === path.targetGemId);
        if (!targetGem) return null;

        const canAfford = playerResources.gold >= path.cost.gold;

        return {
          path,
          targetGem,
          canAfford,
        };
      })
      .filter((option): option is EvolutionOption => option !== null);
  }, [gem, paths, gems, playerResources.gold]);

  // Empty state when no gem is selected
  if (!gem) {
    return (
      <div className="w-80 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-3">💎</div>
          <p className="font-medium">Select a gem</p>
          <p className="text-sm mt-1">
            Click on a gem in the skill tree to view its details
          </p>
        </div>
      </div>
    );
  }

  const tierConfig = config.tiers[gem.tier];
  const skillConfig = config.skillTypes[gem.skillType];
  const stateStyle = state ? config.nodeStyle.states[state] : null;

  return (
    <div className="w-80 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header with close button */}
      <div
        className="p-4 border-b border-gray-200"
        style={{ backgroundColor: `${tierConfig.color}10` }}
      >
        <div className="flex items-start justify-between">
          <div>
            {/* Tier badge */}
            <span
              className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white uppercase"
              style={{ backgroundColor: tierConfig.color }}
            >
              {tierConfig.name}
            </span>
            {/* Gem name */}
            <h3 className="text-lg font-bold text-gray-900 mt-2">{gem.name}</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Gem details */}
      <div className="p-4 space-y-4">
        {/* Ownership status */}
        {state && stateStyle && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: stateStyle.backgroundColor,
              color:
                state === "owned" || state === "available"
                  ? "#059669"
                  : "#6B7280",
            }}
          >
            <span>
              {state === "owned" && "✓ Owned"}
              {state === "available" && "✓ Owned - Can Evolve"}
              {state === "locked" && "🔒 Locked"}
              {state === "unowned" && "○ Not Owned"}
            </span>
          </div>
        )}

        {/* Skill type */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{skillConfig.icon}</span>
          <div>
            <p className="font-medium" style={{ color: skillConfig.color }}>
              {skillConfig.label}
            </p>
            <p className="text-xs text-gray-500">Skill Type</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-gray-900">
              {gem.activationChance}%
            </p>
            <p className="text-xs text-gray-500">Activation Chance</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-gray-900">
              {gem.cooldown === 0 ? "None" : `${gem.cooldown}t`}
            </p>
            <p className="text-xs text-gray-500">Cooldown</p>
          </div>
        </div>

        {/* Trigger */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-900 capitalize">
            {gem.trigger}
          </p>
          <p className="text-xs text-gray-500">Trigger Type</p>
        </div>

        {/* Description */}
        {gem.description && (
          <div>
            <p className="text-sm text-gray-600">{gem.description}</p>
          </div>
        )}
      </div>

      {/* Evolution options */}
      {evolutionOptions.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3">
            Evolution Paths
          </h4>
          <div className="space-y-2">
            {evolutionOptions.map(({ path, targetGem, canAfford }) => {
              const targetTierConfig = config.tiers[targetGem.tier];
              const isOwned = ownedGemIds.has(gem.id);
              const canEvolveThis = isOwned && canAfford;

              return (
                <div
                  key={path.id}
                  className={`
                    p-3 rounded-lg border transition-all
                    ${
                      canEvolveThis
                        ? "border-amber-300 bg-amber-50"
                        : "border-gray-200 bg-gray-50"
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: targetTierConfig.color }}
                      >
                        {targetTierConfig.name}
                      </span>
                      <span className="font-medium text-sm text-gray-900">
                        {targetGem.name}
                      </span>
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        canAfford ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      <span>💰</span>
                      <span className="font-medium">{path.cost.gold}</span>
                      <span className="text-gray-400 text-xs">
                        / {playerResources.gold}
                      </span>
                    </div>

                    {/* Evolve button */}
                    {onEvolve && canEvolveThis && (
                      <button
                        onClick={() => onEvolve(path.id)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded transition-colors"
                      >
                        Evolve
                      </button>
                    )}
                    {!canEvolveThis && !isOwned && (
                      <span className="text-xs text-gray-400">
                        Own gem first
                      </span>
                    )}
                    {!canEvolveThis && isOwned && !canAfford && (
                      <span className="text-xs text-red-400">
                        Need more gold
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No evolutions message */}
      {evolutionOptions.length === 0 && (
        <div className="border-t border-gray-200 p-4">
          <p className="text-sm text-gray-500 text-center">
            {gem.tier === "legendary"
              ? "This is a Legendary gem - maximum tier reached!"
              : "No evolution paths available for this gem"}
          </p>
        </div>
      )}
    </div>
  );
}
