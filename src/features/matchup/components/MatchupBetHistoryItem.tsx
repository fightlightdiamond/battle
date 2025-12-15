/**
 * MatchupBetHistoryItem Component - Displays a single bet history item
 * Requirements: 7.2
 * - Display matchup info, bet amount, selected card
 * - Show result (won/lost/cancelled/refunded)
 * - Show payout amount for won bets
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Trophy,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { MatchupBet, BetStatus } from "../types/matchup";

export interface MatchupInfo {
  card1Name: string;
  card2Name: string;
  winnerName?: string | null;
}

export interface MatchupBetHistoryItemProps {
  /** The bet record */
  bet: MatchupBet;
  /** Matchup info for context */
  matchupInfo?: MatchupInfo;
  /** Callback when item is clicked */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get status badge configuration
 */
function getStatusConfig(status: BetStatus): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
  icon: React.ReactNode;
  colorClass: string;
} {
  switch (status) {
    case "active":
      return {
        variant: "secondary",
        label: "Active",
        icon: <Clock className="h-3 w-3" />,
        colorClass: "text-blue-600",
      };
    case "won":
      return {
        variant: "default",
        label: "Won",
        icon: <Trophy className="h-3 w-3" />,
        colorClass: "text-green-600",
      };
    case "lost":
      return {
        variant: "destructive",
        label: "Lost",
        icon: <TrendingDown className="h-3 w-3" />,
        colorClass: "text-red-600",
      };
    case "cancelled":
      return {
        variant: "outline",
        label: "Cancelled",
        icon: <XCircle className="h-3 w-3" />,
        colorClass: "text-gray-600",
      };
    case "refunded":
      return {
        variant: "outline",
        label: "Refunded",
        icon: <RefreshCw className="h-3 w-3" />,
        colorClass: "text-orange-600",
      };
  }
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * MatchupBetHistoryItem Component
 * Displays a single bet history entry with all relevant info
 */
export function MatchupBetHistoryItem({
  bet,
  matchupInfo,
  onClick,
  className,
}: MatchupBetHistoryItemProps) {
  const statusConfig = getStatusConfig(bet.status);
  const isClickable = !!onClick;

  // Calculate net result
  const netResult =
    bet.status === "won" && bet.payoutAmount
      ? bet.payoutAmount - bet.betAmount
      : bet.status === "lost"
      ? -bet.betAmount
      : 0;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-all",
        isClickable && "cursor-pointer hover:border-primary/50 hover:shadow-md",
        bet.status === "won" &&
          "border-green-200 bg-green-50/50 dark:bg-green-900/10",
        bet.status === "lost" &&
          "border-red-200 bg-red-50/50 dark:bg-red-900/10",
        className
      )}
      onClick={onClick}
      data-testid="matchup-bet-history-item"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant={statusConfig.variant} className="gap-1">
          {statusConfig.icon}
          {statusConfig.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDate(bet.createdAt)}
        </span>
      </div>

      {/* Matchup info */}
      {matchupInfo && (
        <div className="mb-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {matchupInfo.card1Name}
          </span>
          {" vs "}
          <span className="font-medium text-foreground">
            {matchupInfo.card2Name}
          </span>
        </div>
      )}

      {/* Bet details */}
      <div className="space-y-2">
        {/* Selected card */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Your pick:</span>
          <span className="font-medium">{bet.selectedCardName}</span>
        </div>

        {/* Bet amount */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Bet amount:</span>
          <div className="flex items-center gap-1">
            <Coins className="h-3 w-3 text-yellow-500" />
            <span className="font-medium text-yellow-600">
              {bet.betAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payout for won bets */}
        {bet.status === "won" && bet.payoutAmount && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payout:</span>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">
                +{bet.payoutAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Winner info for resolved bets */}
        {matchupInfo?.winnerName &&
          (bet.status === "won" || bet.status === "lost") && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Winner:</span>
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-yellow-500" />
                <span className="font-medium">{matchupInfo.winnerName}</span>
              </div>
            </div>
          )}
      </div>

      {/* Net result summary */}
      {(bet.status === "won" || bet.status === "lost") && (
        <div
          className={cn(
            "mt-3 pt-3 border-t flex items-center justify-between",
            statusConfig.colorClass
          )}
        >
          <span className="text-sm font-medium">Net Result:</span>
          <div className="flex items-center gap-1 font-bold">
            {bet.status === "won" ? (
              <>
                <TrendingUp className="h-4 w-4" />
                <span>+{netResult.toLocaleString()}</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4" />
                <span>{netResult.toLocaleString()}</span>
              </>
            )}
            <Coins className="h-4 w-4 text-yellow-500 ml-1" />
          </div>
        </div>
      )}

      {/* Refund info */}
      {(bet.status === "cancelled" || bet.status === "refunded") && (
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-orange-600">
          <span className="text-sm font-medium">Refunded:</span>
          <div className="flex items-center gap-1 font-bold">
            <RefreshCw className="h-4 w-4" />
            <span>+{bet.betAmount.toLocaleString()}</span>
            <Coins className="h-4 w-4 text-yellow-500 ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchupBetHistoryItem;
