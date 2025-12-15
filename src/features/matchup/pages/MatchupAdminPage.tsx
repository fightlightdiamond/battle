/**
 * MatchupAdminPage - Admin page for managing matchups
 *
 * Requirements: 5.1, 5.4, 6.5
 * - Admin controls: Start Battle, Cancel Matchup
 * - View all bets on the matchup
 * - Separate from player betting page
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Swords,
  XCircle,
  Trophy,
  Users,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchupCard, type CardInfo } from "../components/MatchupCard";
import { matchupService } from "../services/matchupService";
import { matchupBetService } from "../services/matchupBetService";
import { matchupBattleService } from "../services/matchupBattleService";
import { useMatchupBettingStore } from "../store/matchupBettingStore";
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
        <Link to="/admin/matchups">Back to Admin</Link>
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
 * MatchupAdminPage
 *
 * Admin page for managing matchups - start battles and cancel matchups.
 * Separate from player betting page.
 *
 * Requirements: 5.1, 5.4, 6.5
 */
export function MatchupAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [allBets, setAllBets] = useState<MatchupBet[]>([]);
  const [card1Info, setCard1Info] = useState<CardInfo | undefined>(undefined);
  const [card2Info, setCard2Info] = useState<CardInfo | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecutingBattle, setIsExecutingBattle] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get betting store actions for resolving bets locally
  const resolveMatchupBets = useMatchupBettingStore(
    (state) => state.resolveMatchupBets
  );
  const refundMatchupBets = useMatchupBettingStore(
    (state) => state.refundMatchupBets
  );

  const fetchData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch matchup by ID
      const matchupData = await matchupService.getMatchupById(id);
      setMatchup(matchupData);

      if (matchupData) {
        // Fetch all bets for this matchup
        const bets = await matchupBetService.getBetsByMatchup(id);
        setAllBets(bets);

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

  // Handle admin start battle - Requirements: 5.1, 5.4
  const handleStartBattle = useCallback(async () => {
    if (!id || !matchup) return;

    setIsExecutingBattle(true);

    try {
      // Execute battle and resolve bets in database
      const result = await matchupBattleService.executeAndResolveBets(id);

      // Update local gold balance for player's bet
      await resolveMatchupBets(id, result.winnerId);

      toast.success("Battle completed!", {
        description: `${result.winnerName} wins! Bets have been resolved.`,
      });

      // Refresh data to show updated matchup
      fetchData();
    } catch (err) {
      toast.error("Failed to execute battle", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsExecutingBattle(false);
    }
  }, [id, matchup, resolveMatchupBets, fetchData]);

  // Handle admin cancel matchup - Requirements: 6.5
  const handleCancelMatchup = useCallback(async () => {
    if (!id || !matchup) return;

    setIsCancelling(true);

    try {
      // Cancel matchup and refund bets in database
      await matchupBattleService.cancelMatchupAndRefundBets(id);

      // Update local gold balance for player's bet
      await refundMatchupBets(id);

      toast.success("Matchup cancelled", {
        description: "All bets have been refunded.",
      });

      // Navigate back to admin matchups list
      navigate("/admin/matchups");
    } catch (err) {
      toast.error("Failed to cancel matchup", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsCancelling(false);
    }
  }, [id, matchup, refundMatchupBets, navigate]);

  // Calculate bet totals
  const { card1Total, card2Total } = matchup
    ? calculateTotalBets(allBets, matchup.card1Id, matchup.card2Id)
    : { card1Total: 0, card2Total: 0 };

  const activeBets = allBets.filter((b) => b.status === "active");

  return (
    <AppLayout
      variant="menu"
      width="narrow"
      title="Admin: Manage Matchup"
      subtitle="Start battle or cancel matchup"
      backTo="/admin/matchups"
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
          {/* Matchup Card - with card images and stats */}
          <MatchupCard
            matchup={matchup}
            card1Info={card1Info}
            card2Info={card2Info}
            card1TotalBets={card1Total}
            card2TotalBets={card2Total}
          />

          {/* Bet Statistics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bet Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <p className="text-sm text-muted-foreground">
                    {matchup.card1Name}
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    {card1Total.toLocaleString()} G
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <p className="text-sm text-muted-foreground">
                    {matchup.card2Name}
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {card2Total.toLocaleString()} G
                  </p>
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Total: {activeBets.length} active bet(s) •{" "}
                {(card1Total + card2Total).toLocaleString()} G in pool
              </p>
            </CardContent>
          </Card>

          {/* Admin Controls for pending matchups */}
          {matchup.status === "pending" && (
            <Card className="border-2 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <Trophy className="h-5 w-5" />
                  Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleStartBattle}
                    disabled={isExecutingBattle || isCancelling}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    size="lg"
                  >
                    {isExecutingBattle ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Executing Battle...
                      </>
                    ) : (
                      <>
                        <Swords className="h-5 w-5 mr-2" />
                        Start Battle
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelMatchup}
                    disabled={isExecutingBattle || isCancelling}
                    className="flex-1"
                    size="lg"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 mr-2" />
                        Cancel Matchup
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Starting the battle will execute the fight and automatically
                  resolve all bets.
                  <br />
                  Cancelling will refund all active bets to players.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Battle Replay Link for completed matchups */}
          {matchup.status === "completed" && matchup.battleHistoryId && (
            <div className="flex justify-center">
              <Button asChild size="lg">
                <Link to={`/history/${matchup.battleHistoryId}/replay`}>
                  <Play className="h-5 w-5 mr-2" />
                  Watch Battle Replay
                </Link>
              </Button>
            </div>
          )}

          {/* Winner announcement for completed matchups */}
          {matchup.status === "completed" && matchup.winnerName && (
            <Card className="border-2 border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="py-6 text-center">
                <Trophy className="h-10 w-10 mx-auto text-yellow-500 mb-3" />
                <p className="text-xl font-bold text-green-700 dark:text-green-400">
                  Winner: {matchup.winnerName}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  All bets have been resolved
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cancelled matchup notice */}
          {matchup.status === "cancelled" && (
            <Card className="border-2 border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="py-6 text-center">
                <XCircle className="h-10 w-10 mx-auto text-red-500 mb-3" />
                <p className="text-xl font-bold text-red-700 dark:text-red-400">
                  Matchup Cancelled
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  All bets have been refunded to players
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppLayout>
  );
}

export default MatchupAdminPage;
