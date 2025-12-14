/**
 * FloatingMenu Component - Radial floating action button for game navigation
 * Hover/click to expand menu items in a circular pattern
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
} from "lucide-react";
import { GoldBalanceDisplay } from "@/features/betting/components/GoldBalanceDisplay";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const menuItems: MenuItem[] = [
  {
    path: "/cards",
    label: "Cards",
    icon: <Library className="h-5 w-5" />,
    color: "from-blue-500 to-blue-600",
  },
  {
    path: "/battle/setup",
    label: "Battle",
    icon: <Swords className="h-5 w-5" />,
    color: "from-red-500 to-red-600",
  },
  {
    path: "/bet-battle",
    label: "Bet Battle",
    icon: <Coins className="h-5 w-5" />,
    color: "from-yellow-500 to-amber-600",
  },
  {
    path: "/bet-history",
    label: "Bet History",
    icon: <Coins className="h-5 w-5" />,
    color: "from-amber-500 to-orange-600",
  },
  {
    path: "/history",
    label: "History",
    icon: <History className="h-5 w-5" />,
    color: "from-purple-500 to-purple-600",
  },
  {
    path: "/cards/new",
    label: "New Card",
    icon: <Plus className="h-5 w-5" />,
    color: "from-green-500 to-green-600",
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

  // Calculate position for each menu item in a semi-circle
  const getItemPosition = (index: number, total: number) => {
    // Spread items in upper-left quadrant (from -45 to -180 degrees)
    const startAngle = -30;
    const endAngle = -150;
    const angleStep = (endAngle - startAngle) / (total - 1);
    const angle = startAngle + index * angleStep;
    const radian = (angle * Math.PI) / 180;
    const radius = 80;

    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Gold Balance Display - Requirements: 6.1 */}
      <div className="fixed top-4 right-4 z-40">
        <GoldBalanceDisplay size="md" />
      </div>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Items */}
            {menuItems.map((item, index) => {
              const pos = getItemPosition(index, menuItems.length);
              const isActive =
                location.pathname === item.path ||
                (item.path === "/cards" &&
                  location.pathname.startsWith("/cards") &&
                  !location.pathname.includes("/new")) ||
                (item.path === "/battle/setup" &&
                  location.pathname.startsWith("/battle")) ||
                (item.path === "/bet-battle" &&
                  location.pathname.startsWith("/bet-battle") &&
                  !location.pathname.startsWith("/bet-history")) ||
                (item.path === "/bet-history" &&
                  location.pathname.startsWith("/bet-history")) ||
                (item.path === "/history" &&
                  location.pathname.startsWith("/history"));

              return (
                <motion.button
                  key={item.path}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    x: pos.x,
                    y: pos.y,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                  onClick={() => handleItemClick(item.path)}
                  className={cn(
                    "absolute bottom-0 right-0 flex items-center gap-2 px-3 py-2 rounded-full",
                    "bg-gradient-to-r text-white shadow-lg",
                    "hover:scale-110 transition-transform",
                    "whitespace-nowrap",
                    item.color,
                    isActive &&
                      "ring-2 ring-white ring-offset-2 ring-offset-transparent"
                  )}
                  title={item.label}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.button>
              );
            })}
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
  );
}

export default FloatingMenu;
