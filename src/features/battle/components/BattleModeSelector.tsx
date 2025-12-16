/**
 * BattleModeSelector Component - Toggle between Classic and Arena battle modes
 * Requirements: 1.1, 1.2, 1.3
 */

import { cn } from "@/lib/utils";
import { Swords, Grid3X3 } from "lucide-react";
import type { BattleMode, BattleModeOption } from "./battleModeConfig";

// Re-export types from config
export type { BattleMode, BattleModeOption };

export interface BattleModeSelectorProps {
  selectedMode: BattleMode;
  onModeChange: (mode: BattleMode) => void;
  className?: string;
}

interface BattleModeOptionWithIcon extends BattleModeOption {
  icon: React.ReactNode;
}

const BATTLE_MODES: BattleModeOptionWithIcon[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Instant combat - cards fight immediately",
    icon: <Swords className="h-6 w-6" />,
  },
  {
    id: "arena",
    label: "Arena",
    description: "1D arena - cards move and fight when adjacent",
    icon: <Grid3X3 className="h-6 w-6" />,
  },
];

/**
 * BattleModeSelector Component
 * Displays toggle UI for selecting between Classic and Arena battle modes
 * - Classic Mode: Combat starts immediately
 * - Arena Mode: Cards move on 8-cell arena, combat when adjacent
 */
export function BattleModeSelector({
  selectedMode,
  onModeChange,
  className,
}: BattleModeSelectorProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-medium text-muted-foreground text-center">
        Battle Mode
      </label>
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        {BATTLE_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onModeChange(mode.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-md transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
              aria-pressed={isSelected}
              aria-label={`Select ${mode.label} mode: ${mode.description}`}
            >
              <div
                className={cn(
                  "transition-colors",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              >
                {mode.icon}
              </div>
              <span className="font-medium text-sm">{mode.label}</span>
              <span className="text-xs text-muted-foreground text-center leading-tight">
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BattleModeSelector;
