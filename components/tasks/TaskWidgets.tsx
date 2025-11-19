import React, { useMemo, useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { useCalendarStore } from '../../store/useCalendarStore';

const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

export const DailyStatsWidget: React.FC = () => {
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

export const TodaysEvents: React.FC = () => {
    const events = useCalendarStore(state => state.events);
    const today = new Date();

    const todaysEvents = events
        .filter(event => {
            const eventDate = typeof event.start === 'string' ? new Date(event.start) : event.start;
            return isSameDay(eventDate, today);
        })
        .sort((a, b) => {
            const aStart = typeof a.start === 'string' ? new Date(a.start) : a.start;
            const bStart = typeof b.start === 'string' ? new Date(b.start) : b.start;
            return aStart.getTime() - bStart.getTime();
        });

    const categoryColors: Record<string, string> = {
        work: 'bg-blue-500',
        personal: 'bg-green-500',
        meeting: 'bg-purple-500',
    };

    if (todaysEvents.length === 0) {
        return (
            <div className="bg-[#1C1C1E] border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📅 Today's Events</h3>
                <p className="text-gray-500 text-center py-8">No events scheduled today</p>
            </div>
        );
    }

    return (
        <div className="bg-[#1C1C1E] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📅 Today's Events</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
                {todaysEvents.map(event => {
                    const start = typeof event.start === 'string' ? new Date(event.start) : event.start;
                    const end = typeof event.end === 'string' ? new Date(event.end) : event.end;

                    return (
                        <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition">
                            <div className={`w-2 h-10 rounded-full ${categoryColors[event.category] || 'bg-gray-500'} flex-shrink-0`}></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{event.title}</p>
                                <p className="text-gray-400 text-xs">{formatTime(start)} - {formatTime(end)}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded-full flex-shrink-0 ${event.category === 'work' ? 'bg-blue-500/20 text-blue-400' :
                                event.category === 'personal' ? 'bg-green-500/20 text-green-400' :
                                    'bg-purple-500/20 text-purple-400'
                                }`}>
                                {event.category}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const QuickTemplates: React.FC = () => {
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
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${template.priority === TaskPriority.HIGH ? 'bg-red-500/20 text-red-400' :
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

export const CategoryBreakdown: React.FC = () => {
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
                                className="bg-gradient-to-r from-orange-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
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

export const RotatingMotivation: React.FC = () => {
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
