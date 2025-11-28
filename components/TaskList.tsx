import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { useAppStore } from "../store/useAppStore";
import { CheckCircleIcon, CircleIcon } from './icons/IconComponents';

// --- Priority Badge ---
const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
    const base = "px-2 py-1 text-xs font-semibold rounded-full";
    const color = {
        HIGH: "bg-red-500/20 text-red-400",
        MEDIUM: "bg-yellow-500/20 text-yellow-400",
        LOW: "bg-blue-500/20 text-blue-400",
    }[priority];

    return <span className={`${base} ${color}`}>{priority}</span>;
};

// --- Task Row ---
const TaskItem: React.FC<{ task: Task; onToggle: (id: string) => void }> = ({ task, onToggle }) => {
    const activeTaskId = useAppStore(state => state.activeTaskId);
    const isActive = task.id === activeTaskId;

    // If subtasks exist → calculate progress from subtasks
    const progress = task.subtasks && task.subtasks.length > 0
        ? Math.round((task.subtasks.filter(st => st.isCompleted).length / task.subtasks.length) * 100)
        : task.isCompleted ? 100 : (task.status === TaskStatus.InProgress ? 50 : 0);

    return (
        <div className="grid grid-cols-10 items-center gap-4 p-4 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors">

            {/* Toggle + Title */}
            <div className="col-span-4 flex items-center space-x-4">
                <button onClick={() => onToggle(task.id)} className="text-gray-400 hover:text-white transition">
                    {task.isCompleted
                        ? <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        : <CircleIcon className="h-5 w-5 text-gray-700" />}
                </button>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold ${isActive ? "text-orange-400" : task.isCompleted ? "line-through text-gray-500" : "text-white"}`}>
                            {task.title}
                        </p>

                        {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold animate-pulse">
                                ⚡ Active
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-400">{task.category}</p>
                </div>
            </div>

            {/* Priority */}
            <div className="col-span-2 flex justify-start">
                <PriorityBadge priority={task.priority} />
            </div>

            {/* Duration */}
            <div className="col-span-2 text-gray-300">{task.duration}</div>

            {/* Progress + Status */}
            <div className="col-span-2">
                {(() => {
                    let total = 0;

                    // Total duration calculation
                    if (task.subtasks?.length) {
                        total = task.subtasks.reduce((acc, st) => {
                            const num = parseInt(st.duration);
                            if (st.duration.includes("hour")) return acc + num * 3600;
                            if (st.duration.includes("min")) return acc + num * 60;
                            return acc + num;
                        }, 0);
                    } else if (task.duration) {
                        const num = parseInt(task.duration);
                        if (task.duration.includes("hour")) total = num * 3600;
                        else if (task.duration.includes("min")) total = num * 60;
                        else total = num;
                    }

                    const remaining = task.remainingTime ?? total;
                    const progress = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 0;

                    return (
                        <div className="flex items-center gap-3">
                            {/* Progress Bar */}
                            <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden relative">
                                <div
                                    className={`h-2 transition-all duration-[1000ms] ease-linear ${isActive ? 'bg-orange-500' : 'bg-blue-500'}`}
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
                            {total > 0 && (
                                <span className={`text-xs font-mono w-10 text-right ${isActive ? 'text-orange-400 font-semibold' : 'text-gray-400'}`}>
                                    {Math.round(progress)}%
                                </span>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

// --- MAIN LIST ---
const TaskList: React.FC = () => {
    const tasks = useAppStore(state => state.tasks);
    const activeTaskId = useAppStore(state => state.activeTaskId);
    const setTasks = useAppStore(state => state.setTasks);

    const handleToggle = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        setTasks(tasks.map(t =>
            t.id === id
                ? {
                    ...t,
                    isCompleted: !t.isCompleted,
                    status: !t.isCompleted ? TaskStatus.Done : TaskStatus.Todo,
                    completedAt: !t.isCompleted ? Date.now() : undefined
                }
                : t
        ));
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

        // Priority 3: For DONE tasks, show newest first
        if (a.status === TaskStatus.Done && b.status === TaskStatus.Done) {
            return (b.completedAt || 0) - (a.completedAt || 0);
        }

        // Priority 4: Default order (by id, newest first)
        return parseInt(b.id) - parseInt(a.id);
    });

    return (
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
            <div className="grid grid-cols-10 gap-4 p-4 text-sm font-semibold text-white/90 drop-shadow-md border-b border-white/10">
                <div className="col-span-4">Task</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-2">Est. Duration</div>
                <div className="col-span-2">Progress</div>
            </div>

            {/* Items */}
            <div className="max-h-[380px] overflow-y-auto">
                {sortedTasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-lg mb-2">No tasks yet</p>
                        <p className="text-sm">Create your first task to get started! 🚀</p>
                    </div>
                ) : (
                    sortedTasks.map(task => (
                        <TaskItem key={task.id} task={task} onToggle={handleToggle} />
                    ))
                )}
            </div>
        </div>
    );
};

export default TaskList;
