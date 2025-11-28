import React from 'react';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
    { name: 'Mon', tasks: 4 },
    { name: 'Tue', tasks: 7 },
    { name: 'Wed', tasks: 5 },
    { name: 'Thu', tasks: 9 },
    { name: 'Fri', tasks: 6 },
    { name: 'Sat', tasks: 3 },
    { name: 'Sun', tasks: 4 },
];

const TaskStats: React.FC = () => {
    return (
        <div className="bg-white rounded-[30px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Weekly Flow
                </h3>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50 px-2 py-1 rounded-md">Last 7 Days</span>
            </div>

            <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={24}>
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#1e293b',
                                color: '#fff',
                                padding: '4px 8px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ display: 'none' }}
                        />
                        <Bar dataKey="tasks" radius={[6, 6, 6, 6]}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.tasks >= 7 ? '#6366f1' : '#a5b4fc'}
                                    className="transition-all duration-300 hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TaskStats;
