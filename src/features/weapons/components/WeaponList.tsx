import { ImageOff } from "lucide-react";
import type { Weapon } from "../types/weapon";
import { WeaponCard, WeaponCardSkeleton } from "./WeaponCard";

interface WeaponListProps {
  weapons: Weapon[];
  isLoading?: boolean;
  isEmpty?: boolean;
  onDelete?: (weapon: Weapon) => void;
}

/**
 * WeaponList component
 * Displays weapons in a responsive grid layout
 * Requirements: 2.1
 */
export function WeaponList({
  weapons,
  isLoading,
  isEmpty,
  onDelete,
}: WeaponListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <WeaponCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isEmpty || weapons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageOff className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No weapons found</h3>
        <p className="text-muted-foreground">
          Get started by creating your first weapon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {weapons.map((weapon) => (
        <WeaponCard
          key={weapon.id}
          weapon={weapon}
          onDelete={onDelete ? () => onDelete(weapon) : undefined}
        />
      ))}
    </div>
  );
}
