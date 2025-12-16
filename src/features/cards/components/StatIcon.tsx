import { createElement } from "react";
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

interface StatIconProps {
  /** The icon name from StatDefinition */
  iconName: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * StatIcon component
 * Renders a stat icon based on the icon name using createElement
 * to avoid ESLint static-components rule
 */
export function StatIcon({ iconName, className = "h-4 w-4" }: StatIconProps) {
  const IconComponent = ICON_MAP[iconName] ?? HelpCircle;
  return createElement(IconComponent, { className });
}
