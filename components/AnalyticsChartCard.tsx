
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsData } from '../types';

const data: AnalyticsData[] = [
  { name: 'Mon', currentWeek: 4, previousWeek: 2.4 },
  { name: 'Tue', currentWeek: 3, previousWeek: 1.3 },
  { name: 'Wed', currentWeek: 5, previousWeek: 3.8 },
  { name: 'Thu', currentWeek: 2.7, previousWeek: 3.9 },
  { name: 'Fri', currentWeek: 4.8, previousWeek: 4.8 },
  { name: 'Sat', currentWeek: 2.3, previousWeek: 3.8 },
  { name: 'Sun', currentWeek: 3.4, previousWeek: 4.3 },
];

const AnalyticsChartCard: React.FC = () => {
  return (
    <div className="bg-[#1C1C1E] border border-gray-800 rounded-2xl p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-white">Time Distribution</h3>
          <div className="flex items-center gap-1 text-xs text-green-400">
            <span>+5%</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
      </div>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} fontSize={12} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af' }} fontSize={12} axisLine={false} tickLine={false} />
            <Area type="monotone" dataKey="currentWeek" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCurrent)" strokeWidth={2} />
            <Area type="monotone" dataKey="previousWeek" stroke="#818CF8" fillOpacity={1} fill="url(#colorPrevious)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChartCard;