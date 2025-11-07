import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAppStore } from '../store/useAppStore';

import {
    PlusIcon, SparklesIcon, ClockIcon, TagIcon, PlayIcon, PauseIcon,
    EditIcon, TrashIcon
} from './icons/IconComponents';
const COLUMNS = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];


// -----------------------------------------------------------------------------
// INITIAL DATA
const initialTasksData: Task[] = [
    { id: 1, title: 'Build UI for Dashboard', category: 'Project Phoenix', priority: TaskPriority.HIGH, duration: '4 hours', status: TaskStatus.DONE, isCompleted: true },
    { id: 2, title: 'Review marketing copy', category: 'Marketing', priority: TaskPriority.MEDIUM, duration: '30 min', status: TaskStatus.IN_PROGRESS, isCompleted: false },
    { id: 3, title: 'Weekly team sync', category: 'Meetings', priority: TaskPriority.LOW, duration: '1 hour', status: TaskStatus.TODO, isCompleted: false },
    { id: 4, title: 'Draft Q3 report', category: 'Reporting', priority: TaskPriority.HIGH, duration: '2 hours', status: TaskStatus.TODO, isCompleted: false },
];

// -----------------------------------------------------------------------------
// Duration Helpers
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


// -----------------------------------------------------------------------------
// UI Small Components
const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
    const color = {
        [TaskPriority.HIGH]: "bg-red-500/20 text-red-400",
        [TaskPriority.MEDIUM]: "bg-yellow-500/20 text-yellow-400",
        [TaskPriority.LOW]: "bg-blue-500/20 text-blue-400"
    }[priority];

    return <span className={`px-2 py-1 text-xs font-semibold rounded ${color}`}>{priority}</span>;
};

const DailyStatsWidget: React.FC = () => {
    const tasks = useAppStore(state => state.tasks);
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    const todayCompleted = tasks.filter(t => t.completedAt && t.completedAt >= startOfDay);
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
    const highPriority = tasks.filter(t => t.priority === TaskPriority.HIGH && t.status !== TaskStatus.DONE);

    return (
        <div className="bg-[#1C1C1E] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                📊 Today's Stats
            </h3>
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-3xl font-bold text-green-500">{todayCompleted.length}</p>
                    <p className="text-sm text-gray-400 mt-1">Completed</p>
                </div>
                <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <p className="text-3xl font-bold text-orange-500">{inProgress.length}</p>
                    <p className="text-sm text-gray-400 mt-1">In Progress</p>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-3xl font-bold text-red-500">{highPriority.length}</p>
                    <p className="text-sm text-gray-400 mt-1">High Priority</p>
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// NEW: Recent Activity Feed
const RecentActivity: React.FC = () => {
    const tasks = useAppStore(state => state.tasks);
    
    const recentActivities = tasks
        .filter(t => t.completedAt)
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
        .slice(0, 5);

    if (recentActivities.length === 0) {
        return (
            <div className="bg-[#1C1C1E] border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📋 Recent Activity</h3>
                <p className="text-gray-500 text-center py-8">No completed tasks yet</p>
            </div>
        );
    }

    return (
        <div className="bg-[#1C1C1E] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📋 Recent Activity</h3>
            <div className="space-y-3">
                {recentActivities.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{task.title}</p>
                            <p className="text-gray-400 text-xs">{task.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <span className="text-xs text-gray-500 block">
                                {new Date(task.completedAt!).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                })}
                            </span>
                            <span className="text-xs text-green-400">{task.duration}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// NEW: Quick Task Templates
const QuickTemplates: React.FC = () => {
    const { addTask } = useAppStore();

    const templates = [
        { title: "📚 Study Session", category: "Learning", duration: "2 hours", priority: TaskPriority.HIGH },
        { title: "🏋️ Workout", category: "Fitness", duration: "1 hour", priority: TaskPriority.MEDIUM },
        { title: "💻 Code Review", category: "Development", duration: "30 min", priority: TaskPriority.HIGH },
        { title: "📧 Check Emails", category: "Admin", duration: "20 min", priority: TaskPriority.LOW },
        { title: "☕ Break", category: "Rest", duration: "15 min", priority: TaskPriority.LOW },
        { title: "📖 Read Articles", category: "Learning", duration: "45 min", priority: TaskPriority.MEDIUM },
    ];

    const addFromTemplate = (template: any) => {
        addTask({
            ...template,
            id: Date.now(),
            status: TaskStatus.TODO,
            isCompleted: false,
        });
    };

    return (
        <div className="bg-[#1C1C1E] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">⚡ Quick Add Templates</h3>
            <div className="grid grid-cols-2 gap-3">
                {templates.map((template, idx) => (
                    <button
                        key={idx}
                        onClick={() => addFromTemplate(template)}
                        className="p-3 bg-gray-800/40 hover:bg-orange-500/20 border border-gray-700 hover:border-orange-500/40 rounded-lg text-left transition group"
                    >
                        <p className="text-white text-sm font-medium group-hover:text-orange-400 transition">{template.title}</p>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-gray-400 text-xs">{template.duration}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                template.priority === TaskPriority.HIGH ? 'bg-red-500/20 text-red-400' :
                                template.priority === TaskPriority.MEDIUM ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                            }`}>
                                {template.priority}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// NEW: Category Breakdown
const CategoryBreakdown: React.FC = () => {
    const tasks = useAppStore(state => state.tasks);
    
    const categoryStats = useMemo(() => {
        const stats: Record<string, { total: number; completed: number }> = {};
        
        tasks.forEach(task => {
            if (!stats[task.category]) {
                stats[task.category] = { total: 0, completed: 0 };
            }
            stats[task.category].total++;
            if (task.isCompleted) {
                stats[task.category].completed++;
            }
        });
        
        return Object.entries(stats)
            .map(([category, data]) => ({
                category,
                ...data,
                percentage: Math.round((data.completed / data.total) * 100)
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [tasks]);

    return (
        <div className="bg-[#1C1C1E] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📂 Category Breakdown</h3>
            <div className="space-y-4">
                {categoryStats.map(({ category, total, completed, percentage }) => (
                    <div key={category}>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300 font-medium">{category}</span>
                            <span className="text-gray-400">{completed}/{total}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// Task Card Component
const TaskCard = ({
    task,
    isActive,
    onDragStart,
    onStartOrResumeTask,
    onPauseTask,
    onEditTask,
    onDeleteTask,
    onToggleSubtask
}: any) => {

    const totalTime = task.subtasks?.length
        ? task.subtasks.reduce((acc: number, st: any) => {
            const n = parseInt(st.duration);
            if (st.duration.includes("hour")) return acc + n * 3600;
            if (st.duration.includes("min")) return acc + n * 60;
            return acc + n;
        }, 0)
        : task.remainingTime ?? parseDurationToSeconds(task.duration);


    const formattedTotal = formatSeconds(totalTime);

    const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            className="bg-[#1C1C1E] border border-gray-800 rounded-lg p-4 group transition hover:-translate-y-1 hover:shadow-lg relative"
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
            <div className="text-sm text-gray-400 flex justify-between mb-3">
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
                                <span className={`${st.isCompleted ? "line-through text-gray-600" : "text-gray-300"}`}>{st.title}</span>
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

// -----------------------------------------------------------------------------
// Add Task Modal
const AddTaskModal = ({ isOpen, onClose, onAddTask }: any) => {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
    const [duration, setDuration] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-[#1C1C1E] p-6 rounded-xl border border-gray-800 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-4">Add Task</h2>

                <input className="w-full bg-[#111217] px-3 py-2 rounded border border-gray-700 text-white mb-3"
                    placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />

                <input className="w-full bg-[#111217] px-3 py-2 rounded border border-gray-700 text-white mb-3"
                    placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />

                <div className="flex gap-3 mb-4">
                    <select className="flex-1 bg-[#111217] border border-gray-700 text-white rounded px-3 py-2"
                        value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                        {Object.values(TaskPriority).map(p => <option key={p}>{p}</option>)}
                    </select>

                    <input className="flex-1 bg-[#111217] border border-gray-700 text-white rounded px-3 py-2"
                        placeholder="45 min" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>

                <div className="flex justify-end gap-3">
                    <button className="px-4 py-2 bg-gray-700 rounded text-white" onClick={onClose}>Cancel</button>
                    <button className="px-4 py-2 bg-orange-600 rounded text-white"
                        onClick={() => { onAddTask({ title, category, priority, duration }); onClose(); }}>
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// AI Task Planner Modal
const GeneratePlanModal = ({ isOpen, onClose, onAddBatch }: any) => {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    const generatePlan = async () => {
        if (!prompt.trim()) return;
        setLoading(true);

        try {
            const genAI = new GoogleGenerativeAI(process.env.API_KEY!);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const response = await model.generateContent(`
Return ONLY valid JSON. No explanation, no markdown.

{
  "task": {
    "title": "",
    "category": "",
    "priority": "HIGH|MEDIUM|LOW",
    "subtasks": [
      { "title": "", "duration": "30 min" }
    ]
  }
}

Goal: ${prompt}
    `);

            let text = response.response.text().trim().replace(/```json|```/g, "");

            const data = JSON.parse(text);

            const mainTask = {
                id: Date.now(),
                title: data.task.title,
                category: data.task.category,
                priority: data.task.priority,
                duration: "0 min", // will be recalculated
                status: TaskStatus.TODO,
                isCompleted: false,
                subtasks: data.task.subtasks.map((st: any) => ({
                    id: Date.now() + Math.random(),
                    title: st.title,
                    duration: st.duration,
                    isCompleted: false
                }))
            };

            onAddBatch([mainTask]);
            onClose();

        } catch (err) {
            console.error(err);
            alert("⚠️ AI could not create tasks. Try rephrasing your prompt.");
        }

        setLoading(false);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-[#1C1C1E] border border-gray-800 rounded-xl p-6 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl text-white font-bold mb-4">AI Task Planner</h2>

                <textarea
                    className="w-full h-32 bg-[#111217] border border-gray-700 text-white rounded p-3"
                    placeholder="Example: Study math calculus notes and revise electrostatics..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />

                <div className="flex justify-end gap-3 mt-4">
                    <button className="px-4 py-2 bg-gray-700 rounded text-white" onClick={onClose}>Cancel</button>
                    <button className="px-4 py-2 bg-indigo-600 rounded text-white disabled:opacity-50"
                        disabled={loading}
                        onClick={generatePlan}>
                        {loading ? "Thinking..." : "Generate"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
const TasksPage = () => {
    const { 
        tasks, 
        activeTaskId,
        setTasks,
        startTask, 
        pauseTask, 
        updateTask, 
        deleteTask, 
        addTask 
    } = useAppStore();

    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);

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
        updateTask(task.id, { status, isCompleted: status === TaskStatus.DONE });
        if (status !== TaskStatus.IN_PROGRESS) pauseTask();
    };

    const handleStart = (task: Task) => startTask(task.id);
    const handlePause = () => pauseTask();

    const handleDeleteTask = (id: number) => {
        if (id === activeTaskId) pauseTask();
        deleteTask(id);
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
                                onDragStart={(e: any, t: Task) => { setDraggedTask(t); e.dataTransfer.effectAllowed = "move"; }}
                                onStartOrResumeTask={handleStart}
                                onPauseTask={handlePause}
                                onEditTask={(t: Task) => alert("Editing coming soon")}
                                onDeleteTask={handleDeleteTask}
                                onToggleSubtask={handleToggleSubtask}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* ✅ NEW: Bottom Widgets Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <DailyStatsWidget />
                <CategoryBreakdown />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <QuickTemplates />
                <RecentActivity />
            </div>

            {/* Modals */}
            <AddTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddTask={(t: any) =>
                    addTask({ ...t, id: Date.now(), status: TaskStatus.TODO, isCompleted: false })
                }
            />

            <GeneratePlanModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} onAddBatch={handleAddBatchTasks} />

            {/* Rotating Motivation */}
            <RotatingMotivation />
        </div>
    );
};

const motivations = [
    "⚡ Consistency is your real superpower.",
    "🧠 Discipline is remembering what you want.",
    "🔥 If you don’t sacrifice for your goals, your goals become the sacrifice.",
    "⏳ One hour of deep focus beats five hours of half-focus.",
    "🥶 No emotion, just execution.",
    "👁️ You said you’d become someone — prove it.",
    "📈 Small progress daily → Unstoppable in months.",
    "🔒 When you feel nothing, work anyway.",
    "🏁 Show up. That’s the whole game."
];

const RotatingMotivation: React.FC = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % motivations.length);
        }, 12000); // changes every 12 seconds (you can tune this)

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="text-center mt-12 text-gray-500 text-sm select-none fade-in">
            {motivations[index]}
        </div>
    );

};

export default TasksPage;
