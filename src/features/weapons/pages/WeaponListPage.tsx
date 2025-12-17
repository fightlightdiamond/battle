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
import { WeaponList } from "../components";
import { useWeapons, useDeleteWeapon } from "../hooks";
import type { Weapon } from "../types/weapon";

/**
 * WeaponListPage
 * Display all weapons with search/filter
 * Navigation to create/edit
 * Requirements: 2.1
 */
export function WeaponListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [weaponToDelete, setWeaponToDelete] = useState<Weapon | null>(null);

  const { data: weapons = [], isLoading } = useWeapons();
  const deleteWeapon = useDeleteWeapon();

  // Filter weapons by search query
  const filteredWeapons = weapons.filter((weapon) =>
    weapon.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteClick = (weapon: Weapon) => {
    setWeaponToDelete(weapon);
  };

  const handleConfirmDelete = async () => {
    if (weaponToDelete) {
      await deleteWeapon.mutateAsync(weaponToDelete.id);
      setWeaponToDelete(null);
    }
  };

  return (
    <AppLayout
      variant="menu"
      width="full"
      title="Weapons"
      headerRight={
        <Button asChild>
          <Link to="/weapons/create">
            <Plus className="h-4 w-4 mr-2" />
            Add Weapon
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
              placeholder="Search weapons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Weapon List */}
        <WeaponList
          weapons={filteredWeapons}
          isLoading={isLoading}
          isEmpty={!isLoading && filteredWeapons.length === 0}
          onDelete={handleDeleteClick}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!weaponToDelete}
          onOpenChange={(open) => !open && setWeaponToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Weapon</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{weaponToDelete?.name}"? This
                action cannot be undone. If this weapon is equipped to a card,
                it will be unequipped first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteWeapon.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
