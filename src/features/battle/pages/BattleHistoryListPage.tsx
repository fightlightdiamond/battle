/**
 * BattleHistoryListPage Component
 *
 * Displays a paginated list of past battles with navigation to detail view.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Swords, Trophy, Clock, Hash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layouts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useBattleHistory } from "../hooks";
import { formatBattleDate, formatBattleDuration } from "../utils/formatters";
import type { BattleRecord } from "../types/battleHistoryTypes";

const DEFAULT_PAGE_SIZE = 10;

/**
 * Battle card component for displaying a single battle record
 */
function BattleHistoryCard({
  battle,
  onClick,
}: {
  battle: BattleRecord;
  onClick: () => void;
}) {
  const isChallegerWinner = battle.winnerId === battle.challenger.id;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>
            {formatBattleDate(battle.startedAt)}
          </CardDescription>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatBattleDuration(battle.battleDurationMs)}
          </div>
        </div>
        <CardTitle className="text-lg">
          <div className="flex items-center gap-2">
            <span className={isChallegerWinner ? "text-green-600" : ""}>
              {battle.challenger.name}
            </span>
            <Swords className="h-4 w-4 text-muted-foreground" />
            <span className={!isChallegerWinner ? "text-green-600" : ""}>
              {battle.opponent.name}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-amber-600">
            <Trophy className="h-4 w-4" />
            <span>{battle.winnerName}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span>{battle.totalTurns} turns</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Pagination component for battle history
 */
function BattleHistoryPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const [, setSearchParams] = useSearchParams();

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("page", String(page));
        return newParams;
      },
      { replace: true }
    );
  };

  // Generate page numbers to display
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers();

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handlePageChange(currentPage - 1)}
            className={
              currentPage <= 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>

        {pageNumbers.map((page, index) =>
          page === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => handlePageChange(page)}
                isActive={page === currentPage}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => handlePageChange(currentPage + 1)}
            className={
              currentPage >= totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Swords className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No battles yet</h3>
      <p className="text-muted-foreground mt-1">
        Start a battle to see your history here.
      </p>
      <Button asChild className="mt-4">
        <Link to="/battle/setup">Start Battle</Link>
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
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-destructive">{message}</p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => window.location.reload()}
      >
        Retry
      </Button>
    </div>
  );
}

/**
 * BattleHistoryListPage
 *
 * Main page component for displaying battle history list.
 * - Fetches battles from API with pagination
 * - Displays battle cards with: date, challenger vs opponent, winner, turns, duration
 * - Sorted by date descending (handled by API)
 * - Navigates to detail on click
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export function BattleHistoryListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = Number(searchParams.get("page")) || 1;

  const { data, isLoading, isError, error } = useBattleHistory(
    page,
    DEFAULT_PAGE_SIZE
  );

  const handleBattleClick = (battleId: string) => {
    navigate(`/history/${battleId}`);
  };

  return (
    <AppLayout
      variant="menu"
      width="full"
      title="Battle History"
      backTo="/cards"
      headerRight={
        <Button asChild>
          <Link to="/battle/setup">
            <Swords className="h-4 w-4 mr-2" />
            New Battle
          </Link>
        </Button>
      }
    >
      {/* Content */}
      {isLoading && <LoadingState />}

      {isError && (
        <ErrorState
          message={
            error instanceof Error ? error.message : "Failed to load battles"
          }
        />
      )}

      {!isLoading && !isError && data && (
        <>
          {data.data.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Battle List */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.data.map((battle) => (
                  <BattleHistoryCard
                    key={battle.id}
                    battle={battle}
                    onClick={() => handleBattleClick(battle.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <BattleHistoryPagination
                  currentPage={data.page}
                  totalPages={data.totalPages}
                />
              )}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
