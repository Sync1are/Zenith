import React from 'react';
import AiCoachCard from './AiCoachCard';
import StatCard from './StatCard';
import AnalyticsChartCard from './AnalyticsChartCard';
import TaskList from './TaskList';
import { Stat } from '../types';

const Dashboard: React.FC = () => {
    const stats: Stat[] = [
        { label: 'Tasks Completed', value: '12', iconBgColor: 'bg-green-500' },
        { label: 'Focus Hours', value: '4.5h', iconBgColor: 'bg-blue-500' },
        { label: 'Efficiency', value: '87%', iconBgColor: 'bg-orange-500' },
        { label: 'Habit Streak', value: '21d', iconBgColor: 'bg-purple-500' },
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

            {/* Stats — Responsive Flow */}
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