import React, { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Habit, CompletionLog, DayColumn } from '../types';
import { StatsOverview, NewHabitForm, HabitGrid } from './habits/HabitComponents';

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
        const dayNumber = d.getDate();
        const isToday = i === 0;

        result.push({ dateStr, dayName, dayNumber, isToday });
    }

    return result;
};

const HabitsPage: React.FC = () => {
    const { habits, completionLog, addHabits, deleteHabit, toggleCompletion } = useHabitStore();
    const [days, setDays] = useState<DayColumn[]>([]);

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
        <div className="w-full h-full px-6 py-4 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-white mb-2">Habit Flow</h1>
                    <p className="text-white/50 font-medium">Build consistency, one check at a time.</p>
                </div>

                {/* Stats Overview */}
                <StatsOverview habits={habits} completionLog={completionLog} />

                {/* New Habit Form */}
                <NewHabitForm onAddHabits={addHabits} />

                {/* Habit Grid */}
                <HabitGrid
                    habits={habits}
                    days={days}
                    completionLog={completionLog}
                    onToggle={toggleCompletion}
                    onDelete={deleteHabit}
                />
            </div>
        </div>
    );
};

export default HabitsPage;
