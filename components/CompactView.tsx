import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';

const CompactView: React.FC = () => {
    const timerRemaining = useAppStore(s => s.timerRemaining);
    const timerActive = useAppStore(s => s.timerActive);
    const setTimerActive = useAppStore(s => s.setTimerActive);
    const setCompactMode = useAppStore(s => s.setCompactMode);
    const addTask = useAppStore(s => s.addTask);
    const setActiveTask = useAppStore(s => s.setActiveTask);
    const tasks = useAppStore(s => s.tasks);
    const activeTaskId = useAppStore(s => s.activeTaskId);

    const activeTask = tasks.find(t => t.id === activeTaskId);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, '0');
        const secs = (Math.abs(seconds) % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const isOvertime = timerRemaining < 0;

    const [showTasks, setShowTasks] = React.useState(false);
    const [newTaskTitle, setNewTaskTitle] = React.useState("");

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        addTask({ title: newTaskTitle.trim() } as any);
        setNewTaskTitle("");
    };

    const handleExpand = () => {
        if (window.electronAPI) {
            window.electronAPI.setNormalMode();
            window.electronAPI.onCompactModeExited(() => {
                setCompactMode(false);
            });
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center overflow-hidden p-2">
            <div className="relative w-full h-full bg-gradient-to-br from-white/[0.08] via-transparent to-transparent backdrop-blur-lg border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] ring-1 ring-inset ring-white/20 flex flex-col overflow-hidden rounded-[30px]">

                <div className="h-12 flex items-center justify-end px-4 z-50" style={{ WebkitAppRegion: 'drag' } as any}>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowTasks(!showTasks)}
                            className={`p-1.5 rounded-full transition-all ${showTasks ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/[0.05] hover:text-white'}`}
                            style={{ WebkitAppRegion: 'no-drag' } as any}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pt-0">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-blue-500/[0.05] blur-2xl rounded-full"></div>
                            <div className={`text-6xl font-mono font-bold tracking-tighter relative z-10 drop-shadow-xl ${isOvertime ? 'text-red-400' : 'text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80'}`}>
                                {isOvertime ? '+' : ''}{formatTime(timerRemaining)}
                            </div>
                        </div>

                        <div className="w-full bg-white/[0.03] border border-white/20 rounded-2xl p-4 mb-6 backdrop-blur-sm ring-1 ring-inset ring-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-1 text-center">Current Focus</p>
                            <p className="text-sm font-medium text-white/90 text-center truncate">
                                {activeTask?.title || "No Active Task"}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 w-full mb-6">
                            <div className="bg-white/[0.03] border border-white/20 rounded-xl p-2 flex flex-col items-center justify-center backdrop-blur-sm">
                                <span className="text-lg font-bold text-white">{tasks.filter(t => t.status === TaskStatus.Done).length}</span>
                                <span className="text-[10px] text-white/50">Done</span>
                            </div>
                            <div className="bg-white/[0.03] border border-white/20 rounded-xl p-2 flex flex-col items-center justify-center backdrop-blur-sm">
                                <span className="text-lg font-bold text-white">{tasks.length}</span>
                                <span className="text-[10px] text-white/50">Total</span>
                            </div>
                            <div className="bg-white/[0.03] border border-white/20 rounded-xl p-2 flex flex-col items-center justify-center backdrop-blur-sm">
                                <button
                                    onClick={() => setTimerActive(!timerActive)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${timerActive ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
                                >
                                    {timerActive ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    )}
                                </button>
                                <span className="text-[10px] text-white/50 mt-1">{timerActive ? 'Pause' : 'Start'}</span>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showTasks && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowTasks(false)}
                                className="absolute inset-0 bg-black/[0.1] backdrop-blur-[2px] z-10"
                            />
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {showTasks && (
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="absolute top-0 right-0 bottom-0 w-[85%] bg-gradient-to-br from-white/[0.12] via-white/[0.02] to-transparent backdrop-blur-xl border-l border-white/30 shadow-2xl z-20 flex flex-col rounded-l-[30px] ring-1 ring-inset ring-white/10"
                            >
                                <div className="p-4 border-b border-white/10">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-white font-semibold text-sm">Tasks</h3>
                                        <button
                                            onClick={() => setShowTasks(false)}
                                            className="p-1.5 rounded-full hover:bg-white/[0.08] text-white/60 hover:text-white transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddTask}>
                                        <input
                                            type="text"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            placeholder="Add new task..."
                                            className="w-full bg-white/[0.02] border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/[0.05] transition-all backdrop-blur-md"
                                        />
                                    </form>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {tasks.map(task => (
                                        <motion.div
                                            key={task.id}
                                            onClick={() => {
                                                setActiveTask(task.id);
                                                setShowTasks(false);
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`p-3 rounded-xl cursor-pointer transition-all border backdrop-blur-md ${activeTaskId === task.id
                                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-white/40 shadow-lg'
                                                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.08] hover:border-white/30'
                                                }`}
                                        >
                                            <p className={`text-sm font-medium ${activeTaskId === task.id ? 'text-white' : 'text-white/80'}`}>
                                                {task.title}
                                            </p>
                                        </motion.div>
                                    ))}
                                    {tasks.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-32 text-white/30">
                                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p className="text-xs">No tasks yet</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-4 pt-0">
                    <button
                        onClick={handleExpand}
                        className="w-full bg-white/90 hover:bg-white text-black font-bold py-3 rounded-2xl transition-all shadow-lg shadow-black/20 backdrop-blur-sm flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        Expand View
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompactView;