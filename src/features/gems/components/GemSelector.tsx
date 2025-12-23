import { Gem as GemIcon, Plus, Zap, Swords } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Gem, SkillType } from "../types/gem";

/**
 * Skill type display configuration
 */
const SKILL_TYPE_CONFIG: Record<SkillType, { label: string; color: string }> = {
  knockback: { label: "Knockback", color: "bg-orange-500" },
  retreat: { label: "Retreat", color: "bg-blue-500" },
  double_move: { label: "Double Move", color: "bg-green-500" },
  double_attack: { label: "Double Attack", color: "bg-red-500" },
  execute: { label: "Execute", color: "bg-purple-500" },
  leap_strike: { label: "Leap Strike", color: "bg-yellow-500" },
};

interface GemSelectorProps {
  gems: Gem[];
  selectedGemId: string | null;
  onSelect: (gemId: string | null) => void;
  equippedGemIds?: string[];
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * GemSelector component
 * Dropdown to select a gem for equipping to a card
 * Filters out already equipped gems
 * Requirements: 2.1
 */
export function GemSelector({
  gems,
  selectedGemId,
  onSelect,
  equippedGemIds = [],
  isLoading,
  disabled,
  placeholder = "Select a gem",
}: GemSelectorProps) {
  // Filter out gems that are already equipped to this card
  const availableGems = gems.filter((gem) => !equippedGemIds.includes(gem.id));

  const handleValueChange = (value: string) => {
    if (value === "none") {
      onSelect(null);
    } else {
      onSelect(value);
    }
  };

  return (
    <Select
      value={selectedGemId || "none"}
      onValueChange={handleValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? "Loading gems..." : placeholder}>
          {selectedGemId ? (
            <GemSelectDisplay gem={gems.find((g) => g.id === selectedGemId)} />
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="flex items-center gap-2 text-muted-foreground">
            <GemIcon className="h-4 w-4" />
            No gem selected
          </span>
        </SelectItem>
        {availableGems.map((gem) => (
          <SelectItem key={gem.id} value={gem.id}>
            <GemSelectDisplay gem={gem} />
          </SelectItem>
        ))}
        {availableGems.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No gems available
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

interface GemSelectDisplayProps {
  gem: Gem | undefined;
}

function GemSelectDisplay({ gem }: GemSelectDisplayProps) {
  if (!gem) {
    return <span className="text-muted-foreground">Unknown gem</span>;
  }

  const skillConfig = SKILL_TYPE_CONFIG[gem.skillType];

  return (
    <span className="flex items-center gap-2">
      {gem.imageUrl ? (
        <img
          src={gem.imageUrl}
          alt={gem.name}
          className="w-5 h-5 object-cover rounded"
        />
      ) : (
        <span className={`p-1 rounded ${skillConfig.color} text-white`}>
          <GemIcon className="h-3 w-3" />
        </span>
      )}
      <span className="truncate">{gem.name}</span>
      <Badge variant="outline" className="text-xs flex items-center gap-0.5">
        {gem.trigger === "combat" ? (
          <Swords className="h-2.5 w-2.5" />
        ) : (
          <Zap className="h-2.5 w-2.5" />
        )}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {gem.activationChance}%
      </span>
    </span>
  );
}

interface GemSelectorWithActionsProps extends GemSelectorProps {
  onEquip?: () => void;
  isEquipping?: boolean;
  canEquip?: boolean;
}

/**
 * GemSelectorWithActions component
 * Gem selector with equip action button
 * Requirements: 2.1
 */
export function GemSelectorWithActions({
  gems,
  selectedGemId,
  onSelect,
  onEquip,
  equippedGemIds,
  isLoading,
  isEquipping,
  canEquip = true,
  disabled,
  placeholder,
}: GemSelectorWithActionsProps) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <GemSelector
          gems={gems}
          selectedGemId={selectedGemId}
          onSelect={onSelect}
          equippedGemIds={equippedGemIds}
          isLoading={isLoading}
          disabled={disabled || isEquipping || !canEquip}
          placeholder={placeholder}
        />
      </div>
      {onEquip && (
        <Button
          onClick={onEquip}
          disabled={!selectedGemId || isEquipping || disabled || !canEquip}
          size="default"
        >
          <Plus className="h-4 w-4 mr-1" />
          {isEquipping ? "Equipping..." : "Equip"}
        </Button>
      )}
    </div>
  );
}
