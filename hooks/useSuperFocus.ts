// src/hooks/useSuperFocus.ts
import { useState, useEffect } from 'react';

export interface SuperFocusSession {
    start: number;
    end: number;
    duration: number; // in seconds
}

class SuperFocusStore {
    private sessions: SuperFocusSession[] = [];
    private isActive: boolean = false;
    private startTime: number | null = null;
    private elapsed: number = 0;
    private interval: NodeJS.Timeout | null = null;
    private listeners: Set<() => void> = new Set();

    constructor() {
        // Load from localStorage
        const stored = localStorage.getItem('zenith-super-focus-sessions');
        if (stored) {
            try {
                this.sessions = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to load SUPER focus sessions', e);
            }
        }

        // Setup ESC key listener from Electron
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            (window as any).electronAPI.onExitSuperFocusRequested(() => {
                if (this.isActive) {
                    this.toggle();
                }
            });
        }
    }

    private saveSessions() {
        localStorage.setItem('zenith-super-focus-sessions', JSON.stringify(this.sessions));
    }

    private notify() {
        this.listeners.forEach(listener => listener());
    }

    subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    getState() {
        return {
            isActive: this.isActive,
            startTime: this.startTime,
            elapsed: this.elapsed,
            sessions: this.sessions
        };
    }

    toggle() {
        if (!this.isActive) {
            // Enter SUPER focus mode
            const now = Date.now();
            this.isActive = true;
            this.startTime = now;
            this.elapsed = 0;

            // Trigger Electron fullscreen and keyboard blocking
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                (window as any).electronAPI.enterSuperFocus();
            }

            // Start timer
            this.interval = setInterval(() => {
                if (this.startTime) {
                    this.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                    this.notify();
                }
            }, 1000);

            this.notify();
        } else {
            // Exit SUPER focus mode
            const now = Date.now();
            const duration = this.startTime ? now - this.startTime : 0;

            // Trigger Electron exit fullscreen
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                (window as any).electronAPI.exitSuperFocus();
            }

            // Save session
            const newSession: SuperFocusSession = {
                start: this.startTime || now,
                end: now,
                duration: Math.floor(duration / 1000)
            };

            this.sessions.push(newSession);
            this.saveSessions();

            // Clear timer
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }

            this.isActive = false;
            this.startTime = null;
            this.elapsed = 0;

            this.notify();
        }
    }

    getTotalTime(): number {
        return this.sessions.reduce((total, session) => total + session.duration, 0);
    }
}

const superFocusStore = new SuperFocusStore();

export function useSuperFocus() {
    const [state, setState] = useState(superFocusStore.getState());

    useEffect(() => {
        const unsubscribe = superFocusStore.subscribe(() => {
            setState(superFocusStore.getState());
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return {
        ...state,
        toggle: () => superFocusStore.toggle(),
        getTotalTime: () => superFocusStore.getTotalTime()
    };
}
