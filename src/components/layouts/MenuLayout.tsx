/**
 * MenuLayout - Standard layout for menu/list/form pages
 *
 * Used for: Card List, Card Edit, History List, Matchup List, etc.
 * Features:
 * - Consistent container width
 * - Standard padding
 * - Optional max-width variants
 * - Header with back button and actions
 */

/**
 * MenuLayout - Standard layout for menu/list/form pages
 *
 * Used for: Card List, Card Edit, History List, Matchup List, etc.
 * Features:
 * - Consistent container width
 * - Standard padding
 * - Optional max-width variants
 * - Header with back button and actions
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type MenuLayoutVariant = "default" | "narrow" | "wide" | "full";

export interface MenuLayoutProps {
  children: ReactNode;
  /** Page title */
  title: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Back button link destination */
  backTo?: string;
  /** Right side header content (buttons, etc.) */
  headerRight?: ReactNode;
  /** Layout width variant */
  variant?: MenuLayoutVariant;
  /** Additional className */
  className?: string;
}

const variantStyles: Record<MenuLayoutVariant, string> = {
  default: "max-w-5xl", // For list pages with cards
  narrow: "max-w-2xl", // For forms and detail pages
  wide: "max-w-7xl", // For pages needing more space
  full: "", // Full width - no max-width constraint
};

export function MenuLayout({
  children,
  title,
  subtitle,
  backTo,
  headerRight,
  variant = "default",
  className,
}: MenuLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div
        className={cn(
          "container mx-auto px-4 py-6 md:py-8",
          variantStyles[variant],
          className
        )}
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {backTo && (
                <Button variant="ghost" size="icon" asChild>
                  <Link to={backTo}>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
                {subtitle && (
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

          {/* Content */}
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}

export default MenuLayout;
