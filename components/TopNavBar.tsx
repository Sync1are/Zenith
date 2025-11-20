import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoIcon } from "./icons/IconComponents";
import { useMessageStore } from "../store/useMessageStore";

const TopNavBar: React.FC<{ activeServer: string; onSelect: (id: string) => void; }> = ({ activeServer, onSelect }) => {
  const { activeUserId, setActiveUser, sendFriendRequest, currentUser, users, notifications } = useMessageStore();

  const [isAutoHidden, setIsAutoHidden] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add Friend Modal State
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState("");
  const [requestStatus, setRequestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

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

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendUsername.trim()) return;

    setRequestStatus("loading");
    setStatusMessage("");

    try {
      await sendFriendRequest(friendUsername.trim());
      setRequestStatus("success");
      setStatusMessage("Friend request sent!");
      setTimeout(() => {
        setShowAddFriend(false);
        setFriendUsername("");
        setRequestStatus("idle");
        setStatusMessage("");
      }, 2000);
    } catch (error: any) {
      setRequestStatus("error");
      setStatusMessage(error.message || "Failed to send request");
    }
  };

  return (
    <>
      {/* MAIN NAV CONTAINER */}
      <div
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        className={`
          fixed top-12 left-0 right-0 flex justify-center z-[9999]
          transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          pointer-events-none
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
            pointer-events-auto overflow-visible
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

          {/* FRIENDS LIST */}
          <div className="flex items-center gap-3 max-w-[400px] overflow-x-auto overflow-y-visible scrollbar-hide px-1">
            {currentUser?.friends && currentUser.friends.length > 0 && (
              <>
                {users
                  .filter(user => currentUser.friends?.includes(user.id))
                  .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
                  .map((friend) => {
                    const unreadCount = notifications[friend.id] || 0;

                    return (
                      <NavItem
                        key={friend.id}
                        id={friend.id}
                        label={friend.username}
                        isActive={activeUserId === friend.id}
                        onClick={() => setActiveUser(friend.id)}
                        onHover={handleHover}
                      >
                        <img
                          src={
                            friend.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`
                          }
                          alt={friend.username}
                          className="w-full h-full rounded-full object-cover"
                        />

                        {/* Status Indicator */}
                        <div
                          className={`
                            absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#18181b]
                            ${friend.status === "online"
                              ? "bg-green-500"
                              : friend.status === "idle"
                                ? "bg-yellow-500"
                                : friend.status === "dnd"
                                  ? "bg-red-500"
                                  : friend.status === "invisible"
                                    ? "bg-gray-700"
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
              </>
            )}
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* ADD FRIEND BUTTON */}
          <NavItem
            id="add-friend"
            label="Add Friend"
            isActive={showAddFriend}
            onClick={() => setShowAddFriend(true)}
            onHover={handleHover}
          >
            <div className="w-full h-full rounded-full flex items-center justify-center bg-white/10 group-hover:bg-indigo-500 transition-colors duration-300">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </NavItem>

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

      {/* ADD FRIEND MODAL */}
      <AnimatePresence>
        {showAddFriend && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#18181b] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Add Friend</h2>
                <button
                  onClick={() => setShowAddFriend(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSendRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                  <input
                    type="text"
                    value={friendUsername}
                    onChange={(e) => setFriendUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    autoFocus
                  />
                </div>

                {statusMessage && (
                  <div className={`text-sm ${requestStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {statusMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={requestStatus === 'loading' || !friendUsername.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {requestStatus === 'loading' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Send Request
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
