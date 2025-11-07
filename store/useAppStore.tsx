import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task, TaskStatus } from "../types";

interface AppState {
  tasks: Task[];
  activeTaskId: number | null;

  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: number, data: Partial<Task>) => void;
  deleteTask: (id: number) => void;

  startTask: (taskId: number) => void;
  pauseTask: () => void;
  setActiveTask: (id: number | null) => void;

  tick: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      activeTaskId: null,

      // ✅ Functional setTasks (used in TasksPage)
      setTasks: (updater) =>
        set((state) => ({ tasks: updater(state.tasks) })),

      addTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, task] })),

      updateTask: (taskId, data) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...data } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

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

        // ✅ Support for tasks with subtasks
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
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: TaskStatus.IN_PROGRESS, remainingTime: remaining }
              : t
          ),
        }));
      },

      pauseTask: () => set({ activeTaskId: null }),

      // ✅ Global tick (keeps timer running even when switching pages)
      tick: () => {
        const { activeTaskId, tasks } = get();
        if (!activeTaskId) return;

        set(() => {
          let shouldStop = false;

          const updated = tasks.map((t) => {
            if (t.id !== activeTaskId) return t;

            const newTime = (t.remainingTime ?? 1) - 1;

            if (newTime <= 0) {
              shouldStop = true;
              return {
                ...t,
                remainingTime: 0,
                status: TaskStatus.DONE,
                isCompleted: true,
                completedAt: Date.now(),
              };
            }

            return { ...t, remainingTime: newTime };
          });

          return {
            tasks: updated,
            activeTaskId: shouldStop ? null : activeTaskId,
          };
        });
      },
    }),
    { name: "zenith-app-storage" }
  )
);
