import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Task, TaskPriority, TaskStatus } from '../types';

// Types
export type KpiData = {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
};

export type ProductivityData = {
  label: string;
  value: number;
  color: string;
};

// Icons
const CheckBadgeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--subtle)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

const ClockIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--subtle)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FireIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--subtle)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12.5l3 3" />
  </svg>
);

const CheckCircleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

// --- Helper Functions ---
const parseDurationToSeconds = (duration: string | undefined): number => {
    if (!duration) return 0;
    let totalSeconds = 0;
    const hourMatch = duration.match(/(\d+)\s*hours?/);
    const minMatch = duration.match(/(\d+)\s*min/);
    if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
    if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
    if (totalSeconds === 0) {
        const num = parseInt(duration);
        if (!isNaN(num)) {
            if (duration.includes("hour")) return num * 3600;
            if (duration.includes("min")) return num * 60;
        }
    }
    return totalSeconds;
};

const calculateChange = (current: number, previous: number): { change: string, changeType: 'increase' | 'decrease' } => {
    if (previous === 0) {
        return current > 0 ? { change: '100%', changeType: 'increase' } : { change: '0%', changeType: 'increase' };
    }
    const diff = ((current - previous) / previous) * 100;
    return {
        change: `${Math.abs(diff).toFixed(1)}%`,
        changeType: diff >= 0 ? 'increase' : 'decrease',
    };
};

const CATEGORY_COLORS = ['#6B5AFA', '#3696F8', '#F47456', '#58B878', '#FACC15', '#EC4899', '#22D3EE'];
const categoryColorMap: { [key: string]: string } = {};
let colorIndex = 0;
const getCategoryColor = (category: string) => {
    if (!categoryColorMap[category]) {
        categoryColorMap[category] = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
        colorIndex++;
    }
    return categoryColorMap[category];
};

// --- Child Components ---
const KPICard: React.FC<KpiData> = ({ title, value, change, changeType, icon }) => {
  const isIncrease = changeType === 'increase';
  const changeColor = isIncrease ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[var(--subtle)]">{title}</span>
        <div className="text-[var(--subtle)]">{icon}</div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-[var(--text)] mb-1">{value}</h3>
        <div className="flex items-center gap-1 text-sm">
          <span className={changeColor}>{isIncrease ? '▲' : '▼'} {change}</span>
          <span className="text-[var(--subtle)]">vs last month</span>
        </div>
      </div>
    </div>
  );
};

const ProductivityDoughnutChart: React.FC<{ data: ProductivityData[]; totalHours: number }> = ({ data, totalHours }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let accPct = 0;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-[var(--text)] mb-4">Time Allocation</h2>

      <div className="flex-grow flex items-center justify-center flex-wrap gap-6">
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--border)" strokeWidth="20" />

            {data.map(item => {
              const pct = (item.value / total) * 100;
              const dash = (pct / 100) * circumference;
              const offset = circumference - (accPct / 100) * circumference;
              accPct += pct;
              return (
                <circle
                  key={item.label}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset={offset}
                  transform="rotate(-90 100 100)"
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[var(--text)]">{totalHours.toFixed(1)}</span>
            <span className="text-sm text-[var(--subtle)]">hours</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {data.map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-[var(--subtle)]">{item.label}</span>
              <span className="text-sm font-semibold text-[var(--text)] ml-auto">{item.value.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RecentTasks: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-[var(--text)] mb-4">Recent Activity</h2>

      <div className="flex-grow space-y-3 pr-2 -mr-2 overflow-y-auto">
        {tasks.map(task => (
          <div key={task.id} className="bg-[var(--bg)]/30 border border-[var(--border)] p-3 rounded-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="text-[var(--accent)] flex-shrink-0"><CheckCircleIcon /></div>
              <div className="overflow-hidden">
                <p className="text-[var(--text)] font-medium text-sm truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(task.category) }} />
                  <span className="text-[var(--subtle)] text-xs">{task.category}</span>
                </div>
              </div>
            </div>

            <span className="text-[var(--subtle)] font-mono text-sm whitespace-nowrap">{task.duration}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// MAIN PAGE
const AnalyticsPage: React.FC = () => {
    const tasks = useAppStore(state => state.tasks);
    const completedTasks = useMemo(() => tasks.filter(t => t.status === TaskStatus.DONE && t.completedAt), [tasks]);

    const kpiData = useMemo<KpiData[]>(() => {
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const tasksThisMonth = completedTasks.filter(t => t.completedAt! >= firstDayCurrentMonth.getTime());
        const tasksLastMonth = completedTasks.filter(t => t.completedAt! >= firstDayLastMonth.getTime() && t.completedAt! < firstDayCurrentMonth.getTime());

        const completedThisMonthCount = tasksThisMonth.length;
        const completedLastMonthCount = tasksLastMonth.length;
        const completedChange = calculateChange(completedThisMonthCount, completedLastMonthCount);

        const focusHoursThisMonth = tasksThisMonth.reduce((sum, t) => sum + parseDurationToSeconds(t.duration), 0) / 3600;
        const focusHoursLastMonth = tasksLastMonth.reduce((sum, t) => sum + parseDurationToSeconds(t.duration), 0) / 3600;
        const focusChange = calculateChange(focusHoursThisMonth, focusHoursLastMonth);

        const highPriorityThisMonth = tasksThisMonth.filter(t => t.priority === TaskPriority.HIGH).length;
        const highPriorityLastMonth = tasksLastMonth.filter(t => t.priority === TaskPriority.HIGH).length;
        const priorityChange = calculateChange(highPriorityThisMonth, highPriorityLastMonth);

        return [
            { title: 'Completed Tasks', value: completedThisMonthCount.toString(), ...completedChange, icon: <CheckBadgeIcon /> },
            { title: 'Focus Hours', value: `${focusHoursThisMonth.toFixed(1)}h`, ...focusChange, icon: <ClockIcon /> },
            { title: 'High Priority Done', value: highPriorityThisMonth.toString(), ...priorityChange, icon: <FireIcon /> },
        ];
    }, [completedTasks]);

    const chartData = useMemo(() => {
        const days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d;
        }).reverse();

        return days.map(day => {
            const count = completedTasks.filter(t => {
                const completedDate = new Date(t.completedAt!);
                return completedDate.getDate() === day.getDate() &&
                       completedDate.getMonth() === day.getMonth() &&
                       completedDate.getFullYear() === day.getFullYear();
            }).length;
            return {
                label: day.toLocaleDateString('en-US', { weekday: 'short' }),
                value: count,
            };
        });
    }, [completedTasks]);

    const maxChartValue = useMemo(() => Math.max(...chartData.map(d => d.value), 1), [chartData]);
    
    const { productivityData, totalFocusHours } = useMemo(() => {
        const categoryTimes: { [key: string]: number } = {};
        completedTasks.forEach(task => {
            const seconds = parseDurationToSeconds(task.duration);
            categoryTimes[task.category] = (categoryTimes[task.category] || 0) + seconds;
        });

        const totalSeconds = Object.values(categoryTimes).reduce((sum, s) => sum + s, 0);
        const totalHours = totalSeconds / 3600;

        const data = Object.entries(categoryTimes).map(([category, seconds]) => ({
            label: category,
            value: totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0,
            color: getCategoryColor(category),
        })).sort((a,b) => b.value - a.value);

        return { productivityData: data, totalFocusHours: totalHours };
    }, [completedTasks]);

    const recentCompletedTasks = useMemo(() => {
        return [...completedTasks].sort((a, b) => b.completedAt! - a.completedAt!).slice(0, 5);
    }, [completedTasks]);
    
    if (completedTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[var(--card)] rounded-2xl border border-[var(--border)]">
                <h2 className="text-2xl font-bold text-[var(--text)] mb-2">No Analytics Data Yet</h2>
                <p className="text-[var(--subtle)] max-w-md">
                    Complete some tasks to see your productivity analytics here. Your journey to peak performance starts now! 🚀
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpiData.map(kpi => (
                    <KPICard key={kpi.title} {...kpi} />
                ))}
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col min-h-[300px]">
                <h2 className="text-xl font-semibold text-[var(--text)] mb-4">Daily Completions (Last 7 Days)</h2>

                <div className="flex-1 flex items-end justify-around gap-2">
                    {chartData.map((d) => (
                        <div key={d.label} className="flex flex-col items-center flex-1 h-full">
                            <div className="w-full h-full flex items-end justify-center">
                                <div
                                    className="w-3/4 rounded-t-md transition-all duration-500 ease-in-out bg-[var(--accent)]"
                                    style={{ height: `${(d.value / maxChartValue) * 100}%` }}
                                    title={`${d.label}: ${d.value} tasks`}
                                />
                            </div>
                            <span className="text-xs text-[var(--subtle)] mt-2">{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                    <ProductivityDoughnutChart data={productivityData} totalHours={totalFocusHours} />
                </div>

                <div className="lg:col-span-3">
                    <RecentTasks tasks={recentCompletedTasks} />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
