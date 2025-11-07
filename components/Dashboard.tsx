import React, { useMemo } from 'react';
import AiCoachCard from './AiCoachCard';
import StatCard from './StatCard';
import AnalyticsChartCard from './AnalyticsChartCard';
import TaskList from './TaskList';
import { useAppStore } from "../store/useAppStore";
import { TaskStatus } from "../types";
const parseDurationToSeconds = (duration: string): number => {
  if (!duration) return 0;
  const num = parseInt(duration);
  if (duration.includes("hour")) return num * 3600;
  if (duration.includes("min")) return num * 60;
  return num;
};

const Dashboard: React.FC = () => {
    const tasks = useAppStore(state => state.tasks);

    // ---- Derived Stats ----
    const completedCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS);

    // Total Focus Time Today (just sums remainingTime or parsed duration)
    const focusSeconds = inProgress.reduce((acc, t) => {
        if (t.remainingTime != null) return acc + (parseDurationToSeconds(t.duration!) - t.remainingTime);
        if (t.elapsedTime != null) return acc + t.elapsedTime;
        if (!t.duration) return acc;
        const num = parseInt(t.duration);
        if (t.duration.includes("hour")) return acc + (num * 3600);
        if (t.duration.includes("min")) return acc + (num * 60);
        return acc + num;
    }, 0);

    const focusHours = (focusSeconds / 3600).toFixed(1);

    const efficiency = tasks.length > 0
        ? Math.round((completedCount / tasks.length) * 100) + "%"
        : "0%";

    const stats = [
        { label: 'Tasks Completed', value: completedCount.toString(), iconBgColor: 'bg-green-500' },
        { label: 'Focus Hours', value: `${focusHours}h`, iconBgColor: 'bg-blue-500' },
        { label: 'Efficiency', value: efficiency, iconBgColor: 'bg-orange-500' },
        { label: 'Habit Streak', value: '—', iconBgColor: 'bg-purple-500' }, // We'll implement streak later
    ];

    return (
        <div className="space-y-6">

            {/* Hero Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 min-w-0">
                    <AiCoachCard />
                </div>
                <div className="min-w-0">
                    <AnalyticsChartCard />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(stat => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            {/* Task List */}
            <div className="min-w-0">
                <TaskList />
            </div>

        </div>

    );
};

export default Dashboard;
