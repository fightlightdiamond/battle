/**
 * GameCard - Interactive card for matching game
 * Includes VFX effects for match/mismatch states
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SuccessVFX, FailVFX } from "@/components/vfx";
import type { GameCard as GameCardType } from "../types";

interface GameCardProps {
  card: GameCardType;
  onClick: (id: string) => void;
  disabled?: boolean;
}

export function GameCard({ card, onClick, disabled = false }: GameCardProps) {
  const handleClick = () => {
    if (!disabled && !card.isMatched) {
      onClick(card.id);
    }
  };

  // Wrap with VFX based on card state
  const CardContent = (
    <motion.button
      onClick={handleClick}
      disabled={disabled || card.isMatched}
      className={cn(
        "relative w-full h-full min-h-[100px] p-4 rounded-xl border-2 transition-all",
        "flex items-center justify-center text-center",
        "font-medium text-sm md:text-base",
        // Base state
        "bg-card hover:bg-accent/50",
        // Type styling
        card.type === "english"
          ? "border-blue-500/50 text-blue-100"
          : "border-emerald-500/50 text-emerald-100",
        // Selected state
        card.isSelected &&
          !card.isWrong &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background",
        // Wrong state - remove border styling, VFX will handle it
        card.isWrong && "border-transparent",
        // Matched state - remove border styling, VFX will handle it
        card.isMatched && "opacity-80 cursor-not-allowed border-transparent",
        // Disabled
        disabled && "cursor-not-allowed opacity-70",
      )}
      initial={{ scale: 1 }}
      animate={{
        scale: card.isSelected ? 1.02 : 1,
      }}
      whileHover={!disabled && !card.isMatched ? { scale: 1.02 } : {}}
      whileTap={!disabled && !card.isMatched ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Type indicator */}
      <div
        className={cn(
          "absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold",
          card.type === "english"
            ? "bg-blue-500/30 text-blue-300"
            : "bg-emerald-500/30 text-emerald-300",
        )}
      >
        {card.type === "english" ? "EN" : "VI"}
      </div>

      {/* Content */}
      <span className={cn("mt-4", card.isMatched && "line-through")}>
        {card.content}
      </span>

      {/* Matched indicator */}
      {card.isMatched && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-12 h-12 rounded-full bg-green-500/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </motion.div>
      )}

      {/* Wrong indicator */}
      {card.isWrong && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </motion.div>
      )}
    </motion.button>
  );

  // Apply VFX based on state
  if (card.isMatched) {
    return <SuccessVFX className="rounded-xl">{CardContent}</SuccessVFX>;
  }

  if (card.isWrong) {
    return <FailVFX className="rounded-xl">{CardContent}</FailVFX>;
  }

  return CardContent;
}
