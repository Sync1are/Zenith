import React, { useMemo, useState, useEffect } from 'react';
import AiCoachCard from './AiCoachCard';
import StatCard from './StatCard';
import AnalyticsChartCard from './AnalyticsChartCard';
import TaskList from './TaskList';
import SmartHomeCard from './SmartHomeCard';
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
        { label: 'Focus Hours', value: `${focusHours} h`, iconBgColor: 'bg-blue-500' },
        { label: 'Efficiency', value: efficiency, iconBgColor: 'bg-orange-500' },
        { label: 'Habit Streak', value: '—', iconBgColor: 'bg-purple-500' }, // We'll implement streak later
    ];

    return (
        <div className="flex gap-6 h-full">
            {/* Left Column - Smart Home Card */}
            <div className="flex-shrink-0 w-[28rem] flex flex-col">
                <SmartHomeCard />
            </div>

            {/* Right Column - Dashboard Widgets */}
            <div className="flex-1 space-y-6 overflow-y-auto">
                {/* Top Row - AI Coach + Analytics Chart (50/50) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                        <AiCoachCard />
                    </div>
                    <div className="min-w-0">
                        <AnalyticsChartCard />
                    </div>
                </div>

                {/* Stats Grid - 2x2 */}
                <div className="grid grid-cols-2 gap-4">
                    {stats.map(stat => (
                        <StatCard key={stat.label} {...stat} />
                    ))}
                </div>

                {/* Task List */}
                <div className="min-w-0">
                    <TaskList />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
