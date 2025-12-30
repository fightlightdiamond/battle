// ============================================================================
// SKILL TREE PAGE
// ============================================================================

import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../../../components/layouts";
import {
  SkillTreeCanvas,
  FilterBar,
  GemDetailPanel,
  SkillTreeConfigProvider,
  EvolutionModal,
} from "../components/skillTree";
import { useSkillTreeData } from "../hooks/useSkillTreeData";
import { EvolutionService } from "../services/evolutionService";
import type { SkillType } from "../types/gem";
import type { NodeState } from "../types/skillTree";
import type { EvolutionPath } from "../types/evolutionPath";
import type { TieredGem } from "../types/gemTier";

/**
 * SkillTreePage - Main page for viewing and interacting with the gem skill tree
 *
 * Features:
 * - Displays the skill tree canvas with all gems and evolution paths
 * - Provides skill type filtering via FilterBar
 * - Shows selected gem details in GemDetailPanel
 * - Manages selected node state
 * - Handles evolution execution via EvolutionModal
 *
 * Requirements: 3.1, 5.1, 5.5
 */
export function SkillTreePage() {
  // State for skill type filter
  const [filterSkillType, setFilterSkillType] = useState<SkillType | null>(
    null,
  );

  // State for selected gem
  const [selectedGemId, setSelectedGemId] = useState<string | null>(null);

  // State for evolution modal
  const [evolutionModalOpen, setEvolutionModalOpen] = useState(false);
  const [selectedEvolutionPath, setSelectedEvolutionPath] =
    useState<EvolutionPath | null>(null);

  // Fetch skill tree data
  const { gems, paths, ownedGemIds, playerResources, nodes, refetch } =
    useSkillTreeData(filterSkillType);

  // Find selected gem and its state
  const selectedGem = useMemo(() => {
    if (!selectedGemId) return null;
    return gems.find((g) => g.id === selectedGemId) || null;
  }, [selectedGemId, gems]);

  const selectedGemState = useMemo<NodeState | null>(() => {
    if (!selectedGemId) return null;
    const node = nodes.find((n) => n.id === selectedGemId);
    return node?.data.state || null;
  }, [selectedGemId, nodes]);

  // Find source and target gems for evolution modal
  const evolutionSourceGem = useMemo<TieredGem | null>(() => {
    if (!selectedEvolutionPath) return null;
    return gems.find((g) => g.id === selectedEvolutionPath.sourceGemId) || null;
  }, [selectedEvolutionPath, gems]);

  const evolutionTargetGem = useMemo<TieredGem | null>(() => {
    if (!selectedEvolutionPath) return null;
    return gems.find((g) => g.id === selectedEvolutionPath.targetGemId) || null;
  }, [selectedEvolutionPath, gems]);

  // Handle node click
  const handleNodeClick = useCallback((gemId: string) => {
    setSelectedGemId((prev) => (prev === gemId ? null : gemId));
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((skillType: SkillType | null) => {
    setFilterSkillType(skillType);
  }, []);

  // Handle close detail panel
  const handleCloseDetail = useCallback(() => {
    setSelectedGemId(null);
  }, []);

  // Handle evolution request - opens the modal
  const handleEvolve = useCallback(
    (pathId: string) => {
      const path = paths.find((p) => p.id === pathId);
      if (path) {
        setSelectedEvolutionPath(path);
        setEvolutionModalOpen(true);
      }
    },
    [paths],
  );

  // Handle evolution confirmation
  const handleConfirmEvolution = useCallback(async () => {
    if (!selectedEvolutionPath) return;

    const result = await EvolutionService.executeEvolution(
      selectedEvolutionPath.id,
      "player-1", // TODO: Get actual player ID from auth context
      playerResources.gold,
      playerResources.materials,
      Array.from(ownedGemIds),
    );

    if (!result.success) {
      throw new Error(result.error || "Evolution failed");
    }

    // Refresh the skill tree data
    refetch();
  }, [selectedEvolutionPath, playerResources, ownedGemIds, refetch]);

  // Handle modal close
  const handleCloseEvolutionModal = useCallback(() => {
    setEvolutionModalOpen(false);
    setSelectedEvolutionPath(null);
  }, []);

  return (
    <AppLayout>
      <SkillTreeConfigProvider>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gem Skill Tree
              </h1>
              <p className="text-gray-600 mt-1">
                View gem evolution paths and upgrade your gems
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Player gold display */}
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-xl">💰</span>
                <span className="font-bold text-amber-700">
                  {playerResources.gold.toLocaleString()}
                </span>
              </div>
              {/* Link to gems list */}
              <Link
                to="/gems"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                ← Back to Gems
              </Link>
            </div>
          </div>

          {/* Filter bar */}
          <div className="mb-4">
            <FilterBar
              selectedSkillType={filterSkillType}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Main content area */}
          <div className="flex gap-6">
            {/* Skill tree canvas */}
            <div className="flex-1">
              <SkillTreeCanvas
                filterSkillType={filterSkillType}
                onNodeClick={handleNodeClick}
              />
            </div>

            {/* Detail panel */}
            <div className="flex-shrink-0">
              <GemDetailPanel
                gem={selectedGem}
                state={selectedGemState}
                paths={paths}
                gems={gems}
                playerResources={playerResources}
                ownedGemIds={ownedGemIds}
                onEvolve={handleEvolve}
                onClose={handleCloseDetail}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Legend</h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500"></div>
                <span className="text-sm text-gray-600">Owned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500"></div>
                <span className="text-sm text-gray-600">Can Evolve</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-400"></div>
                <span className="text-sm text-gray-600">Locked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300"></div>
                <span className="text-sm text-gray-600">Not Owned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-emerald-500"></div>
                <span className="text-sm text-gray-600">Affordable Path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-gray-400"></div>
                <span className="text-sm text-gray-600">Unaffordable Path</span>
              </div>
            </div>
          </div>
        </div>

        {/* Evolution Modal */}
        <EvolutionModal
          isOpen={evolutionModalOpen}
          onClose={handleCloseEvolutionModal}
          onConfirm={handleConfirmEvolution}
          sourceGem={evolutionSourceGem}
          targetGem={evolutionTargetGem}
          evolutionPath={selectedEvolutionPath}
          playerResources={playerResources}
        />
      </SkillTreeConfigProvider>
    </AppLayout>
  );
}
