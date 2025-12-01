import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Priority } from '../types';
import { breakDownTask } from '../services/geminiService';
import { useAppStore } from '../store/useAppStore';
import { Plus, Sparkles, Check, Clock, Trash2, ChevronDown, Hash, Play, Pause, Edit2, X, Save, Timer, CheckCircle2 } from 'lucide-react';

const TaskCard: React.FC<{
    task: Task;
    isActive: boolean;
    timerRemaining?: number;
    timerActive: boolean;
    onTogglePlayPause: () => void;
    onMarkDone: () => void;
    onDelete: () => void;
    onToggleSubtask: (subtaskId: string) => void;
    onUpdateTask: (updates: Partial<Task>) => void;
    onAddSubtask: (title: string) => void;
    index: number;
    exitAnimation?: 'complete' | 'uncomplete' | 'delete';
}> = ({ task, isActive, timerRemaining, timerActive, onTogglePlayPause, onMarkDone, onDelete, onToggleSubtask, onUpdateTask, onAddSubtask, index, exitAnimation }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [editedPriority, setEditedPriority] = useState(task.priority);
    const [editedCategory, setEditedCategory] = useState(task.category);
    const [editedTime, setEditedTime] = useState(task.estimatedTimeMinutes?.toString() || '');
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const formatTime = (seconds: number) => {
        const absSeconds = Math.abs(seconds);
        const mins = Math.floor(absSeconds / 60).toString().padStart(2, '0');
        const secs = (absSeconds % 60).toString().padStart(2, '0');
        const sign = seconds < 0 ? '+' : '';
        return `${sign}${mins}:${secs}`;
    };

    const saveEdits = () => {
        onUpdateTask({
            title: editedTitle,
            priority: editedPriority,
            category: editedCategory,
            estimatedTimeMinutes: editedTime ? parseInt(editedTime) : 0
        });
        setIsEditing(false);
    };

    const cancelEdits = () => {
        setEditedTitle(task.title);
        setEditedPriority(task.priority);
        setEditedCategory(task.category);
        setEditedTime(task.estimatedTimeMinutes?.toString() || '');
        setIsEditing(false);
    };

    const handleAddSubtask = () => {
        if (newSubtaskTitle.trim()) {
            onAddSubtask(newSubtaskTitle.trim());
            setNewSubtaskTitle('');
        }
    };

    const getPriorityColor = (p: Priority) => {
        switch (p) {
            case Priority.High: return 'text-red-400 bg-red-500/20';
            case Priority.Medium: return 'text-yellow-400 bg-yellow-500/20';
            case Priority.Low: return 'text-blue-400 bg-blue-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const hasExpandableContent = totalSubtasks > 0 || !!task.description;

    let animationClass = "animate-slide-up";
    if (exitAnimation === 'complete') animationClass = "animate-exit-right";
    if (exitAnimation === 'uncomplete') animationClass = "animate-exit-left";
    if (exitAnimation === 'delete') animationClass = "animate-exit-delete";

    return (
        <div
            className={`group transform transition-all duration-300 ${animationClass}`}
            style={{ animationDelay: exitAnimation ? '0ms' : `${index * 50}ms`, animationFillMode: 'forwards' }}
        >
            <div className={`relative p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-200 ${expanded ? 'ring-1 ring-white/20' : ''}`}>

                {/* Main Row */}
                <div className="flex items-center gap-4">
                    {/* Play/Pause Button */}
                    <button
                        onClick={onTogglePlayPause}
                        disabled={task.status === TaskStatus.Done}
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${task.status === TaskStatus.Done
                            ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                            : task.status === TaskStatus.InProgress
                                ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105'
                                : 'bg-white/5 text-gray-400 hover:bg-white/20 hover:text-white hover:scale-105'
                            }`}
                    >
                        {task.status === TaskStatus.Done ? (
                            <Check size={18} strokeWidth={3} />
                        ) : task.status === TaskStatus.InProgress ? (
                            <Pause size={18} fill="currentColor" />
                        ) : (
                            <Play size={18} fill="currentColor" className="ml-0.5" />
                        )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            // Edit Mode
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                    placeholder="Task title"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <select
                                        value={editedPriority}
                                        onChange={(e) => setEditedPriority(e.target.value as Priority)}
                                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value={Priority.Low} className="bg-gray-900">Low</option>
                                        <option value={Priority.Medium} className="bg-gray-900">Medium</option>
                                        <option value={Priority.High} className="bg-gray-900">High</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={editedCategory}
                                        onChange={(e) => setEditedCategory(e.target.value)}
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                        placeholder="Category"
                                    />
                                    <input
                                        type="number"
                                        value={editedTime}
                                        onChange={(e) => setEditedTime(e.target.value)}
                                        className="w-20 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                        placeholder="Min"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={cancelEdits} className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button onClick={saveEdits} className="px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">Save</button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`text-base font-medium truncate transition-all ${task.status === TaskStatus.Done ? 'text-gray-500 line-through' : 'text-white'}`}>
                                            {task.title}
                                        </h4>
                                        {isActive && (
                                            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                        <span className={`px-2 py-0.5 rounded-full font-semibold ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Hash size={10} /> {task.category}
                                        </span>
                                        {(task.estimatedTimeMinutes > 0 || task.remainingTime !== undefined) && (
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {isActive && timerRemaining !== undefined
                                                    ? <span className="text-blue-400 font-mono">{formatTime(timerRemaining)}</span>
                                                    : task.remainingTime !== undefined
                                                        ? <span className="font-mono">{formatTime(task.remainingTime)}</span>
                                                        : <span>{task.estimatedTimeMinutes}m</span>
                                                }
                                            </span>
                                        )}
                                        {totalSubtasks > 0 && (
                                            <span className="flex items-center gap-1 text-blue-400">
                                                <CheckCircle2 size={10} />
                                                {completedSubtasks}/{totalSubtasks}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Hover Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {task.status !== TaskStatus.Done && (
                                        <button onClick={onMarkDone} className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="Mark Done">
                                            <Check size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                    {hasExpandableContent && (
                                        <button
                                            onClick={() => setExpanded(!expanded)}
                                            className={`p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all ${expanded ? 'rotate-180' : ''}`}
                                        >
                                            <ChevronDown size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expandable Content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="pt-4 border-t border-white/5 space-y-4 pl-14">
                        {task.description && (
                            <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-blue-300">
                                    <Sparkles size={12} /> AI Summary
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">{task.description}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            {task.subtasks?.map((st) => (
                                <div
                                    key={st.id}
                                    onClick={() => onToggleSubtask(st.id)}
                                    className="group/sub flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${st.isCompleted
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-600 group-hover/sub:border-gray-400'
                                        }`}>
                                        {st.isCompleted && <Check size={10} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <span className={`text-sm transition-colors ${st.isCompleted ? 'text-gray-500 line-through' : 'text-gray-300 group-hover/sub:text-white'}`}>
                                        {st.title}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Add Subtask */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                placeholder="Add a subtask..."
                                className="flex-1 bg-transparent border-b border-white/10 py-1 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <button
                                onClick={handleAddSubtask}
                                disabled={!newSubtaskTitle.trim()}
                                className="text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function TasksPage() {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.Medium);
    const [category, setCategory] = useState('Personal');
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [exitingTasks, setExitingTasks] = useState<Record<string, 'complete' | 'uncomplete' | 'delete'>>({});

    // Use global task store to sync across Dashboard, Focus, and Tasks pages
    const tasks = useAppStore((state) => state.tasks);
    const addTask = useAppStore((state) => state.addTask);
    const setTasks = useAppStore((state) => state.setTasks);
    const activeTaskId = useAppStore((state) => state.activeTaskId);
    const timerRemaining = useAppStore((state) => state.timerRemaining);
    const timerActive = useAppStore((state) => state.timerActive);
    const startTask = useAppStore((state) => state.startTask);
    const pauseTask = useAppStore((state) => state.pauseTask);

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
            category: category
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

        addTask(baseTask);
        setNewTaskTitle('');
        setEstimatedTime('');
        setPriority(Priority.Medium);
        setCategory('Personal');
    };

    const togglePlayPause = (id: string, currentStatus: TaskStatus) => {
        if (currentStatus === TaskStatus.InProgress) {
            pauseTask();
        } else {
            // If another task is active, pause it first (handled by startTask in store usually, but good to be explicit if needed, though store handles it)
            startTask(id);
        }
    };

    const markAsDone = (id: string) => {
        // If this task is currently active, pause it first
        if (activeTaskId === id) {
            pauseTask();
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
    };

    const updateTask = (id: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const addSubtaskToTask = (taskId: string, subtaskTitle: string) => {
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
    };

    const deleteTask = (id: string) => {
        setExitingTasks(prev => ({ ...prev, [id]: 'delete' }));
        setTimeout(() => {
            setTasks(prev => prev.filter(t => t.id !== id));
            setExitingTasks(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }, 300);
    };

    const toggleSubtask = (taskId: string, subtaskId: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            return {
                ...t,
                subtasks: t.subtasks.map(st =>
                    st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
                )
            };
        }));
    };

    const pendingTasks = tasks.filter(t => t.status !== TaskStatus.Done);
    const completedTasks = tasks.filter(t => t.status === TaskStatus.Done);

    const totalTasks = tasks.length;
    const completedCount = completedTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
            <div className="lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-6 animate-fade-in p-6 pb-0">
                <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-blue-300" />
                        <h3 className="font-semibold text-white">Quick Add</h3>
                    </div>

                    <div className="relative mb-3">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) handleAddTask(false);
                            }}
                            placeholder="What's on your mind?"
                            className="w-full bg-white/10 border border-white/20 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                        />
                        <button
                            onClick={() => handleAddTask(true)}
                            disabled={!newTaskTitle.trim() || isProcessingAI}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title="AI Plan"
                        >
                            {isProcessingAI ? (
                                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Sparkles size={16} />
                            )}
                        </button>
                    </div>

                    <div className="mb-3">
                        <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Hash size={16} />
                            </div>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) handleAddTask(false);
                                }}
                                placeholder="e.g., Work, Personal, Study..."
                                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="text-xs text-gray-400 mb-1.5 block">Task Details</label>
                        <div className="flex gap-2">
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 cursor-pointer"
                            >
                                <option value={Priority.Low} className="bg-slate-800">🟢 Low</option>
                                <option value={Priority.Medium} className="bg-slate-800">🟡 Medium</option>
                                <option value={Priority.High} className="bg-slate-800">🔴 High</option>
                            </select>

                            <input
                                type="number"
                                value={estimatedTime}
                                onChange={(e) => setEstimatedTime(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) handleAddTask(false);
                                }}
                                placeholder="Min"
                                min="0"
                                className="w-24 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => handleAddTask(false)}
                        disabled={!newTaskTitle.trim()}
                        className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-2.5 font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Plus size={16} />
                        Add Task
                    </button>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Today's Progress</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">Total Tasks</span>
                            <span className="font-bold text-white text-lg">{totalTasks}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">Completed</span>
                            <span className="font-bold text-green-400 text-lg">{completedCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">In Progress</span>
                            <span className="font-bold text-yellow-400 text-lg">{pendingTasks.length}</span>
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400">Completion</span>
                                <span className="text-xs font-bold text-green-400">{completionRate}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-400 transition-all duration-500"
                                    style={{ width: `${completionRate}%` }}
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => useAppStore.getState().setActivePage('Analytics')}
                            className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all"
                        >
                            View Analytics
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-w-0 space-y-6 overflow-y-auto p-6 pb-0">
                {pendingTasks.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-white mb-4">Active Tasks</h2>
                        <div className="space-y-3">
                            {pendingTasks.map((task, idx) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    isActive={activeTaskId === task.id}
                                    timerRemaining={activeTaskId === task.id ? timerRemaining : undefined}
                                    timerActive={timerActive}
                                    onTogglePlayPause={() => togglePlayPause(task.id, task.status)}
                                    onMarkDone={() => markAsDone(task.id)}
                                    onDelete={() => deleteTask(task.id)}
                                    onToggleSubtask={(stId) => toggleSubtask(task.id, stId)}
                                    onUpdateTask={(updates) => updateTask(task.id, updates)}
                                    onAddSubtask={(title) => addSubtaskToTask(task.id, title)}
                                    index={idx}
                                    exitAnimation={exitingTasks[task.id]}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {pendingTasks.length === 0 && (
                    <div className="p-16 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={32} className="text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                        <p className="text-gray-400">You've completed all your tasks.</p>
                    </div>
                )}

                {completedTasks.length > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">Completed Today</h2>
                            <span className="text-sm text-green-400 font-medium">{completedCount} completed</span>
                        </div>
                        <div className="space-y-3 transition-opacity duration-300">
                            {completedTasks.map((task, idx) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    isActive={activeTaskId === task.id}
                                    timerRemaining={activeTaskId === task.id ? timerRemaining : undefined}
                                    timerActive={timerActive}
                                    onTogglePlayPause={() => togglePlayPause(task.id, task.status)}
                                    onMarkDone={() => markAsDone(task.id)}
                                    onDelete={() => deleteTask(task.id)}
                                    onToggleSubtask={(stId) => toggleSubtask(task.id, stId)}
                                    onUpdateTask={(updates) => updateTask(task.id, updates)}
                                    onAddSubtask={(title) => addSubtaskToTask(task.id, title)}
                                    index={idx}
                                    exitAnimation={exitingTasks[task.id]}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksPage;
