import React from 'react';
import { Task, Priority, TaskStatus } from '../types';
import { useAppStore } from "../store/useAppStore";
import { CheckCircleIcon, CircleIcon, TrashIcon } from './icons/IconComponents';

// --- Priority Badge ---
const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    const base = "px-2 py-1 text-xs font-semibold rounded-full";
    const color = {
        [Priority.High]: "bg-red-500/20 text-red-400",
        [Priority.Medium]: "bg-yellow-500/20 text-yellow-400",
        [Priority.Low]: "bg-blue-500/20 text-blue-400",
    }[priority] || "bg-gray-500/20 text-gray-400";

    return <span className={`${base} ${color}`}>{priority}</span>;
};

// --- Task Row ---
const TaskItem: React.FC<{ task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void }> = ({ task, onToggle, onDelete }) => {
    const activeTaskId = useAppStore(state => state.activeTaskId);
    const isActive = task.id === activeTaskId;

    // If subtasks exist → calculate progress from subtasks
    const progress = task.subtasks && task.subtasks.length > 0
        ? Math.round((task.subtasks.filter(st => st.isCompleted).length / task.subtasks.length) * 100)
        : task.status === TaskStatus.Done ? 100 : (task.status === TaskStatus.InProgress ? 50 : 0);

    return (
        <div className="group grid grid-cols-12 items-center gap-4 p-4 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors relative">

            {/* Toggle + Title */}
            <div className="col-span-5 flex items-center space-x-4">
                <button onClick={() => onToggle(task.id)} className="text-gray-400 hover:text-white transition flex-shrink-0">
                    {task.status === TaskStatus.Done
                        ? <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        : <CircleIcon className="h-5 w-5 text-gray-700" />}
                </button>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold truncate ${isActive ? "text-orange-400" : task.status === TaskStatus.Done ? "line-through text-gray-500" : "text-white"}`}>
                            {task.title}
                        </p>

                        {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold animate-pulse flex-shrink-0">
                                ⚡ Active
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-400 truncate">{task.category}</p>
                </div>
            </div>

            {/* Priority */}
            <div className="col-span-2 flex justify-start">
                <PriorityBadge priority={task.priority} />
            </div>

            {/* Duration */}
            <div className="col-span-2 text-gray-300 truncate">{task.estimatedTimeMinutes} min</div>

            {/* Progress + Status */}
            <div className="col-span-3 flex items-center justify-between gap-2">
                <div className="flex-1">
                    {(() => {
                        // Calculate progress based on time spent vs estimated time
                        const estimatedMinutes = task.estimatedTimeMinutes || 0;
                        const timeSpentMinutes = task.timeSpentMinutes || 0;

                        // If task has subtasks, calculate from subtask completion
                        let progress = 0;
                        if (task.subtasks && task.subtasks.length > 0) {
                            const completedSubtasks = task.subtasks.filter(st => st.isCompleted).length;
                            progress = Math.round((completedSubtasks / task.subtasks.length) * 100);
                        } else if (task.status === TaskStatus.Done) {
                            // Task is complete
                            progress = 100;
                        } else if (estimatedMinutes > 0 && timeSpentMinutes > 0) {
                            // Calculate based on time spent vs estimated
                            progress = Math.min(99, Math.round((timeSpentMinutes / estimatedMinutes) * 100));
                        } else if (task.remainingTime !== undefined && estimatedMinutes > 0) {
                            // Fallback: calculate from remaining time
                            const totalSeconds = estimatedMinutes * 60;
                            const elapsed = totalSeconds - task.remainingTime;
                            progress = Math.min(99, Math.round((elapsed / totalSeconds) * 100));
                        }

                        // Ensure progress is never negative
                        progress = Math.max(0, progress);

                        return (
                            <div className="flex items-center gap-3">
                                {/* Progress Bar */}
                                <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden relative">
                                    <div
                                        className={`h-2 transition-all duration-[1000ms] ease-linear ${task.status === TaskStatus.Done
                                            ? 'bg-green-500'
                                            : isActive
                                                ? 'bg-orange-500'
                                                : 'bg-blue-500'
                                            }`}
                                        style={{
                                            width: `${progress}%`,
                                            boxShadow: isActive ? '0 0 8px rgba(249, 115, 22, 0.6)' : 'none'
                                        }}
                                    >
                                        {/* Shimmer effect for active task */}
                                        {isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                                        )}
                                    </div>
                                </div>

                                {/* Percentage */}
                                <span className={`text-xs font-mono w-10 text-right ${task.status === TaskStatus.Done
                                    ? 'text-green-400 font-semibold'
                                    : isActive
                                        ? 'text-orange-400 font-semibold'
                                        : 'text-gray-400'
                                    }`}>
                                    {progress}%
                                </span>
                            </div>
                        );
                    })()}
                </div>

                {/* Delete Button - Visible on Hover */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Task"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

// --- MAIN LIST ---
const TaskList: React.FC = () => {
    const tasks = useAppStore(state => state.tasks);
    const activeTaskId = useAppStore(state => state.activeTaskId);
    const setTasks = useAppStore(state => state.setTasks);
    const deleteTask = useAppStore(state => state.deleteTask);

    // Delete confirmation modal state
    const [deleteConfirm, setDeleteConfirm] = React.useState<{ isOpen: boolean; taskId: string | null; taskTitle: string }>({
        isOpen: false,
        taskId: null,
        taskTitle: ''
    });

    const handleToggle = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        setTasks(tasks.map(t =>
            t.id === id
                ? {
                    ...t,
                    status: t.status === TaskStatus.Done ? TaskStatus.Todo : TaskStatus.Done,
                }
                : t
        ));
    };

    const handleDeleteClick = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            setDeleteConfirm({ isOpen: true, taskId: id, taskTitle: task.title });
        }
    };

    const confirmDelete = () => {
        if (deleteConfirm.taskId) {
            deleteTask(deleteConfirm.taskId);
        }
        setDeleteConfirm({ isOpen: false, taskId: null, taskTitle: '' });
    };

    const cancelDelete = () => {
        setDeleteConfirm({ isOpen: false, taskId: null, taskTitle: '' });
    };

    // Sorting: Active task always comes first
    const sortedTasks = [...tasks].sort((a, b) => {
        // Priority 1: Active task always at the top
        const aIsActive = a.id === activeTaskId;
        const bIsActive = b.id === activeTaskId;

        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;

        // Priority 2: Sort by status (IN_PROGRESS > TODO > DONE)
        const statusOrder = {
            [TaskStatus.InProgress]: 0,
            [TaskStatus.Todo]: 1,
            [TaskStatus.Done]: 2
        };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;

        // Priority 3: For DONE tasks, show newest first (using id as proxy for creation time if completedAt is missing)
        if (a.status === TaskStatus.Done && b.status === TaskStatus.Done) {
            return parseInt(b.id) - parseInt(a.id);
        }

        // Priority 4: Default order (by createdAt, newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">📋 Task Completion History</h3>
                    <div className="flex items-center gap-3 text-sm">
                        {activeTaskId && (
                            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full font-semibold">
                                ⚡ 1 Active
                            </span>
                        )}
                        <span className="text-gray-400">
                            {tasks.length} total
                        </span>
                    </div>
                </div>

                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-white/90 drop-shadow-md border-b border-white/10">
                    <div className="col-span-5">Task</div>
                    <div className="col-span-2">Priority</div>
                    <div className="col-span-2">Est. Duration</div>
                    <div className="col-span-3">Progress</div>
                </div>

                {/* Items */}
                <div className="max-h-[240px] overflow-y-auto">
                    {sortedTasks.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p className="text-lg mb-2">No tasks yet</p>
                            <p className="text-sm">Create your first task to get started! 🚀</p>
                        </div>
                    ) : (
                        sortedTasks.map(task => (
                            <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDeleteClick} />
                        ))
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={cancelDelete}
                    />

                    {/* Modal */}
                    <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <TrashIcon className="w-5 h-5 text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Delete Task</h3>
                        </div>

                        {/* Content */}
                        <p className="text-white/70 mb-2">Are you sure you want to delete this task?</p>
                        <p className="text-white font-medium bg-white/5 rounded-lg px-3 py-2 mb-6 truncate">
                            "{deleteConfirm.taskTitle}"
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/25"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaskList;
