import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { TaskStatus } from '../types';

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

const AnalyticsChartCard: React.FC = () => {
  const tasks = useAppStore(state => state.tasks);

  const chartData = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekData: { name: string, minutes: number }[] = dayNames.map(name => ({ name, minutes: 0 }));

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const completedThisWeek = tasks.filter(task =>
      task.status === TaskStatus.DONE &&
      task.completedAt &&
      task.completedAt >= startOfWeek.getTime()
    );

    completedThisWeek.forEach(task => {
      if (task.duration && task.completedAt) {
        const completedDate = new Date(task.completedAt);
        const dayIndex = completedDate.getDay();
        const durationSeconds = parseDurationToSeconds(task.duration);
        weekData[dayIndex].minutes += durationSeconds / 60;
      }
    });

    const orderedWeekData = [...weekData.slice(1), weekData[0]].map(d => ({
      ...d,
      minutes: Math.round(d.minutes)
    }));

    return orderedWeekData;
  }, [tasks]);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 h-full flex flex-col">

      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-[var(--text)]">Weekly Focus Time</h3>
        <div className="text-xs text-[var(--subtle)]">
          {chartData.reduce((a, b) => a + b.minutes, 0)} min
        </div>
      </div>

      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <Tooltip
              formatter={(v) => `${v} min`}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "var(--text)" }}
            />

            <XAxis 
              dataKey="name" 
              tick={{ fill: "var(--subtle)" }} 
              fontSize={12} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fill: "var(--subtle)" }} 
              fontSize={12} 
              axisLine={false} 
              tickLine={false} 
            />

            <Area
              type="monotone"
              dataKey="minutes"
              stroke="var(--accent)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFocus)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChartCard;
