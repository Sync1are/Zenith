import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Message } from '../store/useMessageStore';
import { Phone, PhoneOff, Mic, MicOff, Clock } from 'lucide-react';

interface InlinePersonalCallProps {
    message: Message;
    isMe: boolean;
    chatId: string;
    currentUser: any;
    otherUser: any;
}

const InlinePersonalCall: React.FC<InlinePersonalCallProps> = ({
    message,
    isMe,
    chatId,
    currentUser,
    otherUser
}) => {
    const {
        personalCall,
        acceptPersonalCall,
        endPersonalCall,
        handleIncomingPersonalCall
    } = useAppStore();

    const {
        isMicOn,
        connectionStatus,
        initializeCall,
        joinCall,
        toggleMic,
        leaveCall,
    } = useWebRTC();

    const [duration, setDuration] = useState(0);
    const [callStatus, setCallStatus] = useState(message.callStatus || 'ringing');
    const [ringTimer, setRingTimer] = useState(45);

    // Listen to real-time updates for this specific message to sync status
    useEffect(() => {
        const msgRef = doc(db, 'chats', chatId, 'messages', message.id);
        const unsub = onSnapshot(msgRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.callStatus && data.callStatus !== callStatus) {
                    setCallStatus(data.callStatus);
                }
                // Sync duration if provided in update (for "Call lasted X")
                if (data.callDuration) {
                    setDuration(data.callDuration);
                }
            }
        });
        return () => unsub();
    }, [chatId, message.id]);

    // Timer for ringing (45s window)
    useEffect(() => {
        if (callStatus === 'ringing') {
            const timer = setInterval(() => {
                setRingTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleTimeout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [callStatus]);

    // Timer for connected call duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (callStatus === 'connected') {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [callStatus]);

    // WebRTC connection management
    useEffect(() => {
        if (callStatus === 'connected' && personalCall.isActive && personalCall.callId === message.callId) {
            if (isMe) {
                // Caller initializes
                initializeCall(message.callId!, currentUser.id);
            }
        }
    }, [callStatus, personalCall.isActive, isMe, message.callId]);

    const handleTimeout = async () => {
        if (callStatus !== 'ringing') return;

        // Only one side needs to trigger the update, let's say the caller or whoever detects it first
        // But to be safe, we can check if we are the "active" participant in some way.
        // Simple approach: Just update. Firestore handles concurrency reasonably well for this.

        try {
            const msgRef = doc(db, 'chats', chatId, 'messages', message.id);
            await updateDoc(msgRef, {
                callStatus: 'no_answer',
                text: isMe ? 'Did not connect' : `Missed call from ${otherUser?.username || 'User'}`
            });

            // Cleanup any active call docs
            cleanupCallDocs();
        } catch (err) {
            console.error("Error handling timeout:", err);
        }
    };

    const cleanupCallDocs = async () => {
        try {
            const myCallRef = doc(db, 'users', currentUser.id, 'incoming_personal_call', 'active');
            await deleteDoc(myCallRef);

            if (otherUser?.id) {
                const otherCallRef = doc(db, 'users', otherUser.id, 'incoming_personal_call', 'active');
                await deleteDoc(otherCallRef);
            }
        } catch (e) {
            // Ignore if docs don't exist
        }

        if (personalCall.isActive) {
            endPersonalCall('no_answer');
            leaveCall();
        }
    };

    const handleAccept = async () => {
        if (!message.callId) return;

        handleIncomingPersonalCall(otherUser.id, message.callId);
        acceptPersonalCall();

        // Join WebRTC
        await joinCall(message.callId, currentUser.id);

        // Update Firestore
        const msgRef = doc(db, 'chats', chatId, 'messages', message.id);
        await updateDoc(msgRef, { callStatus: 'connected' });
    };

    const handleDecline = async () => {
        const msgRef = doc(db, 'chats', chatId, 'messages', message.id);
        await updateDoc(msgRef, {
            callStatus: 'declined',
            text: 'Call declined'
        });

        cleanupCallDocs();
        endPersonalCall('declined');
    };

    const handleEndCall = async () => {
        const msgRef = doc(db, 'chats', chatId, 'messages', message.id);
        await updateDoc(msgRef, {
            callStatus: 'ended',
            callDuration: duration,
            text: `Call lasted ${formatDuration(duration)}`
        });

        cleanupCallDocs();
        endPersonalCall('user_ended');
        leaveCall();
    };

    const formatDuration = (secs: number) => {
        const hrs = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        const s = secs % 60;

        if (hrs > 0) return `${hrs}h ${mins}m ${s}s`;
        if (mins > 0) return `${mins}m ${s}s`;
        return `${s}s`;
    };

    // --- RENDER STATES ---

    // 1. Ringing (Outgoing)
    if (callStatus === 'ringing' && isMe) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
                            <Phone className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-white">Calling {otherUser?.username}...</p>
                        <p className="text-xs text-indigo-300">Ringing... {ringTimer}s</p>
                    </div>
                    <button
                        onClick={handleEndCall}
                        className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full transition-colors"
                    >
                        <PhoneOff className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    // 2. Ringing (Incoming)
    if (callStatus === 'ringing' && !isMe) {
        return (
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-4 w-64 shadow-lg shadow-indigo-500/10">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce">
                            <Phone className="w-8 h-8 text-green-400" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-white">Incoming Call</p>
                        <p className="text-xs text-indigo-300">from {otherUser?.username}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Auto-decline in {ringTimer}s</p>
                    </div>
                    <div className="flex gap-4 w-full justify-center">
                        <button
                            onClick={handleDecline}
                            className="flex-1 p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <PhoneOff className="w-4 h-4" />
                            <span className="text-xs font-medium">Decline</span>
                        </button>
                        <button
                            onClick={handleAccept}
                            className="flex-1 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20"
                        >
                            <Phone className="w-4 h-4" />
                            <span className="text-xs font-medium">Accept</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Connected
    if (callStatus === 'connected') {
        return (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 w-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-green-400">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-mono font-medium">{formatDuration(duration)}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleMic}
                            className={`p-3 rounded-full transition-colors ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400'}`}
                        >
                            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={handleEndCall}
                            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg shadow-red-500/20"
                        >
                            <PhoneOff className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-green-300/70">Connected with {otherUser?.username}</p>
                </div>
            </div>
        );
    }

    // 4. Ended / Missed / Declined (History View)
    const getStatusDisplay = () => {
        switch (callStatus) {
            case 'ended':
                return {
                    icon: <Clock className="w-4 h-4" />,
                    text: `Call lasted ${formatDuration(duration)}`,
                    color: 'text-gray-400',
                    bg: 'bg-gray-500/10'
                };
            case 'no_answer':
                return {
                    icon: <PhoneOff className="w-4 h-4" />,
                    text: isMe ? 'Did not connect' : `Missed call from ${otherUser?.username}`,
                    color: 'text-red-400',
                    bg: 'bg-red-500/10'
                };
            case 'declined':
                return {
                    icon: <PhoneOff className="w-4 h-4" />,
                    text: 'Call declined',
                    color: 'text-gray-400',
                    bg: 'bg-gray-500/10'
                };
            default:
                return null;
        }
    };

    const statusDisplay = getStatusDisplay();

    if (statusDisplay) {
        return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${statusDisplay.bg} border border-white/5`}>
                <span className={statusDisplay.color}>{statusDisplay.icon}</span>
                <span className={`text-sm ${statusDisplay.color}`}>{statusDisplay.text}</span>
            </div>
        );
    }

    return null;
};

export default InlinePersonalCall;
