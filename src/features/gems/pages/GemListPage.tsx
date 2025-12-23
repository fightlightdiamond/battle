import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layouts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GemList } from "../components/GemList";
import { useGems, useDeleteGem } from "../hooks";
import type { Gem } from "../types/gem";

/**
 * GemListPage
 * Display all gems with search/filter
 * Navigation to create/edit
 * Requirements: 1.2
 */
export function GemListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gemToDelete, setGemToDelete] = useState<Gem | null>(null);

  const { data: gems = [], isLoading } = useGems();
  const deleteGem = useDeleteGem();

  // Filter gems by search query
  const filteredGems = gems.filter(
    (gem) =>
      gem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gem.skillType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gem.trigger.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteClick = (gem: Gem) => {
    setGemToDelete(gem);
  };

  const handleConfirmDelete = async () => {
    if (gemToDelete) {
      await deleteGem.mutateAsync(gemToDelete.id);
      setGemToDelete(null);
    }
  };

  return (
    <AppLayout
      variant="menu"
      width="full"
      title="Gems"
      headerRight={
        <Button asChild>
          <Link to="/gems/create">
            <Plus className="h-4 w-4 mr-2" />
            Add Gem
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Search */}
        <div className="w-full sm:max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search gems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Gem List */}
        <GemList
          gems={filteredGems}
          isLoading={isLoading}
          isEmpty={!isLoading && filteredGems.length === 0}
          onDelete={handleDeleteClick}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!gemToDelete}
          onOpenChange={(open) => !open && setGemToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Gem</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{gemToDelete?.name}"? This
                action cannot be undone. If this gem is equipped to any cards,
                it will be unequipped first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteGem.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
