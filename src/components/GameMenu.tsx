/**
 * GameMenu Component - Floating radial menu for game navigation
 * A compact floating button that expands to show navigation options on hover
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Library, Swords, History, Plus, X } from "lucide-react";

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

export function GameMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show during battle arena or replay
  const isInBattleArena = location.pathname === "/battle/arena";
  const isInReplay = location.pathname.includes("/replay");

  if (isInBattleArena || isInReplay) {
    return null;
  }

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Calculate positions for radial layout (semi-circle above the button)
  const getItemPosition = (index: number, total: number) => {
    const startAngle = -180; // Start from left
    const endAngle = 0; // End at right
    const angleRange = endAngle - startAngle;
    const angle = startAngle + (angleRange / (total - 1)) * index;
    const radian = (angle * Math.PI) / 180;
    const radius = 80; // Distance from center

    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 -z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Items in radial layout */}
            {menuItems.map((item, index) => {
              const pos = getItemPosition(index, menuItems.length);
              const isActive =
                location.pathname === item.path ||
                (item.path === "/cards" &&
                  location.pathname.startsWith("/cards") &&
                  item.path !== "/cards/new") ||
                (item.path === "/battle/setup" &&
                  location.pathname.startsWith("/battle")) ||
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
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2",
                    "flex flex-col items-center gap-1 group"
                  )}
                >
                  {/* Icon Button */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      "bg-gradient-to-br shadow-lg",
                      "text-white transition-transform hover:scale-110",
                      item.color,
                      isActive && "ring-2 ring-white ring-offset-2"
                    )}
                  >
                    {item.icon}
                  </div>
                  {/* Label */}
                  <span className="text-xs font-medium text-white bg-black/70 px-2 py-0.5 rounded whitespace-nowrap">
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative w-14 h-14 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl",
          "text-white transition-all",
          "hover:shadow-yellow-500/30 hover:shadow-2xl",
          isOpen && "rotate-45"
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sparkles className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse effect when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20" />
        )}
      </motion.button>
    </div>
  );
}

export default GameMenu;
