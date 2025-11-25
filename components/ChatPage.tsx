import React, { useState, useEffect, useRef } from 'react';
import { useMessageStore } from '../store/useMessageStore';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { SparklesIcon, CloseIcon } from './icons/IconComponents';
import { getChatResponse } from '../services/studyBuddyService';
import { useAppStore } from '../store/useAppStore';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const SendIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChatPage: React.FC = () => {
    const { activeUserId, users, messages, sendMessage, setActiveUser, currentUser, subscribeToMessages } = useMessageStore();
    const { tasks, startPersonalCall } = useAppStore();
    const [inputText, setInputText] = useState("");
    const [azeMessages, setAzeMessages] = useState<ChatMessage[]>([]);
    const [isAzeLoading, setIsAzeLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();

    const activeUser = users.find(u => u.id === activeUserId);
    const currentMessages = activeUserId ? (messages[activeUserId] || []) : [];

    // Check if this is Aze AI chat
    const isAzeChat = activeUserId === "aze-ai";

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [currentMessages, activeUserId, azeMessages]);

    // Load Aze chat history
    useEffect(() => {
        if (isAzeChat) {
            const saved = localStorage.getItem('aze-chat-history');
            if (saved) {
                try {
                    setAzeMessages(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to load Aze chat history');
                }
            }
        }
    }, [isAzeChat]);

    // Save Aze chat history
    useEffect(() => {
        if (isAzeChat && azeMessages.length > 0) {
            localStorage.setItem('aze-chat-history', JSON.stringify(azeMessages));
        }
    }, [azeMessages, isAzeChat]);

    // Subscribe to messages for active user
    useEffect(() => {
        if (activeUserId && !isAzeChat) {
            const unsub = subscribeToMessages(activeUserId);
            return () => unsub();
        }
    }, [activeUserId, isAzeChat]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !activeUserId) return;

        // Handle Aze AI chat
        if (isAzeChat) {
            const userMessage: ChatMessage = {
                id: Date.now(),
                role: 'user',
                content: inputText,
                timestamp: Date.now()
            };
            setAzeMessages(prev => [...prev, userMessage]);
            setInputText("");
            setIsAzeLoading(true);

            try {
                const response = await getChatResponse(inputText, azeMessages);
                const aiMessage: ChatMessage = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: response,
                    timestamp: Date.now()
                };
                setAzeMessages(prev => [...prev, aiMessage]);
            } catch (err) {
                console.error('Aze error:', err);
                const errorMessage: ChatMessage = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: "Sorry, I'm having trouble responding right now. Please try again!",
                    timestamp: Date.now()
                };
                setAzeMessages(prev => [...prev, errorMessage]);
            }
            setIsAzeLoading(false);
        } else {
            // Regular chat
            sendMessage(activeUserId, inputText);
            setInputText("");
        }
    };

    const handleCall = async () => {
        if (!activeUserId || !currentUser) return;

        // Start personal call (not a study session)
        startPersonalCall(activeUserId);
        const { personalCall } = useAppStore.getState();
        const callId = personalCall.callId;

        // Send invite message (for history)
        sendMessage(activeUserId, "📞 Ringing...", 'personal_call_invite', { callId });

        // Trigger "Ring" on receiver's end
        try {
            await setDoc(doc(db, "users", activeUserId, "incoming_personal_call", "active"), {
                callId,
                callerId: currentUser.id,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error("Error triggering call:", error);
        }
    };

    if (!activeUser && !isAzeChat) return null;

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
                className={`flex items-center justify-between p-4 border-b border-white/5 bg-white/5 cursor-move select-none touch-none ${isAzeChat ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20' : ''
                    }`}
            >
                <div className="flex items-center gap-3 pointer-events-none">
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="relative"
                    >
                        {isAzeChat ? (
                            // Aze avatar
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        ) : (
                            // Regular user avatar
                            <>
                                <img
                                    src={activeUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUser.username}`}
                                    alt={activeUser.username}
                                    className="w-10 h-10 rounded-full bg-gray-700 object-cover"
                                />
                                <div className={`
                                    absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#18181b]
                                    ${activeUser.status === 'online' ? 'bg-green-500' :
                                        activeUser.status === 'idle' ? 'bg-yellow-500' :
                                            activeUser.status === 'dnd' ? 'bg-red-500' :
                                                activeUser.status === 'invisible' ? 'bg-gray-700' : 'bg-gray-500'}
                                `} />
                            </>
                        )}
                    </motion.div>
                    <div>
                        <h2 className="text-sm font-medium text-white">
                            {isAzeChat ? (
                                <span className="flex items-center gap-1.5">
                                    <span>✨</span> Aze
                                </span>
                            ) : activeUser.username}
                        </h2>
                        {isAzeChat ? (
                            <p className="text-xs text-indigo-400">Your AI Study Buddy</p>
                        ) : (
                            <>
                                {activeUser.customStatus && (
                                    <p className="text-xs text-gray-400 mb-0.5">
                                        {activeUser.statusEmoji && <span className="mr-1">{activeUser.statusEmoji}</span>}
                                        {activeUser.customStatus}
                                    </p>
                                )}
                                <p className={`text-xs ${activeUser.status === 'online' ? 'text-green-400' : activeUser.status === 'idle' ? 'text-yellow-400' : activeUser.status === 'dnd' ? 'text-red-400' : 'text-gray-500'}`}>
                                    {activeUser.status === 'online' ? 'Online' : activeUser.status === 'idle' ? 'Idle' : activeUser.status === 'dnd' ? 'Do Not Disturb' : activeUser.status === 'invisible' ? 'Invisible' : 'Offline'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isAzeChat && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCall(); }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-indigo-400 hover:text-white cursor-pointer"
                            title="Start Study Call"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                        </button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setActiveUser(null); }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white cursor-pointer"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={scrollRef}>
                {isAzeChat ? (
                    // Aze AI Chat Messages
                    <>
                        {azeMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center px-4">
                                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                                    <span className="text-5xl mb-4 block">✨</span>
                                    <h3 className="text-lg font-semibold text-white mb-2">Hi! I'm Aze</h3>
                                    <p className="text-sm mb-4">Your AI study buddy here to help you stay productive!</p>
                                    <div className="text-xs text-left space-y-2 bg-white/5 rounded-lg p-4 mt-4">
                                        <p className="text-indigo-400 font-medium">💡 Try asking me to:</p>
                                        <ul className="space-y-1 text-gray-500">
                                            <li>• Break down your tasks</li>
                                            <li>• Give study tips</li>
                                            <li>• Help you focus</li>
                                            <li>• Motivate you!</li>
                                        </ul>
                                    </div>
                                </motion.div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {azeMessages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                                            <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm break-words overflow-hidden ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-none'
                                                : 'bg-gradient-to-br from-indigo-600/30 to-purple-600/30 text-gray-100 border border-indigo-500/30 rounded-bl-none'
                                                }`}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                                                        a: ({ node, ...props }) => <a className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                        code: ({ node, ...props }) => <code className="bg-black/30 rounded px-1 py-0.5 font-mono text-xs break-all" {...props} />,
                                                        pre: ({ node, ...props }) => <pre className="bg-black/30 rounded p-2 overflow-x-auto my-2" {...props} />
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                            <p className={`text-[9px] text-gray-500 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                                {isAzeLoading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                        <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 px-4 py-3 rounded-2xl rounded-bl-none">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    // Regular Chat Messages
                    <>
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
                                    const showDateSeparator = !prevDate || currentDate.toDateString() !== prevDate.toDateString();

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDateSeparator && (
                                                <div className="flex justify-center my-4">
                                                    <span className="text-[10px] font-medium text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                                                        {currentDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            )}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[75%] ${isMe ? 'order-2' : 'order-1'}`}>
                                                    <div
                                                        className={`px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${isMe
                                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                                                            : 'bg-white/10 text-gray-100 border border-white/10 rounded-bl-none'
                                                            }`}
                                                    >
                                                        {msg.type === 'call_invite' || msg.type === 'personal_call_invite' ? (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                                                                    📞
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold">Ringing...</div>
                                                                    <div className="text-xs opacity-80">Click to join</div>
                                                                </div>
                                                                <button
                                                                    onClick={() => msg.sessionCode && startStudySession(msg.sessionCode)}
                                                                    className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                                                                >
                                                                    JOIN
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            msg.text
                                                        )}
                                                    </div>
                                                    <p className={`text-[9px] text-gray-500 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </React.Fragment>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-white/5">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-black/30 transition-all"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!inputText.trim() || (isAzeChat && isAzeLoading)}
                        className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                    >
                        <SendIcon className="w-5 h-5" />
                    </motion.button>
                </div>
            </form>
        </motion.div>
    );
};

export default ChatPage;
