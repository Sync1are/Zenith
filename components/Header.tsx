import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, BellIcon } from './icons/IconComponents';
import { useMessageStore } from '../store/useMessageStore';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  currentPage: string;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setSidebarOpen }) => {
  const {
    currentUser,
    users,
    notifications,
    acceptFriendRequest,
    rejectFriendRequest,
    markAsRead,
    setActiveUser
  } = useMessageStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const friendRequests = currentUser?.friendRequests || [];
  const notificationEntries = Object.entries(notifications).filter(([_, count]) => count > 0);

  const totalNotifications = friendRequests.length + notificationEntries.reduce((acc, [_, c]) => acc + c, 0);

  const handleAccept = async (senderId: string) => {
    await acceptFriendRequest(senderId);
  };

  const handleReject = async (senderId: string) => {
    await rejectFriendRequest(senderId);
  };

  const handleMessageClick = async (senderId: string) => {
    await markAsRead(senderId);
    setActiveUser(senderId);
    setShowNotifications(false);
  };

  const handleClearNotifications = async () => {
    // Mark all messages as read
    for (const [senderId] of notificationEntries) {
      await markAsRead(senderId);
    }
  };

  return (
    <header className="flex items-center justify-between mb-8 relative z-50">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">{currentPage}</h1>
          <p className="text-gray-400">
            {currentPage === 'Dashboard' ? "Welcome back, let's be productive." : `Manage your ${currentPage.toLowerCase()}.`}
          </p>
        </div>
      </div>


      <div className="flex items-center space-x-6">
        <SearchIcon className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />

        {/* NOTIFICATION BELL */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="relative cursor-pointer"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <BellIcon className={`h-6 w-6 transition-colors ${showNotifications ? 'text-white' : 'text-gray-400 hover:text-white'}`} />
            {totalNotifications > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-[#111217]">
                <span className="text-[10px] font-bold text-white">
                  {totalNotifications > 9 ? "9+" : totalNotifications}
                </span>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-10 w-80 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
              >
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  {notificationEntries.length > 0 && (
                    <button
                      onClick={handleClearNotifications}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Clear messages
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {totalNotifications === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {/* FRIEND REQUESTS */}
                      {friendRequests.length > 0 && (
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-500 px-2 mb-2 uppercase tracking-wider">Friend Requests</p>
                          {friendRequests.map(senderId => {
                            const sender = users.find(u => u.id === senderId);
                            if (!sender) return null;
                            return (
                              <div key={senderId} className="p-3 bg-white/5 rounded-lg mb-2">
                                <div className="flex items-center gap-3 mb-3">
                                  <img
                                    src={sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username}`}
                                    alt={sender.username}
                                    className="w-8 h-8 rounded-full bg-gray-700"
                                  />
                                  <div>
                                    <p className="text-sm text-white font-medium">{sender.username}</p>
                                    <p className="text-xs text-gray-400">Sent a friend request</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAccept(senderId)}
                                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded transition-colors"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleReject(senderId)}
                                    className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded transition-colors"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* MESSAGES */}
                      {notificationEntries.length > 0 && (
                        <div className="p-2 border-t border-white/5">
                          <p className="text-xs font-medium text-gray-500 px-2 mb-2 uppercase tracking-wider">Messages</p>
                          {notificationEntries.map(([senderId, count]) => {
                            const sender = users.find(u => u.id === senderId);
                            if (!sender) return null;
                            return (
                              <div
                                key={senderId}
                                onClick={() => handleMessageClick(senderId)}
                                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                              >
                                <div className="relative">
                                  <img
                                    src={sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.username}`}
                                    alt={sender.username}
                                    className="w-10 h-10 rounded-full bg-gray-700"
                                  />
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center border border-[#18181b]">
                                    <span className="text-[10px] font-bold text-white">{count}</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-white font-medium">{sender.username}</p>
                                  <p className="text-xs text-gray-400">Sent you {count} message{count > 1 ? 's' : ''}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {currentUser && (
          <img
            src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
            alt="User avatar"
            className="h-10 w-10 rounded-full border-2 border-indigo-500 object-cover"
          />
        )}
      </div>
    </header>
  );
};

export default Header;
