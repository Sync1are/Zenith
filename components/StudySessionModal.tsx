import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useMessageStore } from '../store/useMessageStore';
import { useAppStore } from '../store/useAppStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { studySessionService } from '../services/studySessionService';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

import Whiteboard from './Whiteboard';

const StudySessionModal: React.FC = () => {
    const { studySession, setStudySessionOpen, startStudySession, joinStudySession, rejectCall } = useAppStore();
    const { isOpen, mode, code, callerId } = studySession;

    // Local state for input
    const [joinCodeInput, setJoinCodeInput] = useState('');
    const [isCompact, setIsCompact] = useState(false);
    const [activeTab, setActiveTab] = useState<'video' | 'whiteboard'>('video');

    const dragControls = useDragControls();

    const { users, currentUser, sendMessage } = useMessageStore();

    const {
        isMicOn,
        connectionStatus,
        error,
        participants,
        initializeCall,
        joinCall,
        toggleMic,
        leaveCall,
    } = useWebRTC();

    // Handle mode changes
    useEffect(() => {
        if (!isOpen) {
            if (mode === 'active') {
                leaveCall();
            }
            setJoinCodeInput('');
            setActiveTab('video');
        } else {
            // Auto-start if in active mode with a code (e.g. from "Call" button)
            if (mode === 'active' && code && currentUser?.id) {
                if (connectionStatus === 'disconnected' || connectionStatus === 'failed' || connectionStatus === 'idle') {
                    // Check if session exists to decide whether to join or create
                    studySessionService.sessionExists(code).then(exists => {
                        if (exists) {
                            joinCall(code, currentUser.id);
                        } else {
                            initializeCall(code, currentUser.id);
                        }
                    });
                }
            }
        }
    }, [isOpen, mode, code, currentUser]);

    const handleCreateSession = async () => {
        if (!currentUser?.id) return;
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        startStudySession(newCode);
    };

    const handleJoinSession = async () => {
        if (joinCodeInput.trim().length > 0) {
            const codeToJoin = joinCodeInput.toUpperCase();
            const exists = await studySessionService.sessionExists(codeToJoin);
            if (!exists) {
                alert('Session not found.');
                return;
            }
            joinStudySession(codeToJoin);
        }
    };

    const handleLeaveSession = () => {
        leaveCall();
        setStudySessionOpen(false);
    };

    const cleanupIncomingCall = async () => {
        if (currentUser?.id) {
            try {
                await deleteDoc(doc(db, "users", currentUser.id, "incoming_call", "active"));
            } catch (error) {
                console.error("Error cleaning up call:", error);
            }
        }
    };

    const handleAcceptCall = async () => {
        await cleanupIncomingCall();
        if (code) {
            joinStudySession(code);
        }
    };

    const handleDeclineCall = async () => {
        await cleanupIncomingCall();
        rejectCall();
    };

    const handleInvite = async (friendId: string) => {
        if (!currentUser || !code) return;
        // Send a call invite message
        await sendMessage(friendId, "📞 Incoming Call...", 'call_invite', { sessionCode: code });
    };

    if (!isOpen) return null;

    const participantList = Array.from(participants.values());
    const caller = callerId ? users.find(u => u.id === callerId) : null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center p-4">
            <motion.div
                drag
                dragControls={dragControls}
                dragListener={false}
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    width: isCompact ? '320px' : (activeTab === 'whiteboard' ? '90vw' : '100%'),
                    maxWidth: isCompact ? '320px' : (activeTab === 'whiteboard' ? '90vw' : '28rem'),
                    height: activeTab === 'whiteboard' && !isCompact ? '80vh' : 'auto'
                }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative glass-modal overflow-hidden pointer-events-auto shadow-2xl flex flex-col"
            >
                <style>{`
          .glass-modal {
            background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
            backdrop-filter: blur(14px) saturate(1.05);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 30px 80px rgba(79,70,229,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
            border-radius: 24px;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}</style>

                {/* Header */}
                <div
                    className="p-5 border-b border-white/5 flex justify-between items-center cursor-move shrink-0"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white tracking-tight select-none">
                            {mode === 'incoming' ? 'Incoming Call' : 'Study Session'}
                        </h2>
                        {mode === 'active' && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold border border-green-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                {connectionStatus === 'connecting' ? 'CONNECTING' : connectionStatus === 'connected' ? 'LIVE' : connectionStatus === 'failed' ? 'FAILED' : 'DISCONNECTED'}
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    {mode === 'active' && !isCompact && (
                        <div className="flex bg-white/5 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('video')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeTab === 'video' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Video
                            </button>
                            <button
                                onClick={() => setActiveTab('whiteboard')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeTab === 'whiteboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Whiteboard
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {mode === 'active' && (
                            <button
                                onClick={() => setIsCompact(!isCompact)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                                title={isCompact ? "Expand" : "Compact Mode"}
                            >
                                {isCompact ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        )}
                        <button
                            onClick={() => setStudySessionOpen(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {error && !isCompact && (
                    <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl shrink-0">
                        <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                )}

                {!isCompact && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <AnimatePresence mode="wait">
                            {mode === 'menu' && (
                                <motion.div
                                    key="menu"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-8 space-y-6"
                                >
                                    {/* Minimalist Header */}
                                    <div className="text-center space-y-3 mb-8">
                                        <div className="relative inline-block">
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-2xl opacity-20 animate-pulse" />
                                            <h2 className="relative text-3xl font-bold text-white tracking-tight">
                                                Study Session
                                            </h2>
                                        </div>
                                        <p className="text-sm text-gray-400 font-light">Create or join a collaborative workspace</p>
                                    </div>

                                    {/* Create Session - Minimalist Card */}
                                    <button
                                        onClick={handleCreateSession}
                                        className="w-full group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {/* Animated gradient background */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/90 via-purple-500/90 to-pink-500/90 opacity-100 group-hover:opacity-90 transition-opacity" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                                        {/* Subtle animated orb */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                                        <div className="relative p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Icon */}
                                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </div>

                                                {/* Text */}
                                                <div className="text-left">
                                                    <div className="text-lg font-semibold text-white mb-0.5">Create New Session</div>
                                                    <div className="text-xs text-white/70 font-light">Start a new study room</div>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Divider */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/10" />
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-[#1a1a1a] px-4 text-xs text-gray-500 uppercase tracking-wider font-medium">Or</span>
                                        </div>
                                    </div>

                                    {/* Join Session - Minimal Glass Card */}
                                    <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm p-6">
                                        {/* Subtle glow */}
                                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl" />

                                        <div className="relative space-y-4">
                                            <div>
                                                <h3 className="text-base font-semibold text-white mb-1">Join Session</h3>
                                                <p className="text-xs text-gray-400 font-light">Enter a 6-character code</p>
                                            </div>

                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={joinCodeInput}
                                                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                                                    placeholder="••••••"
                                                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-center font-mono text-lg font-medium text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                                                    maxLength={6}
                                                />
                                                <button
                                                    onClick={handleJoinSession}
                                                    disabled={joinCodeInput.length < 6}
                                                    className="px-6 py-3 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-700/50 disabled:to-gray-800/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-sm font-semibold transition-all shadow-lg hover:shadow-orange-500/20 hover:scale-105 active:scale-95"
                                                >
                                                    Join
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {mode === 'incoming' && (
                                <motion.div
                                    key="incoming"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8 p-6"
                                >
                                    <div className="w-24 h-24 rounded-full bg-indigo-500 mx-auto mb-4 flex items-center justify-center animate-pulse">
                                        {caller?.avatar ? (
                                            <img src={caller.avatar} alt={caller.username} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-3xl font-bold text-white">{caller?.username?.[0] || '?'}</span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-1">{caller?.username || 'Unknown'}</h3>
                                    <p className="text-indigo-300 mb-8">is inviting you to study...</p>

                                    <div className="flex justify-center gap-6">
                                        <button
                                            onClick={handleDeclineCall}
                                            className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleAcceptCall}
                                            className="w-16 h-16 rounded-full bg-green-500 text-white hover:bg-green-400 hover:scale-110 shadow-lg shadow-green-500/30 transition-all flex items-center justify-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {mode === 'active' && (
                                <motion.div
                                    key="active"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col h-full"
                                >
                                    {activeTab === 'video' ? (
                                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                                            <div className="text-center pt-2">
                                                <h3 className="text-4xl font-mono font-bold text-white tracking-widest mb-2 drop-shadow-lg select-all">{code}</h3>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Share this code</p>
                                            </div>

                                            <div className="flex justify-center gap-6 py-4">
                                                <button
                                                    onClick={toggleMic}
                                                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isMicOn
                                                        ? 'bg-white/10 text-white hover:bg-white/20 hover:scale-110 shadow-lg shadow-white/5'
                                                        : 'bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:scale-110 shadow-lg shadow-red-500/10'
                                                        }`}
                                                >
                                                    {isMicOn ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={handleLeaveSession}
                                                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-300 hover:scale-110 shadow-lg shadow-red-500/30 flex items-center justify-center"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Participants List */}
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Participants ({participants.size})</h4>
                                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                    {participantList.map((p) => {
                                                        const user = users.find(u => u.id === p.userId);
                                                        const name = user?.username || 'Unknown';
                                                        return (
                                                            <div key={p.userId} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
                                                                        {name[0]}
                                                                    </div>
                                                                    <span className="text-sm font-medium text-white">{name}</span>
                                                                </div>
                                                                {p.isMicOn ? (
                                                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                                                ) : (
                                                                    <div className="w-2 h-2 rounded-full bg-red-500 opacity-50" />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {participantList.length === 0 && (
                                                        <p className="text-sm text-gray-500 text-center py-2">Waiting for others...</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Invite Friends Section */}
                                            <div className="pt-2 border-t border-white/10">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Invite Friends</h4>
                                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                                    {users.filter(u => u.id !== currentUser?.id).map(user => (
                                                        <button
                                                            key={user.id}
                                                            onClick={() => handleInvite(user.id)}
                                                            className="flex flex-col items-center gap-1 min-w-[60px] group"
                                                        >
                                                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-transparent group-hover:border-indigo-500 transition-all">
                                                                {user.avatar ? (
                                                                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                                                                        {user.username[0]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 group-hover:text-white truncate w-full text-center">
                                                                {user.username}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 bg-white relative">
                                            {code && <Whiteboard sessionCode={code} />}
                                            {/* Floating controls for whiteboard */}
                                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 bg-black/80 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-2xl z-[200]">
                                                <button
                                                    onClick={toggleMic}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMicOn
                                                        ? 'bg-white/20 text-white hover:bg-white/30'
                                                        : 'bg-red-500/50 text-red-200 hover:bg-red-500/70'
                                                        }`}
                                                >
                                                    {isMicOn ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={handleLeaveSession}
                                                    className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all flex items-center justify-center"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default StudySessionModal;
