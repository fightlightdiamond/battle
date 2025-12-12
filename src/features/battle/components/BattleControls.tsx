/**
 * BattleControls Component - Action buttons for battle control
 * Requirements: 3.1, 7.1, 7.2, 7.3, 5.5
 */

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { BattlePhase } from "../types";
import { BATTLE_PHASES } from "../types/battle";

export interface BattleControlsProps {
  phase: BattlePhase;
  isAutoBattle: boolean;
  onAttack: () => void;
  onToggleAuto: () => void;
  onNewBattle: () => void;
  className?: string;
}

/**
 * BattleControls Component
 * Provides action buttons for controlling the battle:
 * - Attack button: Execute a single attack (enabled only in 'fighting' phase)
 * - Auto-battle toggle: Start/pause automatic battle execution
 * - New Battle button: Reset and start a new battle (visible in 'finished' phase)
 */
export function BattleControls({
  phase,
  isAutoBattle,
  onAttack,
  onToggleAuto,
  onNewBattle,
  className,
}: BattleControlsProps) {
  const isFighting = phase === BATTLE_PHASES.FIGHTING;
  const isFinished = phase === BATTLE_PHASES.FINISHED;

  // Attack button is only enabled during fighting phase and when not in auto-battle
  const canAttack = isFighting && !isAutoBattle;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 p-4 rounded-lg bg-card border",
        className
      )}
    >
      {/* Attack Button - Requirement 3.1: Execute attack on click */}
      {!isFinished && (
        <Button
          variant="default"
          size="lg"
          onClick={onAttack}
          disabled={!canAttack}
          className="min-w-[120px] bg-red-600 hover:bg-red-700 text-white"
        >
          <span className="mr-2">⚔️</span>
          Attack
        </Button>
      )}

      {/* Auto-Battle Toggle - Requirements 7.1, 7.2, 7.3 */}
      {isFighting && (
        <Button
          variant={isAutoBattle ? "destructive" : "secondary"}
          size="lg"
          onClick={onToggleAuto}
          className="min-w-[120px]"
        >
          {isAutoBattle ? (
            <>
              <span className="mr-2">⏸️</span>
              Pause
            </>
          ) : (
            <>
              <span className="mr-2">▶️</span>
              Auto Battle
            </>
          )}
        </Button>
      )}

      {/* New Battle Button - Requirement 5.5: Display after battle ends */}
      {isFinished && (
        <Button
          variant="default"
          size="lg"
          onClick={onNewBattle}
          className="min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
        >
          <span className="mr-2">🔄</span>
          New Battle
        </Button>
      )}
    </div>
  );
}

export default BattleControls;
