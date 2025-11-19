import React, { useState, useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import { useAppStore } from '../store/useAppStore';
import {
    PlusIcon, SparklesIcon
} from './icons/IconComponents';

// Imported Components
import { TaskCard } from './tasks/TaskCard';
import { TaskModal, GeneratePlanModal } from './tasks/TaskModals';
import {
    DailyStatsWidget,
    TodaysEvents,
    QuickTemplates,
    CategoryBreakdown,
    RotatingMotivation
} from './tasks/TaskWidgets';

const COLUMNS = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];

const TasksPage = () => {
    const {
        tasks,
        activeTaskId,
        startTask,
        pauseTask,
        updateTask,
        deleteTask,
        addTask
    } = useAppStore();

    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>();

    const handleToggleSubtask = (taskId: number, subtaskId: number) => {
        updateTask(taskId, {
            subtasks: tasks
                .find(t => t.id === taskId)!
                .subtasks!.map(st =>
                    st.id === subtaskId
                        ? { ...st, isCompleted: !st.isCompleted, completedAt: Date.now() }
                        : st
                )
        });
    };

    const tasksByStatus = useMemo(() =>
        tasks.reduce((acc, t) => {
            acc[t.status] = acc[t.status] || [];
            acc[t.status].push(t);
            return acc;
        }, {} as Record<TaskStatus, Task[]>)
        , [tasks]);

    const moveTask = (task: Task, status: TaskStatus) => {
        updateTask(task.id, { status, isCompleted: status === TaskStatus.DONE, completedAt: status === TaskStatus.DONE ? Date.now() : undefined });
        if (status !== TaskStatus.IN_PROGRESS) pauseTask();
    };

    const handleStart = (task: Task) => startTask(task.id);
    const handlePause = () => pauseTask();

    const handleDeleteTask = (id: number) => {
        if (id === activeTaskId) pauseTask();
        deleteTask(id);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = (taskData: any) => {
        if (editingTask) {
            updateTask(editingTask.id, taskData);
            setEditingTask(undefined);
        } else {
            addTask({
                ...taskData,
                id: Date.now(),
                status: TaskStatus.TODO,
                isCompleted: false
            });
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTask(undefined);
    };

    const handleAddBatchTasks = (batch: Task[]) => {
        batch.forEach(task => addTask({ ...task, id: Date.now() + Math.random() }));
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Tasks</h1>
                <p className="text-gray-400 text-sm">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg flex items-center gap-2 hover:bg-orange-500 transition">
                    <PlusIcon className="h-5 w-5" /> Add Task
                </button>
                <button onClick={() => setAiModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-500 transition">
                    <SparklesIcon className="h-5 w-5" /> AI
                </button>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {COLUMNS.map(status => (
                    <div key={status}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => draggedTask && moveTask(draggedTask, status)}
                        className="bg-[#1C1C1E] border border-gray-800 rounded-xl p-4 space-y-4 min-h-[200px]"
                    >
                        <h3 className="text-white font-bold">{status}</h3>

                        {(tasksByStatus[status] || []).map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                isActive={task.id === activeTaskId}
                                onDragStart={(e: React.DragEvent, t: Task) => { setDraggedTask(t); e.dataTransfer.effectAllowed = "move"; }}
                                onStartOrResumeTask={handleStart}
                                onPauseTask={handlePause}
                                onEditTask={handleEditTask}
                                onDeleteTask={handleDeleteTask}
                                onToggleSubtask={handleToggleSubtask}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Bottom Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <DailyStatsWidget />
                <CategoryBreakdown />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <QuickTemplates />
                <TodaysEvents />
            </div>

            {/* Modals */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveTask}
                editTask={editingTask}
            />

            <GeneratePlanModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} onAddBatch={handleAddBatchTasks} />

            <RotatingMotivation />
        </div>
    );
};

export default TasksPage;
