import { Link, useSearchParams } from "react-router-dom";
import { Plus, Swords, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layouts";
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
    <AppLayout
      variant="menu"
      width="full"
      title="Card Collection"
      subtitle={isSyncing ? "Syncing..." : undefined}
      headerRight={
        <>
          <Button asChild variant="outline">
            <Link to="/history">
              <History className="h-4 w-4 mr-2" />
              History
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/battle/setup">
              <Swords className="h-4 w-4 mr-2" />
              Battle
            </Link>
          </Button>
          <Button asChild>
            <Link to="/cards/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Link>
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
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
    </AppLayout>
  );
}
