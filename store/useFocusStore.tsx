
import { create } from "zustand";

export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type TaskStatus = "IDLE" | "RUNNING" | "DONE";

export interface Task {
  id: number;
  title: string;
  description?: string;
  duration: number; // in minutes
  category: string;
  priority: Priority;
  status: TaskStatus;
}

export type FocusMode = "Pomodoro" | "Deep Work" | "Short Break" | "Long Break";

export type EnvironmentId = "none" | "cafe" | "rain" | "forest" | "space" | "ocean" | "library" | "fireplace";

interface FocusStore {
  tasks: Task[];
  activeTaskId: number | null;
  focusMode: FocusMode;
  timerRemaining: number; // seconds
  timerActive: boolean;
  environment: EnvironmentId; // New state

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  startTask: (taskId: number) => void;
  pauseTask: () => void;
  completeTask: (taskId: number) => void;

  setFocusMode: (mode: FocusMode) => void;
  setTimerRemaining: (seconds: number) => void;
  toggleTimerActive: () => void;
  resetTimer: () => void;
  setEnvironment: (env: EnvironmentId) => void; // New action
}

// Default durations by focus mode (seconds)
const DURATIONS: Record<FocusMode, number> = {
  "Pomodoro": 25 * 60,
  "Deep Work": 50 * 60,
  "Short Break": 5 * 60,
  "Long Break": 15 * 60,
};

export const useFocusStore = create<FocusStore>((set, get) => ({
  tasks: [],
  activeTaskId: null,
  focusMode: "Pomodoro",
  timerRemaining: DURATIONS["Pomodoro"],
  timerActive: false,
  environment: "none", // Default environment

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),

  startTask: (taskId) => {
    set((state) => ({
      activeTaskId: taskId,
      timerRemaining: DURATIONS[state.focusMode],
      timerActive: true,
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, status: "RUNNING" } : t.status === "RUNNING" ? { ...t, status: "IDLE" } : t
      ),
    }));
  },

  pauseTask: () => {
    set((state) => ({
      timerActive: false,
      tasks: state.tasks.map(t =>
        t.status === "RUNNING" ? { ...t, status: "IDLE" } : t
      ),
      activeTaskId: null,
    }));
  },

  completeTask: (taskId) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: "DONE" } : t),
    activeTaskId: null,
    timerActive: false,
  })),

  setFocusMode: (mode) => {
    set({ focusMode: mode, timerRemaining: DURATIONS[mode], timerActive: false });
  },

  setTimerRemaining: (seconds) => set({ timerRemaining: seconds }),

  toggleTimerActive: () => set((state) => ({ timerActive: !state.timerActive })),

  resetTimer: () => {
    const mode = get().focusMode;
    set({ timerRemaining: DURATIONS[mode], timerActive: false });
  },

  setEnvironment: (env) => set({ environment: env }),
}));
