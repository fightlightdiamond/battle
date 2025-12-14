/**
 * ReplayControls Component
 *
 * Provides playback controls for battle replay:
 * - Play/Pause button
 * - Speed selector (1x, 2x, 4x)
 * - Progress indicator
 * - Step forward/backward buttons
 *
 * Requirements: 6.4, 6.5
 */

import { Play, Pause, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ReplaySpeed,
  ReplayControls as ReplayControlsType,
} from "../hooks/useReplayState";

/**
 * Props for ReplayControls component
 */
export interface ReplayControlsProps {
  /** Whether replay is currently playing */
  isPlaying: boolean;
  /** Current turn number */
  currentTurn: number;
  /** Total number of turns */
  totalTurns: number;
  /** Current playback speed */
  speed: ReplaySpeed;
  /** Whether replay has completed */
  isComplete: boolean;
  /** Replay control functions */
  controls: ReplayControlsType;
  /** Optional className for styling */
  className?: string;
}

/** Available speed options */
const SPEED_OPTIONS: ReplaySpeed[] = [1, 2, 4];

/**
 * ReplayControls Component
 *
 * Displays playback controls for battle replay with:
 * - Play/Pause toggle button
 * - Speed selector buttons (1x, 2x, 4x)
 * - Progress bar showing current position
 * - Step forward/backward buttons for manual navigation
 * - Reset button to return to beginning
 *
 * Requirements: 6.4, 6.5
 */
export function ReplayControls({
  isPlaying,
  currentTurn,
  totalTurns,
  speed,
  isComplete,
  controls,
  className,
}: ReplayControlsProps) {
  const progressPercent = totalTurns > 0 ? (currentTurn / totalTurns) * 100 : 0;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Progress Bar */}
      <div className="w-full">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Turn {currentTurn}</span>
          <span>{totalTurns} turns total</span>
        </div>
        <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Turn markers */}
          <div className="absolute inset-0 flex justify-between px-0.5">
            {Array.from({ length: Math.min(totalTurns + 1, 20) }).map(
              (_, i) => {
                const turnIndex = Math.round((i / 19) * totalTurns);
                return (
                  <button
                    key={i}
                    className={cn(
                      "w-1 h-full transition-colors",
                      turnIndex <= currentTurn
                        ? "bg-primary-foreground/30"
                        : "bg-muted-foreground/20"
                    )}
                    onClick={() => controls.goToTurn(turnIndex)}
                    title={`Go to turn ${turnIndex}`}
                  />
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-2">
        {/* Reset Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={controls.reset}
          disabled={currentTurn === 0 && !isPlaying}
          title="Reset to beginning"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Previous Turn */}
        <Button
          variant="outline"
          size="icon"
          onClick={controls.prevTurn}
          disabled={currentTurn === 0}
          title="Previous turn"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {/* Play/Pause Button */}
        <Button
          variant="default"
          size="lg"
          onClick={isPlaying ? controls.pause : controls.play}
          className="px-8"
          title={isPlaying ? "Pause" : isComplete ? "Replay" : "Play"}
        >
          {isPlaying ? (
            <>
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </>
          ) : isComplete ? (
            <>
              <RotateCcw className="h-5 w-5 mr-2" />
              Replay
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Play
            </>
          )}
        </Button>

        {/* Next Turn */}
        <Button
          variant="outline"
          size="icon"
          onClick={controls.nextTurn}
          disabled={currentTurn >= totalTurns}
          title="Next turn"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 ml-4 border rounded-lg p-1">
          {SPEED_OPTIONS.map((speedOption) => (
            <Button
              key={speedOption}
              variant={speed === speedOption ? "default" : "ghost"}
              size="sm"
              onClick={() => controls.setSpeed(speedOption)}
              className={cn(
                "min-w-[3rem]",
                speed === speedOption && "pointer-events-none"
              )}
              title={`${speedOption}x speed`}
            >
              {speedOption}x
            </Button>
          ))}
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center text-sm text-muted-foreground">
        {isComplete ? (
          <span className="text-amber-500 font-medium">Battle Complete</span>
        ) : isPlaying ? (
          <span>Playing at {speed}x speed...</span>
        ) : currentTurn === 0 ? (
          <span>Press Play to start replay</span>
        ) : (
          <span>Paused at turn {currentTurn}</span>
        )}
      </div>
    </div>
  );
}

export default ReplayControls;
