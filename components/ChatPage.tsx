import React, { useState, useEffect, useRef } from 'react';
import { useMessageStore } from '../store/useMessageStore';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { SparklesIcon, CloseIcon } from './icons/IconComponents';

const SendIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChatPage: React.FC = () => {
    const { activeUserId, users, messages, sendMessage, setActiveUser, currentUser } = useMessageStore();
    const [inputText, setInputText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();

    const activeUser = users.find(u => u.id === activeUserId);
    const currentMessages = activeUserId ? (messages[activeUserId] || []) : [];

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [currentMessages, activeUserId]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !activeUserId) return;

        sendMessage(activeUserId, inputText);
        setInputText("");
    };

    if (!activeUser) return null;

    return (
        <motion.div
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="fixed bottom-4 right-4 md:bottom-10 md:right-10 
                       w-[90vw] max-w-[400px] min-w-[320px]
                       h-[70vh] max-h-[600px] min-h-[400px]
                       bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl 
                       shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col z-[10000] overflow-hidden"
        >
            {/* Header (Draggable Handle) */}
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 cursor-move select-none touch-none"
            >
                <div className="flex items-center gap-3 pointer-events-none">
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="relative"
                    >
                        <img
                            src={activeUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUser.username}`}
                            alt={activeUser.username}
                            className="w-10 h-10 rounded-full bg-gray-700 object-cover"
                        />
                        <div className={`
                            absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#18181b]
                            ${activeUser.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}
                        `} />
                    </motion.div>
                    <div>
                        <h2 className="text-sm font-medium text-white">{activeUser.username}</h2>
                        <p className={`text-xs ${activeUser.status === 'online' ? 'text-green-400' : 'text-gray-500'}`}>
                            {activeUser.status === 'online' ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); setActiveUser(null); }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white cursor-pointer"
                >
                    <CloseIcon className="w-5 h-5" />
                </motion.button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={scrollRef}>
                {currentMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <SparklesIcon className="w-8 h-8 mb-2" />
                        </motion.div>
                        <p className="text-sm">No messages yet.</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {currentMessages.map((msg, index) => {
                            const isMe = msg.senderId === currentUser?.id;
                            const prevMsg = index > 0 ? currentMessages[index - 1] : null;

                            // Check if we need a date separator
                            const currentDate = new Date(msg.timestamp);
                            const prevDate = prevMsg ? new Date(prevMsg.timestamp) : null;
                            const needsDateSeparator = !prevDate ||
                                currentDate.toDateString() !== prevDate.toDateString();

                            // Check if we need to show timestamp (> 2 min gap or different sender)
                            const timeDiff = prevMsg ? msg.timestamp - prevMsg.timestamp : Infinity;
                            const differentSender = prevMsg ? msg.senderId !== prevMsg.senderId : true;
                            const showTimestamp = differentSender || timeDiff > 2 * 60 * 1000; // 2 minutes

                            // Format date separator
                            const formatDateSeparator = (date: Date) => {
                                const today = new Date();
                                const yesterday = new Date(today);
                                yesterday.setDate(yesterday.getDate() - 1);

                                if (date.toDateString() === today.toDateString()) {
                                    return "Today";
                                } else if (date.toDateString() === yesterday.toDateString()) {
                                    return "Yesterday";
                                } else {
                                    return date.toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                                    });
                                }
                            };

                            return (
                                <React.Fragment key={msg.id}>
                                    {/* Date Separator */}
                                    {needsDateSeparator && (
                                        <div className="flex items-center gap-3 my-4">
                                            <div className="flex-1 h-px bg-white/10" />
                                            <span className="text-xs text-gray-500 font-medium px-3 py-1 bg-white/5 rounded-full">
                                                {formatDateSeparator(currentDate)}
                                            </span>
                                            <div className="flex-1 h-px bg-white/10" />
                                        </div>
                                    )}

                                    {/* Message */}
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                        transition={{ type: "spring", bounce: 0.4 }}
                                        className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        {/* Avatar with timestamp below */}
                                        {showTimestamp ? (
                                            <div className="flex flex-col items-center gap-0.5 min-w-[32px]">
                                                <img
                                                    src={
                                                        (isMe ? currentUser?.avatar : activeUser.avatar) ||
                                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${isMe ? currentUser?.username : activeUser.username}`
                                                    }
                                                    alt="Avatar"
                                                    className="w-8 h-8 rounded-full bg-gray-700 object-cover"
                                                />
                                                <span className="text-[9px] text-gray-500 whitespace-nowrap">
                                                    {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="w-8" /> // Spacer to maintain alignment
                                        )}

                                        <div className="flex flex-col gap-1 max-w-[70%]">
                                            <div className={`
                                                px-4 py-2 rounded-2xl text-sm shadow-sm
                                                ${isMe
                                                    ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-900/20'
                                                    : 'bg-[#27272a] text-gray-300 rounded-bl-none'}
                                            `}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    </motion.div>
                                </React.Fragment>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4">
                <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl p-1 focus-within:border-white/10 transition-colors"
                >
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Message..."
                        className="flex-1 bg-transparent border-none outline-none text-white px-3 py-2 text-sm placeholder-gray-600"
                        autoFocus
                    />
                    <motion.button
                        type="submit"
                        disabled={!inputText.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white transition-colors"
                    >
                        <SendIcon className="w-4 h-4" />
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
};

export default ChatPage;
