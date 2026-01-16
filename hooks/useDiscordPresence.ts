// hooks/useDiscordPresence.ts
// Custom hook to update Discord Rich Presence based on app state

import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useSuperFocus } from './useSuperFocus';
import { TaskStatus } from '../types';

interface DiscordPresenceData {
    page: string;
    taskName?: string;
    taskCount?: number;
    timerActive?: boolean;
    isSuperFocus?: boolean;
    startTimestamp?: number;
    timerRemaining?: number;
    estimatedTimeMinutes?: number;
}

export function useDiscordPresence(currentPage: string) {
    const tasks = useAppStore((s) => s.tasks);
    const timerActive = useAppStore((s) => s.timerActive);
    const timerRemaining = useAppStore((s) => s.timerRemaining);
    const activeTaskId = useAppStore((s) => s.activeTaskId);
    const superFocus = useSuperFocus();

    const startTimeRef = useRef<number>(Date.now());
    const lastUpdateRef = useRef<string>('');

    useEffect(() => {
        // Only run in Electron environment
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI?.updateDiscordPresence) return;

        // Build presence data
        const presenceData: DiscordPresenceData = {
            page: currentPage,
            startTimestamp: startTimeRef.current,
        };

        // Add focus-specific data
        if (currentPage === 'Focus') {
            presenceData.timerActive = timerActive;
            presenceData.isSuperFocus = superFocus.isActive;
            presenceData.timerRemaining = timerRemaining;

            // Get active task name and estimated time if focusing
            if (activeTaskId) {
                const activeTask = tasks.find(t => t.id === activeTaskId);
                presenceData.taskName = activeTask?.title;
                presenceData.estimatedTimeMinutes = activeTask?.estimatedTimeMinutes || 0;
            }
        }

        // Add task count for Tasks page
        if (currentPage === 'Tasks') {
            presenceData.taskCount = tasks.filter(t => t.status !== TaskStatus.Done).length;
        }

        // Create a key to check if we need to update
        const updateKey = JSON.stringify(presenceData);

        // Only update if something changed
        if (updateKey !== lastUpdateRef.current) {
            lastUpdateRef.current = updateKey;
            electronAPI.updateDiscordPresence(presenceData);
        }
    }, [currentPage, tasks, timerActive, timerRemaining, activeTaskId, superFocus.isActive]);

    // Update start time when page changes
    useEffect(() => {
        startTimeRef.current = Date.now();
    }, [currentPage]);
}
