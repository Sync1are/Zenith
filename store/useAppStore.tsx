import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task, TaskStatus } from "../types";

interface AppState {
  tasks: Task[];
  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: number) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      tasks: [],

      // ✅ Functional updater support
      setTasks: (updater) =>
        set((state) => ({ tasks: updater(state.tasks) })),

      addTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, task] })),

      updateTask: (task) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      resetAll: () => set({ tasks: [] })
    }),
    { name: "zenith-app-storage" }
  )
);
