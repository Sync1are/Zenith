import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Task, Priority, TaskStatus } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ===============================
// Background Particle Animation
// ===============================
const ParticleBackground: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();

    const particles: Array<{ x: number; y: number; r: number; dx: number; dy: number; o: number }> = [];
    const count = 50;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (Math.random() * 2 + 1) * DPR,
        dx: (Math.random() - 0.5) * 0.3 * DPR,
        dy: (Math.random() - 0.5) * 0.3 * DPR,
        o: Math.random() * 0.5 + 0.2,
      });
    }

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.o})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-20" />;
};

// ===============================
// Helper Functions
// ===============================


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

const CATEGORY_COLORS = ['#8B5CF6', '#F97316', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6'];
const categoryColorMap: { [key: string]: string } = {};
let colorIndex = 0;
const getCategoryColor = (category: string) => {
  if (!categoryColorMap[category]) {
    categoryColorMap[category] = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
    colorIndex++;
  }
  return categoryColorMap[category];
};

// ===============================
// KPI Card Component
// ===============================
interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  gradient: string;
  icon: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, changeType, gradient, icon }) => {
  const isIncrease = changeType === 'increase';

  // Determine animation class based on icon
  const getIconAnimation = () => {
    if (icon === '⏱') return 'group-hover:animate-spin-once';
    if (icon === '🔥') return 'group-hover:animate-shake';
    if (icon === '✓') return 'group-hover:animate-bounce-once';
    return '';
  };

  return (
    <div className="glass-panel p-6 rounded-2xl hover:scale-[1.02] transition-transform duration-300 group relative overflow-hidden">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/50 text-sm uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-4xl font-black text-white">{value}</h3>
          </div>
          <div className={`text-4xl opacity-30 group-hover:opacity-50 transition-opacity ${getIconAnimation()}`}>
            {icon}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${isIncrease ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
            {isIncrease ? '↗' : '↘'} {change}
          </span>
          <span className="text-white/40 text-xs">vs last month</span>
        </div>
      </div>
    </div>
  );
};

// ===============================
// Weekly Focus Time Chart
// ===============================
const WeeklyFocusChart: React.FC = () => {
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
    </div>
  );
};

// ===============================
// Enhanced Bar Chart  
// ===============================
interface BarChartProps {
  data: { label: string; value: number }[];
}

const EnhancedBarChart: React.FC<BarChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h2 className="text-xl font-bold text-white mb-6">Daily Completions (Last 7 Days)</h2>

      <div className="flex items-end justify-around gap-3 h-64">
        {data.map((d, idx) => {
          const height = (d.value / maxValue) * 100;
          return (
            <div key={d.label} className="flex flex-col items-center flex-1 h-full group">
              <div className="w-full h-full flex items-end justify-center">
                <div
                  className="w-full rounded-t-xl relative overflow-hidden transition-all duration-500 hover:scale-105"
                  style={{
                    height: `${height}%`,
                    background: 'rgba(139, 92, 246, 0.8)',
                    boxShadow: height > 0 ? '0 0 20px rgba(139, 92, 246, 0.4)' : 'none'
                  }}
                >
                  {/* Glow effect */}
                  {height > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                  )}

                  {/* Value label */}
                  {d.value > 0 && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.value}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-white/60 mt-3 font-medium">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===============================
// Radial Progress Chart
// ===============================
interface RadialChartProps {
  data: { label: string; value: number; color: string }[];
  totalHours: number;
}

const RadialProgressChart: React.FC<RadialChartProps> = ({ data, totalHours }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPct = 0;

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
      <h2 className="text-xl font-bold text-white mb-6">Time Allocation</h2>

      <div className="flex-1 flex items-center justify-center gap-8 flex-wrap">
        {/* Radial SVG */}
        <div className="relative w-56 h-56">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="20"
            />

            {/* Segments */}
            {data.map((item, idx) => {
              const pct = item.value;
              const segmentLength = (pct / 100) * circumference;
              const offset = circumference - (accumulatedPct / 100) * circumference;
              accumulatedPct += pct;

              return (
                <circle
                  key={item.label}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={`${segmentLength} ${circumference}`}
                  strokeDashoffset={offset}
                  className="transition-all duration-700"
                  style={{
                    filter: `drop-shadow(0 0 8px ${item.color}90)`
                  }}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-white">{totalHours.toFixed(1)}</span>
            <span className="text-sm text-white/50 uppercase tracking-wider">hours</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {data.map((item) => (
            <div key={item.label} className="flex items-center gap-3 group hover:scale-105 transition-transform">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 12px ${item.color}80`
                }}
              />
              <span className="text-white/70 text-sm min-w-[100px]">{item.label}</span>
              <span className="text-white font-bold text-sm">{item.value.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ===============================
// Recent Activity
// ===============================
interface RecentActivityProps {
  tasks: Task[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ tasks }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
      <h2 className="text-xl font-bold text-white mb-6">Recent Completions</h2>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all group"
            style={{
              animation: `slideIn 0.3s ease-out ${idx * 0.1}s both`
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className="text-green-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-white font-medium text-sm truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: getCategoryColor(task.category),
                        boxShadow: `0 0 6px ${getCategoryColor(task.category)}`
                      }}
                    />
                    <span className="text-white/50 text-xs">{task.category}</span>
                  </div>
                </div>
              </div>
              <span className="text-white/40 font-mono text-sm whitespace-nowrap">
                {task.timeSpentMinutes ? `${Math.round(task.timeSpentMinutes)}m` : `${task.estimatedTimeMinutes}m`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===============================
// Main Analytics Page
// ===============================
const AnalyticsPage: React.FC = () => {
  const tasks = useAppStore(state => state.tasks);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === TaskStatus.Done && t.completedAt), [tasks]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const tasksThisMonth = completedTasks.filter(t => t.completedAt! >= firstDayCurrentMonth.getTime());
    const tasksLastMonth = completedTasks.filter(t => t.completedAt! >= firstDayLastMonth.getTime() && t.completedAt! < firstDayCurrentMonth.getTime());

    const completedThisMonthCount = tasksThisMonth.length;
    const completedLastMonthCount = tasksLastMonth.length;
    const completedChange = calculateChange(completedThisMonthCount, completedLastMonthCount);

    const focusHoursThisMonth = tasksThisMonth.reduce((sum, t) => sum + (t.timeSpentMinutes || t.estimatedTimeMinutes || 0), 0) / 60;
    const focusHoursLastMonth = tasksLastMonth.reduce((sum, t) => sum + (t.timeSpentMinutes || t.estimatedTimeMinutes || 0), 0) / 60;
    const focusChange = calculateChange(focusHoursThisMonth, focusHoursLastMonth);

    const highPriorityThisMonth = tasksThisMonth.filter(t => t.priority === Priority.High).length;
    const highPriorityLastMonth = tasksLastMonth.filter(t => t.priority === Priority.High).length;
    const priorityChange = calculateChange(highPriorityThisMonth, highPriorityLastMonth);

    return [
      {
        title: 'Completed Tasks',
        value: completedThisMonthCount.toString(),
        ...completedChange,
        gradient: 'from-violet-500 to-purple-600',
        icon: '✓'
      },
      {
        title: 'Focus Hours',
        value: `${focusHoursThisMonth.toFixed(1)}h`,
        ...focusChange,
        gradient: 'from-orange-500 to-red-500',
        icon: '⏱'
      },
      {
        title: 'High Priority',
        value: highPriorityThisMonth.toString(),
        ...priorityChange,
        gradient: 'from-pink-500 to-rose-600',
        icon: '🔥'
      },
    ];
  }, [completedTasks]);

  // Chart Data
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

  // Productivity Data
  const { productivityData, totalFocusHours } = useMemo(() => {
    const categoryTimes: { [key: string]: number } = {};
    completedTasks.forEach(task => {
      const seconds = (task.timeSpentMinutes || task.estimatedTimeMinutes || 0) * 60;
      categoryTimes[task.category] = (categoryTimes[task.category] || 0) + seconds;
    });

    const totalSeconds = Object.values(categoryTimes).reduce((sum, s) => sum + s, 0);
    const totalHours = totalSeconds / 3600;

    const data = Object.entries(categoryTimes).map(([category, seconds]) => ({
      label: category,
      value: totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0,
      color: getCategoryColor(category),
    })).sort((a, b) => b.value - a.value);

    return { productivityData: data, totalFocusHours: totalHours };
  }, [completedTasks]);

  const recentCompletedTasks = useMemo(() => {
    return [...completedTasks].sort((a, b) => b.completedAt! - a.completedAt!).slice(0, 6);
  }, [completedTasks]);

  // Empty State
  if (completedTasks.length === 0) {
    return (
      <div className="relative h-full w-full overflow-hidden p-8">
        <ParticleBackground />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center glass-panel p-12 rounded-3xl max-w-2xl mx-auto">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-3xl font-black text-white mb-4">No Data Yet</h2>
          <p className="text-white/60 text-lg max-w-md">
            Complete some tasks to unlock your productivity insights. Your analytics journey begins with your first completed task! 🚀
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden p-6 pb-12">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(249,115,22,0.1),transparent_50%)]" />
        <div className="absolute inset-[-100px] opacity-20 animate-spin-slow bg-[conic-gradient(from_0deg,transparent,rgba(139,92,246,0.15),transparent)]" />
      </div>
      <ParticleBackground />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Analytics</h1>
          <p className="text-white/50">Track your productivity and focus patterns</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kpiData.map(kpi => (
            <KPICard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnhancedBarChart data={chartData} />
          <WeeklyFocusChart />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <RadialProgressChart data={productivityData} totalHours={totalFocusHours} />
          </div>
          <div className="lg:col-span-3">
            <RecentActivity tasks={recentCompletedTasks} />
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
                .glass-panel {
                    background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
                    backdrop-filter: blur(12px) saturate(1.1);
                    border: 1px solid rgba(255,255,255,0.10);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow { animation: spin-slow 30s linear infinite; }

                /* Icon Animations */
                @keyframes spin-once {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-once { animation: spin-once 0.6s ease-in-out; }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(2px); }
                }
                .animate-shake { animation: shake 0.5s ease-in-out; }

                @keyframes bounce-once {
                    0%, 100% { transform: translateY(0); }
                    25% { transform: translateY(-8px); }
                    50% { transform: translateY(0); }
                    75% { transform: translateY(-4px); }
                }
                .animate-bounce-once { animation: bounce-once 0.6s ease-in-out; }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
    </div>
  );
};

export default AnalyticsPage;
