// ============================================================================
// EVOLUTION MODAL COMPONENT
// ============================================================================

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { useSkillTreeConfig } from "../../hooks/useSkillTreeConfig";
import type { TieredGem } from "../../types/gemTier";
import type { EvolutionPath } from "../../types/evolutionPath";
import type { PlayerResources } from "../../types/skillTree";

interface EvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  sourceGem: TieredGem | null;
  targetGem: TieredGem | null;
  evolutionPath: EvolutionPath | null;
  playerResources: PlayerResources;
}

/**
 * EvolutionModal - Confirmation dialog for gem evolution
 *
 * Features:
 * - Displays source and target gem details
 * - Shows evolution cost breakdown
 * - Indicates if player can afford the evolution
 * - Confirm/cancel buttons
 * - Loading state during evolution execution
 *
 * Requirements: 5.1, 5.5
 */
export function EvolutionModal({
  isOpen,
  onClose,
  onConfirm,
  sourceGem,
  targetGem,
  evolutionPath,
  playerResources,
}: EvolutionModalProps) {
  const config = useSkillTreeConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Early return if missing data
  if (!sourceGem || !targetGem || !evolutionPath) {
    return null;
  }

  const sourceTierConfig = config.tiers[sourceGem.tier];
  const targetTierConfig = config.tiers[targetGem.tier];
  const sourceSkillConfig = config.skillTypes[sourceGem.skillType];
  const targetSkillConfig = config.skillTypes[targetGem.skillType];

  // Check if player can afford
  const canAffordGold = playerResources.gold >= evolutionPath.cost.gold;
  const canAffordMaterials = evolutionPath.cost.materials
    ? Object.entries(evolutionPath.cost.materials).every(
        ([materialId, required]) =>
          (playerResources.materials[materialId] || 0) >= required,
      )
    : true;
  const canAfford = canAffordGold && canAffordMaterials;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evolution failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>✨</span>
            <span>Evolve Gem</span>
          </DialogTitle>
          <DialogDescription>
            Transform your gem into a more powerful version
          </DialogDescription>
        </DialogHeader>

        {/* Evolution visualization */}
        <div className="flex items-center justify-center gap-4 py-4">
          {/* Source gem */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center p-2"
              style={{
                borderColor: sourceTierConfig.color,
                backgroundColor: `${sourceTierConfig.color}10`,
              }}
            >
              <span className="text-2xl">{sourceSkillConfig.icon}</span>
              <span
                className="text-xs font-bold px-1 rounded text-white mt-1"
                style={{ backgroundColor: sourceTierConfig.color }}
              >
                {sourceTierConfig.name}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 text-center max-w-20 truncate">
              {sourceGem.name}
            </span>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center">
            <span className="text-2xl text-amber-500">→</span>
          </div>

          {/* Target gem */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center p-2"
              style={{
                borderColor: targetTierConfig.color,
                backgroundColor: `${targetTierConfig.color}10`,
              }}
            >
              <span className="text-2xl">{targetSkillConfig.icon}</span>
              <span
                className="text-xs font-bold px-1 rounded text-white mt-1"
                style={{ backgroundColor: targetTierConfig.color }}
              >
                {targetTierConfig.name}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 text-center max-w-20 truncate">
              {targetGem.name}
            </span>
          </div>
        </div>

        {/* Stat comparison */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Stat Changes</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Activation:</span>
              <span>
                <span className="text-gray-400">
                  {sourceGem.activationChance}%
                </span>
                <span className="mx-1">→</span>
                <span className="text-green-600 font-medium">
                  {targetGem.activationChance}%
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cooldown:</span>
              <span>
                <span className="text-gray-400">
                  {sourceGem.cooldown === 0 ? "None" : `${sourceGem.cooldown}t`}
                </span>
                <span className="mx-1">→</span>
                <span className="text-green-600 font-medium">
                  {targetGem.cooldown === 0 ? "None" : `${targetGem.cooldown}t`}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="border rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">
            Evolution Cost
          </h4>

          {/* Gold cost */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <span className="text-sm text-gray-600">Gold</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-bold ${
                  canAffordGold ? "text-green-600" : "text-red-500"
                }`}
              >
                {evolutionPath.cost.gold.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400">
                / {playerResources.gold.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Material costs */}
          {evolutionPath.cost.materials &&
            Object.entries(evolutionPath.cost.materials).map(
              ([materialId, required]) => {
                const available = playerResources.materials[materialId] || 0;
                const canAffordThis = available >= required;
                return (
                  <div
                    key={materialId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📦</span>
                      <span className="text-sm text-gray-600 capitalize">
                        {materialId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          canAffordThis ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {required}
                      </span>
                      <span className="text-xs text-gray-400">
                        / {available}
                      </span>
                    </div>
                  </div>
                );
              },
            )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Warning if can't afford */}
        {!canAfford && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            ⚠️ You don't have enough resources for this evolution
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canAfford || isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Evolving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>✨</span>
                Evolve
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
