// store/useJournalStore.tsx
// Zustand store for Journal / Daily Logs feature

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JournalTopic, JournalEntry, JournalDraft } from '../types';

interface JournalFilters {
    topicIds: string[];
    dateRange: { start: string | null; end: string | null };
    mood: number | null;
    pinnedOnly: boolean;
}

interface JournalReminder {
    enabled: boolean;
    time: string; // HH:MM format
    lastNotified: string | null; // ISO date string
}

interface JournalStore {
    // State
    topics: JournalTopic[];
    entries: JournalEntry[];
    drafts: JournalDraft[];
    selectedTopicId: string | null;
    selectedDate: string | null;
    searchQuery: string;
    filters: JournalFilters;
    reminder: JournalReminder;

    // Topic Actions
    addTopic: (topic: Omit<JournalTopic, 'id' | 'createdAt'>) => void;
    updateTopic: (id: string, updates: Partial<JournalTopic>) => void;
    deleteTopic: (id: string) => void;

    // Entry Actions
    addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
    deleteEntry: (id: string) => void;
    togglePinEntry: (id: string) => void;

    // Draft Actions
    saveDraft: (topicId: string, date: string, content: string) => void;
    getDraft: (topicId: string, date: string) => JournalDraft | null;
    clearDraft: (topicId: string, date: string) => void;

    // Reminder Actions
    setReminderEnabled: (enabled: boolean) => void;
    setReminderTime: (time: string) => void;
    markReminderNotified: () => void;

    // Navigation
    setSelectedTopic: (id: string | null) => void;
    setSelectedDate: (date: string | null) => void;
    setSearchQuery: (query: string) => void;
    setFilters: (filters: Partial<JournalFilters>) => void;
    clearFilters: () => void;

    // Computed / Selectors
    getEntriesForTopic: (topicId: string) => JournalEntry[];
    getEntriesForDate: (date: string) => JournalEntry[];
    getStreak: () => number;
    getWeeklyStats: () => { total: number; mostActiveTopic: string | null };
    getMonthlyStats: () => { total: number; daysLogged: number };
    shouldShowReminder: () => boolean;
}

// Default topics for new users
const DEFAULT_TOPICS: Omit<JournalTopic, 'id' | 'createdAt'>[] = [
    { name: 'Work', color: '#6366f1', icon: '💼' },
    { name: 'Study', color: '#22c55e', icon: '📚' },
    { name: 'Personal', color: '#f59e0b', icon: '🌟' },
];

export const useJournalStore = create<JournalStore>()(
    persist(
        (set, get) => ({
            // Initial State
            topics: [],
            entries: [],
            drafts: [],
            selectedTopicId: null,
            selectedDate: null,
            searchQuery: '',
            filters: {
                topicIds: [],
                dateRange: { start: null, end: null },
                mood: null,
                pinnedOnly: false,
            },
            reminder: {
                enabled: false,
                time: '20:00', // Default 8 PM
                lastNotified: null,
            },

            // Topic Actions
            addTopic: (topicData) => {
                const newTopic: JournalTopic = {
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                    ...topicData,
                };
                set((state) => ({ topics: [...state.topics, newTopic] }));
            },

            updateTopic: (id, updates) => {
                set((state) => ({
                    topics: state.topics.map((t) => (t.id === id ? { ...t, ...updates } : t)),
                }));
            },

            deleteTopic: (id) => {
                set((state) => ({
                    topics: state.topics.filter((t) => t.id !== id),
                    entries: state.entries.filter((e) => e.topicId !== id),
                    drafts: state.drafts.filter((d) => d.topicId !== id),
                }));
            },

            // Entry Actions
            addEntry: (entryData) => {
                const now = new Date().toISOString();
                const newEntry: JournalEntry = {
                    id: crypto.randomUUID(),
                    createdAt: now,
                    updatedAt: now,
                    ...entryData,
                };
                set((state) => ({ entries: [...state.entries, newEntry] }));
                // Clear draft after saving
                get().clearDraft(entryData.topicId, entryData.date);
            },

            updateEntry: (id, updates) => {
                set((state) => ({
                    entries: state.entries.map((e) =>
                        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
                    ),
                }));
            },

            deleteEntry: (id) => {
                set((state) => ({
                    entries: state.entries.filter((e) => e.id !== id),
                }));
            },

            togglePinEntry: (id) => {
                set((state) => ({
                    entries: state.entries.map((e) =>
                        e.id === id ? { ...e, pinned: !e.pinned, updatedAt: new Date().toISOString() } : e
                    ),
                }));
            },

            // Draft Actions
            saveDraft: (topicId, date, content) => {
                const draft: JournalDraft = {
                    topicId,
                    date,
                    content,
                    lastSaved: new Date().toISOString(),
                };
                set((state) => ({
                    drafts: [
                        ...state.drafts.filter((d) => !(d.topicId === topicId && d.date === date)),
                        draft,
                    ],
                }));
            },

            getDraft: (topicId, date) => {
                return get().drafts.find((d) => d.topicId === topicId && d.date === date) || null;
            },

            clearDraft: (topicId, date) => {
                set((state) => ({
                    drafts: state.drafts.filter((d) => !(d.topicId === topicId && d.date === date)),
                }));
            },

            // Reminder Actions
            setReminderEnabled: (enabled) => {
                set((state) => ({
                    reminder: { ...state.reminder, enabled }
                }));
            },

            setReminderTime: (time) => {
                set((state) => ({
                    reminder: { ...state.reminder, time }
                }));
            },

            markReminderNotified: () => {
                set((state) => ({
                    reminder: { ...state.reminder, lastNotified: new Date().toISOString() }
                }));
            },

            // Navigation
            setSelectedTopic: (id) => set({ selectedTopicId: id }),
            setSelectedDate: (date) => set({ selectedDate: date }),
            setSearchQuery: (query) => set({ searchQuery: query }),
            setFilters: (filters) =>
                set((state) => ({ filters: { ...state.filters, ...filters } })),
            clearFilters: () =>
                set({
                    filters: {
                        topicIds: [],
                        dateRange: { start: null, end: null },
                        mood: null,
                        pinnedOnly: false,
                    },
                    searchQuery: '',
                }),

            // Computed
            getEntriesForTopic: (topicId) => {
                return get()
                    .entries.filter((e) => e.topicId === topicId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            },

            getEntriesForDate: (date) => {
                return get()
                    .entries.filter((e) => e.date === date)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            },

            getStreak: () => {
                const entries = get().entries;
                if (entries.length === 0) return 0;

                const dates = [...new Set(entries.map((e) => e.date))].sort().reverse();
                let streak = 0;
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                for (let i = 0; i < 365; i++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(today.getDate() - i);
                    const dateStr = checkDate.toISOString().split('T')[0];

                    if (dates.includes(dateStr)) {
                        streak++;
                    } else if (i > 0) {
                        // Allow skipping today if no entry yet
                        break;
                    }
                }
                return streak;
            },

            getWeeklyStats: () => {
                const entries = get().entries;
                const topics = get().topics;
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                const weekAgoStr = weekAgo.toISOString().split('T')[0];

                const weekEntries = entries.filter((e) => e.date >= weekAgoStr);
                const topicCounts: Record<string, number> = {};

                weekEntries.forEach((e) => {
                    topicCounts[e.topicId] = (topicCounts[e.topicId] || 0) + 1;
                });

                let mostActiveTopic: string | null = null;
                let maxCount = 0;
                Object.entries(topicCounts).forEach(([topicId, count]) => {
                    if (count > maxCount) {
                        maxCount = count;
                        const topic = topics.find((t) => t.id === topicId);
                        mostActiveTopic = topic?.name || null;
                    }
                });

                return { total: weekEntries.length, mostActiveTopic };
            },

            getMonthlyStats: () => {
                const entries = get().entries;
                const monthAgo = new Date();
                monthAgo.setDate(monthAgo.getDate() - 30);
                const monthAgoStr = monthAgo.toISOString().split('T')[0];

                const monthEntries = entries.filter((e) => e.date >= monthAgoStr);
                const uniqueDays = new Set(monthEntries.map((e) => e.date));

                return { total: monthEntries.length, daysLogged: uniqueDays.size };
            },

            shouldShowReminder: () => {
                const { reminder, entries } = get();
                if (!reminder.enabled) return false;

                const now = new Date();
                const today = now.toISOString().split('T')[0];

                // Check if already logged today
                const hasLoggedToday = entries.some(e => e.date === today);
                if (hasLoggedToday) return false;

                // Check if already notified today
                if (reminder.lastNotified) {
                    const lastNotifiedDate = reminder.lastNotified.split('T')[0];
                    if (lastNotifiedDate === today) return false;
                }

                // Check if current time is past reminder time
                const [hours, minutes] = reminder.time.split(':').map(Number);
                const reminderTime = new Date(now);
                reminderTime.setHours(hours, minutes, 0, 0);

                return now >= reminderTime;
            },
        }),
        {
            name: 'zenith-journal-storage',
            version: 1,
        }
    )
);
