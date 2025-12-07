import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Task, TaskStatus } from '../types';

interface TaskHeatmapProps {
    tasks: Task[];
    onDateClick?: (date: Date) => void;
}

export const TaskHeatmap: React.FC<TaskHeatmapProps> = ({ tasks, onDateClick }) => {
    const [hoveredDay, setHoveredDay] = React.useState<{ date: Date; stats: { created: number; completed: number; pending: number }; x: number; y: number } | null>(null);

    // Generate last 12 weeks (reduced to fit)
    const heatmapData = useMemo(() => {
        const weeks = [];
        const today = new Date();
        // Align to the end of the current week (Saturday)
        const dayOfWeek = today.getDay(); // 0 = Sun, 6 = Sat
        const endOffset = 6 - dayOfWeek;
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + endOffset);

        // Generate 12 weeks back
        for (let w = 11; w >= 0; w--) {
            const weekDays = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(endDate);
                date.setDate(endDate.getDate() - (w * 7) - (6 - d));
                const dateStr = date.toISOString().split('T')[0];
                weekDays.push({ dateStr, date });
            }
            weeks.push(weekDays);
        }
        return weeks;
    }, []);

    // Calculate stats per day
    const statsPerDay = useMemo(() => {
        const stats: Record<string, { created: number; completed: number; pending: number }> = {};

        tasks.forEach(task => {
            // Created & Pending
            if (task.createdAt) {
                const createdDate = new Date(task.createdAt);
                // Validate the date is valid before calling toISOString()
                if (!isNaN(createdDate.getTime())) {
                    createdDate.setHours(0, 0, 0, 0);
                    const createdStr = createdDate.toISOString().split('T')[0];

                    if (!stats[createdStr]) stats[createdStr] = { created: 0, completed: 0, pending: 0 };
                    stats[createdStr].created++;

                    if (task.status !== TaskStatus.Done) {
                        stats[createdStr].pending++;
                    }
                }
            }

            // Completed
            if (task.status === TaskStatus.Done && task.completedAt) {
                const completedDate = new Date(task.completedAt);
                // Validate the date is valid before calling toISOString()
                if (!isNaN(completedDate.getTime())) {
                    completedDate.setHours(0, 0, 0, 0);
                    const completedStr = completedDate.toISOString().split('T')[0];

                    if (!stats[completedStr]) stats[completedStr] = { created: 0, completed: 0, pending: 0 };
                    stats[completedStr].completed++;
                }
            }
        });
        return stats;
    }, [tasks]);

    // Determine max completions for intensity scaling
    const maxCompletions = useMemo(() => {
        const values = Object.values(statsPerDay).map(s => s.completed);
        return values.length > 0 ? Math.max(...values) : 1;
    }, [statsPerDay]);

    const getIntensityColor = (count: number) => {
        if (count === 0) return 'bg-white/5 hover:bg-white/10';
        const intensity = Math.ceil((count / maxCompletions) * 4);
        switch (intensity) {
            case 1: return 'bg-blue-500/30 shadow-[0_0_4px_rgba(59,130,246,0.2)]';
            case 2: return 'bg-blue-500/50 shadow-[0_0_6px_rgba(59,130,246,0.3)]';
            case 3: return 'bg-blue-500/70 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
            case 4: return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
            default: return 'bg-blue-500/30';
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Activity</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-white/5" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-500/30" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-500/70" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-500" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="flex items-center justify-center overflow-hidden">
                <div className="flex gap-[3px]">
                    {heatmapData.map((week, wIndex) => (
                        <div key={wIndex} className="flex flex-col gap-[3px]">
                            {week.map((day) => {
                                const stats = statsPerDay[day.dateStr] || { created: 0, completed: 0, pending: 0 };
                                const isFuture = day.date > new Date();
                                return (
                                    <div
                                        key={day.dateStr}
                                        onClick={() => !isFuture && onDateClick?.(day.date)}
                                        onMouseEnter={(e) => {
                                            if (!isFuture) {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setHoveredDay({
                                                    date: day.date,
                                                    stats,
                                                    x: rect.left + rect.width / 2,
                                                    y: rect.top
                                                });
                                            }
                                        }}
                                        onMouseLeave={() => setHoveredDay(null)}
                                        className={`
                                            w-3 h-3 rounded-[2px] transition-all duration-300 cursor-pointer
                                            ${isFuture ? 'opacity-0 pointer-events-none' : getIntensityColor(stats.completed)}
                                        `}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Tooltip Portal */}
            {hoveredDay && createPortal(
                <div
                    className="fixed z-[9999] bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-10px] animate-in fade-in zoom-in-95 duration-150"
                    style={{ left: hoveredDay.x, top: hoveredDay.y }}
                >
                    <p className="text-xs font-bold text-white mb-2 pb-1 border-b border-white/10">
                        {hoveredDay.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between gap-4 text-blue-300">
                            <span>Created</span>
                            <span className="font-bold">{hoveredDay.stats.created}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-green-300">
                            <span>Completed</span>
                            <span className="font-bold">{hoveredDay.stats.completed}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-yellow-300">
                            <span>Pending</span>
                            <span className="font-bold">{hoveredDay.stats.pending}</span>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
