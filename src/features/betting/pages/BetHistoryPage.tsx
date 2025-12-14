/**
 * BetHistoryPage Component
 *
 * Displays a paginated list of past bets with navigation.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useBetHistory } from "../hooks";
import { BetHistoryItem } from "../components/BetHistoryItem";

const DEFAULT_PAGE_SIZE = 10;

/**
 * Pagination component for bet history
 */
function BetHistoryPagination({
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
 * Requirements: 5.3
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Coins className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No bets yet</h3>
      <p className="text-muted-foreground mt-1">
        Place a bet in a battle to see your history here.
      </p>
      <Button asChild className="mt-4">
        <Link to="/bet-battle">Start Betting</Link>
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
 * BetHistoryPage
 *
 * Main page component for displaying bet history list.
 * - Fetches bets from API with pagination
 * - Displays bet cards with: date, selected card, winner, result, payout
 * - Sorted by timestamp descending (handled by API)
 * - Shows empty state when no history
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function BetHistoryPage() {
  const [searchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;

  const { data, isLoading, isError, error } = useBetHistory(
    page,
    DEFAULT_PAGE_SIZE
  );

  // Calculate total pages from response
  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/cards">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Bet History</h1>
          </div>
          <Button asChild>
            <Link to="/bet-battle">
              <Coins className="h-4 w-4 mr-2" />
              Place Bet
            </Link>
          </Button>
        </div>

        {/* Content */}
        {isLoading && <LoadingState />}

        {isError && (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Failed to load bet history"
            }
          />
        )}

        {!isLoading && !isError && data && (
          <>
            {data.data.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {/* Bet List */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.data.map((bet) => (
                    <BetHistoryItem key={bet.id} bet={bet} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <BetHistoryPagination
                    currentPage={page}
                    totalPages={totalPages}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
