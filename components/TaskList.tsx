
import React, { useState } from 'react';
import { Task, TaskPriority } from '../types';
import { CheckCircleIcon, CircleIcon } from './icons/IconComponents';

const initialTasks: Task[] = [
    { id: 1, title: 'Build UI for Dashboard', category: 'Project Phoenix', priority: TaskPriority.HIGH, duration: '45 min', isCompleted: true },
    { id: 2, title: 'Review marketing copy', category: 'Marketing', priority: TaskPriority.MEDIUM, duration: '30 min', isCompleted: false },
    { id: 3, title: 'Weekly team sync', category: 'Meetings', priority: TaskPriority.LOW, duration: '1 hour', isCompleted: false },
    { id: 4, title: 'Draft Q3 report', category: 'Reporting', priority: TaskPriority.HIGH, duration: '2 hours', isCompleted: false },
];

const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
    const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
    const colorClasses = {
        [TaskPriority.HIGH]: 'bg-red-500/20 text-red-400',
        [TaskPriority.MEDIUM]: 'bg-yellow-500/20 text-yellow-400',
        [TaskPriority.LOW]: 'bg-blue-500/20 text-blue-400',
    };
    return <span className={`${baseClasses} ${colorClasses[priority]}`}>{priority}</span>;
};


const TaskItem: React.FC<{ task: Task; onToggle: (id: number) => void }> = ({ task, onToggle }) => (
    <div className="grid grid-cols-10 items-center gap-4 p-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-800/40 transition-colors">
        <div className="col-span-4 flex items-center space-x-4">
            <button 
                onClick={() => onToggle(task.id)} 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={`Mark task ${task.title} as ${task.isCompleted ? 'incomplete' : 'complete'}`}
            >
                {task.isCompleted ? <CheckCircleIcon className="h-5 w-5 text-green-500" /> : <CircleIcon className="h-5 w-5 text-gray-700" />}
            </button>
            <div>
                <p className={`font-semibold transition-colors ${task.isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</p>
                <p className="text-sm text-gray-400">{task.category}</p>
            </div>
        </div>
        <div className="col-span-2 flex justify-start">
            <PriorityBadge priority={task.priority} />
        </div>
        <div className="col-span-2 text-gray-300">{task.duration}</div>
        <div className="col-span-2">
            <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: task.isCompleted ? '100%' : `${Math.random() * 80 + 10}%` }}></div>
            </div>
        </div>
    </div>
);

const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    const handleToggleTask = (taskId: number) => {
        setTasks(currentTasks => 
            currentTasks.map(task =>
                task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
            )
        );
    };

    return (
        <div className="bg-[#1C1C1E] border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Task Completion History</h3>
            </div>
            <div className="grid grid-cols-10 items-center gap-4 p-4 text-sm font-semibold text-gray-400">
                <div className="col-span-4">Task</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-2">Est. Duration</div>
                <div className="col-span-2">Progress</div>
            </div>
            <div>
                {tasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTask} />)}
            </div>
        </div>
    );
};

export default TaskList;