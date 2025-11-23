import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import {
    PlayIcon, PauseIcon, EditIcon, TrashIcon, TagIcon, ClockIcon
} from '../icons/IconComponents';

// Duration Helpers (duplicated here or should be in utils, but keeping local for now to avoid breaking changes)
const parseDurationToSeconds = (duration: string): number => {
    const num = parseInt(duration);
    if (duration.includes("hour")) return num * 3600;
    if (duration.includes("min")) return num * 60;
    return num;
};

const formatSeconds = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
            .toString()
            .padStart(2, "0")}`;
    }

    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
    const color = {
        [TaskPriority.HIGH]: "bg-red-500/20 text-red-400",
        [TaskPriority.MEDIUM]: "bg-yellow-500/20 text-yellow-400",
        [TaskPriority.LOW]: "bg-blue-500/20 text-blue-400"
    }[priority];

    return <span className={`px-2 py-1 text-xs font-semibold rounded ${color}`}>{priority}</span>;
};

interface TaskCardProps {
    task: Task;
    isActive: boolean;
    onDragStart: (e: React.DragEvent, task: Task) => void;
    onStartOrResumeTask: (task: Task) => void;
    onPauseTask: (task: Task) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (id: number) => void;
    onToggleSubtask: (taskId: number, subtaskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    isActive,
    onDragStart,
    onStartOrResumeTask,
    onPauseTask,
    onEditTask,
    onDeleteTask,
    onToggleSubtask
}) => {

    const totalTime = task.subtasks?.length
        ? task.subtasks.reduce((acc: number, st: any) => {
            const n = parseInt(st.duration);
            if (st.duration.includes("hour")) return acc + n * 3600;
            if (st.duration.includes("min")) return acc + n * 60;
            return acc + n;
        }, 0)
        : task.remainingTime ?? parseDurationToSeconds(task.duration);


    const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 hover:bg-orange-500/10 hover:border-orange-500/40 rounded-lg p-4 group transition hover:-translate-y-1 hover:shadow-lg relative"
        >
            {/* Controls */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex gap-1 transition">
                {task.status !== TaskStatus.DONE && (
                    isActive ?
                        <button onClick={() => onPauseTask(task)} className="p-1 hover:bg-gray-700 rounded">
                            <PauseIcon className="w-4 h-4 text-gray-300" />
                        </button>
                        :
                        <button onClick={() => onStartOrResumeTask(task)} className="p-1 hover:bg-gray-700 rounded">
                            <PlayIcon className="w-4 h-4 text-gray-300" />
                        </button>
                )}

                <button onClick={() => onEditTask(task)} className="p-1 hover:bg-gray-700 rounded">
                    <EditIcon className="w-4 h-4 text-gray-300" />
                </button>

                <button onClick={() => onDeleteTask(task.id)} className="p-1 hover:bg-red-600/40 rounded">
                    <TrashIcon className="w-4 h-4 text-red-300" />
                </button>
            </div>

            {/* Title */}
            <p className="font-semibold text-white mb-2">{task.title}</p>

            {/* Time + Category */}
            <div className="text-sm text-gray-400 group-hover:text-gray-300 flex justify-between mb-3">
                <span className="flex items-center gap-1">
                    <TagIcon className="w-3 h-3" /> {task.category}
                </span>

                <span className="font-mono flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />

                    {/* If task has set duration → countdown mode */}
                    {task.duration
                        ? formatSeconds(task.remainingTime ?? parseDurationToSeconds(task.duration))

                        /* If no duration → stopwatch mode */
                        : formatSeconds(task.elapsedTime ?? 0)
                    }
                </span>
            </div>


            {/* Subtasks List */}
            {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-1 mt-2">
                    {task.subtasks.map(st => (
                        <div key={st.id} className="flex items-center justify-between text-gray-400 text-sm">
                            <button onClick={() => onToggleSubtask(task.id, st.id)} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full border ${st.isCompleted ? "bg-orange-500" : "border-gray-500"}`} />
                                <span className={`${st.isCompleted ? "line-through text-white/40" : "text-gray-200 group-hover:text-white"}`}>{st.title}</span>
                            </button>
                            <span className="font-mono text-xs">{st.duration}</span>
                        </div>
                    ))}
                    <p className="text-xs text-gray-500 mt-1">{completedSubtasks}/{task.subtasks.length} subtasks done</p>
                </div>
            )}

            <PriorityBadge priority={task.priority} />
        </div>
    );
};
