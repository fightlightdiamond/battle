import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PresetType } from "../types/presets";
import { getPresetOptions } from "../presets";
import { useEntityStore, selectCurrentPreset } from "../store/entityStore";

/**
 * PresetSelector component for selecting entity presets
 * Shows all preset options with labels and descriptions
 * Highlights currently selected preset with background color and checkmark
 * Calls store action when preset is selected
 * Requirements: 1.1, 1.2, 3.4
 */
export function PresetSelector() {
  const currentPreset = useEntityStore(selectCurrentPreset);
  const applyPreset = useEntityStore((state) => state.applyPreset);
  const clearPreset = useEntityStore((state) => state.clearPreset);

  const presetOptions = getPresetOptions();

  const handleSelect = (type: PresetType) => {
    if (type === "none") {
      clearPreset();
    } else {
      applyPreset(type);
    }
  };

  // Find current preset for display in trigger
  const currentOption = presetOptions.find((opt) => opt.type === currentPreset);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="preset-selector">Use Preset</Label>
      <Select value={currentPreset} onValueChange={handleSelect}>
        <SelectTrigger id="preset-selector" className="w-full h-auto min-h-9">
          <SelectValue placeholder="Select a preset...">
            {currentOption && (
              <div className="flex flex-col items-start py-1">
                <span className="font-medium">{currentOption.label}</span>
                <span className="text-xs text-muted-foreground">
                  {currentOption.description}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-[var(--radix-select-trigger-width)]">
          {presetOptions.map((option) => {
            const isSelected = option.type === currentPreset;
            return (
              <SelectItem
                key={option.type}
                value={option.type}
                className={cn(
                  "flex-col items-start py-2",
                  isSelected && "bg-accent text-accent-foreground",
                )}
              >
                <div className="flex flex-col items-start w-full">
                  <span
                    className={cn("font-medium", isSelected && "text-primary")}
                  >
                    {option.label}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-normal">
                    {option.description}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
