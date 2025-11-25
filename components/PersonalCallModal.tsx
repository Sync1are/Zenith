import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessageStore } from '../store/useMessageStore';
import { useAppStore } from '../store/useAppStore';
import { useWebRTC } from '../hooks/useWebRTC';

const PersonalCallModal: React.FC = () => {
    const { personalCall, acceptPersonalCall, endPersonalCall } = useAppStore();
    const { isActive, mode, callId, otherUserId } = personalCall;
    const { users, currentUser } = useMessageStore();
    const [ringTimer, setRingTimer] = useState(45);

    const {
        isMicOn,
        connectionStatus,
        error,
        initializeCall,
        joinCall,
        toggleMic,
        leaveCall,
    } = useWebRTC();

    const otherUser = users.find(u => u.id === otherUserId);

    // Handle call connection
    useEffect(() => {
        if (!isActive || !callId || !currentUser?.id) return;

        if (mode === 'outgoing' || mode === 'connected') {
            // Caller initiates the call
            if (connectionStatus === 'idle') {
                initializeCall(callId, currentUser.id);
            }
        } else if (mode === 'incoming') {
            // Receiver joins when they accept
            // We'll join in handleAccept instead
        }
    }, [isActive, mode, callId, currentUser?.id, connectionStatus]);

    // 45-second timeout for incoming calls
    useEffect(() => {
        if (mode === 'incoming' && isActive) {
            setRingTimer(45);
            const interval = setInterval(() => {
                setRingTimer(prev => {
                    if (prev <= 1) {
                        // Time's up - auto hang up
                        clearInterval(interval);
                        handleDecline();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [mode, isActive]);

    // Reset timer when mode changes to connected
    useEffect(() => {
        if (mode === 'connected') {
            setRingTimer(0);
        }
    }, [mode]);

    const handleAccept = async () => {
        if (callId && currentUser?.id) {
            acceptPersonalCall();
            await joinCall(callId, currentUser.id);
        }
    };

    const handleDecline = () => {
        leaveCall();
        endPersonalCall();
    };

    const handleEnd = () => {
        leaveCall();
        endPersonalCall();
    };

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center p-4">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative glass-modal overflow-hidden pointer-events-auto shadow-2xl w-full max-w-sm"
                >
                    <style>{`
                        .glass-modal {
                            background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
                            backdrop-filter: blur(14px) saturate(1.05);
                            border: 1px solid rgba(255,255,255,0.08);
                            box-shadow: 0 30px 80px rgba(79,70,229,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
                            border-radius: 24px;
                        }
                    `}</style>

                    {/* Incoming Call UI */}
                    {mode === 'incoming' && (
                        <div className="text-center py-12 px-8">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="mb-6"
                            >
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mx-auto mb-4 flex items-center justify-center animate-pulse shadow-xl shadow-indigo-500/30">
                                    {otherUser?.avatar ? (
                                        <img src={otherUser.avatar} alt={otherUser.username} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-white">{otherUser?.username?.[0] || '?'}</span>
                                    )}
                                </div>
                            </motion.div>

                            <h3 className="text-2xl font-bold text-white mb-2">{otherUser?.username || 'Unknown'}</h3>
                            <p className="text-indigo-300 mb-2 flex items-center justify-center gap-2">
                                <span className="text-xl">📞</span>
                                <span>Ringing...</span>
                            </p>
                            <p className="text-xs text-gray-500 mb-8">{ringTimer}s</p>

                            <div className="flex justify-center gap-6">
                                <button
                                    onClick={handleDecline}
                                    className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center group"
                                    title="Decline"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleAccept}
                                    className="w-16 h-16 rounded-full bg-green-500 text-white hover:bg-green-400 hover:scale-110 shadow-xl shadow-green-500/30 transition-all flex items-center justify-center"
                                    title="Accept"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Active Call UI */}
                    {(mode === 'outgoing' || mode === 'connected') && (
                        <div className="py-10 px-8">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mx-auto mb-4 flex items-center justify-center shadow-lg">
                                    {otherUser?.avatar ? (
                                        <img src={otherUser.avatar} alt={otherUser.username} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-white">{otherUser?.username?.[0] || '?'}</span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{otherUser?.username || 'Unknown'}</h3>
                                <div className="flex items-center justify-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                                            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                                'bg-gray-500'
                                        }`} />
                                    <p className={`text-sm font-medium ${connectionStatus === 'connected' ? 'text-green-400' : 'text-gray-400'}`}>
                                        {connectionStatus === 'connected' ? 'Connected' :
                                            connectionStatus === 'connecting' ? 'Connecting...' :
                                                mode === 'outgoing' ? 'Ringing...' : 'Disconnected'}
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-sm text-red-400 text-center">{error}</p>
                                </div>
                            )}

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={toggleMic}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMicOn
                                            ? 'bg-white/10 text-white hover:bg-white/20'
                                            : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                                        }`}
                                    title={isMicOn ? 'Mute' : 'Unmute'}
                                >
                                    {isMicOn ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    )}
                                </button>
                                <button
                                    onClick={handleEnd}
                                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/30 flex items-center justify-center"
                                    title="End Call"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default PersonalCallModal;
