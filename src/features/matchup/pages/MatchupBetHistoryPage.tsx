/**
 * MatchupBetHistoryPage - Displays player's matchup bet history
 *
 * Requirements: 7.1, 7.3
 * - Fetch and display bet history
 * - Show empty state when no bets
 */

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Coins, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchupBetHistoryItem } from "../components/MatchupBetHistoryItem";
import type { MatchupInfo } from "../components/MatchupBetHistoryItem";
import { matchupBetService } from "../services/matchupBetService";
import { matchupService } from "../services/matchupService";
import type { MatchupBet, Matchup } from "../types/matchup";

/**
 * Empty state component
 * Requirements: 7.3
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Coins className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No matchup bets yet</h3>
      <p className="text-muted-foreground mt-1">
        Place a bet on a matchup to see your history here.
      </p>
      <Button asChild className="mt-4">
        <Link to="/matchups">Browse Matchups</Link>
      </Button>
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

/**
 * MatchupBetHistoryPage
 *
 * Main page component for displaying matchup bet history.
 * - Fetches all bets sorted by timestamp descending (Requirements: 7.1)
 * - Displays bet cards with matchup info, bet amount, result, payout
 * - Shows empty state when no history (Requirements: 7.3)
 *
 * Requirements: 7.1, 7.3
 */
export function MatchupBetHistoryPage() {
  const [bets, setBets] = useState<MatchupBet[]>([]);
  const [matchups, setMatchups] = useState<Map<string, Matchup>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch bet history sorted by createdAt descending (Requirements: 7.1)
      const betHistory = await matchupBetService.getBetHistory();
      setBets(betHistory);

      // Fetch matchup info for each unique matchup
      const uniqueMatchupIds = [...new Set(betHistory.map((b) => b.matchupId))];
      const matchupMap = new Map<string, Matchup>();

      await Promise.all(
        uniqueMatchupIds.map(async (matchupId) => {
          try {
            const matchup = await matchupService.getMatchupById(matchupId);
            if (matchup) {
              matchupMap.set(matchupId, matchup);
            }
          } catch {
            // Ignore errors for individual matchup fetches
          }
        })
      );

      setMatchups(matchupMap);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load bet history"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get matchup info for a bet
  const getMatchupInfo = (matchupId: string): MatchupInfo | undefined => {
    const matchup = matchups.get(matchupId);
    if (!matchup) return undefined;

    return {
      card1Name: matchup.card1Name,
      card2Name: matchup.card2Name,
      winnerName: matchup.winnerName,
    };
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/matchups">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Matchup Bet History</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/matchups">
                <Coins className="h-4 w-4 mr-2" />
                Place Bet
              </Link>
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading && <LoadingState />}

        {error && <ErrorState message={error} onRetry={fetchData} />}

        {!isLoading && !error && (
          <>
            {bets.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bets.map((bet) => (
                  <Link
                    key={bet.id}
                    to={`/matchups/${bet.matchupId}`}
                    className="block"
                  >
                    <MatchupBetHistoryItem
                      bet={bet}
                      matchupInfo={getMatchupInfo(bet.matchupId)}
                      onClick={() => {}}
                    />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MatchupBetHistoryPage;
