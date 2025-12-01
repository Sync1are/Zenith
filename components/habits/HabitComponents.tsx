import React, { useState, useEffect } from 'react';
import { Check, Trash2, Plus, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { generateRoutine } from '../../services/geminiService';
import { Habit, CompletionLog, DayColumn } from '../../types';

// ==========================================
// Component: AnimatedCounter
// ==========================================

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
    const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span>{display}</motion.span>;
};

// ==========================================
// Component: StatsOverview
// ==========================================

interface StatsOverviewProps {
    habits: Habit[];
    completionLog: CompletionLog;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ habits, completionLog }) => {

    const getLocalYMD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    let streak = 0;
    let weeklyCompleted = 0;
    let weeklyTotal = 0;

    const isDayPerfect = (dateStr: string, dateObj: Date) => {
        const activeHabits = habits.filter(h => {
            const created = new Date(h.createdAt);
            return created <= dateObj || getLocalYMD(created) === dateStr;
        });

        if (activeHabits.length === 0) return false;
        return activeHabits.every(h => completionLog[h.id]?.[dateStr]);
    };

    const todayStr = getLocalYMD(today);
    let checkDate = new Date(today);

    if (!isDayPerfect(todayStr, checkDate)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
        const dStr = getLocalYMD(checkDate);
        const anyHabitsActive = habits.some(h => new Date(h.createdAt) <= checkDate);
        if (!anyHabitsActive && habits.length > 0) break;

        if (isDayPerfect(dStr, checkDate)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = getLocalYMD(d);

        habits.forEach(h => {
            if (new Date(h.createdAt) <= d) {
                weeklyTotal++;
                if (completionLog[h.id]?.[dStr]) {
                    weeklyCompleted++;
                }
            }
        });
    }

    const weeklyRate = weeklyTotal === 0 ? 0 : Math.round((weeklyCompleted / weeklyTotal) * 100);

    return (
        <AnimatePresence>
            {habits.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="grid grid-cols-2 gap-4 overflow-hidden"
                >
                    <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all">
                        <div className="text-sm text-white/50 mb-2">Current Streak</div>
                        <div className="text-3xl font-bold text-white">
                            <AnimatedCounter value={streak} /> <span className="text-lg text-white/50">days</span>
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all">
                        <div className="text-sm text-white/50 mb-2">This Week</div>
                        <div className="text-3xl font-bold text-white">
                            <AnimatedCounter value={weeklyRate} /><span className="text-lg text-white/50">%</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// ==========================================
// Component: NewHabitForm
// ==========================================

interface NewHabitFormProps {
    onAddHabits: (habits: Habit[]) => void;
}

export const NewHabitForm: React.FC<NewHabitFormProps> = ({ onAddHabits }) => {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'manual' | 'ai'>('manual');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setError(null);

        if (mode === 'manual') {
            const newHabit: Habit = {
                id: Math.random().toString(36).substr(2, 9),
                title: input,
                category: 'Personal',
                createdAt: new Date().toISOString(),
            };
            onAddHabits([newHabit]);
            setInput('');
        } else {
            setLoading(true);
            try {
                const generatedHabits = await generateRoutine(input);
                onAddHabits(generatedHabits);
                setInput('');
                setMode('manual');
            } catch (err) {
                console.error(err);
                setError("Failed to generate habits. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="mb-6">
            <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setMode('manual')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'manual'
                            ? 'bg-white/20 text-white'
                            : 'text-white/50 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        Manual
                    </button>
                    <button
                        onClick={() => setMode('ai')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'ai'
                            ? 'bg-white/20 text-white'
                            : 'text-white/50 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <Sparkles size={14} />
                        AI Generate
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === 'manual' ? "Add a new habit..." : "Describe your goal..."}
                        disabled={loading}
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className={`px-5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${loading || !input.trim()
                            ? 'bg-white/10 text-white/30 cursor-not-allowed'
                            : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        Add
                    </button>
                </form>

                {error && (
                    <div className="mt-3 text-sm text-red-400">{error}</div>
                )}
            </div>
        </div>
    );
};


// ==========================================
// Component: HabitGrid
// ==========================================

interface HabitGridProps {
    habits: Habit[];
    days: DayColumn[];
    completionLog: CompletionLog;
    onToggle: (habitId: string, dateStr: string) => void;
    onDelete: (habitId: string) => void;
}

export const HabitGrid: React.FC<HabitGridProps> = ({
    habits,
    days,
    completionLog,
    onToggle,
    onDelete
}) => {

    const getLocalYMD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const calculateHabitStreak = (habitId: string) => {
        const today = new Date();
        const todayStr = getLocalYMD(today);
        let streak = 0;
        let checkDate = new Date(today);

        // If today isn't done yet, start checking from yesterday
        if (!completionLog[habitId]?.[todayStr]) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Calculate streak going backwards - MUST be consecutive days
        for (let i = 0; i < 365; i++) {
            const dStr = getLocalYMD(checkDate);
            if (completionLog[habitId]?.[dStr]) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // Break immediately if we hit a gap - no streak if missing a day
                break;
            }
        }

        return streak;
    };



    return (
        <div className="overflow-x-auto">
            <div className="min-w-[800px]">
                {/* Header */}
                <div className="grid grid-cols-[1fr_repeat(7,60px)_50px] gap-2 mb-3 px-2">
                    <div className="text-sm font-medium text-white/50">Habit</div>
                    {days.map((day) => (
                        <div key={day.dateStr} className="text-center">
                            <div className="text-xs text-white/40 mb-1">{day.dayName}</div>
                            <div className={`text-sm font-medium ${day.isToday ? 'text-white' : 'text-white/50'}`}>
                                {day.dayNumber}
                            </div>
                        </div>
                    ))}
                    <div></div>
                </div>

                {/* Habit Rows */}
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {habits.map((habit) => {
                            const habitStreak = calculateHabitStreak(habit.id);

                            return (
                                <motion.div
                                    key={habit.id}
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1, height: "auto", marginBottom: 8 }}
                                    exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className="grid grid-cols-[1fr_repeat(7,60px)_50px] gap-2 items-center p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <div className="text-white font-medium flex items-center gap-2">
                                                {habit.title}
                                                {habitStreak > 0 && (
                                                    <motion.span
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold"
                                                    >
                                                        🔥 {habitStreak}
                                                    </motion.span>
                                                )}
                                            </div>
                                            {habit.category && (
                                                <div className="text-xs text-white/40 mt-0.5">{habit.category}</div>
                                            )}
                                        </div>
                                    </div>

                                    {days.map((day) => {
                                        const isCompleted = completionLog[habit.id]?.[day.dateStr] || false;

                                        return (
                                            <div key={day.dateStr} className="flex justify-center">
                                                <motion.button
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => onToggle(habit.id, day.dateStr)}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isCompleted
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                                                        : 'bg-white/5 text-white/30 border border-white/10 hover:bg-white/10 hover:border-white/30'
                                                        }`}
                                                >
                                                    {isCompleted && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                        >
                                                            <Check size={18} strokeWidth={3} />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            </div>
                                        );
                                    })}

                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => onDelete(habit.id)}
                                            className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {habits.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ delay: 0.2 }}
                            className="p-20 text-center text-white/30 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl border-dashed"
                        >
                            <p className="text-lg mb-1">No habits yet</p>
                            <p className="text-sm">Add your first habit above to get started</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

