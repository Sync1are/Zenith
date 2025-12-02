import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TaskStatus } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AnalyticsChartCard: React.FC = () => {
  const tasks = useAppStore(state => state.tasks);

  const chartData = useMemo(() => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekData: { name: string, minutes: number }[] = dayNames.map(name => ({ name, minutes: 0 }));

    const today = new Date();
    // Calculate start of week (Monday)
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const completedThisWeek = tasks.filter(task =>
      task.status === TaskStatus.Done &&
      task.completedAt &&
      task.completedAt >= startOfWeek.getTime()
    );

    completedThisWeek.forEach(task => {
      if (task.timeSpentMinutes || task.estimatedTimeMinutes) {
        const completedDate = new Date(task.completedAt!);
        const dayIndex = completedDate.getDay();
        // Use timeSpentMinutes if available (actual), otherwise estimated
        const durationMinutes = task.timeSpentMinutes || task.estimatedTimeMinutes || 0;

        // Adjust index: Sunday is 0, but we want Mon-Sun order
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        if (adjustedIndex >= 0 && adjustedIndex < 7) {
          weekData[adjustedIndex].minutes += durationMinutes;
        }
      }
    });

    return weekData.map(d => ({
      ...d,
      minutes: Math.round(d.minutes)
    }));
  }, [tasks]);

  const totalMinutes = chartData.reduce((a, b) => a + b.minutes, 0);

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Weekly Focus Time</h2>
        <div className="text-sm font-bold text-white/60">
          {totalMinutes} min total
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <Tooltip
              formatter={(v) => `${v} min`}
              contentStyle={{
                background: 'rgba(28, 28, 30, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
                backdropFilter: 'blur(10px)',
                color: '#fff'
              }}
              labelStyle={{ color: '#fff' }}
            />

            <XAxis
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.5)' }}
              fontSize={12}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.5)' }}
              fontSize={12}
              axisLine={false}
              tickLine={false}
            />

            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#8B5CF6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorFocus)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <style>{`
        .glass-panel {
            background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
            backdrop-filter: blur(12px) saturate(1.1);
            border: 1px solid rgba(255,255,255,0.10);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default AnalyticsChartCard;
