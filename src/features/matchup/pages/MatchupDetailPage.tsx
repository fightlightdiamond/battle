/**
 * MatchupDetailPage - Displays matchup details and betting form for PLAYERS
 *
 * Requirements: 2.2, 3.1, 4.1, 4.3, 8.2
 * - Display matchup info with MatchupCard
 * - Show BetForm for placing/updating/cancelling bets
 * - Show current player's bet if exists
 * - Link to battle replay for completed matchups
 *
 * Note: Admin controls (Start Battle, Cancel Matchup) are on /admin/matchups/:id
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Loader2,
  RefreshCw,
  Play,
  AlertCircle,
  XCircle,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layouts";
import { Card, CardContent } from "@/components/ui/card";
import { MatchupCard, type CardInfo } from "../components/MatchupCard";
import { BetForm } from "../components/BetForm";
import { matchupService } from "../services/matchupService";
import { matchupBetService } from "../services/matchupBetService";
import { cardApi } from "@/features/cards/api/cardApi";
import { getImageUrl } from "@/features/cards/services";
import type { Matchup, MatchupBet } from "../types/matchup";

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
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <p className="text-destructive">{message}</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

/**
 * Not found state component
 */
function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">Matchup not found</h3>
      <p className="text-muted-foreground mt-1">
        This matchup may have been removed or doesn't exist.
      </p>
      <Button asChild className="mt-4">
        <Link to="/matchups">Back to Matchups</Link>
      </Button>
    </div>
  );
}

/**
 * Calculate total bets for each card
 */
function calculateTotalBets(
  bets: MatchupBet[],
  card1Id: string,
  card2Id: string
): { card1Total: number; card2Total: number } {
  let card1Total = 0;
  let card2Total = 0;

  for (const bet of bets) {
    if (bet.status === "active") {
      if (bet.selectedCardId === card1Id) {
        card1Total += bet.betAmount;
      } else if (bet.selectedCardId === card2Id) {
        card2Total += bet.betAmount;
      }
    }
  }

  return { card1Total, card2Total };
}

/**
 * MatchupDetailPage
 *
 * Player page for viewing matchup details and placing bets.
 * - Fetches matchup by ID
 * - Displays matchup info with MatchupCard
 * - Shows BetForm for placing/updating/cancelling bets
 * - Shows current player's bet if exists
 * - Links to battle replay for completed matchups
 *
 * Note: Admin controls are on /admin/matchups/:id
 *
 * Requirements: 2.2, 3.1, 4.1, 4.3, 8.2
 */
export function MatchupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [currentBet, setCurrentBet] = useState<MatchupBet | null>(null);
  const [allBets, setAllBets] = useState<MatchupBet[]>([]);
  const [card1Info, setCard1Info] = useState<CardInfo | undefined>(undefined);
  const [card2Info, setCard2Info] = useState<CardInfo | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch matchup by ID
      const matchupData = await matchupService.getMatchupById(id);
      setMatchup(matchupData);

      if (matchupData) {
        // Fetch all bets for this matchup to calculate totals
        const bets = await matchupBetService.getBetsByMatchup(id);
        setAllBets(bets);

        // Fetch player's active bet on this matchup
        const activeBet = await matchupBetService.getActiveBetForMatchup(id);
        setCurrentBet(activeBet);

        // Fetch card data for display
        const [card1, card2] = await Promise.all([
          cardApi.getById(matchupData.card1Id),
          cardApi.getById(matchupData.card2Id),
        ]);

        if (card1) {
          const imageUrl = card1.imagePath
            ? await getImageUrl(card1.imagePath)
            : undefined;
          setCard1Info({
            id: card1.id,
            name: card1.name,
            imageUrl: imageUrl || undefined,
            stats: {
              hp: card1.hp,
              atk: card1.atk,
              def: card1.def,
              spd: card1.spd,
            },
          });
        }

        if (card2) {
          const imageUrl = card2.imagePath
            ? await getImageUrl(card2.imagePath)
            : undefined;
          setCard2Info({
            id: card2.id,
            name: card2.name,
            imageUrl: imageUrl || undefined,
            stats: {
              hp: card2.hp,
              atk: card2.atk,
              def: card2.def,
              spd: card2.spd,
            },
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matchup");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle bet placed
  const handleBetPlaced = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Handle bet updated
  const handleBetUpdated = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Handle bet cancelled
  const handleBetCancelled = useCallback(() => {
    setCurrentBet(null);
    fetchData();
  }, [fetchData]);

  // Calculate bet totals
  const { card1Total, card2Total } = matchup
    ? calculateTotalBets(allBets, matchup.card1Id, matchup.card2Id)
    : { card1Total: 0, card2Total: 0 };

  return (
    <AppLayout
      variant="menu"
      width="narrow"
      title="Matchup Details"
      backTo="/matchups"
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

      {!isLoading && !error && !matchup && <NotFoundState />}

      {!isLoading && !error && matchup && (
        <div className="flex flex-col gap-6">
          {/* Matchup Card - Requirements: 2.2 */}
          <MatchupCard
            matchup={matchup}
            card1Info={card1Info}
            card2Info={card2Info}
            card1TotalBets={card1Total}
            card2TotalBets={card2Total}
          />

          {/* Battle Replay Link for completed matchups - Requirements: 8.2 */}
          {matchup.status === "completed" && matchup.battleHistoryId && (
            <div className="flex justify-center">
              <Button asChild>
                <Link to={`/history/${matchup.battleHistoryId}/replay`}>
                  <Play className="h-4 w-4 mr-2" />
                  Watch Battle Replay
                </Link>
              </Button>
            </div>
          )}

          {/* Winner announcement for completed matchups */}
          {matchup.status === "completed" && matchup.winnerName && (
            <Card className="border-2 border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="py-4 text-center">
                <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  Winner: {matchup.winnerName}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cancelled matchup notice */}
          {matchup.status === "cancelled" && (
            <Card className="border-2 border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="py-4 text-center">
                <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                <p className="text-lg font-bold text-red-700 dark:text-red-400">
                  Matchup Cancelled
                </p>
                <p className="text-sm text-muted-foreground">
                  All bets have been refunded.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bet Form - Requirements: 3.1, 4.1, 4.3 */}
          <BetForm
            matchup={matchup}
            card1={{
              id: matchup.card1Id,
              name: matchup.card1Name,
            }}
            card2={{
              id: matchup.card2Id,
              name: matchup.card2Name,
            }}
            currentBet={currentBet}
            onBetPlaced={handleBetPlaced}
            onBetUpdated={handleBetUpdated}
            onBetCancelled={handleBetCancelled}
          />
        </div>
      )}
    </AppLayout>
  );
}

export default MatchupDetailPage;
