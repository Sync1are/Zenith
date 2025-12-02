import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Habit, CompletionLog, DayColumn } from '../types';
import { StatsOverview, NewHabitForm, HabitGrid } from './habits/HabitComponents';
import { LayoutGrid, Calendar, Activity } from 'lucide-react';

// Zustand Store for Habits
interface HabitStore {
    habits: Habit[];
    completionLog: CompletionLog;
    addHabits: (habits: Habit[]) => void;
    deleteHabit: (id: string) => void;
    toggleCompletion: (habitId: string, dateStr: string) => void;
}

export const useHabitStore = create<HabitStore>()(
    persist(
        (set) => ({
            habits: [],
            completionLog: {},

            addHabits: (habits) =>
                set((state) => ({
                    habits: [...state.habits, ...habits],
                })),

            deleteHabit: (id) =>
                set((state) => {
                    const newLog = { ...state.completionLog };
                    delete newLog[id];
                    return {
                        habits: state.habits.filter((h) => h.id !== id),
                        completionLog: newLog,
                    };
                }),

            toggleCompletion: (habitId, dateStr) =>
                set((state) => {
                    const habitLog = state.completionLog[habitId] || {};
                    const newValue = !habitLog[dateStr];
                    return {
                        completionLog: {
                            ...state.completionLog,
                            [habitId]: { ...habitLog, [dateStr]: newValue },
                        },
                    };
                }),
        }),
        {
            name: 'zenith-habit-storage',
        }
    )
);

// Utility: Generate last 7 days
const generateDays = (): DayColumn[] => {
    const result: DayColumn[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const dayNumber = String(d.getDate());
        const isToday = i === 0;

        result.push({ dateStr, dayName, dayNumber, isToday });
    }

    return result;
};

const HabitsPage: React.FC = () => {
    const { habits, completionLog, addHabits, deleteHabit, toggleCompletion } = useHabitStore();
    const [days, setDays] = useState<DayColumn[]>([]);
    const [viewMode, setViewMode] = useState<'Today' | 'Weekly' | 'Overall'>('Weekly');

    useEffect(() => {
        setDays(generateDays());

        // Update days at midnight
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();

        const timeout = setTimeout(() => {
            setDays(generateDays());
            // Set up daily interval
            const interval = setInterval(() => {
                setDays(generateDays());
            }, 24 * 60 * 60 * 1000);

            return () => clearInterval(interval);
        }, msUntilMidnight);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="w-full h-full px-6 py-8 overflow-y-auto">
            <div className="max-w-[1000px] mx-auto">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Habit Flow</h1>
                        <p className="text-white/50 font-medium">Build consistency, one check at a time.</p>
                    </div>

                    {/* View Toggle */}
                    <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex relative">
                        {(['Today', 'Weekly', 'Overall'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`
                                    relative px-5 py-2 rounded-lg text-sm font-bold transition-colors z-10
                                    ${viewMode === mode ? 'text-black' : 'text-white/40 hover:text-white'}
                                `}
                            >
                                {viewMode === mode && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white rounded-lg shadow-lg -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Overview */}
                <StatsOverview habits={habits} completionLog={completionLog} />

                {/* New Habit Form - Only visible in Today view */}
                <AnimatePresence mode="wait">
                    {viewMode === 'Today' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <NewHabitForm onAddHabits={addHabits} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content Grid */}
                <div className="space-y-4">
                    {habits.length === 0 ? (
                        <div className="p-20 text-center text-white/30 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl border-dashed">
                            <p className="text-lg font-medium mb-1">No habits yet</p>
                            <p className="text-sm">Create your first habit above to get started</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={viewMode}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                <HabitGrid
                                    habits={habits}
                                    days={days}
                                    completionLog={completionLog}
                                    onToggle={toggleCompletion}
                                    onDelete={deleteHabit}
                                    viewMode={viewMode}
                                />
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HabitsPage;
