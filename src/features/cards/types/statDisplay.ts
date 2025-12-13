// ============================================================================
// STAT DISPLAY UTILITIES
// ============================================================================

import {
  Heart,
  Sword,
  Shield,
  Zap,
  Target,
  Flame,
  Crosshair,
  HeartPulse,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { StatDefinition, StatFormat } from "./statConfig";

/**
 * Icon mapping from string names to Lucide components
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Heart,
  Sword,
  Shield,
  Zap,
  Target,
  Flame,
  Crosshair,
  HeartPulse,
};

/**
 * Default icon when specified icon is not found
 */
const DEFAULT_ICON: LucideIcon = HelpCircle;

/**
 * Get the Lucide icon component for a stat
 * @param iconName - The icon name from StatDefinition
 * @returns The Lucide icon component, or default icon if not found
 */
export function getStatIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? DEFAULT_ICON;
}

/**
 * Format a stat value based on its format type and decimal places
 * @param value - The numeric value to format (defaults to 0 if undefined/null)
 * @param format - The format type ('number' or 'percentage')
 * @param decimalPlaces - Number of decimal places to show
 * @returns Formatted string representation
 */
export function formatStatValue(
  value: number | undefined | null,
  format: StatFormat,
  decimalPlaces: number
): string {
  // Handle undefined/null values - use 0 as default
  const safeValue = value ?? 0;
  const formattedNumber = safeValue.toFixed(decimalPlaces);

  if (format === "percentage") {
    return `${formattedNumber}%`;
  }

  // For number format, use locale string for large numbers
  if (decimalPlaces === 0) {
    return Math.round(safeValue).toLocaleString();
  }

  return parseFloat(formattedNumber).toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

/**
 * Format a stat value using its StatDefinition
 * @param stat - The stat definition
 * @param value - The numeric value to format (defaults to stat's defaultValue if undefined)
 * @returns Formatted string representation
 */
export function formatStatFromDefinition(
  stat: StatDefinition,
  value: number | undefined | null
): string {
  // Use stat's default value if value is undefined/null
  const safeValue = value ?? stat.defaultValue;
  return formatStatValue(safeValue, stat.format, stat.decimalPlaces);
}

/**
 * Get icon component from a StatDefinition
 * @param stat - The stat definition
 * @returns The Lucide icon component
 */
export function getStatIconFromDefinition(stat: StatDefinition): LucideIcon {
  return getStatIcon(stat.icon);
}
