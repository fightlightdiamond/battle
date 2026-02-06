/**
 * GameStats - Display game statistics (timer, matches, score)
 */

import { Clock, Target, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface GameStatsProps {
  elapsedTime: number;
  matchedPairs: number;
  totalPairs: number;
  wrongAttempts: number;
  timeLimit?: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function GameStats({
  elapsedTime,
  matchedPairs,
  totalPairs,
  wrongAttempts,
  timeLimit,
}: GameStatsProps) {
  const progress = totalPairs > 0 ? (matchedPairs / totalPairs) * 100 : 0;
  const isTimeCritical = timeLimit && elapsedTime >= timeLimit * 0.8;

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">
            {matchedPairs} / {totalPairs}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Timer */}
        <div className="flex items-center gap-2">
          <Clock
            className={`w-5 h-5 ${
              isTimeCritical
                ? "text-red-400 animate-pulse"
                : "text-muted-foreground"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Time</span>
            <span
              className={`font-mono font-bold ${
                isTimeCritical ? "text-red-400" : ""
              }`}
            >
              {formatTime(elapsedTime)}
              {timeLimit && (
                <span className="text-muted-foreground">
                  /{formatTime(timeLimit)}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Matches */}
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-green-400" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Matched</span>
            <span className="font-mono font-bold text-green-400">
              {matchedPairs}
            </span>
          </div>
        </div>

        {/* Wrong attempts */}
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Mistakes</span>
            <span
              className={`font-mono font-bold ${
                wrongAttempts === 0 ? "text-green-400" : "text-yellow-400"
              }`}
            >
              {wrongAttempts}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
