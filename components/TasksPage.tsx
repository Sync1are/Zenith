import React, { useState, useMemo, useCallback } from 'react';
import { Task, TaskStatus, Priority } from '../types';
import { breakDownTask } from '../services/geminiService';
import { useAppStore } from '../store/useAppStore';
import { Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { TaskSection } from './TaskSection';
import { TaskHeatmap } from './TaskHeatmap';
import StatCard from './StatCard';

export default function TasksPage() {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.Medium);
    const [category, setCategory] = useState('Personal');
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [exitingTasks, setExitingTasks] = useState<Record<string, 'complete' | 'uncomplete' | 'delete'>>({});

    // Recurring task state
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly'>('daily');
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default

    // Use global task store to sync across Dashboard, Focus, and Tasks pages
    const tasks = useAppStore((state) => state.tasks);
    const addTask = useAppStore((state) => state.addTask);
    const setTasks = useAppStore((state) => state.setTasks);
    const activeTaskId = useAppStore((state) => state.activeTaskId);
    const timerRemaining = useAppStore((state) => state.timerRemaining);
    const timerActive = useAppStore((state) => state.timerActive);
    const startTask = useAppStore((state) => state.startTask);
    const pauseTask = useAppStore((state) => state.pauseTask);

    // Generate recurring task instances
    const generateRecurringInstances = (templateTask: Task): Task[] => {
        const instances: Task[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Generate for next 30 days
        for (let i = 0; i < 30; i++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + i);
            const dayOfWeek = targetDate.getDay();

            let shouldGenerate = false;
            if (templateTask.recurrenceType === 'daily') {
                shouldGenerate = true;
            } else if (templateTask.recurrenceType === 'weekly' && templateTask.recurrenceDays) {
                shouldGenerate = templateTask.recurrenceDays.includes(dayOfWeek);
            }

            if (shouldGenerate) {
                instances.push({
                    ...templateTask,
                    id: `${templateTask.id}-${targetDate.getTime()}`,
                    createdAt: targetDate,
                    parentTaskId: templateTask.id,
                    isTemplate: false,
                });
            }
        }

        return instances;
    };

    const handleAddTask = async (useAI: boolean = false) => {
        if (!newTaskTitle.trim()) return;

        const baseTask: Task = {
            id: Date.now().toString(),
            title: newTaskTitle,
            priority: priority,
            status: TaskStatus.Todo,
            estimatedTimeMinutes: estimatedTime ? parseInt(estimatedTime) : 0,
            timeSpentMinutes: 0,
            remainingTime: estimatedTime ? parseInt(estimatedTime) * 60 : 0,
            createdAt: new Date(),
            subtasks: [],
            category: category,
            isRecurring: isRecurring,
            recurrenceType: isRecurring ? recurrenceType : undefined,
            recurrenceDays: isRecurring && recurrenceType === 'weekly' ? selectedDays : undefined,
            isTemplate: isRecurring,
        };

        if (useAI) {
            setIsProcessingAI(true);
            const plan = await breakDownTask(newTaskTitle);
            setIsProcessingAI(false);

            if (plan) {
                baseTask.description = plan.summary;
                baseTask.estimatedTimeMinutes = plan.estimatedTotalMinutes;
                baseTask.remainingTime = plan.estimatedTotalMinutes * 60;
                baseTask.subtasks = plan.subtasks.map((st, idx) => ({
                    id: `${baseTask.id}-${idx}`,
                    title: st.title,
                    isCompleted: false
                }));

                if (plan.estimatedTotalMinutes > 120) {
                    baseTask.priority = Priority.High;
                } else if (plan.estimatedTotalMinutes > 30) {
                    baseTask.priority = Priority.Medium;
                } else {
                    baseTask.priority = Priority.Low;
                }

                const titleLower = newTaskTitle.toLowerCase();
                if (titleLower.includes('work') || titleLower.includes('meeting') || titleLower.includes('project')) {
                    baseTask.category = 'Work';
                } else if (titleLower.includes('study') || titleLower.includes('learn') || titleLower.includes('course')) {
                    baseTask.category = 'Study';
                } else if (titleLower.includes('exercise') || titleLower.includes('workout') || titleLower.includes('health')) {
                    baseTask.category = 'Health';
                } else {
                    baseTask.category = 'Personal';
                }
            }
        }

        // Add template task (hidden from normal view if recurring)
        addTask(baseTask);

        // Generate recurring instances
        if (isRecurring) {
            const instances = generateRecurringInstances(baseTask);
            instances.forEach(instance => addTask(instance));
        }

        // Reset form
        setNewTaskTitle('');
        setEstimatedTime('');
        setPriority(Priority.Medium);
        setCategory('Personal');
        setIsRecurring(false);
        setRecurrenceType('daily');
        setSelectedDays([1, 2, 3, 4, 5]);
    };

    const togglePlayPause = useCallback((id: string, currentStatus: TaskStatus) => {
        if (currentStatus === TaskStatus.InProgress) {
            pauseTask();
        } else {
            startTask(id);
        }
    }, [startTask, pauseTask]);

    const logSession = useAppStore((state) => state.logSession);

    const markAsDone = useCallback((id: string) => {
        // Find the task to get its time spent
        const task = tasks.find(t => t.id === id);

        if (activeTaskId === id) {
            pauseTask();
        }

        // Log the time spent on this task to analytics
        if (task && task.timeSpentMinutes && task.timeSpentMinutes > 0) {
            logSession(Math.round(task.timeSpentMinutes));
        }

        const animationType = 'complete';
        setExitingTasks(prev => ({ ...prev, [id]: animationType }));

        setTimeout(() => {
            setTasks(prev => prev.map(t =>
                t.id === id ? { ...t, status: TaskStatus.Done, completedAt: Date.now() } : t
            ));
            setExitingTasks(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }, 400);
    }, [activeTaskId, pauseTask, setTasks, tasks, logSession]);

    const updateTask = useCallback((id: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, [setTasks]);

    const addSubtaskToTask = useCallback((taskId: string, subtaskTitle: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const newSubtask = {
                    id: `${taskId}-${Date.now()}`,
                    title: subtaskTitle,
                    isCompleted: false
                };
                return {
                    ...t,
                    subtasks: [...(t.subtasks || []), newSubtask]
                };
            }
            return t;
        }));
    }, [setTasks]);

    const deleteTask = useCallback((id: string) => {
        setExitingTasks(prev => ({ ...prev, [id]: 'delete' }));
        setTimeout(() => {
            setTasks(prev => prev.filter(t => t.id !== id));
            setExitingTasks(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }, 300);
    }, [setTasks]);

    const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            return {
                ...t,
                subtasks: t.subtasks.map(st =>
                    st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
                )
            };
        }));
    }, [setTasks]);

    const toggleDaySelection = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    // Filter out template tasks from display - memoized
    const displayTasks = useMemo(() => tasks.filter(t => !t.isTemplate), [tasks]);

    // Group tasks by their exact date - memoized to prevent recalculation on keystroke
    const taskGroups = useMemo(() => {
        const groupTasksByDate = (tasks: Task[]) => {
            const groups: { [key: string]: Task[] } = {};

            tasks.forEach(task => {
                const date = new Date(task.createdAt);
                date.setHours(0, 0, 0, 0);
                const dateKey = date.getTime().toString();

                if (!groups[dateKey]) {
                    groups[dateKey] = [];
                }
                groups[dateKey].push(task);
            });

            // Sort by date (newest first)
            return Object.entries(groups)
                .map(([dateKey, tasks]) => ({
                    date: new Date(parseInt(dateKey)),
                    tasks
                }))
                .sort((a, b) => b.date.getTime() - a.date.getTime());
        };

        return groupTasksByDate(displayTasks);
    }, [displayTasks]);

    const handleDateClick = (date: Date) => {
        const dateKey = date.getTime();
        const element = document.getElementById(`section-${dateKey}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const totalTasks = displayTasks.length;
    const completedCount = displayTasks.filter(t => t.status === TaskStatus.Done).length;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="h-full flex flex-col">
            {/* Header Stats */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Tasks</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            <CheckCircle2 size={14} className="text-green-400" />
                            {completedCount}/{totalTasks} Completed
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            <Sparkles size={14} className="text-purple-400" />
                            {completionRate}% Efficiency
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-8 overflow-hidden">

                {/* Left Column: Input & Heatmap */}
                <div className="lg:col-span-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2">
                    {/* Quick Add Card */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="text-blue-400" size={18} />
                            <h2 className="text-lg font-bold text-white">Quick Add</h2>
                        </div>

                        <div className="space-y-5 relative z-10">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(false)}
                                    placeholder="What's on your mind?"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all pr-12"
                                />
                                <button
                                    onClick={() => handleAddTask(true)}
                                    disabled={!newTaskTitle.trim() || isProcessingAI}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 text-purple-400 transition-colors disabled:opacity-50"
                                >
                                    {isProcessingAI ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Sparkles size={16} />
                                    )}
                                </button>
                            </div>

                            <div>
                                <label className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2 block">Category</label>
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 pl-10"
                                    >
                                        <option value="Personal" className="bg-gray-900">Personal</option>
                                        <option value="Work" className="bg-gray-900">Work</option>
                                        <option value="Study" className="bg-gray-900">Study</option>
                                        <option value="Health" className="bg-gray-900">Health</option>
                                    </select>
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                                        #
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2 block">Task Details</label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as Priority)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 pl-10"
                                        >
                                            <option value={Priority.Low} className="bg-gray-900">Low</option>
                                            <option value={Priority.Medium} className="bg-gray-900">Medium</option>
                                            <option value={Priority.High} className="bg-gray-900">High</option>
                                        </select>
                                        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none ${priority === Priority.High ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                            priority === Priority.Medium ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' :
                                                'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                            }`} />
                                    </div>
                                    <input
                                        type="number"
                                        value={estimatedTime}
                                        onChange={(e) => setEstimatedTime(e.target.value)}
                                        placeholder="Min"
                                        className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-center"
                                    />
                                </div>
                            </div>

                            {/* Repeat Toggle & Configuration */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all duration-300 hover:bg-white/10">
                                <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isRecurring ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                                            <Sparkles size={14} />
                                        </div>
                                        <span className="text-sm text-white font-medium">Recurring Task</span>
                                    </div>

                                    {/* Custom Toggle Switch */}
                                    <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${isRecurring ? 'bg-blue-500' : 'bg-white/10'}`}>
                                        <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${isRecurring ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </div>

                                {isRecurring && (
                                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* Segmented Control for Frequency */}
                                        <div className="bg-black/20 p-1 rounded-lg flex relative">
                                            {/* Sliding Background */}
                                            <div
                                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-md transition-all duration-300 ease-out ${recurrenceType === 'weekly' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`}
                                            />

                                            <button
                                                onClick={() => setRecurrenceType('daily')}
                                                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider text-center relative z-10 transition-colors ${recurrenceType === 'daily' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                                            >
                                                Daily
                                            </button>
                                            <button
                                                onClick={() => setRecurrenceType('weekly')}
                                                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider text-center relative z-10 transition-colors ${recurrenceType === 'weekly' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                                            >
                                                Weekly
                                            </button>
                                        </div>

                                        {/* Day Selection */}
                                        {recurrenceType === 'weekly' && (
                                            <div className="flex justify-between gap-1">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                                                    const isSelected = selectedDays.includes(index);
                                                    return (
                                                        <button
                                                            key={index}
                                                            onClick={() => toggleDaySelection(index)}
                                                            className={`
                                                                w-8 h-8 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all duration-200
                                                                ${isSelected
                                                                    ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)] scale-105'
                                                                    : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60'
                                                                }
                                                            `}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleAddTask(false)}
                                disabled={!newTaskTitle.trim()}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                            >
                                <Plus size={18} className="group-hover/btn:scale-110 transition-transform" />
                                Add Task
                            </button>
                        </div>
                    </div>

                    {/* Today's Progress Card */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-6">Today's Progress</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-white/70">Total Tasks</span>
                                <span className="text-white font-bold text-lg">
                                    {tasks.filter(t => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        return new Date(t.createdAt).getTime() >= today.getTime();
                                    }).length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/70">Completed</span>
                                <span className="text-green-400 font-bold text-lg">
                                    {tasks.filter(t => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        return t.status === TaskStatus.Done && t.completedAt && t.completedAt >= today.getTime();
                                    }).length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/70">In Progress</span>
                                <span className="text-yellow-400 font-bold text-lg">
                                    {tasks.filter(t => t.status === TaskStatus.InProgress).length}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xs text-white/40">Completion</span>
                                <span className="text-green-400 font-bold text-sm">
                                    {(() => {
                                        const todayTasks = tasks.filter(t => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            return new Date(t.createdAt).getTime() >= today.getTime();
                                        });
                                        const completedToday = todayTasks.filter(t => t.status === TaskStatus.Done).length;
                                        return todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0;
                                    })()}%
                                </span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(() => {
                                            const todayTasks = tasks.filter(t => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return new Date(t.createdAt).getTime() >= today.getTime();
                                            });
                                            const completedToday = todayTasks.filter(t => t.status === TaskStatus.Done).length;
                                            return todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;
                                        })()}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Heatmap */}
                    <TaskHeatmap tasks={tasks} onDateClick={handleDateClick} />
                </div>

                {/* Right Column: Task List */}
                <div className="lg:col-span-4 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                        {taskGroups.map((group) => (
                            <TaskSection
                                key={group.date.getTime()}
                                date={group.date}
                                tasks={group.tasks}
                                activeTaskId={activeTaskId}
                                timerRemaining={timerRemaining}
                                timerActive={timerActive}
                                onTogglePlayPause={togglePlayPause}
                                onMarkDone={markAsDone}
                                onDelete={deleteTask}
                                onToggleSubtask={toggleSubtask}
                                onUpdateTask={updateTask}
                                onAddSubtask={addSubtaskToTask}
                                exitingTasks={exitingTasks}
                            />
                        ))}

                        {taskGroups.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles size={40} className="text-white/20" />
                                </div>
                                <p className="text-xl font-medium text-white/40">No tasks yet</p>
                                <p className="text-sm text-white/20 mt-2">Add a task to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
