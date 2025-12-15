/**
 * MatchupListPage - Displays all pending matchups for betting
 *
 * Requirements: 2.1, 2.3
 * - Fetch and display pending matchups
 * - Show empty state when no matchups
 * - Link to matchup detail page
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Swords, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layouts";
import { MatchupCard } from "../components/MatchupCard";
import { matchupService } from "../services/matchupService";
import { matchupBetService } from "../services/matchupBetService";
import type { Matchup, MatchupBet } from "../types/matchup";

/**
 * Empty state component
 * Requirements: 2.3
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Swords className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No pending matchups</h3>
      <p className="text-muted-foreground mt-1">
        Check back later for new matchups to bet on.
      </p>
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
 * Calculate total bets for each card in a matchup
 */
function calculateTotalBets(
  matchupId: string,
  bets: MatchupBet[],
  card1Id: string,
  card2Id: string
): { card1Total: number; card2Total: number } {
  const matchupBets = bets.filter(
    (bet) => bet.matchupId === matchupId && bet.status === "active"
  );

  let card1Total = 0;
  let card2Total = 0;

  for (const bet of matchupBets) {
    if (bet.selectedCardId === card1Id) {
      card1Total += bet.betAmount;
    } else if (bet.selectedCardId === card2Id) {
      card2Total += bet.betAmount;
    }
  }

  return { card1Total, card2Total };
}

/**
 * MatchupListPage
 *
 * Main page component for displaying pending matchups.
 * - Fetches pending matchups from API
 * - Displays matchup cards with bet totals
 * - Shows empty state when no pending matchups
 * - Links to matchup detail page
 *
 * Requirements: 2.1, 2.3
 */
export function MatchupListPage() {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [allBets, setAllBets] = useState<MatchupBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch pending matchups sorted by createdAt descending (Requirements: 2.1)
      const pendingMatchups = await matchupService.getMatchups("pending");
      setMatchups(pendingMatchups);

      // Fetch all bets to calculate totals for each matchup
      const bets = await matchupBetService.getBetHistory();
      setAllBets(bets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matchups");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AppLayout
      variant="menu"
      width="full"
      title="Matchups"
      backTo="/cards"
      headerRight={
        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      }
    >
      {/* Content */}
      {isLoading && <LoadingState />}

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {!isLoading && !error && (
        <>
          {matchups.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matchups.map((matchup) => {
                const { card1Total, card2Total } = calculateTotalBets(
                  matchup.id,
                  allBets,
                  matchup.card1Id,
                  matchup.card2Id
                );

                return (
                  <Link
                    key={matchup.id}
                    to={`/matchups/${matchup.id}`}
                    className="block"
                  >
                    <MatchupCard
                      matchup={matchup}
                      card1TotalBets={card1Total}
                      card2TotalBets={card2Total}
                      onClick={() => {}}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}

export default MatchupListPage;
