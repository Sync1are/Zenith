import React, { useState } from 'react';
import { Task, TaskStatus, Priority } from '../types';
import { Plus, Sparkles, Check, Clock, Trash2, ChevronDown, Hash, Play, Pause, Edit2, CheckCircle2 } from 'lucide-react';

interface TaskCardProps {
    task: Task;
    isActive: boolean;
    timerRemaining?: number;
    timerActive: boolean;
    onTogglePlayPause: (id: string, status: TaskStatus) => void;
    onMarkDone: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onAddSubtask: (taskId: string, title: string) => void;
    index: number;
    exitAnimation?: 'complete' | 'uncomplete' | 'delete';
}

export const TaskCard = React.memo<TaskCardProps>(({
    task,
    isActive,
    timerRemaining,
    timerActive,
    onTogglePlayPause,
    onMarkDone,
    onDelete,
    onToggleSubtask,
    onUpdateTask,
    onAddSubtask,
    index,
    exitAnimation
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [editedPriority, setEditedPriority] = useState(task.priority);
    const [editedCategory, setEditedCategory] = useState(task.category);
    const [editedTime, setEditedTime] = useState(task.estimatedTimeMinutes?.toString() || '');
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    // Check if this is a count-up task (no estimated time)
    // Handle edge cases: undefined, null, 0, empty string, or NaN
    const estimatedMins = task.estimatedTimeMinutes;
    const isCountUpTask = !estimatedMins || Number(estimatedMins) === 0 || Number.isNaN(Number(estimatedMins));

    const formatTime = (seconds: number, isCountUp: boolean = false) => {
        const absSeconds = Math.abs(seconds);
        const mins = Math.floor(absSeconds / 60).toString().padStart(2, '0');
        const secs = (absSeconds % 60).toString().padStart(2, '0');
        // For count-up tasks, never show a sign
        // For countdown tasks, show + when in overtime (negative)
        const sign = !isCountUp && seconds < 0 ? '+' : '';
        return `${sign}${mins}:${secs}`;
    };

    const saveEdits = () => {
        onUpdateTask(task.id, {
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
            onAddSubtask(task.id, newSubtaskTitle.trim());
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
            <div className={`relative p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-200 shadow-lg ${expanded ? 'ring-1 ring-white/30 bg-white/15' : ''}`}>

                {/* Main Row */}
                <div className="flex items-center gap-4">
                    {/* Play/Pause Button */}
                    <button
                        onClick={() => onTogglePlayPause(task.id, task.status)}
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
                                        <h4 className={`text-base font-medium truncate transition-all ${task.status === TaskStatus.Done ? 'text-white/50 line-through decoration-white/30' : 'text-white'}`}>
                                            {task.title}
                                        </h4>
                                        {task.parentTaskId && (
                                            <span className="text-xs text-blue-400" title="Recurring task">♻️</span>
                                        )}
                                        {isActive && (
                                            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-gray-300">
                                        <span className={`px-2 py-0.5 rounded-full font-semibold ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Hash size={10} /> {task.category}
                                        </span>
                                        {(task.estimatedTimeMinutes > 0 || task.remainingTime !== undefined || task.timeSpentMinutes) && (
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {isActive && timerRemaining !== undefined
                                                    ? <span className={`font-mono ${isCountUpTask ? 'text-green-400' : 'text-blue-400'}`}>{formatTime(timerRemaining, isCountUpTask)}</span>
                                                    : task.remainingTime !== undefined
                                                        ? <span className="font-mono">{formatTime(task.remainingTime, isCountUpTask)}</span>
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
                                        <button onClick={() => onMarkDone(task.id)} className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="Mark Done">
                                            <Check size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => onDelete(task.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
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
                                    onClick={() => onToggleSubtask(task.id, st.id)}
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
});
