import { Link } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Gem as GemIcon,
  Zap,
  Swords,
  Timer,
  Percent,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Gem, SkillType } from "../types/gem";

interface GemCardProps {
  gem: Gem;
  onDelete?: () => void;
  showActions?: boolean;
}

/**
 * Skill type display configuration
 */
const SKILL_TYPE_CONFIG: Record<
  SkillType,
  { label: string; color: string; description: string }
> = {
  knockback: {
    label: "Knockback",
    color: "bg-orange-500",
    description: "Push enemy back",
  },
  retreat: {
    label: "Retreat",
    color: "bg-blue-500",
    description: "Move back after attack",
  },
  double_move: {
    label: "Double Move",
    color: "bg-green-500",
    description: "Move 2 cells",
  },
  double_attack: {
    label: "Double Attack",
    color: "bg-red-500",
    description: "Attack twice",
  },
  execute: {
    label: "Execute",
    color: "bg-purple-500",
    description: "Kill low HP enemy",
  },
  leap_strike: {
    label: "Leap Strike",
    color: "bg-yellow-500",
    description: "Jump and knockback",
  },
};

/**
 * GemCard component
 * Displays gem name, skill type, trigger, and stats in a card format
 * Requirements: 1.2
 */
export function GemCard({ gem, onDelete, showActions = true }: GemCardProps) {
  const skillConfig = SKILL_TYPE_CONFIG[gem.skillType];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {gem.imageUrl ? (
            <img
              src={gem.imageUrl}
              alt={gem.name}
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div
              className={`p-2 rounded-lg ${skillConfig.color} text-white flex-shrink-0`}
            >
              <GemIcon className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate" title={gem.name}>
              {gem.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {skillConfig.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="secondary" className="text-xs">
            {skillConfig.label}
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            {gem.trigger === "combat" ? (
              <Swords className="h-3 w-3" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            {gem.trigger === "combat" ? "Combat" : "Movement"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Percent className="h-3.5 w-3.5" />
            {gem.activationChance}% chance
          </span>
          <span className="flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            {gem.cooldown > 0 ? `${gem.cooldown} turn CD` : "No CD"}
          </span>
        </div>

        {gem.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {gem.description}
          </p>
        )}

        {showActions && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to={`/gems/${gem.id}/edit`}>
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
 * GemCardSkeleton component for loading states
 */
export function GemCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-9 w-9 bg-muted animate-pulse rounded-lg" />
          <div className="flex-1">
            <div className="h-5 w-3/4 bg-muted animate-pulse rounded mb-1" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="flex gap-1.5 mb-3">
          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 flex-1 bg-muted animate-pulse rounded" />
          <div className="h-8 flex-1 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
