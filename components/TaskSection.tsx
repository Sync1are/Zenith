import React from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface TaskSectionProps {
    date: Date;
    tasks: Task[];
    activeTaskId: string | null;
    timerRemaining: number;
    timerActive: boolean;
    onTogglePlayPause: (id: string, status: TaskStatus) => void;
    onMarkDone: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onAddSubtask: (taskId: string, title: string) => void;
    exitingTasks: Record<string, 'complete' | 'uncomplete' | 'delete'>;
}

const formatDateLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) {
        return { emoji: '📅', label: 'Today' };
    } else if (date.getTime() === yesterday.getTime()) {
        return { emoji: '📆', label: 'Yesterday' };
    } else {
        return {
            emoji: '📋',
            label: date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            })
        };
    }
};

export const TaskSection = React.memo<TaskSectionProps>(({
    date,
    tasks,
    activeTaskId,
    timerRemaining,
    timerActive,
    onTogglePlayPause,
    onMarkDone,
    onDelete,
    onToggleSubtask,
    onUpdateTask,
    onAddSubtask,
    exitingTasks
}) => {
    if (tasks.length === 0) return null;

    const { emoji, label } = formatDateLabel(date);

    return (
        <div className="mb-8 animate-fade-in" id={`section-${date.getTime()}`}>
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/20">
                <h2 className="text-xl font-bold text-white drop-shadow-lg">{emoji} {label}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-sm text-white font-semibold border border-white/20">
                    {tasks.length}
                </span>
            </div>
            <div className="space-y-3">
                {tasks.map((task, idx) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        isActive={activeTaskId === task.id}
                        timerRemaining={activeTaskId === task.id ? timerRemaining : undefined}
                        timerActive={timerActive}
                        onTogglePlayPause={onTogglePlayPause}
                        onMarkDone={onMarkDone}
                        onDelete={onDelete}
                        onToggleSubtask={onToggleSubtask}
                        onUpdateTask={onUpdateTask}
                        onAddSubtask={onAddSubtask}
                        index={idx}
                        exitAnimation={exitingTasks[task.id]}
                    />
                ))}
            </div>
        </div>
    );
});
