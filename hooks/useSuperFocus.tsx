// src/hooks/useSuperFocus.tsx
import { useState, useEffect, useCallback } from 'react';

export interface SuperFocusSession {
    start: number;
    end: number;
    duration: number; // in seconds
}

interface SuperFocusState {
    isActive: boolean;
    startTime: number | null;
    elapsed: number;
    sessions: SuperFocusSession[];
    showingExitModal: boolean;
    showingEntryModal: boolean;
    skipEntryWarning: boolean;
}

class SuperFocusStore {
    private sessions: SuperFocusSession[] = [];
    private isActive: boolean = false;
    private startTime: number | null = null;
    private elapsed: number = 0;
    private interval: NodeJS.Timeout | null = null;
    private listeners: Set<() => void> = new Set();
    private showingExitModal: boolean = false;
    private showingEntryModal: boolean = false;
    private skipEntryWarning: boolean = false;

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

        // Load skip preference
        const skipPref = localStorage.getItem('zenith-super-focus-skip-warning');
        this.skipEntryWarning = skipPref === 'true';

        // Setup ESC key listener from Electron
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            (window as any).electronAPI.onExitSuperFocusRequested(() => {
                if (this.isActive && !this.showingExitModal) {
                    this.requestExit();
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

    getState(): SuperFocusState {
        return {
            isActive: this.isActive,
            startTime: this.startTime,
            elapsed: this.elapsed,
            sessions: this.sessions,
            showingExitModal: this.showingExitModal,
            showingEntryModal: this.showingEntryModal,
            skipEntryWarning: this.skipEntryWarning
        };
    }

    requestEntry() {
        if (this.isActive) return;

        if (this.skipEntryWarning) {
            this.confirmEntry();
        } else {
            this.showingEntryModal = true;
            this.notify();
        }
    }

    cancelEntry() {
        this.showingEntryModal = false;
        this.notify();
    }

    setSkipEntryWarning(skip: boolean) {
        this.skipEntryWarning = skip;
        localStorage.setItem('zenith-super-focus-skip-warning', skip ? 'true' : 'false');
        this.notify();
    }

    confirmEntry() {
        if (this.isActive) return;

        this.showingEntryModal = false;
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
    }

    requestExit() {
        if (!this.isActive) return;
        this.showingExitModal = true;
        this.notify();
    }

    cancelExit() {
        this.showingExitModal = false;
        this.notify();
    }

    confirmExit() {
        if (!this.isActive) return;

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
        this.showingExitModal = false;

        this.notify();
    }

    toggle() {
        if (!this.isActive) {
            this.requestEntry();
        } else {
            this.requestExit();
        }
    }

    getTotalTime(): number {
        return this.sessions.reduce((total, session) => total + session.duration, 0);
    }
}

const superFocusStore = new SuperFocusStore();

export const useSuperFocus = () => {
    const [state, setState] = useState(superFocusStore.getState());

    useEffect(() => {
        const unsubscribe = superFocusStore.subscribe(() => {
            setState(superFocusStore.getState());
        });
        return () => { unsubscribe(); };
    }, []);

    return {
        ...state,
        requestEntry: () => superFocusStore.requestEntry(),
        cancelEntry: () => superFocusStore.cancelEntry(),
        confirmEntry: () => superFocusStore.confirmEntry(),
        setSkipEntryWarning: (skip: boolean) => superFocusStore.setSkipEntryWarning(skip),
        requestExit: () => superFocusStore.requestExit(),
        cancelExit: () => superFocusStore.cancelExit(),
        confirmExit: () => superFocusStore.confirmExit(),
        toggle: () => superFocusStore.toggle(),
        getTotalTime: () => superFocusStore.getTotalTime()
    };
};
