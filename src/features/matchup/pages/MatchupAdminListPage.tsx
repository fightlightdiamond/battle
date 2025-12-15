/**
 * MatchupAdminListPage - Admin page for listing and managing matchups
 *
 * Requirements: 5.1
 * - List all matchups for admin management
 * - Quick access to start battle or cancel
 */

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Plus,
  Settings,
  Trophy,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { matchupService } from "../services/matchupService";
import type { Matchup } from "../types/matchup";

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
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No matchups yet</h3>
      <p className="text-muted-foreground mt-1">
        Create your first matchup for players to bet on.
      </p>
      <Button asChild className="mt-4">
        <Link to="/matchups/create">
          <Plus className="h-4 w-4 mr-2" />
          Create Matchup
        </Link>
      </Button>
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: Matchup["status"] }) {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-300"
        >
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300"
        >
          <Trophy className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return null;
  }
}

/**
 * MatchupAdminListPage
 *
 * Admin page for listing all matchups with management options.
 */
export function MatchupAdminListPage() {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all matchups (no status filter)
      const data = await matchupService.getMatchups();
      // Sort by createdAt descending (newest first)
      data.sort(
        (a: Matchup, b: Matchup) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMatchups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matchups");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendingMatchups = matchups.filter((m) => m.status === "pending");
  const completedMatchups = matchups.filter((m) => m.status === "completed");
  const cancelledMatchups = matchups.filter((m) => m.status === "cancelled");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Admin: Matchups
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage matchups - start battles or cancel
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/matchups/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Matchup
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {pendingMatchups.length}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {completedMatchups.length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {cancelledMatchups.length}
              </p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {isLoading && <LoadingState />}

        {error && <ErrorState message={error} onRetry={fetchData} />}

        {!isLoading && !error && matchups.length === 0 && <EmptyState />}

        {!isLoading && !error && matchups.length > 0 && (
          <div className="space-y-4">
            {/* Pending Matchups - Priority */}
            {pendingMatchups.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
                    <Clock className="h-5 w-5" />
                    Pending Matchups ({pendingMatchups.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingMatchups.map((matchup) => (
                    <Link
                      key={matchup.id}
                      to={`/admin/matchups/${matchup.id}`}
                      className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {matchup.card1Name} vs {matchup.card2Name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Created:{" "}
                            {new Date(matchup.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={matchup.status} />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Completed Matchups */}
            {completedMatchups.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                    <Trophy className="h-5 w-5" />
                    Completed Matchups ({completedMatchups.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedMatchups.map((matchup) => (
                    <Link
                      key={matchup.id}
                      to={`/admin/matchups/${matchup.id}`}
                      className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {matchup.card1Name} vs {matchup.card2Name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Winner: {matchup.winnerName}
                          </p>
                        </div>
                        <StatusBadge status={matchup.status} />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Cancelled Matchups */}
            {cancelledMatchups.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                    <XCircle className="h-5 w-5" />
                    Cancelled Matchups ({cancelledMatchups.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {cancelledMatchups.map((matchup) => (
                    <Link
                      key={matchup.id}
                      to={`/admin/matchups/${matchup.id}`}
                      className="block p-4 rounded-lg border hover:bg-accent transition-colors opacity-60"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {matchup.card1Name} vs {matchup.card2Name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Cancelled
                          </p>
                        </div>
                        <StatusBadge status={matchup.status} />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchupAdminListPage;
