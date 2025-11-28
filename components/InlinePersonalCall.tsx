import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Message } from '../store/useMessageStore';

interface InlinePersonalCallProps {
    message: Message;
    isMe: boolean;
    otherUserId: string;
    currentUserId: string;
    otherUserName: string;
}

const InlinePersonalCall: React.FC<InlinePersonalCallProps> = ({
    message,
    isMe,
    otherUserId,
    currentUserId,
    otherUserName
}) => {
    const { personalCall, acceptPersonalCall, endPersonalCall, handleIncomingPersonalCall } = useAppStore();
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

    const callId = message.callId || '';
    const callStatus = message.callStatus || 'ringing';
    const isIncoming = !isMe && callStatus === 'ringing';
    const isOutgoing = isMe && callStatus === 'ringing';
    const isActive = callStatus === 'connected' && personalCall.isActive && personalCall.callId === callId;
    const isEnded = ['ended', 'no_answer', 'declined'].includes(callStatus);

    // Handle WebRTC initialization for active calls
    useEffect(() => {
        if (isActive && connectionStatus === 'idle') {
            if (isMe) {
                initializeCall(callId, currentUserId);
            }
        }
    }, [isActive, connectionStatus, isMe, callId, currentUserId]);

    // Handle timeout (no answer)
    const handleTimeout = async () => {
        try {
            // Clean up Firebase incoming call notification
            const callRef = doc(db, 'users', currentUserId, 'incoming_personal_call', 'active');
            await deleteDoc(callRef);

            // Update message status to no_answer (Missed Call)
            const chatId = [currentUserId, otherUserId].sort().join('_');
            const messageRef = doc(db, 'chats', chatId, 'messages', message.id);
            await updateDoc(messageRef, { callStatus: 'no_answer' });
        } catch (err) {
            console.error('Failed to handle timeout:', err);
        }

        if (isActive) leaveCall();
        endPersonalCall('no_answer');
    };

    // 45-second timeout for incoming calls
    useEffect(() => {
        if (isIncoming && callStatus === 'ringing') {
            setRingTimer(45);
            const interval = setInterval(() => {
                setRingTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        handleTimeout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isIncoming, callStatus]);

    // 45-second timeout for outgoing calls
    useEffect(() => {
        if (isOutgoing && callStatus === 'ringing') {
            const timer = setTimeout(() => {
                handleTimeout();
            }, 45000);

            return () => clearTimeout(timer);
        }
    }, [isOutgoing, callStatus]);

    const handleAccept = async () => {
        if (callId && currentUserId) {
            // Update local state
            handleIncomingPersonalCall(otherUserId, callId);
            acceptPersonalCall();

            // Join WebRTC call
            await joinCall(callId, currentUserId);

            // Update message status in Firestore
            try {
                const chatId = [currentUserId, otherUserId].sort().join('_');
                const messageRef = doc(db, 'chats', chatId, 'messages', message.id);
                await updateDoc(messageRef, { callStatus: 'connected' });
            } catch (err) {
                console.error('Failed to update call status:', err);
            }
        }
    };

    const handleDecline = async () => {
        try {
            // Clean up Firebase incoming call notification
            const callRef = doc(db, 'users', currentUserId, 'incoming_personal_call', 'active');
            await deleteDoc(callRef);

            // Update message status to declined
            const chatId = [currentUserId, otherUserId].sort().join('_');
            const messageRef = doc(db, 'chats', chatId, 'messages', message.id);
            await updateDoc(messageRef, { callStatus: 'declined' });
        } catch (err) {
            console.error('Failed to handle decline:', err);
        }

        leaveCall();
        endPersonalCall('declined');
    };

    const handleEnd = async () => {
        try {
            // Update message status to ended
            const chatId = [currentUserId, otherUserId].sort().join('_');
            const messageRef = doc(db, 'chats', chatId, 'messages', message.id);
            await updateDoc(messageRef, { callStatus: 'ended' });

            // Clean up Firebase documents
            const myCallRef = doc(db, 'users', currentUserId, 'incoming_personal_call', 'active');
            await deleteDoc(myCallRef);

            if (isMe && otherUserId) {
                const receiverCallRef = doc(db, 'users', otherUserId, 'incoming_personal_call', 'active');
                await deleteDoc(receiverCallRef);
            }
        } catch (err) {
            console.error('Failed to end call:', err);
        }

        leaveCall();
        endPersonalCall('user_ended');
    };

    // Incoming call UI
    if (isIncoming) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="my-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 backdrop-blur-sm"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center animate-pulse">
                        📞
                    </div>
                    <div className="flex-1">
                        <div className="text-white font-semibold">{otherUserName} is calling...</div>
                        <div className="text-xs text-indigo-300">Ringing • {ringTimer}s</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDecline}
                        className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all font-medium text-sm"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-green-500/20"
                    >
                        Answer
                    </button>
                </div>
            </motion.div>
        );
    }

    // Outgoing call UI (ringing)
    if (isOutgoing) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="my-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 backdrop-blur-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center animate-pulse">
                        📞
                    </div>
                    <div className="flex-1">
                        <div className="text-white font-semibold">Calling {otherUserName}...</div>
                        <div className="text-xs text-indigo-300">Ringing...</div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Active call UI
    if (isActive) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="my-3 p-4 rounded-2xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 backdrop-blur-sm"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                        📞
                    </div>
                    <div className="flex-1">
                        <div className="text-white font-semibold">In call with {otherUserName}</div>
                        <div className="flex items-center gap-1.5 text-xs">
                            <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                    'bg-gray-500'
                                }`} />
                            <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-gray-400'}>
                                {connectionStatus === 'connected' ? 'Connected' :
                                    connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs text-red-400">{error}</p>
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={toggleMic}
                        className={`flex-1 px-4 py-2 rounded-xl transition-all font-medium text-sm flex items-center justify-center gap-2 ${isMicOn
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                        title={isMicOn ? 'Mute' : 'Unmute'}
                    >
                        {isMicOn ? '🎤' : '🔇'}
                        {isMicOn ? 'Mute' : 'Unmute'}
                    </button>
                    <button
                        onClick={handleEnd}
                        className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-red-500/20"
                    >
                        End Call
                    </button>
                </div>
            </motion.div>
        );
    }

    // Call ended states
    if (isEnded) {
        let statusText = '';
        let statusIcon = '';
        let statusColor = 'text-gray-400';

        switch (callStatus) {
            case 'ended':
                statusText = 'Call ended';
                statusIcon = '📞';
                statusColor = 'text-gray-400';
                break;
            case 'no_answer':
                statusText = isMe ? 'Did not connect' : 'Missed call';
                statusIcon = '📞';
                statusColor = 'text-yellow-400';
                break;
            case 'declined':
                statusText = isMe ? 'Call declined' : 'Declined';
                statusIcon = '📞';
                statusColor = 'text-red-400';
                break;
        }

        return (
            <div className="my-2 flex items-center gap-2 text-sm opacity-60">
                <span>{statusIcon}</span>
                <span className={statusColor}>{statusText}</span>
            </div>
        );
    }

    return null;
};

export default InlinePersonalCall;
