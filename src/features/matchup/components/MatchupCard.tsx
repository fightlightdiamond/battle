/**
 * MatchupCard Component - Displays a matchup between two cards
 * Requirements: 2.2
 * - Display two cards facing each other
 * - Show card names, images, and key stats
 * - Show total bets on each side
 * - Show matchup status badge
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Coins, Swords, Trophy, Clock, XCircle, Play } from "lucide-react";
import type { Matchup, MatchupStatus } from "../types/matchup";

export interface CardInfo {
  id: string;
  name: string;
  imageUrl?: string;
  stats?: {
    hp?: number;
    atk?: number;
    def?: number;
    spd?: number;
  };
}

export interface MatchupCardProps {
  /** The matchup data */
  matchup: Matchup;
  /** Card 1 info with image and stats */
  card1Info?: CardInfo;
  /** Card 2 info with image and stats */
  card2Info?: CardInfo;
  /** Total bets placed on card 1 */
  card1TotalBets?: number;
  /** Total bets placed on card 2 */
  card2TotalBets?: number;
  /** Whether this card is clickable */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get status badge variant and label
 */
function getStatusBadge(status: MatchupStatus): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case "pending":
      return {
        variant: "secondary",
        label: "Pending",
        icon: <Clock className="h-3 w-3" />,
      };
    case "in_progress":
      return {
        variant: "default",
        label: "In Progress",
        icon: <Play className="h-3 w-3" />,
      };
    case "completed":
      return {
        variant: "outline",
        label: "Completed",
        icon: <Trophy className="h-3 w-3" />,
      };
    case "cancelled":
      return {
        variant: "destructive",
        label: "Cancelled",
        icon: <XCircle className="h-3 w-3" />,
      };
  }
}

/**
 * MatchupCard Component
 * Displays two cards facing each other with matchup info
 */
export function MatchupCard({
  matchup,
  card1Info,
  card2Info,
  card1TotalBets = 0,
  card2TotalBets = 0,
  onClick,
  className,
}: MatchupCardProps) {
  const statusBadge = getStatusBadge(matchup.status);
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-all",
        isClickable && "cursor-pointer hover:border-primary/50 hover:shadow-md",
        className
      )}
      onClick={onClick}
      data-testid="matchup-card"
    >
      {/* Header with status badge */}
      <div className="flex items-center justify-between mb-4">
        <Badge variant={statusBadge.variant} className="gap-1">
          {statusBadge.icon}
          {statusBadge.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(matchup.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Cards facing each other */}
      <div className="flex items-center justify-between gap-4">
        {/* Card 1 */}
        <CardDisplay
          name={matchup.card1Name}
          imageUrl={card1Info?.imageUrl}
          stats={card1Info?.stats}
          totalBets={card1TotalBets}
          isWinner={matchup.winnerId === matchup.card1Id}
          isLoser={
            matchup.status === "completed" &&
            matchup.winnerId !== matchup.card1Id
          }
        />

        {/* VS Divider */}
        <div className="flex flex-col items-center gap-1">
          <Swords className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-bold text-muted-foreground">VS</span>
        </div>

        {/* Card 2 */}
        <CardDisplay
          name={matchup.card2Name}
          imageUrl={card2Info?.imageUrl}
          stats={card2Info?.stats}
          totalBets={card2TotalBets}
          isWinner={matchup.winnerId === matchup.card2Id}
          isLoser={
            matchup.status === "completed" &&
            matchup.winnerId !== matchup.card2Id
          }
        />
      </div>

      {/* Winner announcement for completed matchups */}
      {matchup.status === "completed" && matchup.winnerName && (
        <div className="mt-4 pt-4 border-t text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-600">
            <Trophy className="h-5 w-5" />
            <span className="font-semibold">{matchup.winnerName} wins!</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual card display within the matchup
 */
interface CardDisplayProps {
  name: string;
  imageUrl?: string;
  stats?: {
    hp?: number;
    atk?: number;
    def?: number;
    spd?: number;
  };
  totalBets: number;
  isWinner?: boolean;
  isLoser?: boolean;
}

function CardDisplay({
  name,
  imageUrl,
  stats,
  totalBets,
  isWinner = false,
  isLoser = false,
}: CardDisplayProps) {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center p-3 rounded-lg border transition-all",
        isWinner && "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
        isLoser && "opacity-50 grayscale",
        !isWinner && !isLoser && "border-border"
      )}
    >
      {/* Winner badge */}
      {isWinner && (
        <div className="mb-2">
          <Badge className="bg-yellow-500 text-yellow-900">
            <Trophy className="h-3 w-3 mr-1" />
            Winner
          </Badge>
        </div>
      )}

      {/* Card image */}
      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted mb-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-3xl">🃏</span>
          </div>
        )}
      </div>

      {/* Card name */}
      <h4 className="font-semibold text-sm text-center truncate w-full mb-1">
        {name}
      </h4>

      {/* Stats */}
      {stats && (
        <div className="flex gap-2 text-xs text-muted-foreground mb-2">
          {stats.hp !== undefined && <span>HP:{stats.hp}</span>}
          {stats.atk !== undefined && <span>ATK:{stats.atk}</span>}
        </div>
      )}

      {/* Total bets */}
      <div className="flex items-center gap-1 text-xs">
        <Coins className="h-3 w-3 text-yellow-500" />
        <span className="text-yellow-600 font-medium">
          {totalBets.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default MatchupCard;
