import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  category: 'work' | 'personal' | 'meeting';
  reminder?: number;
  notified?: boolean;
}

interface CalendarStore {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: number, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: number) => void;
  markAsNotified: (id: number) => void;
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (event) => set((state) => ({
        events: [...state.events, { ...event, id: Date.now() }]
      })),
      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        )
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter((e) => e.id !== id)
      })),
      markAsNotified: (id) => set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, notified: true } : e
        )
      })),
    }),
    {
      name: 'calendar-storage',
      partialize: (state) => ({
        events: state.events.map(e => ({
          ...e,
          start: typeof e.start === 'string' ? e.start : e.start.toISOString(),
          end: typeof e.end === 'string' ? e.end : e.end.toISOString()
        }))
      }),
    }
  )
);
