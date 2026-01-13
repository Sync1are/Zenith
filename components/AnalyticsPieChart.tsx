import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TaskStatus } from '../types';

const CATEGORY_COLORS = ['#8B5CF6', '#F97316', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6'];
const categoryColorMap: { [key: string]: string } = {};
let colorIndex = 0;

const getCategoryColor = (category: string) => {
    if (!categoryColorMap[category]) {
        categoryColorMap[category] = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
        colorIndex++;
    }
    return categoryColorMap[category];
};

const AnalyticsPieChart: React.FC = () => {
    const tasks = useAppStore(state => state.tasks);
    const completedTasks = useMemo(() => tasks.filter(t => t.status === TaskStatus.Done), [tasks]);

    const { productivityData, totalFocusHours } = useMemo(() => {
        const categoryTimes: { [key: string]: number } = {};
        completedTasks.forEach(task => {
            const seconds = (task.timeSpentMinutes || task.estimatedTimeMinutes || 0) * 60;
            categoryTimes[task.category] = (categoryTimes[task.category] || 0) + seconds;
        });

        const totalSeconds = Object.values(categoryTimes).reduce((sum, s) => sum + s, 0);
        const totalHours = totalSeconds / 3600;

        const data = Object.entries(categoryTimes).map(([category, seconds]) => ({
            label: category,
            value: totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0,
            color: getCategoryColor(category),
        })).sort((a, b) => b.value - a.value);

        return { productivityData: data, totalFocusHours: totalHours };
    }, [completedTasks]);

    const radius = 85; // Increased size
    const circumference = 2 * Math.PI * radius;
    let accumulatedPct = 0;

    // Get recent completions
    const recentCompletions = useMemo(() => {
        return [...completedTasks]
            .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
            .slice(0, 3);
    }, [completedTasks]);

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl h-full flex flex-col shadow-xl relative overflow-hidden group">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <h2 className="text-lg font-bold text-white">Focus Distribution</h2>
                <div className="text-xs font-medium text-white/40 bg-white/5 px-2 py-1 rounded-lg">
                    Last 7 Days
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 relative z-10">
                {/* Left Side: Chart + Legend */}
                <div className="col-span-7 flex items-center gap-6">
                    {/* Radial SVG */}
                    <div className="relative w-40 h-40 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                            {/* Background circle */}
                            <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="none"
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="16"
                            />

                            {/* Segments */}
                            {productivityData.map((item) => {
                                const pct = item.value;
                                const segmentLength = (pct / 100) * circumference;
                                const offset = - (accumulatedPct / 100) * circumference;
                                accumulatedPct += pct;

                                return (
                                    <circle
                                        key={item.label}
                                        cx="100"
                                        cy="100"
                                        r={radius}
                                        fill="none"
                                        stroke={item.color}
                                        strokeWidth="16"
                                        strokeDasharray={`${segmentLength} ${circumference}`}
                                        strokeDashoffset={offset}
                                        className="transition-all duration-700"
                                        strokeLinecap="round"
                                        style={{
                                            filter: `drop-shadow(0 0 4px ${item.color}60)`
                                        }}
                                    />
                                );
                            })}
                        </svg>

                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{totalFocusHours.toFixed(1)}</span>
                            <span className="text-[10px] text-white/50 uppercase tracking-wider">hrs</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                        {productivityData.slice(0, 3).map((item) => (
                            <div key={item.label} className="flex items-center gap-2 group/item">
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{
                                        backgroundColor: item.color,
                                        boxShadow: `0 0 6px ${item.color}60`
                                    }}
                                />
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="text-white/80 text-xs font-medium truncate">{item.label}</span>
                                    </div>
                                    <div className="text-white/40 text-[10px]">{item.value.toFixed(0)}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Recent Activity */}
                <div className="col-span-5 border-l border-white/10 pl-6 flex flex-col">
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Recent Activity</h3>
                    <div className="flex-1 space-y-3">
                        {recentCompletions.length > 0 ? (
                            recentCompletions.map((task) => (
                                <div key={task.id} className="group/task">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-white/90 text-xs font-medium truncate max-w-[120px]" title={task.title}>
                                            {task.title}
                                        </span>
                                        <span className="text-white/30 text-[10px]">
                                            {Math.round(task.timeSpentMinutes || task.estimatedTimeMinutes || 0)}m
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-green-500/50 group-hover/task:bg-green-500 transition-colors"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex items-center justify-center text-white/20 text-xs text-center">
                                No recent activity
                            </div>
                        )}
                    </div>

                    {/* Mini Stat */}
                    <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center">
                        <span className="text-white/40 text-[10px]">Efficiency</span>
                        <span className="text-green-400 text-xs font-bold">
                            {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPieChart;


