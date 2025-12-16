/**
 * BattleLogPopup - Transparent popup overlay for battle log
 * Reusable component for both BattleArenaPage and ArenaBattlePage
 */

import { ScrollText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BattleLog } from "./BattleLog";
import type { BattleLogEntry } from "../types";

export interface BattleLogPopupProps {
  /** Whether the popup is open */
  isOpen: boolean;
  /** Callback to close the popup */
  onClose: () => void;
  /** Battle log entries to display */
  entries: readonly BattleLogEntry[];
  /** Optional title override */
  title?: string;
  /** Optional className for customization */
  className?: string;
}

/**
 * BattleLogPopup Component
 * Displays battle log in a transparent popup overlay
 * Click backdrop or X button to close
 */
export function BattleLogPopup({
  isOpen,
  onClose,
  entries,
  title = "Battle Log",
  className,
}: BattleLogPopupProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Popup Content */}
      <div
        className={cn(
          "relative w-[90%] max-w-lg max-h-[70vh]",
          "bg-slate-900/80 backdrop-blur-md rounded-xl",
          "border border-white/20 shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Log Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)]">
          <BattleLog entries={entries} maxHeight="100%" />
        </div>
      </div>
    </div>
  );
}

export default BattleLogPopup;
