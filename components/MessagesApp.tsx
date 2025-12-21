import React, { useState, useEffect, useRef } from 'react';
import { Search, Phone, Send, MessageCircle, X } from 'lucide-react';
import { useMessageStore, User as StoreUser, Message as StoreMessage } from '../store/useMessageStore';
import { motion } from 'framer-motion';

// Compact Messages App for floating window
const MessagesApp: React.FC = () => {
    const { users, messages, sendMessage, currentUser, subscribeToUsers, subscribeToNotifications, subscribeToMessages, notifications } = useMessageStore();
    const [localActiveUserId, setLocalActiveUserId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Subscribe to users and notifications
    useEffect(() => {
        if (!currentUser) return;
        const unsubUsers = subscribeToUsers();
        const unsubNotifs = subscribeToNotifications();
        return () => {
            unsubUsers();
            unsubNotifs();
        };
    }, [currentUser, subscribeToUsers, subscribeToNotifications]);

    // Subscribe to messages for active chat
    useEffect(() => {
        if (currentUser && localActiveUserId) {
            const unsub = subscribeToMessages(localActiveUserId);
            return () => unsub();
        }
    }, [currentUser, localActiveUserId, subscribeToMessages]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, localActiveUserId]);

    const activeUser = users.find(u => u.id === localActiveUserId);
    const currentMessages = localActiveUserId ? (messages[localActiveUserId] || []) : [];

    // Filter users: show friends only
    const friendUsers = users.filter(user => currentUser?.friends?.includes(user.id));
    const searchFiltered = friendUsers.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSend = () => {
        if (inputText.trim() && localActiveUserId) {
            sendMessage(localActiveUserId, inputText);
            setInputText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!currentUser) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white/50 p-4">
                <p className="text-sm">Please log in to use messaging</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex bg-[#0a0a0a] text-white overflow-hidden">
            {/* Sidebar - Compact Contacts List */}
            <div className="w-52 flex flex-col border-r border-white/10 bg-[#111111]">
                {/* Search Bar */}
                <div className="p-2 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/30 text-white text-xs placeholder-white/30 pl-8 pr-2 py-2 rounded-lg focus:outline-none focus:bg-black/40 border border-white/10"
                        />
                    </div>
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {searchFiltered.length > 0 ? (
                        searchFiltered.map(user => {
                            const userMessages = messages[user.id] || [];
                            const lastMessage = userMessages[userMessages.length - 1];
                            const unreadCount = notifications[user.id] || 0;
                            const isActive = user.id === localActiveUserId;

                            return (
                                <button
                                    key={user.id}
                                    onClick={() => setLocalActiveUserId(user.id)}
                                    className={`w-full text-left p-2 rounded-lg transition-all ${isActive
                                        ? 'bg-indigo-600/30 border border-indigo-500/50'
                                        : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <img
                                                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                                alt={user.username}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <div
                                                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-white truncate">{user.username}</p>
                                            <p className="text-[10px] text-white/40 truncate">
                                                {lastMessage?.text || 'No messages'}
                                            </p>
                                        </div>
                                        {unreadCount > 0 && (
                                            <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-[9px] font-bold">
                                                {unreadCount}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="h-full flex items-center justify-center p-4">
                            <p className="text-xs text-white/30 text-center">No friends yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
                {activeUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-12 shrink-0 border-b border-white/10 px-3 flex items-center justify-between bg-[#111111]">
                            <div className="flex items-center gap-2">
                                <img
                                    src={activeUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUser.id}`}
                                    alt={activeUser.username}
                                    className="w-7 h-7 rounded-full object-cover"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-white">{activeUser.username}</p>
                                    <p className="text-[9px] text-white/40">
                                        {activeUser.status === 'online' ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                            <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                <Phone size={14} className="text-white/60" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {currentMessages.map((msg) => {
                                const isMe = msg.senderId === currentUser?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[75%] px-3 py-1.5 rounded-lg text-xs ${isMe
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white/10 text-white border border-white/10'
                                                }`}
                                        >
                                            <p>{msg.text}</p>
                                            <p className="text-[9px] opacity-60 mt-0.5">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="shrink-0 p-2 border-t border-white/10 bg-[#111111]">
                            <div className="flex items-center gap-2 bg-black/30 rounded-lg px-2 py-1.5 border border-white/10">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent text-white text-xs placeholder-white/30 focus:outline-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Send size={12} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-white/30">
                        <MessageCircle size={32} className="mb-2 opacity-50" />
                        <p className="text-xs text-center">Select a friend to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesApp;
