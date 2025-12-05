import React, { useState, useEffect, useRef } from 'react';
import { Search, Phone, Video, MoreVertical, Paperclip, Smile, Mic, Send, Pin, UserPlus, UserMinus, X } from 'lucide-react';
import { useMessageStore, User as StoreUser, Message as StoreMessage } from '../store/useMessageStore';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from './EmojiPicker';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import InlinePersonalCall from './InlinePersonalCall';

// Emoji data by category
const EMOJI_DATA = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😎', '🤓', '🧐'],
    'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'],
    'Food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋', '🤼', '🤸', '🤺', '⛹', '🤾', '🏌', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩'],
    'Travel': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟', '🎡', '🎢', '🎠', '⛲', '⛱', '🏖', '🏝', '🏜', '🌋', '⛰', '🏔', '🗻', '🏕', '⛺', '🛖', '🏠', '🏡', '🏘', '🏚', '🏗', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛', '⛪', '🕌', '🕍', '🛕', '🕋']
};

// --- COMPONENTS ---

// Context Menu Component
const ContextMenu: React.FC<{
    x: number;
    y: number;
    user: StoreUser;
    currentUserId: string;
    onClose: () => void;
    onPin: () => void;
    onSendFriendRequest: () => void;
    onRemoveFriend: () => void;
}> = ({ x, y, user, currentUserId, onClose, onPin, onSendFriendRequest, onRemoveFriend }) => {
    const { currentUser } = useMessageStore();
    const isFriend = currentUser?.friends?.includes(user.id) || false;

    useEffect(() => {
        const handleClick = () => onClose();
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [onClose]);

    return (
        <div
            className="fixed bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl py-2 z-[9999]"
            style={{ left: x, top: y }}
            onClick={(e) => e.stopPropagation()}
        >
            {isFriend && (
                <button
                    onClick={() => { onPin(); onClose(); }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                    <Pin size={14} />
                    Pin to Top Navbar
                </button>
            )}
            {isFriend ? (
                <button
                    onClick={() => { onRemoveFriend(); onClose(); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                    <UserMinus size={14} />
                    Remove Friend
                </button>
            ) : (
                <button
                    onClick={() => { onSendFriendRequest(); onClose(); }}
                    className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                    <UserPlus size={14} />
                    Send Friend Request
                </button>
            )}
        </div>
    );
};

// ChatListItem Component
const ChatListItem: React.FC<{
    user: StoreUser;
    isActive: boolean;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    lastMessage?: StoreMessage;
    unreadCount: number;
}> = ({ user, isActive, onClick, onContextMenu, lastMessage, unreadCount }) => {
    const statusColor = {
        online: 'bg-green-500',
        idle: 'bg-yellow-500',
        dnd: 'bg-red-500',
        invisible: 'bg-gray-500',
        offline: 'bg-gray-600'
    }[user.status] || 'bg-gray-600';

    const formattedTime = lastMessage
        ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <div
            onClick={onClick}
            onContextMenu={onContextMenu}
            className={`px-3 py-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-300 group relative overflow-hidden ${isActive
                ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 shadow-lg shadow-indigo-500/10 scale-[1.02]'
                : 'hover:bg-zinc-800/50 border border-transparent hover:border-white/5 hover:scale-[1.01]'
                }`}
        >
            {/* Active indicator */}
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-r-full shadow-lg shadow-indigo-500/50" />
            )}

            <div className="relative shrink-0">
                <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt={user.username}
                    className={`w-11 h-11 rounded-full object-cover bg-gray-700 shadow-lg transition-all ${isActive ? 'ring-2 ring-indigo-500/50' : 'ring-1 ring-white/10'}`}
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${statusColor} border-2 border-zinc-900 rounded-full ${user.status === 'online' ? 'shadow-[0_0_8px_rgba(34,197,94,0.8)]' : ''}`}></div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className={`font-semibold text-sm truncate ${isActive ? 'text-white' : 'text-zinc-200'}`}>
                        {user.username}
                    </h4>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-300' : 'text-zinc-500'}`}>
                        {formattedTime}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    {user.customStatus ? (
                        <p className={`text-xs truncate max-w-[140px] ${isActive ? 'text-white/80' : 'text-zinc-400'}`}>
                            {user.statusEmoji && `${user.statusEmoji} `}{user.customStatus}
                        </p>
                    ) : (
                        <p className={`text-xs truncate max-w-[140px] ${isActive ? 'text-white/70' : 'text-white/40'}`}>
                            {lastMessage?.text || 'No messages yet'}
                        </p>
                    )}
                    {unreadCount > 0 && (
                        <div className="w-5 h-5 bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-lg backdrop-blur-sm">
                            {unreadCount}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ChatList Component (Left Panel)
const ChatList: React.FC<{
    localActiveUserId: string | null;
    onSelectUser: (userId: string) => void;
}> = ({ localActiveUserId, onSelectUser }) => {
    const { users, messages, currentUser, sendFriendRequest, removeFriend, notifications } = useMessageStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'friends'>('all');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; user: StoreUser } | null>(null);

    // Filter users: show friends (users you can message)
    // In "All DMs" tab, show all friends
    // Messages will load when you select a friend
    const friendUsers = users.filter(user =>
        currentUser?.friends?.includes(user.id)
    );

    // Apply tab filtering
    let filteredUsers = friendUsers;
    if (activeTab === 'friends') {
        filteredUsers = friendUsers; // Same as All DMs for now
    } else if (activeTab === 'groups') {
        filteredUsers = []; // No groups yet
    }

    // Apply search filtering
    const searchFiltered = filteredUsers.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleContextMenu = (e: React.MouseEvent, user: StoreUser) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, user });
    };

    const handlePin = (user: StoreUser) => {
        // Store pinned contacts in localStorage
        const pinned = JSON.parse(localStorage.getItem('pinnedContacts') || '[]');
        if (!pinned.includes(user.id)) {
            pinned.push(user.id);
            localStorage.setItem('pinnedContacts', JSON.stringify(pinned));
        }
    };

    const handleSendFriendRequest = async (username: string) => {
        try {
            await sendFriendRequest(username);
            alert('Friend request sent!');
        } catch (error: any) {
            alert(error.message || 'Failed to send friend request');
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        if (confirm('Are you sure you want to remove this friend?')) {
            try {
                await removeFriend(friendId);
            } catch (error) {
                alert('Failed to remove friend');
            }
        }
    };

    return (
        <div className="w-full md:w-[24rem] lg:w-[26rem] flex flex-col gap-4 h-full shrink-0 p-4 pt-10 pb-8">
            {/* Floating Search Bar */}
            <div className="relative group bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl h-20 flex items-center">
                <Search className="absolute left-4 text-white/30 group-focus-within:text-white/70 transition-colors" size={18} />
                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-full bg-transparent text-white placeholder-white/30 pl-12 pr-4 rounded-2xl focus:outline-none focus:border-white/20 transition-all text-sm"
                />
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex gap-2">
                {(['all', 'groups', 'friends'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === tab
                            ? 'bg-white/10 text-white shadow-lg'
                            : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                            }`}
                    >
                        {tab === 'all' ? 'All DMs' : tab === 'groups' ? 'All Groups' : 'Friends'}
                    </button>
                ))}
            </div>

            {/* Floating Contacts List */}
            <div className="flex-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 shadow-2xl overflow-hidden flex flex-col relative">
                <div className="flex-1 overflow-y-auto space-y-2 px-2 scrollbar-hide">
                    {searchFiltered.length > 0 ? (
                        searchFiltered.map(user => {
                            const userMessages = messages[user.id] || [];
                            const lastMessage = userMessages[userMessages.length - 1];
                            const unreadCount = notifications[user.id] || 0;

                            return (
                                <ChatListItem
                                    key={user.id}
                                    user={user}
                                    isActive={user.id === localActiveUserId}
                                    onClick={() => onSelectUser(user.id)}
                                    onContextMenu={(e) => handleContextMenu(e, user)}
                                    lastMessage={lastMessage}
                                    unreadCount={unreadCount}
                                />
                            );
                        })
                    ) : (
                        <div className="h-full flex items-center justify-center text-white/30 text-sm">
                            {activeTab === 'groups' ? 'No groups yet' : activeTab === 'friends' ? 'No friends yet. Add friends to see them here!' : 'No conversations yet'}
                        </div>
                    )}
                </div>
                {/* Fade gradient at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none rounded-b-[2.5rem]"></div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    user={contextMenu.user}
                    currentUserId={currentUser?.id || ''}
                    onClose={() => setContextMenu(null)}
                    onPin={() => handlePin(contextMenu.user)}
                    onSendFriendRequest={() => handleSendFriendRequest(contextMenu.user.username)}
                    onRemoveFriend={() => handleRemoveFriend(contextMenu.user.id)}
                />
            )}
        </div>
    );
};

// ChatWindow Component (Right Panel)
const ChatWindow: React.FC<{
    localActiveUserId: string | null;
}> = ({ localActiveUserId }) => {
    const { users, messages, sendMessage, currentUser, subscribeToMessages } = useMessageStore();
    const { startPersonalCall } = useAppStore();
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeUser = users.find(u => u.id === localActiveUserId);
    const currentMessages = localActiveUserId ? (messages[localActiveUserId] || []) : [];

    // Subscribe to messages and clear notifications
    useEffect(() => {
        if (localActiveUserId) {
            const unsub = subscribeToMessages(localActiveUserId);

            // Clear notifications when opening chat
            if (currentUser?.id) {
                const notifRef = doc(db, 'users', currentUser.id, 'notifications', localActiveUserId);
                deleteDoc(notifRef).catch(() => { });
            }

            return () => unsub();
        }
    }, [localActiveUserId, subscribeToMessages, currentUser]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (inputText.trim() && localActiveUserId) {
            sendMessage(localActiveUserId, inputText);
            setInputText('');
        }
    };

    // Call handler functions
    const handleVoiceCall = () => {
        if (!localActiveUserId) return;
        const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        startPersonalCall(localActiveUserId);
        sendMessage(localActiveUserId, 'Voice call...', 'personal_call', { callId, callStatus: 'ringing' });
    };

    const handleVideoCall = () => {
        if (!localActiveUserId) return;
        const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        startPersonalCall(localActiveUserId);
        sendMessage(localActiveUserId, 'Video call...', 'personal_call', { callId, callStatus: 'ringing' });
    };

    if (!activeUser) {
        return (
            <div className="flex-1 flex items-center justify-center text-white/30">
                <p>Select a contact to start messaging</p>
            </div>
        );
    }

    const statusText = {
        online: 'Online',
        idle: 'Idle',
        dnd: 'Do Not Disturb',
        invisible: 'Invisible',
        offline: 'Offline'
    }[activeUser.status] || 'Offline';

    return (
        <div className="flex-1 flex flex-col gap-4 h-full min-w-0 p-4 pt-10 pb-8">
            {/* Floating Header */}
            <div className="h-20 shrink-0 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-6 md:px-8 flex items-center justify-between shadow-2xl z-10">
                <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer">
                        <img
                            src={activeUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUser.id}`}
                            alt={activeUser.username}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 shadow-lg group-hover:scale-105 transition-transform"
                        />
                        <div className={`absolute bottom-0 right-0 w-3 h-3 ${activeUser.status === 'online' ? 'bg-green-500' :
                            activeUser.status === 'idle' ? 'bg-yellow-500' :
                                activeUser.status === 'dnd' ? 'bg-red-500' :
                                    'bg-gray-500'
                            } rounded-full border-2 border-gray-900 shadow-[0_0_10px_rgba(34,197,94,0.6)]`}></div>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg tracking-wide leading-tight">{activeUser.username}</h2>
                        {activeUser.customStatus ? (
                            <p className="text-white/60 text-[11px] flex items-center gap-1 font-medium tracking-wide mt-0.5">
                                {activeUser.statusEmoji && `${activeUser.statusEmoji} `}{activeUser.customStatus}
                            </p>
                        ) : (
                            <p className={`text-[11px] flex items-center gap-1 font-medium tracking-wide mt-0.5 ${activeUser.status === 'online' ? 'text-green-400/80' : 'text-white/40'
                                }`}>
                                {statusText}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 text-white/50">
                    <button
                        onClick={handleVoiceCall}
                        className="p-3 hover:bg-white/10 hover:text-green-400 rounded-full transition-all"
                        title="Voice Call"
                    >
                        <Phone size={18} />
                    </button>
                    <button
                        onClick={handleVideoCall}
                        className="p-3 hover:bg-white/10 hover:text-blue-400 rounded-full transition-all"
                        title="Video Call"
                    >
                        <Video size={18} />
                    </button>
                    <div className="w-px h-5 bg-white/10 mx-2"></div>
                    <button className="p-3 hover:bg-white/10 hover:text-white rounded-full transition-all"><MoreVertical size={18} /></button>
                </div>
            </div>

            {/* Floating Messages Area */}
            <div className="flex-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 md:p-8 shadow-2xl overflow-hidden relative flex flex-col z-0">
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 scroll-smooth custom-scrollbar">
                    <div className="flex justify-center mb-6 opacity-60">
                        <span className="bg-black/30 text-white/50 text-[10px] font-bold px-4 py-1.5 rounded-full backdrop-blur-sm tracking-wider uppercase">Today</span>
                    </div>

                    {currentMessages.map((msg, idx) => {
                        const isMe = msg.senderId === currentUser?.id;

                        // Render call messages with InlinePersonalCall component
                        if (msg.type === 'personal_call') {
                            return (
                                <div key={msg.id} className="flex w-full justify-center my-2">
                                    <InlinePersonalCall
                                        message={msg}
                                        isMe={isMe}
                                        chatId={[currentUser?.id || '', localActiveUserId || ''].sort().join('_')}
                                        currentUser={currentUser}
                                        otherUser={activeUser}
                                    />
                                </div>
                            );
                        }

                        // Regular text messages
                        return (
                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                <div className={`flex max-w-[85%] md:max-w-[65%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                                    {/* Avatar for other user */}
                                    {!isMe && (
                                        <img
                                            src={activeUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUser?.id}`}
                                            alt={activeUser?.username}
                                            className="w-8 h-8 rounded-full object-cover bg-gray-700 shadow-lg ring-1 ring-white/10 flex-shrink-0"
                                        />
                                    )}

                                    {/* Message Bubble */}
                                    <div className={`
                                        relative px-4 py-2.5 text-[14px] leading-relaxed shadow-xl transition-all
                                        ${isMe
                                            ? 'bg-gradient-to-br from-indigo-600/90 to-purple-700/90 text-white rounded-2xl rounded-br-md backdrop-blur-xl'
                                            : 'bg-zinc-800/90 backdrop-blur-xl text-white rounded-2xl rounded-bl-md border border-white/5'
                                        }
                                        hover:scale-[1.01] transition-transform
                                    `}>
                                        <p className="break-words">{msg.text}</p>
                                        <div className={`text-[10px] mt-1 text-right font-medium tracking-wide opacity-60 flex items-center justify-end gap-1`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isMe && <span className="text-green-400">✓✓</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Floating Input Area */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 pr-3 flex items-center gap-2 shadow-2xl shrink-0 z-10 group hover:bg-white/10 transition-colors duration-500 relative">
                {/* Icons Left */}
                <div className="flex items-center gap-1 px-3 border-r border-white/10 mr-1 relative">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2.5 text-white/40 hover:text-yellow-400 hover:bg-white/5 rounded-full transition-colors"
                        title="Emoji Picker"
                    >
                        <Smile size={20} />
                    </button>

                    {/* Emoji Picker */}
                    <AnimatePresence>
                        {showEmojiPicker && (
                            <EmojiPicker
                                onEmojiSelect={(emoji) => {
                                    setInputText(prev => prev + emoji);
                                }}
                                onClose={() => setShowEmojiPicker(false)}
                            />
                        )}
                    </AnimatePresence>

                    <button className="p-2.5 text-white/40 hover:text-blue-400 hover:bg-white/5 rounded-full transition-colors" title="Attach File">
                        <Paperclip size={20} />
                    </button>
                </div>

                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message here..."
                    className="flex-1 bg-transparent text-white placeholder-white/20 border-none focus:ring-0 focus:outline-none text-sm py-4 px-2 font-light"
                />

                <div className="flex items-center gap-2">
                    {!inputText ? (
                        <button className="p-3 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                            <Mic size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            className="p-3.5 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
                        >
                            <Send size={18} className="text-white" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main ChatApp Component
const ChatApp: React.FC = () => {
    const { currentUser, subscribeToUsers, subscribeToNotifications } = useMessageStore();
    const [localActiveUserId, setLocalActiveUserId] = useState<string | null>(null);

    // Subscribe to users and notifications
    useEffect(() => {
        const unsubUsers = subscribeToUsers();
        const unsubNotifs = subscribeToNotifications();
        return () => {
            unsubUsers();
            unsubNotifs();
        };
    }, [subscribeToUsers, subscribeToNotifications]);

    if (!currentUser) {
        return (
            <div className="w-full h-screen flex items-center justify-center text-white/50">
                <p>Please log in to use the messaging system</p>
            </div>
        );
    }

    return (
        <div className="w-full flex gap-0 overflow-hidden" style={{ height: '98.5vh' }}>
            {/* Left Panel - ChatList with animation */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <ChatList
                    localActiveUserId={localActiveUserId}
                    onSelectUser={setLocalActiveUserId}
                />
            </motion.div>

            {/* Right Panel - ChatWindow with animation */}
            <motion.div
                className="flex-1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
            >
                <ChatWindow localActiveUserId={localActiveUserId} />
            </motion.div>
        </div>
    );
};

export default ChatApp;
