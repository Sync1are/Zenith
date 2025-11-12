import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../store/useAppStore';

const AnalyticsChartCard: React.FC = () => {
  const sessionHistory = useAppStore(state => state.sessionHistory);

  // Fallback placeholder if no real data yet
  const chartData = sessionHistory.length > 0
    ? sessionHistory
    : [
        { name: "Mon", minutes: 0 },
        { name: "Tue", minutes: 0 },
        { name: "Wed", minutes: 0 },
        { name: "Thu", minutes: 0 },
        { name: "Fri", minutes: 0 },
        { name: "Sat", minutes: 0 },
        { name: "Sun", minutes: 0 },
      ];

  return (
    <div className="bg-[#1C1C1E] border border-gray-800 rounded-2xl p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-white">Weekly Focus Time</h3>
        <div className="text-xs text-gray-400">{chartData.reduce((a,b)=>a+b.minutes,0)} min</div>
      </div>

      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <Tooltip
              formatter={(v) => `${v} min`}
              contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#cbd5e1' }}
            />

            <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} fontSize={12} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af' }} fontSize={12} axisLine={false} tickLine={false} />

            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#8b5cf6"
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
