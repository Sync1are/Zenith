import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task, TaskStatus } from "../types";

export type FocusMode = "Pomodoro" | "Deep Work" | "Short Break" | "Long Break";

interface AppState {
  tasks: Task[];
  activeTaskId: number | null;

  focusMode: FocusMode;
  timerActive: boolean;
  timerRemaining: number; // seconds

  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: number, data: Partial<Task>) => void;
  deleteTask: (id: number) => void;

  startTask: (taskId: number) => void;
  pauseTask: () => void;
  setActiveTask: (id: number | null) => void;

  setFocusMode: (mode: FocusMode) => void;
  setTimerActive: (active: boolean) => void;
  setTimerRemaining: (seconds: number) => void;
  resetTimer: () => void;

  tick: () => void;
}

const FOCUS_MODE_DURATIONS: Record<FocusMode, number> = {
  Pomodoro: 25 * 60,
  "Deep Work": 50 * 60,
  "Short Break": 5 * 60,
  "Long Break": 15 * 60,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      activeTaskId: null,

      focusMode: "Pomodoro",
      timerActive: false,
      timerRemaining: FOCUS_MODE_DURATIONS["Pomodoro"],

      // Task CRUD
      setTasks: (updater) => set((state) => ({ tasks: updater(state.tasks) })),
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (taskId, data) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
        })),
      deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      setActiveTask: (id) => set({ activeTaskId: id }),

      startTask: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const parse = (duration: string) => {
          const num = parseInt(duration);
          if (duration.includes("hour")) return num * 3600;
          if (duration.includes("min")) return num * 60;
          return num;
        };

        const totalSeconds = task.subtasks?.length
          ? task.subtasks.reduce((acc, st) => {
              const num = parseInt(st.duration);
              if (st.duration.includes("hour")) return acc + num * 3600;
              if (st.duration.includes("min")) return acc + num * 60;
              return acc + num;
            }, 0)
          : parse(task.duration);

        const remaining = task.remainingTime ?? totalSeconds;

        set((state) => ({
          activeTaskId: taskId,
          timerRemaining: remaining,
          timerActive: true,
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, status: TaskStatus.IN_PROGRESS, remainingTime: remaining } : t.status === TaskStatus.IN_PROGRESS ? { ...t, status: TaskStatus.IDLE } : t
          ),
        }));
      },

      pauseTask: () => set({ activeTaskId: null, timerActive: false }),

      setFocusMode: (mode) =>
        set({
          focusMode: mode,
          timerRemaining: FOCUS_MODE_DURATIONS[mode],
          timerActive: false,
        }),

      setTimerActive: (active) => set({ timerActive: active }),

      setTimerRemaining: (seconds) => set({ timerRemaining: seconds }),

      resetTimer: () => {
        const mode = get().focusMode;
        set({
          timerRemaining: FOCUS_MODE_DURATIONS[mode],
          timerActive: false,
        });
      },

      tick: () => {
        const { timerRemaining, timerActive, activeTaskId, tasks } = get();
        if (!timerActive || timerRemaining <= 0) return;

        let shouldStop = false;

        const newTasks = tasks.map((t) => {
          if (t.id !== activeTaskId) return t;
          const newRemaining = (t.remainingTime ?? 1) - 1;
          if (newRemaining <= 0) {
            shouldStop = true;
            return {
              ...t,
              remainingTime: 0,
              status: TaskStatus.DONE,
              isCompleted: true,
              completedAt: Date.now(),
            };
          }
          return { ...t, remainingTime: newRemaining };
        });

        set({
          timerRemaining: timerRemaining - 1,
          tasks: newTasks,
          timerActive: shouldStop ? false : timerActive,
          activeTaskId: shouldStop ? null : activeTaskId,
        });
      },
    }),
    { name: "zenith-app-storage" }
  )
);
