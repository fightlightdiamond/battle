/**
 * BattleLog Component - Display battle action history
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { BattleLogEntry, BattleLogEntryType } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface BattleLogProps {
  entries: ReadonlyArray<Readonly<BattleLogEntry>>;
  className?: string;
  maxHeight?: string;
}

/**
 * Get styling classes based on log entry type
 * - attack: Standard attack action styling
 * - damage: Damage received styling (currently same as attack)
 * - victory: Victory announcement with special styling
 */
function getEntryStyles(type: BattleLogEntryType): string {
  switch (type) {
    case "attack":
      return "text-slate-700 bg-slate-50 border-l-blue-500";
    case "damage":
      return "text-red-700 bg-red-50 border-l-red-500";
    case "victory":
      return "text-amber-700 bg-amber-50 border-l-amber-500 font-semibold";
    default:
      return "text-slate-700 bg-slate-50 border-l-slate-500";
  }
}

/**
 * Get icon for log entry type
 */
function getEntryIcon(type: BattleLogEntryType): string {
  switch (type) {
    case "attack":
      return "⚔️";
    case "damage":
      return "💥";
    case "victory":
      return "🏆";
    default:
      return "📝";
  }
}

/**
 * Single log entry component
 */
function LogEntry({ entry }: { entry: Readonly<BattleLogEntry> }) {
  const styles = getEntryStyles(entry.type);
  const icon = getEntryIcon(entry.type);

  return (
    <div className={cn("px-3 py-2 border-l-4 rounded-r text-sm", styles)}>
      <span className="mr-2">{icon}</span>
      <span>{entry.message}</span>
    </div>
  );
}

/**
 * BattleLog Component
 * Displays a scrollable list of battle log entries with auto-scroll
 * to the latest entry when new entries are added.
 */
export function BattleLog({
  entries,
  className,
  maxHeight = "300px",
}: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest entry when entries change
  // Requirement 6.4: Auto-scroll to show the latest entry
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className={cn("rounded-lg border bg-card p-4", className)}>
        <h3 className="font-semibold text-lg mb-2">Battle Log</h3>
        <p className="text-muted-foreground text-sm italic">
          No actions yet. Start the battle to see the log.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <div className="p-3 border-b">
        <h3 className="font-semibold text-lg">Battle Log</h3>
      </div>
      <ScrollArea style={{ maxHeight }} className="p-3">
        <div ref={scrollRef} className="space-y-2">
          {entries.map((entry) => (
            <LogEntry key={entry.id} entry={entry} />
          ))}
          {/* Invisible element to scroll to */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

export default BattleLog;
