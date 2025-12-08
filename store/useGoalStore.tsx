// Goals Store with Firebase Sync
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Subgoal {
    id: string;
    title: string;
    completed: boolean;
}

export interface Goal {
    id: string;
    title: string;
    createdAt: number;
    isPinned: boolean;
    order: number;
    subgoals: Subgoal[];
}

export interface Album {
    id: string;
    name: string;
    goalIds: string[];
    createdAt: number;
}

interface GoalStore {
    goals: Goal[];
    albums: Album[];

    // Goal Actions
    addGoal: (goal: Goal) => void;
    updateGoal: (goal: Goal) => void;
    deleteGoal: (id: string) => void;
    setGoals: (goals: Goal[]) => void;

    // Album Actions
    addAlbum: (album: Album) => void;
    updateAlbum: (album: Album) => void;
    deleteAlbum: (id: string) => void;
    setAlbums: (albums: Album[]) => void;
    addGoalToAlbum: (goalId: string, albumId: string) => void;
    removeGoalFromAlbum: (goalId: string, albumId: string) => void;
}

export const useGoalStore = create<GoalStore>()(
    persist(
        (set) => ({
            goals: [],
            albums: [],

            // Goal Actions
            addGoal: (goal) =>
                set((state) => ({
                    goals: [goal, ...state.goals],
                })),

            updateGoal: (updatedGoal) =>
                set((state) => ({
                    goals: state.goals.map((g) =>
                        g.id === updatedGoal.id ? updatedGoal : g
                    ),
                })),

            deleteGoal: (id) =>
                set((state) => ({
                    goals: state.goals.filter((g) => g.id !== id),
                    albums: state.albums.map((a) => ({
                        ...a,
                        goalIds: a.goalIds.filter((gid) => gid !== id),
                    })),
                })),

            setGoals: (goals) => set({ goals }),

            // Album Actions
            addAlbum: (album) =>
                set((state) => ({
                    albums: [...state.albums, album],
                })),

            updateAlbum: (updatedAlbum) =>
                set((state) => ({
                    albums: state.albums.map((a) =>
                        a.id === updatedAlbum.id ? updatedAlbum : a
                    ),
                })),

            deleteAlbum: (id) =>
                set((state) => ({
                    albums: state.albums.filter((a) => a.id !== id),
                })),

            setAlbums: (albums) => set({ albums }),

            addGoalToAlbum: (goalId, albumId) =>
                set((state) => ({
                    albums: state.albums.map((a) =>
                        a.id === albumId && !a.goalIds.includes(goalId)
                            ? { ...a, goalIds: [...a.goalIds, goalId] }
                            : a
                    ),
                })),

            removeGoalFromAlbum: (goalId, albumId) =>
                set((state) => ({
                    albums: state.albums.map((a) =>
                        a.id === albumId
                            ? { ...a, goalIds: a.goalIds.filter((gid) => gid !== goalId) }
                            : a
                    ),
                })),
        }),
        {
            name: 'zenith-goal-storage',
        }
    )
);
