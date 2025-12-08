import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MessageCircle, Plus, Users, UserPlus, X } from 'lucide-react';
import { useMessageStore } from "../store/useMessageStore";
import { Status, Persona } from "../types";
import { motion, AnimatePresence } from "framer-motion";

// --- UI Component (ConceptDeck) ---
// Pure presentation component that receives state from parent
const ConceptDeck: React.FC<{
  personas: Persona[];
  onAddPersona: () => void;
  activeId: string | null;
  onSelect: (id: string) => void;
  onOpenChat: (id: string) => void;
  isDropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}> = ({
  personas, onAddPersona, activeId, onSelect, onOpenChat,
  isDropdownOpen, setDropdownOpen, hoveredId, setHoveredId
}) => {

    // Max number of visual slots (excluding the 'Add' button). 
    const MAX_SLOTS = 6;
    const hasOverflow = personas.length > MAX_SLOTS;
    const visibleLimit = hasOverflow ? MAX_SLOTS - 1 : personas.length;

    // --- Logic to ensure Active Persona is always visible ---
    let visiblePersonas = [...personas];
    let overflowPersonas: typeof personas = [];

    if (hasOverflow && activeId) {
      const activeIndex = personas.findIndex(p => p.id === activeId);
      if (activeIndex !== -1) {
        const copy = [...personas];
        if (activeIndex >= visibleLimit) {
          const itemToBump = copy[visibleLimit - 1];
          copy[visibleLimit - 1] = copy[activeIndex];
          copy[activeIndex] = itemToBump;
        }
        visiblePersonas = copy.slice(0, visibleLimit);
        overflowPersonas = copy.slice(visibleLimit);
      } else {
        visiblePersonas = personas.slice(0, visibleLimit);
        overflowPersonas = personas.slice(visibleLimit);
      }
    } else {
      if (hasOverflow) {
        visiblePersonas = personas.slice(0, visibleLimit);
        overflowPersonas = personas.slice(visibleLimit);
      } else {
        visiblePersonas = personas;
        overflowPersonas = [];
      }
    }

    return (
      <div className="flex items-center justify-center space-x-4 px-4 h-20 pointer-events-auto">
        <AnimatePresence mode='popLayout'>
          {visiblePersonas.map((persona, index) => {
            const isActive = activeId === persona.id && !isDropdownOpen;

            return (
              <div key={persona.id} className="relative group/tooltip">
                <AnimatePresence>
                  {hoveredId === persona.id && !isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-xs font-medium rounded-lg border border-white/10 whitespace-nowrap z-[60]">
                      {persona.name}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45 border-r border-b border-white/10" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  layout
                  onClick={() => {
                    if (isDropdownOpen) setDropdownOpen(false);
                    onSelect(persona.id);
                  }}
                  onMouseEnter={() => setHoveredId(persona.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ zIndex: isActive ? 50 : 30 - index }}
                  initial={false}
                  animate={{
                    width: isActive ? 256 : 40,
                    height: isActive ? 56 : 48,
                    borderRadius: isActive ? 16 : 12,
                    opacity: isActive ? 1 : 0.6,
                    y: isActive ? 0 : 0,
                    rotate: 0
                  }}
                  whileHover={!isActive ? {
                    scale: 1.1,
                    y: -12,
                    zIndex: 40,
                    opacity: 1,
                  } : {}}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`relative flex items-center overflow-hidden border border-white/10 shadow-2xl group ${isActive ? 'bg-[#1e1e20] ring-1 ring-white/10' : 'bg-zinc-800/80 backdrop-blur-sm'}`}>
                  <motion.div layout className={`absolute left-0 top-0 h-full overflow-hidden`} animate={{ width: isActive ? 56 : "100%" }}>
                    <motion.img
                      layoutId={`avatar-${persona.id}`}
                      src={persona.avatarUrl}
                      alt={persona.name}
                      className="w-full h-full object-cover"
                      animate={{
                        scale: isActive ? 1 : 1.1,
                        filter: isActive ? 'grayscale(0%)' : 'grayscale(100%)'
                      }}
                    />

                    {!isActive && <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />}

                    <div className={`absolute w-2.5 h-2.5 rounded-full ring-2 ring-[#1e1e20] transition-all duration-500 z-10 ${isActive ? 'bottom-1 right-1' : 'bottom-1 right-1/2 translate-x-1/2 mb-1'
                      } ${persona.status === Status.ONLINE ? 'bg-emerald-400' :
                        persona.status === Status.THINKING ? 'bg-purple-400 animate-pulse' : 'bg-zinc-500'
                      }`} />
                  </motion.div>

                  <motion.div
                    className="absolute left-14 right-0 top-0 h-full flex items-center justify-between pl-3 pr-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 20 }}
                    transition={{ duration: 0.2, delay: isActive ? 0.1 : 0 }}>
                    <div className="flex flex-col items-start overflow-hidden min-w-0">
                      <span className="text-sm font-bold text-white truncate w-full text-left tracking-tight">{persona.name}</span>
                      <span className="text-[10px] text-zinc-400 font-medium truncate w-full flex items-center gap-1 text-left">
                        {persona.status === Status.THINKING ? (
                          <span className="animate-pulse text-purple-400 flex items-center gap-1">
                            <span className="w-1 h-1 bg-purple-400 rounded-full" /> Thinking...
                          </span>
                        ) : persona.customStatus ? (
                          <span className="flex items-center gap-1">
                            {persona.customStatus.emoji} {persona.customStatus.text}
                          </span>
                        ) : persona.role}
                      </span>
                    </div>

                    <div className="flex-shrink-0 ml-1">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(persona.id);
                        }}
                        className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer">
                        <MessageCircle size={16} />
                      </div>
                    </div>
                  </motion.div>
                </motion.button>
              </div>
            );
          })}
        </AnimatePresence>

        {hasOverflow && (
          <div className={`relative transition-all duration-500 ${isDropdownOpen ? 'z-[60]' : 'z-[40]'}`} style={{ marginLeft: '1rem' }}>
            <button
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              className={`relative flex items-center justify-center rounded-xl bg-zinc-800/90 border border-white/10 shadow-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group ${isDropdownOpen ? 'w-64 h-14 bg-[#1e1e20] ring-1 ring-white/10 translate-y-0' : 'w-10 h-12 hover:w-12 hover:-translate-y-2 hover:bg-zinc-700'}`}>
              <span className={`absolute transition-all duration-300 font-bold text-zinc-400 group-hover:text-white ${isDropdownOpen ? 'opacity-0 scale-50' : 'opacity-100 scale-100 text-xs'}`}>
                +{overflowPersonas.length}
              </span>

              <div className={`absolute inset-0 flex items-center justify-between px-4 transition-all duration-300 ${isDropdownOpen ? 'opacity-100 scale-100 delay-100' : 'opacity-0 scale-90'}`}>
                <div className="flex items-center gap-2 text-white">
                  <Users size={16} className="text-zinc-400" />
                  <span className="text-sm font-bold">More Agents</span>
                </div>
                <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">{overflowPersonas.length}</span>
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 w-64 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                <div className="max-h-56 overflow-y-auto p-1 custom-scrollbar">
                  {overflowPersonas.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelect(p.id);
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-2 hover:bg-white/5 rounded-lg text-left transition-colors group">
                      <div className="relative">
                        <img src={p.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt={p.name} />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#18181b] ${p.status === Status.ONLINE ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">{p.name}</span>
                        <span className="text-[10px] text-zinc-500 truncate">{p.role}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onAddPersona}
          className="w-10 h-12 rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 flex items-center justify-center transition-all z-0 ml-4 text-white/20 hover:text-white hover:scale-110 active:scale-95 flex-shrink-0">
          <Plus size={20} />
        </button>

      </div>
    );
  };

// --- Main Connected Component ---
const TopNavBar: React.FC<{ activeServer: string; onSelect: (id: string) => void; }> = ({ activeServer, onSelect }) => {
  const { activeUserId, setActiveUser, currentUser, users, addFriend } = useMessageStore();
  const [localActiveId, setLocalActiveId] = useState<string | null>(null);
  const [isAutoHidden, setIsAutoHidden] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);

  useEffect(() => {
    if (activeUserId) { setLocalActiveId(activeUserId); }
  }, [activeUserId]);

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

  useEffect(() => {
    if (isAutoHidden) {
      setLocalActiveId(activeUserId);
      setDropdownOpen(false);
    }
  }, [isAutoHidden, activeUserId]);

  const personas: Persona[] = useMemo(() => {
    const list: Persona[] = [];
    list.push({
      id: "alex-ai",
      name: "Alex",
      role: "Study Buddy",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=alex",
      status: Status.THINKING
    });

    if (currentUser?.friends) {
      const friends = users.filter(u => currentUser.friends.includes(u.id));
      friends.forEach(f => {
        list.push({
          id: f.id,
          name: f.username,
          role: "Friend",
          avatarUrl: f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`,
          status: f.status === 'online' ? Status.ONLINE : Status.OFFLINE,
          customStatus: f.statusEmoji && f.customStatus ? {
            emoji: f.statusEmoji,
            text: f.customStatus
          } : undefined
        });
      });
    }

    return list;
  }, [currentUser, users]);

  const handleSelect = (id: string) => {
    setLocalActiveId(id);
  };

  const handleOpenChat = (id: string) => {
    setActiveUser(id);
    onSelect(id);
  };

  return (
    <>
      <div
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        className={`fixed top-6 left-0 right-0 flex justify-center z-[9999] py-4 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) pointer-events-none ${isAutoHidden ? "-translate-y-[200%]" : "translate-y-0"}`}
        onMouseEnter={() => {
          setIsAutoHidden(false);
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        }}>
        <ConceptDeck
          personas={personas}
          activeId={localActiveId}
          onSelect={handleSelect}
          onOpenChat={handleOpenChat}
          onAddPersona={() => setIsAddFriendModalOpen(true)}
          isDropdownOpen={isDropdownOpen}
          setDropdownOpen={setDropdownOpen}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />
      </div>

      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />
    </>
  );
};

// --- Add Friend Modal Component ---
const AddFriendModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { users, currentUser, sendFriendRequest } = useMessageStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      const foundUser = users.find(u =>
        u.username.toLowerCase() === searchQuery.toLowerCase().trim() &&
        u.id !== currentUser?.id
      );
      setSearchedUser(foundUser || null);
      setIsSearching(false);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddFriend = async () => {
    if (searchedUser && currentUser) {
      try {
        await sendFriendRequest(searchedUser.username);
        setTimeout(() => {
          onClose();
          setSearchQuery('');
          setSearchedUser(null);
        }, 500);
      } catch (error: any) {
        console.error('Failed to send friend request:', error);
        alert(error.message || 'Failed to send friend request');
      }
    }
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
    setSearchedUser(null);
  };

  const isFriend = currentUser?.friends?.includes(searchedUser?.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-[#1e1e20] border border-white/10 rounded-2xl shadow-2xl w-[480px] p-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus size={24} className="text-purple-400" />
            Add Friend
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X size={20} className="text-zinc-400 hover:text-white" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-2">Enter username</label>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search by username..."
            className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
          <p className="text-xs text-zinc-500 mt-2">Press Enter to search</p>
        </div>

        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent"></div>
          </div>
        )}

        {!isSearching && searchedUser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={searchedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${searchedUser.username}`}
                    alt={searchedUser.username}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-[#1e1e20] ${searchedUser.status === 'online' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                </div>

                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">{searchedUser.username}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${searchedUser.status === 'online' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                      {searchedUser.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {searchedUser.customStatus && (
                    <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1">
                      {searchedUser.customStatus.emoji} {searchedUser.customStatus.text}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleAddFriend}
                disabled={isFriend}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${isFriend ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}>
                <UserPlus size={18} />
                {isFriend ? 'Already Friends' : 'Add Friend'}
              </button>
            </div>
          </motion.div>
        )}

        {!isSearching && searchQuery && !searchedUser && (
          <div className="text-center py-12">
            <p className="text-zinc-400">No user found with username "{searchQuery}"</p>
          </div>
        )}

        {!isSearching && !searchQuery && !searchedUser && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-400">Enter a username to find friends</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TopNavBar;
