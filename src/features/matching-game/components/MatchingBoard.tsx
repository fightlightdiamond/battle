/**
 * MatchingBoard - Grid of game cards
 */

import { motion } from "framer-motion";
import { GameCard } from "./GameCard";
import type { GameCard as GameCardType } from "../types";

interface MatchingBoardProps {
  cards: GameCardType[];
  onCardClick: (id: string) => void;
  disabled?: boolean;
}

export function MatchingBoard({
  cards,
  onCardClick,
  disabled = false,
}: MatchingBoardProps) {
  // Calculate grid columns based on card count
  const columns = cards.length <= 8 ? 4 : cards.length <= 12 ? 4 : 6;

  return (
    <motion.div
      className="grid gap-3 md:gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
    >
      {cards.map((card) => (
        <motion.div
          key={card.id}
          variants={{
            hidden: { opacity: 0, y: 20, scale: 0.8 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
              },
            },
          }}
        >
          <GameCard card={card} onClick={onCardClick} disabled={disabled} />
        </motion.div>
      ))}
    </motion.div>
  );
}
