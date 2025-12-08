import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TaskStatus } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Play, Pause, ChevronDown, Clock, Coffee, Check, X } from 'lucide-react';

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

    const activeTask = tasks.find(t => t.id === activeTaskId);
    const incompleteTasks = tasks.filter(t => t.status !== TaskStatus.Done);
    const completedTasks = tasks.filter(t => t.status === TaskStatus.Done);
    const otherTasks = incompleteTasks.filter(t => t.id !== activeTaskId);

    useEffect(() => {
        if (window.electronAPI?.resizeCompactWindow) {
            const taskCount = Math.min(otherTasks.length, 4);
            const completedHeight = completedTasks.length > 0 ? 30 : 0;
            const extraHeight = isDropdownOpen ? 100 + (taskCount * 44) + completedHeight : 0;
            window.electronAPI.resizeCompactWindow(130 + extraHeight);
        }
    }, [isDropdownOpen, otherTasks.length, completedTasks.length]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, '0');
        const secs = (Math.abs(seconds) % 60).toString().padStart(2, '0');
        return `${seconds < 0 ? '+' : ''}${mins}:${secs}`;
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
            <style>{hideScrollbarStyle}</style>
            <div
                className="compact-container"
                style={{
                    width: '300px',
                    background: 'rgba(17, 18, 23, 0.7)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden'
                }}
            >
                {/* Drag Handle */}
                <div
                    className="h-5 w-full cursor-move flex items-center justify-center"
                    style={{ WebkitAppRegion: 'drag' } as any}
                >
                    <div className="w-8 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Content */}
                <div className="px-4 pb-4 flex flex-col gap-3" style={{ overflow: 'hidden' }}>
                    {incompleteTasks.length > 0 ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={`text-4xl font-mono font-bold ${isOnBreak ? 'text-orange-400' : timerRemaining < 0 ? 'text-red-400' : 'text-white'
                                    }`}>
                                    {formatTime(timerRemaining)}
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
                                className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all cursor-pointer"
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
                                            background: 'rgba(26, 27, 35, 0.85)',
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
        </>
    );
};

export default CompactView;