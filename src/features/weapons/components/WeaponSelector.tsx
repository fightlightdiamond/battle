import { ImageOff, Sword } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Weapon } from "../types/weapon";

interface WeaponSelectorProps {
  weapons: Weapon[];
  selectedWeaponId: string | null;
  onSelect: (weaponId: string | null) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * WeaponSelector component
 * Dropdown to select a weapon for equipping to a card
 * Requirements: 3.2
 */
export function WeaponSelector({
  weapons,
  selectedWeaponId,
  onSelect,
  isLoading,
  disabled,
  placeholder = "Select a weapon",
}: WeaponSelectorProps) {
  const handleValueChange = (value: string) => {
    if (value === "none") {
      onSelect(null);
    } else {
      onSelect(value);
    }
  };

  return (
    <Select
      value={selectedWeaponId || "none"}
      onValueChange={handleValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={isLoading ? "Loading weapons..." : placeholder}
        >
          {selectedWeaponId ? (
            <WeaponSelectDisplay
              weapon={weapons.find((w) => w.id === selectedWeaponId)}
            />
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="flex items-center gap-2 text-muted-foreground">
            <ImageOff className="h-4 w-4" />
            No weapon
          </span>
        </SelectItem>
        {weapons.map((weapon) => (
          <SelectItem key={weapon.id} value={weapon.id}>
            <WeaponSelectDisplay weapon={weapon} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface WeaponSelectDisplayProps {
  weapon: Weapon | undefined;
}

function WeaponSelectDisplay({ weapon }: WeaponSelectDisplayProps) {
  if (!weapon) {
    return <span className="text-muted-foreground">Unknown weapon</span>;
  }

  return (
    <span className="flex items-center gap-2">
      {weapon.imageUrl ? (
        <img
          src={weapon.imageUrl}
          alt={weapon.name}
          className="h-5 w-5 rounded object-cover"
        />
      ) : (
        <Sword className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="truncate">{weapon.name}</span>
      <span className="text-xs text-muted-foreground">+{weapon.atk} ATK</span>
    </span>
  );
}

interface WeaponSelectorWithActionsProps extends WeaponSelectorProps {
  onEquip?: () => void;
  onUnequip?: () => void;
  isEquipping?: boolean;
  isUnequipping?: boolean;
  hasEquippedWeapon?: boolean;
}

/**
 * WeaponSelectorWithActions component
 * Weapon selector with equip/unequip action buttons
 * Requirements: 3.2, 3.4
 */
export function WeaponSelectorWithActions({
  weapons,
  selectedWeaponId,
  onSelect,
  onEquip,
  onUnequip,
  isLoading,
  isEquipping,
  isUnequipping,
  hasEquippedWeapon,
  disabled,
  placeholder,
}: WeaponSelectorWithActionsProps) {
  return (
    <div className="space-y-3">
      <WeaponSelector
        weapons={weapons}
        selectedWeaponId={selectedWeaponId}
        onSelect={onSelect}
        isLoading={isLoading}
        disabled={disabled || isEquipping || isUnequipping}
        placeholder={placeholder}
      />
      <div className="flex gap-2">
        {onEquip && selectedWeaponId && (
          <Button
            onClick={onEquip}
            disabled={isEquipping || isUnequipping || disabled}
            size="sm"
          >
            {isEquipping ? "Equipping..." : "Equip Weapon"}
          </Button>
        )}
        {onUnequip && hasEquippedWeapon && (
          <Button
            variant="outline"
            onClick={onUnequip}
            disabled={isEquipping || isUnequipping || disabled}
            size="sm"
          >
            {isUnequipping ? "Unequipping..." : "Unequip"}
          </Button>
        )}
      </div>
    </div>
  );
}
