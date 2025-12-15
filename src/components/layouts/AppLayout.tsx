/**
 * AppLayout - Unified layout for all pages
 *
 * Single layout component for the entire app with variants:
 * - "game": Full-screen immersive (Battle Arena, Replay, Setup)
 * - "menu": Standard container-based (Cards, History, Matchups)
 */

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBar } from "@/components/StatusBar";
import { shouldShowStatusBar } from "@/components/statusBarUtils";

export type AppLayoutVariant = "game" | "menu";
export type AppLayoutWidth = "full" | "wide" | "default" | "narrow";

export interface AppLayoutProps {
  children: ReactNode;
  /** Layout variant: "game" for battle pages, "menu" for standard pages */
  variant?: AppLayoutVariant;
  /** Content width constraint */
  width?: AppLayoutWidth;
  /** Page title */
  title?: string;
  /** Subtitle (menu variant only) */
  subtitle?: string;
  /** Back button link */
  backTo?: string;
  /** Back button label */
  backLabel?: string;
  /** Right side header content */
  headerRight?: ReactNode;
  /** Additional className */
  className?: string;
}

const widthStyles: Record<AppLayoutWidth, string> = {
  full: "w-full",
  wide: "max-w-7xl mx-auto",
  default: "max-w-5xl mx-auto",
  narrow: "max-w-2xl mx-auto",
};

export function AppLayout({
  children,
  variant = "menu",
  width = "full",
  title,
  subtitle,
  backTo,
  backLabel = "Back",
  headerRight,
  className,
}: AppLayoutProps) {
  const location = useLocation();
  const isGame = variant === "game";
  const showStatusBar = shouldShowStatusBar(location.pathname);

  return (
    <div
      className={cn(
        "min-h-screen overflow-auto",
        isGame
          ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
          : "bg-background"
      )}
    >
      {/* Status Bar - fixed at top (Requirements: 4.2, 4.3) */}
      <StatusBar visible={showStatusBar} />

      {/* Background overlay for game variant */}
      {isGame && (
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-50 pointer-events-none" />
      )}

      {/* Main container - add top padding for status bar (36px) */}
      <div
        className={cn(
          "relative z-10 flex flex-col min-h-screen",
          showStatusBar && "pt-9", // 36px padding for status bar
          className
        )}
      >
        {/* Header */}
        {(title || backTo || headerRight) && (
          <header
            className={cn(
              "flex items-center justify-between px-4 py-4 md:px-6",
              isGame ? "text-white" : ""
            )}
          >
            <div className="flex items-center gap-4">
              {backTo && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className={isGame ? "text-white hover:bg-white/10" : ""}
                >
                  <Link to={backTo}>
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    {backLabel}
                  </Link>
                </Button>
              )}
              <div>
                {title && (
                  <h1
                    className={cn(
                      "text-xl md:text-2xl font-bold",
                      isGame ? "text-white" : ""
                    )}
                  >
                    {title}
                  </h1>
                )}
                {subtitle && !isGame && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {headerRight && (
              <div className="flex items-center gap-2">{headerRight}</div>
            )}
          </header>
        )}

        {/* Content */}
        <main
          className={cn(
            "flex-1 flex flex-col px-4 py-4 md:px-6",
            widthStyles[width]
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
