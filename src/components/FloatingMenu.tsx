/**
 * FloatingMenu Component - Floating action button with vertical menu
 * Click to expand menu items in a vertical list above the FAB
 * Requirements: 6.1 - Show gold balance globally
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Library,
  Swords,
  History,
  Plus,
  X,
  Coins,
  Trophy,
  ScrollText,
} from "lucide-react";
import { GoldBalanceDisplay } from "@/features/betting/components/GoldBalanceDisplay";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const menuItems: MenuItem[] = [
  // Card Management
  {
    path: "/cards/new",
    label: "New Card",
    icon: <Plus className="h-5 w-5" />,
    color: "from-green-500 to-green-600",
  },
  {
    path: "/cards",
    label: "Cards",
    icon: <Library className="h-5 w-5" />,
    color: "from-blue-500 to-blue-600",
  },
  // Practice Battle (no betting)
  {
    path: "/battle/setup",
    label: "Practice Battle",
    icon: <Swords className="h-5 w-5" />,
    color: "from-red-500 to-red-600",
  },
  {
    path: "/history",
    label: "Battle History",
    icon: <History className="h-5 w-5" />,
    color: "from-purple-500 to-purple-600",
  },
  // Betting System - Player views matchups and bets
  {
    path: "/matchups",
    label: "Bet on Matchups",
    icon: <Trophy className="h-5 w-5" />,
    color: "from-emerald-500 to-teal-600",
  },
  {
    path: "/matchup-bets",
    label: "My Bets",
    icon: <ScrollText className="h-5 w-5" />,
    color: "from-cyan-500 to-sky-600",
  },
  // Admin - Manage matchups
  {
    path: "/admin/matchups",
    label: "Admin: Matchups",
    icon: <Coins className="h-5 w-5" />,
    color: "from-yellow-500 to-amber-600",
  },
];

export function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide during battle arena and replay
  const isInBattleArena = location.pathname === "/battle/arena";
  const isInBetBattleArena = location.pathname === "/bet-battle/arena";
  const isInReplay = location.pathname.includes("/replay");

  if (isInBattleArena || isInBetBattleArena || isInReplay) {
    return null;
  }

  const handleItemClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const isActiveItem = (item: MenuItem) => {
    return (
      location.pathname === item.path ||
      (item.path === "/cards" &&
        location.pathname.startsWith("/cards") &&
        !location.pathname.includes("/new")) ||
      (item.path === "/battle/setup" &&
        location.pathname.startsWith("/battle")) ||
      (item.path === "/matchups" &&
        location.pathname.startsWith("/matchups") &&
        !location.pathname.startsWith("/matchups/create")) ||
      (item.path === "/matchup-bets" &&
        location.pathname.startsWith("/matchup-bets")) ||
      (item.path === "/admin/matchups" &&
        (location.pathname.startsWith("/admin/matchups") ||
          location.pathname === "/matchups/create")) ||
      (item.path === "/history" && location.pathname.startsWith("/history"))
    );
  };

  return (
    <>
      {/* Gold Balance Display - Fixed top right - Requirements: 6.1 */}
      <div className="fixed top-4 right-4 z-40">
        <GoldBalanceDisplay size="md" />
      </div>

      {/* FAB Container - Fixed bottom left (right is reserved for scroll-to-top) */}
      <div className="fixed bottom-6 left-6 z-50">
        {/* Menu Items - Vertical list above FAB */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                style={{ zIndex: -1 }}
                onClick={() => setIsOpen(false)}
              />

              {/* Menu Items Container */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-16 left-0 flex flex-col gap-2 items-start mb-2"
              >
                {menuItems.map((item, index) => {
                  const isActive = isActiveItem(item);

                  return (
                    <motion.button
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        delay: index * 0.03,
                      }}
                      onClick={() => handleItemClick(item.path)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-full",
                        "bg-gradient-to-r text-white shadow-lg",
                        "hover:scale-105 hover:shadow-xl transition-all",
                        "whitespace-nowrap",
                        item.color,
                        isActive && "ring-2 ring-white/80 shadow-xl"
                      )}
                      title={item.label}
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative w-14 h-14 rounded-full shadow-lg",
            "bg-gradient-to-r from-yellow-400 to-orange-500",
            "flex items-center justify-center",
            "hover:from-yellow-500 hover:to-orange-600",
            "transition-colors",
            "ring-4 ring-white/20"
          )}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Sparkles className="h-6 w-6 text-white" />
            )}
          </motion.div>

          {/* Pulse effect when closed */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20" />
          )}
        </motion.button>
      </div>
    </>
  );
}

export default FloatingMenu;
