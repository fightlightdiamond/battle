import { Link } from "react-router-dom";
import {
  Pencil,
  Trash2,
  ImageOff,
  Sword,
  Target,
  Flame,
  Crosshair,
  HeartPulse,
  Ruler,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Weapon } from "../types/weapon";

interface WeaponCardProps {
  weapon: Weapon;
  onDelete?: () => void;
  showActions?: boolean;
}

/**
 * Weapon stat display configuration
 */
const WEAPON_STATS_DISPLAY = [
  { key: "atk", label: "ATK", icon: Sword, format: "number" as const },
  {
    key: "critChance",
    label: "Crit%",
    icon: Target,
    format: "percentage" as const,
  },
  {
    key: "critDamage",
    label: "CritDmg",
    icon: Flame,
    format: "percentage" as const,
  },
  {
    key: "armorPen",
    label: "ArPen",
    icon: Crosshair,
    format: "percentage" as const,
  },
  {
    key: "lifesteal",
    label: "LS",
    icon: HeartPulse,
    format: "percentage" as const,
  },
  {
    key: "attackRange",
    label: "Range",
    icon: Ruler,
    format: "number" as const,
  },
] as const;

/**
 * Format stat value based on format type
 */
function formatStatValue(
  value: number,
  format: "number" | "percentage",
): string {
  if (format === "percentage") {
    return `${value}%`;
  }
  return value.toLocaleString();
}

/**
 * WeaponCard component
 * Displays weapon name, image, and stats in a card format
 * Requirements: 2.1
 */
export function WeaponCard({
  weapon,
  onDelete,
  showActions = true,
}: WeaponCardProps) {
  return (
    <Card className="overflow-hidden py-0">
      <div className="aspect-square relative bg-muted">
        {weapon.imageUrl ? (
          <img
            src={weapon.imageUrl}
            alt={weapon.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate mb-2" title={weapon.name}>
          {weapon.name}
        </h3>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
          {WEAPON_STATS_DISPLAY.map((stat) => {
            const value = (weapon[stat.key as keyof Weapon] as number) ?? 0;
            const Icon = stat.icon;
            return (
              <span key={stat.key} className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                {formatStatValue(value, stat.format)}
              </span>
            );
          })}
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to={`/weapons/${weapon.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * WeaponCardSkeleton component for loading states
 */
export function WeaponCardSkeleton() {
  return (
    <Card className="overflow-hidden py-0">
      <div className="aspect-square bg-muted animate-pulse" />
      <CardContent className="p-4">
        <div className="h-5 w-3/4 bg-muted animate-pulse rounded mb-2" />
        <div className="grid grid-cols-2 gap-2 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-8 flex-1 bg-muted animate-pulse rounded" />
          <div className="h-8 flex-1 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
