/**
 * GameLayout - Full-screen immersive layout for game screens
 *
 * Used for: Battle Arena, Battle Replay, Setup pages
 * Features:
 * - Full viewport height
 * - Dark gradient background
 * - Centered content
 * - Optional header with back button
 * - StatusBar integration (Requirements: 4.2, 4.3)
 */

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBar } from "@/components/StatusBar";
import { shouldShowStatusBar } from "@/components/statusBarUtils";

export interface GameLayoutProps {
  children: ReactNode;
  /** Page title displayed in header */
  title?: string;
  /** Back button link destination */
  backTo?: string;
  /** Back button label */
  backLabel?: string;
  /** Right side header content */
  headerRight?: ReactNode;
  /** Additional className for the main container */
  className?: string;
  /** Whether to show the gradient background */
  showBackground?: boolean;
  /** Whether content should use full width (default: true for game pages) */
  fullWidth?: boolean;
}

export function GameLayout({
  children,
  title,
  backTo,
  backLabel = "Back",
  headerRight,
  className,
  showBackground = true,
  fullWidth = true,
}: GameLayoutProps) {
  const location = useLocation();
  const showStatusBar = shouldShowStatusBar(location.pathname);

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-auto",
        showBackground &&
          "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
      )}
    >
      {/* Status Bar - fixed at top (Requirements: 4.2, 4.3) */}
      <StatusBar visible={showStatusBar} />

      {/* Background overlay */}
      {showBackground && (
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-50 pointer-events-none" />
      )}

      {/* Main Content - add top padding for status bar (36px) */}
      <div
        className={cn(
          "relative z-10 flex flex-col min-h-screen",
          showStatusBar && "pt-9", // 36px padding for status bar
          className
        )}
      >
        {/* Header */}
        {(title || backTo || headerRight) && (
          <header className="flex items-center justify-between px-4 py-4 md:px-6">
            <div className="flex items-center gap-4">
              {backTo && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-white hover:bg-white/10"
                >
                  <Link to={backTo}>
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    {backLabel}
                  </Link>
                </Button>
              )}
              {title && (
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  {title}
                </h1>
              )}
            </div>
            {headerRight && <div>{headerRight}</div>}
          </header>
        )}

        {/* Content */}
        <main
          className={cn(
            "flex-1 flex flex-col px-4 py-4",
            fullWidth ? "w-full" : "container mx-auto max-w-6xl"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default GameLayout;
