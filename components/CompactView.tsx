import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useSpotifyStore } from '../store/useSpotifyStore';
import { beginLogin } from '../auth/spotifyAuth';
import { TaskStatus } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Play, Pause, ChevronDown, Clock, Coffee, Check, X, SkipBack, SkipForward, Music } from 'lucide-react';

const CompactView: React.FC = () => {
    const tasks = useAppStore(s => s.tasks);
    const activeTaskId = useAppStore(s => s.activeTaskId);
    const setActiveTask = useAppStore(s => s.setActiveTask);
    const timerRemaining = useAppStore(s => s.timerRemaining);
    const setTimerRemaining = useAppStore(s => s.setTimerRemaining);
    const timerActive = useAppStore(s => s.timerActive);
    const setTimerActive = useAppStore(s => s.setTimerActive);
    const setCompactMode = useAppStore(s => s.setCompactMode);
    const updateTask = useAppStore(s => s.updateTask);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showReward, setShowReward] = useState<string | null>(null);
    const [isOnBreak, setIsOnBreak] = useState(false);
    const [previousTaskId, setPreviousTaskId] = useState<string | null>(null);
    const [previousTime, setPreviousTime] = useState<number>(0);

    // Spotify state
    const { spotify, ensureSpotifyAccessToken, getCurrentlyPlaying, togglePlayback, skipNext, skipPrevious } = useSpotifyStore();
    const [spotifyTrack, setSpotifyTrack] = useState<any>(null);

    // Fetch Spotify track
    const refreshSpotify = async () => {
        const token = await ensureSpotifyAccessToken();
        if (!token) return;
        const data = await getCurrentlyPlaying();
        if (data?.item) {
            setSpotifyTrack({
                name: data.item.name,
                artists: data.item.artists,
                album: data.item.album,
                is_playing: data.is_playing,
            });
        } else {
            setSpotifyTrack(null);
        }
    };

    // Sync Spotify every 5s when connected
    useEffect(() => {
        if (!spotify.accessToken) return;
        refreshSpotify();
        const interval = setInterval(refreshSpotify, 5000);
        return () => clearInterval(interval);
    }, [spotify.accessToken]);

    const activeTask = tasks.find(t => t.id === activeTaskId);
    const incompleteTasks = tasks.filter(t => t.status !== TaskStatus.Done);
    const completedTasks = tasks.filter(t => t.status === TaskStatus.Done);
    const otherTasks = incompleteTasks.filter(t => t.id !== activeTaskId);

    useEffect(() => {
        if (window.electronAPI?.resizeCompactWindow) {
            const taskCount = Math.min(otherTasks.length, 4);
            const completedHeight = completedTasks.length > 0 ? 30 : 0;
            const spotifyHeight = 100; // Space for Spotify player (expanded to include margin)
            const extraHeight = isDropdownOpen ? 100 + (taskCount * 44) + completedHeight : 0;
            // Base height increased to 150 to account for the margin between containers
            window.electronAPI.resizeCompactWindow(150 + spotifyHeight + extraHeight);
        }
    }, [isDropdownOpen, otherTasks.length, completedTasks.length]);

    // Check if active task is a count-up task (no estimated time)
    // Handle edge cases: undefined, null, 0, empty string, or NaN
    const estimatedMins = activeTask?.estimatedTimeMinutes;
    const isCountUpTask = activeTask && (!estimatedMins || Number(estimatedMins) === 0 || Number.isNaN(Number(estimatedMins)));

    const formatTime = (seconds: number, isCountUp: boolean = false) => {
        const mins = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, '0');
        const secs = (Math.abs(seconds) % 60).toString().padStart(2, '0');
        // For count-up tasks, never show a sign
        // For countdown tasks, show + when in overtime (negative)
        const sign = !isCountUp && seconds < 0 ? '+' : '';
        return `${sign}${mins}:${secs}`;
    };

    const handleExpand = () => {
        if (window.electronAPI?.setNormalMode) {
            window.electronAPI.setNormalMode();
        }
        setCompactMode(false);
    };

    const handleTaskSwitch = (taskId: string) => {
        setActiveTask(taskId);
        setIsDropdownOpen(false);
        if (isOnBreak) setIsOnBreak(false);
    };

    const handleAddTime = (minutes: number) => {
        setTimerRemaining(timerRemaining + (minutes * 60));
        triggerReward(`+${minutes}m`);
        setIsDropdownOpen(false);
    };

    const handleTakeBreak = () => {
        setPreviousTaskId(activeTaskId);
        setPreviousTime(timerRemaining);
        setIsOnBreak(true);
        setTimerActive(false);
        setTimerRemaining(10 * 60);
        triggerReward('☕ Break!');
        setIsDropdownOpen(false);
    };

    const handleEndBreak = () => {
        setIsOnBreak(false);
        if (previousTaskId) {
            setActiveTask(previousTaskId);
            setTimerRemaining(previousTime);
        }
        setTimerActive(true);
        triggerReward('Back to work!');
    };

    const handleCompleteTask = () => {
        if (activeTask) {
            updateTask(activeTask.id, { status: TaskStatus.Done, completedAt: Date.now() });
            triggerReward('✓ Done!');
            setIsDropdownOpen(false);
            const nextTask = otherTasks[0];
            if (nextTask) setActiveTask(nextTask.id);
        }
    };

    const triggerReward = (message: string) => {
        setShowReward(message);
        setTimeout(() => setShowReward(null), 1500);
    };

    useEffect(() => {
        if (timerRemaining === 0 && timerActive) {
            if (isOnBreak) {
                triggerReward('Break over!');
                handleEndBreak();
            } else {
                triggerReward('⏰ Time!');
            }
        }
    }, [timerRemaining, timerActive]);

    // CSS to hide all scrollbars completely
    const hideScrollbarStyle = `
        html, body, #root {
            background: transparent !important;
        }
        html, body, .compact-container, .compact-container * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            overflow-x: hidden !important;
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar,
        .compact-container::-webkit-scrollbar,
        .compact-container *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }
    `;

    return (
        <>
            {/* ... (styles and container setup) */}
            <style>{hideScrollbarStyle}</style>
            <div
                className="compact-container"
                style={{
                    width: '300px',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden'
                }}
            >
                {/* Drag Handle */}
                <div
                    className="h-5 w-full cursor-move flex items-center justify-center hover:bg-white/5 transition-colors"
                    style={{ WebkitAppRegion: 'drag' } as any}
                >
                    <div className="w-8 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Content */}
                <div className="px-4 pb-4 flex flex-col gap-3" style={{ overflow: 'hidden' }}>
                    {incompleteTasks.length > 0 ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={`text-4xl font-mono font-bold ${isOnBreak ? 'text-orange-400' : isCountUpTask ? 'text-green-400' : timerRemaining < 0 ? 'text-red-400' : 'text-white'
                                    }`}>
                                    {formatTime(timerRemaining, !!isCountUpTask)}
                                </span>
                                {isOnBreak && (
                                    <span className="text-[10px] text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        Break
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setTimerActive(!timerActive)}
                                    className={`p-2.5 rounded-xl transition-all cursor-pointer ${timerActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                        }`}
                                >
                                    {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                                <button onClick={handleExpand} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer">
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <span className="text-lg text-white/50">🎉 All done!</span>
                            <button onClick={handleExpand} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer">
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {isOnBreak && (
                        <button onClick={handleEndBreak} className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-500/30 rounded-xl text-blue-400 text-xs font-medium transition-all cursor-pointer">
                            <X className="w-3 h-3" />
                            End Break & Resume Task
                        </button>
                    )}

                    {!isOnBreak && (
                        <div className="relative" style={{ overflow: 'hidden' }}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 border border-white/10 rounded-xl text-left transition-all cursor-pointer"
                                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                            >
                                <span className="text-sm text-white/90 truncate flex-1 pr-2">
                                    {incompleteTasks.length === 0 ? 'Add tasks from expanded view' : (activeTask?.title || 'Select task...')}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-white/40 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-2 rounded-xl shadow-2xl"
                                        style={{
                                            background: 'rgba(26, 27, 35, 0.55)',
                                            backdropFilter: 'blur(16px)',
                                            WebkitBackdropFilter: 'blur(16px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div className="p-2 border-b border-white/5">
                                            <div className="grid grid-cols-4 gap-1.5">
                                                <button onClick={() => handleAddTime(10)} className="flex flex-col items-center gap-1 p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] transition-all cursor-pointer">
                                                    <Clock className="w-3.5 h-3.5" />+10m
                                                </button>
                                                <button onClick={() => handleAddTime(20)} className="flex flex-col items-center gap-1 p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] transition-all cursor-pointer">
                                                    <Clock className="w-3.5 h-3.5" />+20m
                                                </button>
                                                <button onClick={handleTakeBreak} className="flex flex-col items-center gap-1 p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-[10px] transition-all cursor-pointer">
                                                    <Coffee className="w-3.5 h-3.5" />Break
                                                </button>
                                                <button onClick={handleCompleteTask} disabled={!activeTask} className="flex flex-col items-center gap-1 p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                                                    <Check className="w-3.5 h-3.5" />Done
                                                </button>
                                            </div>
                                        </div>

                                        {otherTasks.length > 0 && (
                                            <div style={{ overflow: 'hidden' }}>
                                                <div className="px-3 py-2 text-[10px] text-white/40 uppercase tracking-wider font-medium">Other Tasks</div>
                                                <div className="max-h-[180px] overflow-y-auto" style={{ overflowX: 'hidden' }}>
                                                    {otherTasks.map(task => (
                                                        <button key={task.id} onClick={() => handleTaskSwitch(task.id)} className="w-full px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white transition-all cursor-pointer border-l-2 border-transparent hover:border-blue-500">
                                                            {task.title}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {otherTasks.length === 0 && incompleteTasks.length > 0 && (
                                            <div className="px-4 py-3 text-xs text-white/40 text-center">No other tasks</div>
                                        )}

                                        {incompleteTasks.length === 0 && (
                                            <div className="px-4 py-3 text-xs text-white/40 text-center">🎉 Add tasks from expanded view</div>
                                        )}

                                        {completedTasks.length > 0 && (
                                            <div className="px-3 py-2 border-t border-white/5 text-[11px] text-emerald-400/70 text-center">
                                                ✓ {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    <AnimatePresence>
                        {showReward && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-500/30 rounded-xl"
                            >
                                <span className="text-sm font-medium text-amber-300">{showReward}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>

            {/* Spotify Player Container */}
            <div
                className="compact-container mt-2"
                style={{
                    width: '300px',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden',
                    padding: '8px'
                }}
            >
                {!spotify.accessToken ? (
                    <button
                        onClick={beginLogin}
                        className="w-full h-[52px] flex items-center justify-center gap-2 bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/20 hover:border-[#1DB954]/40 rounded-xl group transition-all cursor-pointer"
                    >
                        <div className="p-1.5 bg-[#1DB954]/20 rounded-full group-hover:scale-110 transition-transform">
                            <Music className="w-4 h-4 text-[#1DB954]" />
                        </div>
                        <span className="text-[#1DB954] text-xs font-medium">Connect Spotify</span>
                    </button>
                ) : spotifyTrack ? (
                    <div className="bg-white/5 border border-white/5 rounded-xl p-2 flex items-center gap-3 backdrop-blur-sm">
                        <img
                            src={spotifyTrack.album?.images?.[2]?.url || spotifyTrack.album?.images?.[0]?.url}
                            alt={spotifyTrack.album?.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-lg"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <Music className="w-3 h-3 text-[#1DB954]" />
                                <p className="text-xs font-medium text-white/90 truncate">{spotifyTrack.name}</p>
                            </div>
                            <p className="text-[10px] text-white/50 truncate pl-4.5">{spotifyTrack.artists?.map((a: any) => a.name).join(', ')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={async () => { await skipPrevious(); setTimeout(refreshSpotify, 400); }}
                                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                            >
                                <SkipBack className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={async () => { await togglePlayback(!spotifyTrack.is_playing); setTimeout(refreshSpotify, 400); }}
                                className="p-1.5 text-white hover:scale-110 transition-transform cursor-pointer"
                            >
                                {spotifyTrack.is_playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={async () => { await skipNext(); setTimeout(refreshSpotify, 400); }}
                                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                            >
                                <SkipForward className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-[52px] flex items-center justify-center gap-2 bg-white/5 border border-white/5 rounded-xl text-white/40 text-xs">
                        <Music className="w-4 h-4 opacity-50" />
                        <span>No music playing</span>
                    </div>
                )}
            </div>
        </>
    );
};

export default CompactView;