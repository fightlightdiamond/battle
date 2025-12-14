/**
 * BetResultOverlay Component - Displays bet result after battle ends
 * Requirements: 3.4
 * - Display bet result after battle ends
 * - Show win/lose status and payout amount
 * - Integrate with VictoryOverlay
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Trophy, Frown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BetRecord } from "../types/betting";

export interface BetResultOverlayProps {
  /** The resolved bet record */
  betResult: BetRecord | null;
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Callback when overlay is dismissed */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * BetResultOverlay Component
 * Shows the result of a bet after battle concludes
 */
export function BetResultOverlay({
  betResult,
  isVisible,
  onDismiss,
  className,
}: BetResultOverlayProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible && betResult) {
      // Delay content animation for dramatic effect
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => {
        clearTimeout(timer);
        setShowContent(false);
      };
    }
    return () => setShowContent(false);
  }, [isVisible, betResult]);

  if (!betResult) return null;

  const isWin = betResult.result === "win";
  const netResult = isWin
    ? betResult.payoutAmount - betResult.betAmount
    : -betResult.betAmount;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            "bg-black/60 backdrop-blur-sm",
            className
          )}
          onClick={onDismiss}
          data-testid="bet-result-overlay"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "relative rounded-2xl p-8 max-w-md w-full mx-4",
              "shadow-2xl border-2",
              isWin
                ? "bg-gradient-to-br from-yellow-900/90 to-amber-900/90 border-yellow-500"
                : "bg-gradient-to-br from-gray-900/90 to-slate-900/90 border-gray-500"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative glow */}
            {isWin && (
              <div className="absolute inset-0 rounded-2xl bg-yellow-500/20 blur-xl -z-10" />
            )}

            {/* Result Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={showContent ? { scale: 1, rotate: 0 } : {}}
              transition={{ type: "spring", damping: 10, delay: 0.1 }}
              className="flex justify-center mb-6"
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center",
                  isWin
                    ? "bg-yellow-500 text-yellow-900"
                    : "bg-gray-500 text-gray-900"
                )}
              >
                {isWin ? (
                  <Trophy className="h-10 w-10" />
                ) : (
                  <Frown className="h-10 w-10" />
                )}
              </div>
            </motion.div>

            {/* Result Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={showContent ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.2 }}
              className={cn(
                "text-3xl font-bold text-center mb-2",
                isWin ? "text-yellow-400" : "text-gray-400"
              )}
            >
              {isWin ? "YOU WON!" : "YOU LOST"}
            </motion.h2>

            {/* Bet Details */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={showContent ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
              className="space-y-3 mb-6"
            >
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Your Pick:</span>
                <span className="font-medium text-white">
                  {betResult.selectedCardName}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Winner:</span>
                <span
                  className={cn(
                    "font-medium",
                    isWin ? "text-yellow-400" : "text-red-400"
                  )}
                >
                  {betResult.winnerCardName}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Bet Amount:</span>
                <span className="font-medium text-white flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  {betResult.betAmount.toLocaleString()}
                </span>
              </div>
            </motion.div>

            {/* Payout/Loss Display */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={showContent ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.4, type: "spring" }}
              className={cn(
                "rounded-xl p-4 text-center",
                isWin ? "bg-yellow-500/20" : "bg-red-500/20"
              )}
            >
              <p className="text-sm text-gray-400 mb-1">
                {isWin ? "Payout" : "Lost"}
              </p>
              <div
                className={cn(
                  "text-3xl font-bold flex items-center justify-center gap-2",
                  isWin ? "text-yellow-400" : "text-red-400"
                )}
              >
                <Coins className="h-8 w-8" />
                <span>
                  {isWin ? "+" : ""}
                  {netResult.toLocaleString()}
                </span>
              </div>
              {isWin && (
                <p className="text-xs text-gray-400 mt-1">
                  (2x your bet amount)
                </p>
              )}
            </motion.div>

            {/* Dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={showContent ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
              className="text-center text-xs text-gray-500 mt-4"
            >
              Click anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BetResultOverlay;
