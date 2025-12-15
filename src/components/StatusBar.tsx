/**
 * StatusBar Component - Game-style navigation bar
 * Features:
 * - Animated icons with glow effects
 * - Gradient backgrounds
 * - Game-like visual style
 */

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { shouldShowStatusBar } from "./statusBarUtils";
import { GoldBalanceDisplay } from "@/features/betting/components/GoldBalanceDisplay";
import {
  Library,
  Plus,
  Swords,
  History,
  Trophy,
  ScrollText,
  Settings,
} from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  items: NavItem[];
  basePaths: string[];
}

const navGroups: NavGroup[] = [
  {
    label: "Cards",
    icon: <Library className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-400",
    glowColor: "shadow-blue-500/50",
    basePaths: ["/cards"],
    items: [
      {
        path: "/cards",
        label: "All Cards",
        icon: <Library className="h-4 w-4" />,
      },
      {
        path: "/cards/new",
        label: "New Card",
        icon: <Plus className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "Battle",
    icon: <Swords className="h-5 w-5" />,
    color: "from-red-500 to-orange-400",
    glowColor: "shadow-red-500/50",
    basePaths: ["/battle", "/history"],
    items: [
      {
        path: "/battle/setup",
        label: "Practice Battle",
        icon: <Swords className="h-4 w-4" />,
      },
      {
        path: "/history",
        label: "Battle History",
        icon: <History className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "Betting",
    icon: <Trophy className="h-5 w-5" />,
    color: "from-yellow-500 to-amber-400",
    glowColor: "shadow-yellow-500/50",
    basePaths: ["/matchups", "/matchup-bets", "/admin"],
    items: [
      {
        path: "/matchups",
        label: "Bet on Matchups",
        icon: <Trophy className="h-4 w-4" />,
      },
      {
        path: "/matchup-bets",
        label: "My Bets",
        icon: <ScrollText className="h-4 w-4" />,
      },
      {
        path: "/admin/matchups",
        label: "Admin: Matchups",
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

export interface StatusBarProps {
  className?: string;
  visible?: boolean;
}

export function StatusBar({ className, visible }: StatusBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const isVisible = visible ?? shouldShowStatusBar(location.pathname);

  if (!isVisible) {
    return null;
  }

  const isGroupActive = (group: NavGroup) => {
    return group.basePaths.some((base) => location.pathname.startsWith(base));
  };

  const isItemActive = (item: NavItem) => {
    if (item.path === "/cards") {
      return (
        location.pathname === "/cards" ||
        (location.pathname.startsWith("/cards/") &&
          !location.pathname.includes("/new"))
      );
    }
    return location.pathname.startsWith(item.path);
  };

  const handleGroupClick = (groupLabel: string) => {
    setOpenGroup(openGroup === groupLabel ? null : groupLabel);
  };

  const handleItemClick = (path: string) => {
    navigate(path);
    setOpenGroup(null);
  };

  return (
    <>
      {/* Backdrop for closing dropdown */}
      {openGroup && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenGroup(null)}
        />
      )}

      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "h-12",
          "flex items-center justify-between px-3",
          "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900",
          "border-b-2 border-yellow-500/30",
          "shadow-lg shadow-black/50",
          className
        )}
        data-testid="status-bar"
      >
        {/* Left: Navigation Groups */}
        <nav className="flex items-center gap-2">
          {navGroups.map((group) => {
            const isActive = isGroupActive(group);
            const isOpen = openGroup === group.label;

            return (
              <div key={group.label} className="relative">
                {/* Group Button */}
                <motion.button
                  onClick={() => handleGroupClick(group.label)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                    "font-bold text-sm uppercase tracking-wide",
                    "transition-all duration-200",
                    `bg-gradient-to-r ${group.color}`,
                    "text-white",
                    isActive && `shadow-lg ${group.glowColor}`,
                    isOpen && "ring-2 ring-white/50"
                  )}
                >
                  {/* Animated icon */}
                  <motion.span
                    animate={
                      isActive
                        ? {
                            rotate: [0, -10, 10, 0],
                            scale: [1, 1.1, 1],
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.5,
                      repeat: isActive ? Infinity : 0,
                      repeatDelay: 2,
                    }}
                  >
                    {group.icon}
                  </motion.span>
                  <span className="hidden sm:inline">{group.label}</span>

                  {/* Shine effect */}
                  <span className="absolute inset-0 rounded-lg overflow-hidden">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                  </span>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        "absolute top-full left-0 mt-2 min-w-[180px]",
                        "bg-slate-800/95 backdrop-blur-sm",
                        "border border-slate-600/50 rounded-lg",
                        "shadow-xl shadow-black/50",
                        "overflow-hidden"
                      )}
                    >
                      {group.items.map((item, index) => (
                        <motion.button
                          key={item.path}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleItemClick(item.path)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5",
                            "text-left text-sm font-medium",
                            "transition-all duration-150",
                            "hover:bg-gradient-to-r",
                            `hover:${group.color}`,
                            isItemActive(item)
                              ? `bg-gradient-to-r ${group.color} text-white`
                              : "text-slate-200 hover:text-white"
                          )}
                        >
                          <span
                            className={
                              isItemActive(item) ? "animate-pulse" : ""
                            }
                          >
                            {item.icon}
                          </span>
                          {item.label}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Right: Gold Balance */}
        <motion.div className="flex items-center" whileHover={{ scale: 1.05 }}>
          <GoldBalanceDisplay size="sm" />
        </motion.div>
      </div>
    </>
  );
}

export default StatusBar;
