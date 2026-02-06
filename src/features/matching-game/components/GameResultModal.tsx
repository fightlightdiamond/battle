/**
 * GameResultModal - Display game result with reward
 */

import { motion } from "framer-motion";
import {
  Trophy,
  Clock,
  Target,
  Gem,
  Star,
  RotateCcw,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SuccessVFX } from "@/components/vfx";
import type { GameResult } from "../types";

interface GameResultModalProps {
  result: GameResult | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function GameResultModal({
  result,
  isOpen,
  onClose,
  onPlayAgain,
  onGoHome,
}: GameResultModalProps) {
  if (!result) return null;

  const { reward, accuracy, timeSpent, isPerfect, session } = result;
  const totalReward = reward.gems + reward.bonusGems;
  const wrongAttempts = session.attempts.filter((a) => !a.isCorrect).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {isPerfect ? "🎉 Perfect!" : "Game Complete!"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Trophy with VFX */}
          <div className="flex justify-center">
            <SuccessVFX>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center"
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>
            </SuccessVFX>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg"
            >
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs text-muted-foreground">Time</div>
                <div className="font-bold">{formatTime(timeSpent)}</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg"
            >
              <Target className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
                <div className="font-bold">{accuracy}%</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg"
            >
              <Star className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-xs text-muted-foreground">Pairs</div>
                <div className="font-bold">
                  {session.matchedPairs}/{session.totalPairs}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg"
            >
              <div className="w-5 h-5 text-red-400 font-bold text-center">
                ✗
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Mistakes</div>
                <div className="font-bold">{wrongAttempts}</div>
              </div>
            </motion.div>
          </div>

          {/* Reward */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gem className="w-6 h-6 text-purple-400" />
                <span className="font-semibold">Reward</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-300">
                  +{totalReward}
                </div>
                {reward.bonusGems > 0 && (
                  <div className="text-xs text-green-400">
                    +{reward.bonusGems} bonus
                  </div>
                )}
              </div>
            </div>
            {reward.message && (
              <div className="mt-2 text-sm text-muted-foreground">
                {reward.message}
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex gap-3"
          >
            <Button variant="outline" className="flex-1" onClick={onGoHome}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button className="flex-1" onClick={onPlayAgain}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
