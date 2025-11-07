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
const TaskItem: React.FC<{ task: Task; onToggle: (id: number) => void }> = ({ task, onToggle }) => {
    
    // If subtasks exist → calculate progress from subtasks
    const progress = task.subtasks && task.subtasks.length > 0
        ? Math.round((task.subtasks.filter(st => st.isCompleted).length / task.subtasks.length) * 100)
        : task.isCompleted ? 100 : (task.status === TaskStatus.IN_PROGRESS ? 50 : 0); // fallback logic

    return (
        <div className="grid grid-cols-10 items-center gap-4 p-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-800/40 transition-colors">
            
            {/* Toggle + Title */}
            <div className="col-span-4 flex items-center space-x-4">
                <button onClick={() => onToggle(task.id)} className="text-gray-400 hover:text-white transition">
                    {task.isCompleted 
                        ? <CheckCircleIcon className="h-5 w-5 text-green-500" /> 
                        : <CircleIcon className="h-5 w-5 text-gray-700" />}
                </button>
                <div>
                    <p className={`font-semibold ${task.isCompleted ? "line-through text-gray-500" : "text-white"}`}>
                        {task.title}
                    </p>
                    <p className="text-sm text-gray-400">{task.category}</p>
                </div>
            </div>

            {/* Priority */}
            <div className="col-span-2 flex justify-start">
                <PriorityBadge priority={task.priority} />
            </div>

            {/* Duration */}
            <div className="col-span-2 text-gray-300">{task.duration}</div>

            {/* Progress Bar */}
            <div className="col-span-2">
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div 
                        className="bg-orange-500 h-1.5 rounded-full transition-all" 
                        style={{ width: `${progress}%` }} 
                    ></div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN LIST ---
const TaskList: React.FC = () => {
    const tasks = useAppStore(state => state.tasks);
    const updateTask = useAppStore(state => state.updateTask);

    const handleToggle = (id: number) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        updateTask({ ...task, isCompleted: !task.isCompleted, status: (!task.isCompleted ? TaskStatus.DONE : TaskStatus.TODO) });
    };

    // Sorting: DONE first (newest), then IN PROGRESS, then TODO
    const sortedTasks = [...tasks].sort((a, b) => {
        const order = { [TaskStatus.DONE]: 0, [TaskStatus.IN_PROGRESS]: 1, [TaskStatus.TODO]: 2 };
        return order[a.status] - order[b.status];
    });

    return (
        <div className="bg-[#1C1C1E] border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Task Completion History</h3>
            </div>

            {/* Header Row */}
            <div className="grid grid-cols-10 gap-4 p-4 text-sm font-semibold text-gray-400">
                <div className="col-span-4">Task</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-2">Est. Duration</div>
                <div className="col-span-2">Progress</div>
            </div>

            {/* Items */}
            <div>
                {sortedTasks.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No tasks yet.</div>
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
