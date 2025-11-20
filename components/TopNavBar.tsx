import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoIcon } from "./icons/IconComponents";
import { useMessageStore } from "../store/useMessageStore";

const TopNavBar: React.FC<{ activeServer: string; onSelect: (id: string) => void; }> = ({ activeServer, onSelect }) => {
  const { users, activeUserId, setActiveUser } = useMessageStore();
  const notifications = useMessageStore((s) => s.notifications);

  const [isAutoHidden, setIsAutoHidden] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Tooltip state
  const [tooltip, setTooltip] =
    useState<{ id: string; label: string; rect: DOMRect } | null>(null);

  // Tooltip handler
  const handleHover = (id: string | null, label?: string, rect?: DOMRect) => {
    if (id && label && rect) {
      setTooltip({ id, label, rect });
    } else {
      setTooltip(null);
    }
  };

  // Auto-hide logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 100) {
        setIsAutoHidden(false);
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
      } else {
        if (!hoverTimeoutRef.current) {
          hoverTimeoutRef.current = setTimeout(() => {
            setIsAutoHidden(true);
            hoverTimeoutRef.current = null;
          }, 800);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <>
      {/* MAIN NAV CONTAINER */}
      <div
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        className={`
          fixed top-12 left-0 right-0 flex justify-center z-[9999]
          transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${isAutoHidden ? "-translate-y-[250%]" : "translate-y-0"}
        `}
        onMouseEnter={() => {
          setIsAutoHidden(false);
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        }}
      >
        <nav
          className="
            relative flex items-center gap-3 px-3 py-3
            bg-[#09090b]/60 backdrop-blur-xl border border-white/5
            rounded-full shadow-2xl
          "
        >
          {/* HOME BUTTON */}
          <NavItem
            id="home"
            label="Home"
            isActive={activeUserId === null}
            onClick={() => setActiveUser(null)}
            onHover={handleHover}
          >
            <div
              className={`
                w-full h-full rounded-full flex items-center justify-center transition-colors duration-300
                ${activeUserId === null ? "bg-orange-500" : "bg-white/10 group-hover:bg-orange-500"}
              `}
            >
              <LogoIcon className="w-6 h-6 text-white" />
            </div>
          </NavItem>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* USER LIST */}
          <div className="flex items-center gap-3 max-w-[300px] overflow-x-auto scrollbar-hide px-1">
            {[...users]
              .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
              .map((user) => {
                const unreadCount = notifications[user.id] || 0;

                return (
                  <NavItem
                    key={user.id}
                    id={user.id}
                    label={user.username}
                    isActive={activeUserId === user.id}
                    onClick={() => setActiveUser(user.id)}
                    onHover={handleHover}
                  >
                    <img
                      src={
                        user.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                      }
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />

                    {/* Status Indicator */}
                    <div
                      className={`
                        absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#18181b]
                        ${user.status === "online"
                          ? "bg-green-500"
                          : user.status === "busy"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }
                      `}
                    />

                    {/* Notification Badge */}
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#18181b] z-20">
                        <span className="text-[10px] font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      </div>
                    )}
                  </NavItem>
                );
              })}
          </div>
        </nav>

        {/* GLOBAL TOOLTIP */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.9 }}
              animate={{ opacity: 1, y: -10, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.9 }}
              style={{
                position: "fixed",
                top: tooltip.rect.top - 12, // clean spacing above
                left: tooltip.rect.left + tooltip.rect.width / 2,
                transform: "translateX(-50%)",
                zIndex: 10000,
              }}
              className="px-3 py-1.5 bg-black/90 text-white text-xs font-medium rounded-lg whitespace-nowrap border border-white/10 shadow-xl pointer-events-none"
            >
              {tooltip.label}

              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/10" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

/* ------------------------- NAV ITEM COMPONENT ------------------------- */

const NavItem = ({ id, label, isActive, onClick, onHover, children }: any) => {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        onMouseEnter={(e) => onHover(id, label, e.currentTarget.getBoundingClientRect())}
        onMouseLeave={() => onHover(null)}
        className={`
          relative w-12 h-12 transition-all duration-300 z-10
          ${isActive ? "scale-110" : "hover:scale-105"}
        `}
      >
        {isActive && (
          <motion.div
            layoutId="spotlight"
            className="absolute inset-0 bg-indigo-500/20 rounded-full blur-lg"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}

        <div
          className={`
            w-full h-full rounded-full overflow-hidden border-2 transition-all duration-300
            ${isActive
              ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              : "border-transparent hover:border-white/20"}
          `}
        >
          {children}
        </div>
      </button>

      {isActive && (
        <motion.div
          layoutId="activePill"
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
        />
      )}
    </div>
  );
};


export default TopNavBar;
