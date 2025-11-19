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
            className="fixed bottom-10 right-10 w-[400px] h-[600px] bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col z-[10000] overflow-hidden"
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
                        <p className="text-xs text-green-400">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
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
                        {currentMessages.map((msg) => {
                            const isMe = msg.senderId === currentUser?.id;
                            return (
                                <motion.div
                                    key={msg.id}
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                    transition={{ type: "spring", bounce: 0.4 }}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`
                                        max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm
                                        ${isMe
                                            ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-900/20'
                                            : 'bg-[#27272a] text-gray-300 rounded-bl-none'}
                                    `}>
                                        {msg.text}
                                    </div>
                                </motion.div>
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
