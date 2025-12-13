import { useMemo } from "react";
import type { StatDefinition } from "../types/statConfig";
import { getStatIcon, formatStatValue } from "../types/statDisplay";

interface StatDisplayProps {
  /** The stat definition from the registry */
  stat: StatDefinition;
  /** The numeric value to display (uses stat's defaultValue if undefined) */
  value: number | undefined | null;
  /** Optional className for styling */
  className?: string;
}

/**
 * StatDisplay component
 * Displays a stat with its icon and formatted value based on config
 * Requirements: 3.1, 3.2, 3.3
 */
export function StatDisplay({ stat, value, className = "" }: StatDisplayProps) {
  // Memoize the icon component to avoid creating during render
  const Icon = useMemo(() => getStatIcon(stat.icon), [stat.icon]);
  // Use stat's default value if value is undefined/null
  const safeValue = value ?? stat.defaultValue;
  const formattedValue = formatStatValue(
    safeValue,
    stat.format,
    stat.decimalPlaces
  );

  return (
    <span className={`flex items-center gap-1 ${className}`}>
      <Icon className="h-4 w-4" />
      {formattedValue}
    </span>
  );
}
