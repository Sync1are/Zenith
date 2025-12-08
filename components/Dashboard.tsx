import React, { useMemo, useState, useEffect } from 'react';
import AnalyticsPieChart from './AnalyticsPieChart';
import StatCard from './StatCard';
import AnalyticsChartCard from './AnalyticsChartCard';
import TaskList from './TaskList';
import SmartHomeCard from './SmartHomeCard';
import { useAppStore } from "../store/useAppStore";
import { TaskStatus } from "../types";
import { Minimize2 } from 'lucide-react';


const Dashboard: React.FC = () => {
    const tasks = useAppStore(state => state.tasks);
    const setCompactMode = useAppStore(state => state.setCompactMode);

    // ---- Derived Stats ----
    const completedCount = tasks.filter(t => t.status === TaskStatus.Done).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.InProgress);


    // Total Focus Time Today (just sums remainingTime or parsed duration)
    const focusSeconds = inProgress.reduce((acc, t) => {
        const totalSeconds = t.estimatedTimeMinutes * 60;

        if (t.remainingTime !== undefined) {
            return acc + Math.max(0, totalSeconds - t.remainingTime);
        }

        if (t.timeSpentMinutes) {
            return acc + (t.timeSpentMinutes * 60);
        }

        return acc;
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

    const handleCompactMode = () => {
        if (window.electronAPI?.setCompactMode) {
            window.electronAPI.setCompactMode();
        }
        setCompactMode(true);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full relative">
            {/* Compact Mode Button */}
            <button
                onClick={handleCompactMode}
                className="absolute top-0 right-0 z-10 flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white text-sm font-medium transition-all"
            >
                <Minimize2 className="w-4 h-4" />
                Compact
            </button>

            {/* Left Column - Smart Home Card */}
            <div className="flex-shrink-0 w-full lg:w-80 xl:w-96 2xl:w-[28rem] flex flex-col">
                <SmartHomeCard />
            </div>

            {/* Right Column - Dashboard Widgets */}
            <div className="flex-1 space-y-6 overflow-y-auto">
                {/* Top Row - AI Coach + Analytics Chart (50/50) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="min-w-0">
                        <AnalyticsPieChart />
                    </div>
                    <div className="min-w-0">
                        <AnalyticsChartCard />
                    </div>
                </div>

                {/* Stats Grid - 2x2 */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4">
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

