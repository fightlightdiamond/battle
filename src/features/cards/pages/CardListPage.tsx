import { Link, useSearchParams } from "react-router-dom";
import { Plus, RefreshCw, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SearchBar,
  SortControls,
  CardList,
  CardPagination,
  DeleteConfirmDialog,
} from "../components";
import { useCards, useSyncCards } from "../hooks";
import type { CardListParams } from "../types";

const DEFAULT_PAGE_SIZE = 10;

/**
 * CardListPage
 * Render SearchBar, SortControls, CardList, Pagination, DeleteConfirmDialog
 * Read/write URL query params for search, sort, page
 * Add "Add Card" button linking to `/cards/new`
 * Requirements: 1.1, 1.5, 1.6, 1.7, 2.1
 */
export function CardListPage() {
  const [searchParams] = useSearchParams();

  // Sync cards between API and IndexedDB on mount
  const { isSyncing } = useSyncCards();

  // Parse query params with defaults
  const params: CardListParams = {
    search: searchParams.get("search") || "",
    sortBy: (searchParams.get("sortBy") as CardListParams["sortBy"]) || "name",
    sortOrder:
      (searchParams.get("sortOrder") as CardListParams["sortOrder"]) || "asc",
    page: Number(searchParams.get("page")) || 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };

  const { data, isLoading } = useCards(params);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Card Collection</h1>
            {isSyncing && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link to="/battle/setup">
                <Swords className="h-4 w-4" />
                Battle
              </Link>
            </Button>
            <Button asChild>
              <Link to="/cards/new">
                <Plus className="h-4 w-4" />
                Add Card
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <SearchBar />
          </div>
          <SortControls />
        </div>

        {/* Card List */}
        <CardList
          cards={data?.cards || []}
          isLoading={isLoading}
          isEmpty={!isLoading && data?.total === 0}
        />

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <CardPagination
            currentPage={data.page}
            totalPages={data.totalPages}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog />
      </div>
    </div>
  );
}
