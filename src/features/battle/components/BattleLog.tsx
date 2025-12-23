/**
 * BattleLog Component - Display battle action history
 * Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3, 6.4
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { BattleLogEntry } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COMBAT_VISUAL_CONFIG } from "../engine/core/combatVisualConfig";

export interface BattleLogProps {
  entries: ReadonlyArray<Readonly<BattleLogEntry>>;
  className?: string;
  maxHeight?: string;
}

/**
 * Get styling classes based on log entry type and crit/lifesteal status
 * - attack: Standard attack action styling
 * - attack with crit: Amber/gold styling for critical hits
 * - damage: Damage received styling
 * - victory: Victory announcement with special styling
 * - skill: Skill activation styling with purple/indigo theme
 * Requirements: 2.2, 2.3, 11.1, 11.4
 */
function getEntryStyles(entry: Readonly<BattleLogEntry>): string {
  const { type, isCrit, hasLifesteal } = entry;

  switch (type) {
    case "attack":
      // Crit attacks get amber styling, lifesteal gets green accent
      if (isCrit && hasLifesteal) {
        return "text-amber-700 bg-gradient-to-r from-amber-50 to-green-50 border-l-amber-500";
      }
      if (isCrit) {
        return "text-amber-700 bg-amber-50 border-l-amber-500";
      }
      if (hasLifesteal) {
        return "text-slate-700 bg-gradient-to-r from-slate-50 to-green-50 border-l-green-500";
      }
      return "text-slate-700 bg-slate-50 border-l-blue-500";
    case "damage":
      return "text-red-700 bg-red-50 border-l-red-500";
    case "victory":
      return "text-amber-700 bg-amber-50 border-l-amber-500 font-semibold";
    case "skill":
      return "text-purple-700 bg-purple-50 border-l-purple-500 font-medium";
    default:
      return "text-slate-700 bg-slate-50 border-l-slate-500";
  }
}

/**
 * Get icon for log entry type with crit/lifesteal indicators
 * Requirements: 2.2, 2.3, 11.1
 */
function getEntryIcon(entry: Readonly<BattleLogEntry>): string {
  const { type, isCrit, hasLifesteal, skillActivation } = entry;

  switch (type) {
    case "attack":
      // Show special icons for crit and lifesteal
      if (isCrit && hasLifesteal) {
        return "⚡💚"; // Crit + lifesteal
      }
      if (isCrit) {
        return "⚡"; // Crit indicator
      }
      if (hasLifesteal) {
        return "⚔️💚"; // Attack + lifesteal
      }
      return "⚔️";
    case "damage":
      return "💥";
    case "victory":
      return "🏆";
    case "skill":
      // Return skill-specific icon based on skill type
      if (skillActivation) {
        switch (skillActivation.skillType) {
          case "knockback":
            return "💨";
          case "retreat":
            return "🔙";
          case "double_move":
            return "⚡";
          case "double_attack":
            return "⚔️⚔️";
          case "execute":
            return "💀";
          case "leap_strike":
            return "🦘";
          default:
            return "💎";
        }
      }
      return "💎";
    default:
      return "📝";
  }
}

/**
 * Single log entry component with visual indicators for crit and lifesteal
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
function LogEntry({ entry }: { entry: Readonly<BattleLogEntry> }) {
  const styles = getEntryStyles(entry);
  const icon = getEntryIcon(entry);
  const critStyle = COMBAT_VISUAL_CONFIG.damageStyles.crit;
  const healStyle = COMBAT_VISUAL_CONFIG.damageStyles.heal;

  return (
    <div className={cn("px-3 py-2 border-l-4 rounded-r text-sm", styles)}>
      <span className="mr-2">{icon}</span>
      <span>{entry.message}</span>
      {/* Visual indicators for crit and lifesteal */}
      <span className="ml-2 inline-flex gap-1">
        {entry.isCrit && (
          <span
            className="text-xs font-bold px-1 rounded"
            style={{
              color: critStyle.color,
              backgroundColor: "rgba(245, 158, 11, 0.1)",
            }}
          >
            {critStyle.label}
          </span>
        )}
        {entry.hasLifesteal &&
          entry.lifestealAmount &&
          entry.lifestealAmount > 0 && (
            <span
              className="text-xs font-semibold px-1 rounded"
              style={{
                color: healStyle.color,
                backgroundColor: "rgba(34, 197, 94, 0.1)",
              }}
            >
              {healStyle.prefix}
              {entry.lifestealAmount} HP
            </span>
          )}
      </span>
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
