import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessageStore } from '../store/useMessageStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { studySessionService } from '../services/studySessionService';

interface StudySessionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ViewState = 'menu' | 'create' | 'join' | 'active';

const StudySessionModal: React.FC<StudySessionModalProps> = ({ isOpen, onClose }) => {
    const [view, setView] = useState<ViewState>('menu');
    const [sessionCode, setSessionCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [isCompact, setIsCompact] = useState(false);
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

    // Reset state when opening/closing
    useEffect(() => {
        if (isOpen) {
            setView('menu');
            setSessionCode('');
            setJoinCode('');
        } else {
            if (view === 'active') {
                leaveCall();
            }
        }
    }, [isOpen]);

    const handleCreateSession = async () => {
        if (!currentUser?.id) {
            alert('You must be logged in to create a session');
            return;
        }

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        try {
            setSessionCode(code);
            setView('active');
            await initializeCall(code, currentUser.id);
        } catch (err: any) {
            console.error('Failed to create session:', err);
            // Don't revert view - stay in session even if WebRTC fails
        }
    };

    const handleJoinSession = async () => {
        if (joinCode.trim().length > 0) {
            const code = joinCode.toUpperCase();

            const exists = await studySessionService.sessionExists(code);
            if (!exists) {
                alert('Session not found. Please check the code and try again.');
                return;
            }

            setSessionCode(code);
            setView('active');

            if (currentUser?.id) {
                try {
                    await joinCall(code, currentUser.id);
                } catch (err: any) {
                    console.error('Failed to join session:', err);
                }
            }
        }
    };

    const handleLeaveSession = () => {
        leaveCall();
        setView('menu');
        setSessionCode('');
    };

    const handleInvite = async (friendId: string) => {
        if (!currentUser) return;
        const inviteText = `📚 ${currentUser.username} invited you for a study session! Join now to collaborate. Code: ${sessionCode}`;
        await sendMessage(friendId, inviteText);
    };

    const handleClose = () => {
        if (view === 'active') {
            leaveCall();
        }
        onClose();
    };

    if (!isOpen) return null;

    const participantList = Array.from(participants.values());

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center p-4">
            <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    width: isCompact ? '320px' : '100%',
                    maxWidth: isCompact ? '320px' : '28rem'
                }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative glass-modal overflow-hidden pointer-events-auto shadow-2xl"
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
                <div className="p-5 border-b border-white/5 flex justify-between items-center cursor-move">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white tracking-tight select-none">Study Session</h2>
                        {view === 'active' && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold border border-green-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                {connectionStatus === 'connecting' ? 'CONNECTING' : connectionStatus === 'connected' ? 'LIVE' : connectionStatus === 'failed' ? 'FAILED' : 'DISCONNECTED'}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
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
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {error && !isCompact && (
                    <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                )}

                {!isCompact && (
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {view === 'menu' && (
                                <motion.div
                                    key="menu"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-4"
                                >
                                    <button
                                        onClick={handleCreateSession}
                                        className="w-full group relative overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 opacity-100" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="relative p-6 flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                🚀
                                            </div>
                                            <div className="text-left flex-1">
                                                <div className="text-xs font-bold text-indigo-100 uppercase tracking-[0.15em] mb-1 opacity-90">Start New</div>
                                                <div className="text-xl font-bold text-white tracking-tight">Create Session</div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-3 group-hover:translate-x-0 transition-all duration-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setView('join')}
                                        className="w-full group relative overflow-hidden rounded-2xl border-2 border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="p-6 flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl border-2 border-white/10 flex items-center justify-center text-3xl group-hover:border-white/20 transition-all duration-300">
                                                👋
                                            </div>
                                            <div className="text-left flex-1">
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-1 group-hover:text-gray-300 transition-colors">Have a code?</div>
                                                <div className="text-xl font-bold text-white/90 group-hover:text-white tracking-tight transition-colors">Join Session</div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center text-white/60 group-hover:text-white group-hover:border-white/20 transition-all duration-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>
                                </motion.div>
                            )}

                            {view === 'join' && (
                                <motion.div
                                    key="join"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center">
                                        <h3 className="text-white font-bold text-lg mb-2">Enter Session Code</h3>
                                        <p className="text-sm text-gray-400">Ask your friend for the 6-character invite code</p>
                                    </div>
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        placeholder="X7Y2Z9"
                                        className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.5em] text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-white/10"
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setView('menu')}
                                            className="flex-1 py-3.5 border-2 border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl text-gray-300 hover:text-white font-medium transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleJoinSession}
                                            disabled={joinCode.length < 6}
                                            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold shadow-lg shadow-indigo-500/20 transition-all"
                                        >
                                            Join Session
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {view === 'active' && (
                                <motion.div
                                    key="active"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center pt-2">
                                        <h3 className="text-4xl font-mono font-bold text-white tracking-widest mb-2 drop-shadow-lg select-all">{sessionCode}</h3>
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

                                    {participantList.length > 0 && (
                                        <div className="border-t border-white/10 pt-5">
                                            <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider px-1">
                                                In Call ({participantList.length + 1})
                                            </h4>
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                        {currentUser?.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-white">You</span>
                                                    <span className="ml-auto text-xs text-gray-400">{isMicOn ? '🎤' : '🔇'}</span>
                                                </div>
                                                {participantList.map((participant) => {
                                                    const user = users.find(u => u.id === participant.userId);
                                                    return (
                                                        <div key={participant.userId} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                                                            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                                                                {user?.username?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            <span className="text-sm font-medium text-white">{user?.username || 'Unknown'}</span>
                                                            <span className="ml-auto text-xs text-gray-400">{participant.isMicOn ? '🎤' : '🔇'}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-t border-white/10 pt-5">
                                        <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider px-1">Invite Friends</h4>
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {currentUser?.friends?.map(friendId => {
                                                const friend = users.find(u => u.id === friendId);
                                                if (!friend) return null;
                                                if (participantList.some(p => p.userId === friendId)) return null;
                                                return (
                                                    <div key={friendId} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                                                                alt={friend.username}
                                                                className="w-9 h-9 rounded-full bg-gray-700 ring-2 ring-transparent group-hover:ring-white/10 transition-all"
                                                            />
                                                            <span className="text-sm font-medium text-white">{friend.username}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleInvite(friendId)}
                                                            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs font-bold rounded-lg transition-all border border-indigo-500/20 hover:border-indigo-500/40"
                                                        >
                                                            INVITE
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                            {(!currentUser?.friends || currentUser.friends.length === 0) && (
                                                <div className="text-center py-6 bg-white/5 rounded-xl border border-dashed border-white/10">
                                                    <p className="text-sm text-gray-400">No friends online</p>
                                                    <p className="text-xs text-gray-600 mt-1">Add friends to invite them</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {isCompact && view === 'active' && (
                    <div className="p-4">
                        <div className="text-center">
                            <h3 className="text-2xl font-mono font-bold text-white tracking-widest mb-1">{sessionCode}</h3>
                            <div className="flex justify-center gap-3 mt-3">
                                <button
                                    onClick={toggleMic}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                                        }`}
                                >
                                    {isMicOn ? '🎤' : '🔇'}
                                </button>
                                <button
                                    onClick={handleLeaveSession}
                                    className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all flex items-center justify-center text-sm"
                                >
                                    ⏹
                                </button>
                            </div>
                            {participantList.length > 0 && (
                                <p className="text-xs text-gray-400 mt-2">{participantList.length + 1} in call</p>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default StudySessionModal;
