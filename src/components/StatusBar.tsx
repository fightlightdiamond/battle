/**
 * StatusBar Component - Fixed status bar at top of viewport
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 * - Fixed positioning at top with 36px height
 * - Left/right content slots
 * - Visibility logic based on route
 * - Gold balance display in right slot
 */

import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { shouldShowStatusBar } from "./statusBarUtils";
import { GoldBalanceDisplay } from "@/features/betting/components/GoldBalanceDisplay";

export interface StatusBarProps {
  /** Additional CSS classes */
  className?: string;
  /** Left side content slot */
  leftContent?: ReactNode;
  /** Right side content slot (default: GoldBalanceDisplay) */
  rightContent?: ReactNode;
  /** Override visibility (if not provided, uses route-based logic) */
  visible?: boolean;
  /** Whether to show gold balance (default: true) */
  showGoldBalance?: boolean;
}

/**
 * StatusBar Component
 * Displays a fixed status bar at the top of the viewport
 */
export function StatusBar({
  className,
  leftContent,
  rightContent,
  visible,
  showGoldBalance = true,
}: StatusBarProps) {
  const location = useLocation();

  // Use provided visibility or calculate from route
  const isVisible = visible ?? shouldShowStatusBar(location.pathname);

  if (!isVisible) {
    return null;
  }

  // Default right content is GoldBalanceDisplay with small size
  const defaultRightContent = showGoldBalance ? (
    <GoldBalanceDisplay size="sm" />
  ) : null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "h-9", // 36px
        "flex items-center justify-between px-4",
        "bg-background/95 backdrop-blur-sm",
        "border-b border-border/50",
        className
      )}
      data-testid="status-bar"
    >
      {/* Left content slot */}
      <div className="flex items-center gap-2">{leftContent}</div>

      {/* Right content slot - defaults to GoldBalanceDisplay */}
      <div className="flex items-center gap-2">
        {rightContent ?? defaultRightContent}
      </div>
    </div>
  );
}

export default StatusBar;
