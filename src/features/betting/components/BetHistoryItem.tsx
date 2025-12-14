/**
 * BetHistoryItem Component
 *
 * Displays a single bet record with amount, card names, result, and payout.
 *
 * Requirements: 5.2
 */

import { Trophy, XCircle, Coins, Swords } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BetRecord } from "../types/betting";

export interface BetHistoryItemProps {
  bet: BetRecord;
  onClick?: () => void;
}

/**
 * Format a timestamp to a readable date/time string
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date/time string
 */
function formatBetDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * BetHistoryItem
 *
 * Displays a single bet record with:
 * - Bet amount and selected card
 * - Winner card name
 * - Result (win/lose) with visual indicator
 * - Payout amount
 * - Timestamp
 *
 * Requirements: 5.2
 */
export function BetHistoryItem({ bet, onClick }: BetHistoryItemProps) {
  const isWin = bet.result === "win";

  return (
    <Card
      className={`transition-colors ${
        onClick ? "cursor-pointer hover:bg-accent/50" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{formatBetDate(bet.timestamp)}</CardDescription>
          <Badge variant={isWin ? "default" : "destructive"}>
            {isWin ? (
              <Trophy className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {isWin ? "WIN" : "LOSE"}
          </Badge>
        </div>
        <CardTitle className="text-lg">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Bet on:</span>
            <span
              className={
                bet.selectedCardId === bet.winnerCardId
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {bet.selectedCardName}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {/* Winner info */}
          <div className="flex items-center gap-2 text-sm">
            <Swords className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Winner:</span>
            <span className="text-amber-600 font-medium">
              {bet.winnerCardName}
            </span>
          </div>

          {/* Bet and payout info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">Bet:</span>
              <span className="font-medium">
                {bet.betAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Payout:</span>
              <span
                className={`font-medium ${
                  isWin ? "text-green-600" : "text-red-600"
                }`}
              >
                {isWin ? "+" : ""}
                {bet.payoutAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
