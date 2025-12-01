// src/store/useAppStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task, TaskStatus } from "../types";

// ---------- Focus timer ----------
export type FocusMode = "Pomodoro" | "Deep Work" | "Short Break" | "Long Break";

const FOCUS_MODE_DURATIONS: Record<FocusMode, number> = {
  Pomodoro: 25 * 60,
  "Deep Work": 50 * 60,
  "Short Break": 5 * 60,
  "Long Break": 15 * 60,
};

// ---------- Spotify auth ----------
type SpotifyTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // epoch ms
};

type Device = {
  id: string;
  is_active: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
};

// Prefer providing your Client ID via environment in Vite/Electron
const SPOTIFY_CLIENT_ID =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SPOTIFY_CLIENT_ID) ||
  process.env.SPOTIFY_CLIENT_ID ||
  "c78fa3fb2fc34a76ae9f6771a403589f";

// ---------- Token refresh helper (PKCE: no client_secret) ----------
async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify refresh failed: ${res.status} ${text}`);
  }
  return res.json();
}

// ---------- AppState ----------
interface AppState {
  // Tasks
  tasks: Task[];
  activeTaskId: string | null;

  // Focus timer
  focusMode: FocusMode;
  timerActive: boolean;
  timerRemaining: number; // seconds

  // Logging
  sessionHistory: { date: string; minutes: number }[];
  logSession: (minutes: number) => void;

  // Internal helper to compute minutes spent in the current run without mutating Task type
  lastStartRemaining: number | null;

  // Spotify auth (legacy raw token for implicit flow; kept for compatibility)
  spotifyToken: string | null;
  setSpotifyToken: (token: string | null) => void;

  // Spotify auth (PKCE)
  spotify: SpotifyTokens;
  setSpotifyTokens: (t: SpotifyTokens) => void;
  clearSpotifyTokens: () => void;
  getEffectiveSpotifyToken: () => string | null;
  ensureSpotifyAccessToken: () => Promise<string | null>;

  // Spotify player helpers
  spotifySkipNext: () => Promise<{ ok: boolean; status: number; note: string }>;
  spotifyTogglePlayback: (play: boolean) => Promise<{ ok: boolean; status: number; note: string }>;
  spotifyGetDevices: () => Promise<Device[] | null>;
  spotifyTransferPlayback: (
    deviceId: string,
    play?: boolean
  ) => Promise<{ ok: boolean; status: number; note: string }>;
  spotifyGetCurrentlyPlaying: () => Promise<any | null>;

  // Task CRUD
  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Task control
  setActiveTask: (id: string | null) => void;
  startTask: (taskId: string) => void;
  pauseTask: () => void;

  // Timer control
  setFocusMode: (mode: FocusMode) => void;
  setTimerActive: (active: boolean) => void;
  setTimerRemaining: (seconds: number) => void;
  resetTimer: () => void;

  // App reset
  resetApp: () => void;

  // Navigation
  activePage: string;
  setActivePage: (page: string) => void;

  // AI Task Modal trigger (for cross-component communication)
  shouldOpenAiTaskModal: boolean;
  triggerAiTaskModal: (open: boolean) => void;

  // Study Session
  studySession: {
    isOpen: boolean;
    mode: 'menu' | 'create' | 'join' | 'active' | 'incoming';
    code: string | null;
    callerId?: string;
  };
  setStudySessionOpen: (isOpen: boolean) => void;
  startStudySession: (code?: string) => void;
  joinStudySession: (code: string) => void;
  handleIncomingCall: (code: string, callerId: string) => void;
  rejectCall: () => void;

  // Personal Call (1-on-1)
  personalCall: {
    isActive: boolean;
    mode: 'idle' | 'outgoing' | 'incoming' | 'connected';
    callId: string | null;
    otherUserId: string | null;
    callEndReason?: 'user_ended' | 'no_answer' | 'declined';
  };
  startPersonalCall: (receiverId: string) => void;
  acceptPersonalCall: () => void;
  endPersonalCall: (reason?: 'user_ended' | 'no_answer' | 'declined') => void;
  handleIncomingPersonalCall: (callerId: string, callId: string) => void;

  // Ticker
  tick: () => void;
}

// ---------- Store ----------
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ---------- Defaults ----------
      tasks: [],
      activeTaskId: null,

      focusMode: "Pomodoro",
      timerActive: false,
      timerRemaining: FOCUS_MODE_DURATIONS["Pomodoro"],

      sessionHistory: [],
      lastStartRemaining: null,

      // Navigation
      activePage: "Dashboard",
      setActivePage: (page) => set({ activePage: page }),

      // AI Task Modal trigger
      shouldOpenAiTaskModal: false,
      triggerAiTaskModal: (open) => set({ shouldOpenAiTaskModal: open }),

      // Study Session
      studySession: { isOpen: false, mode: 'menu', code: null },
      setStudySessionOpen: (isOpen) => set((state) => ({
        studySession: { ...state.studySession, isOpen, mode: isOpen ? 'menu' : 'menu' }
      })),
      startStudySession: (code) => set((state) => ({
        studySession: { ...state.studySession, isOpen: true, mode: 'active', code: code || null }
      })),
      joinStudySession: (code) => set((state) => ({
        studySession: { ...state.studySession, isOpen: true, mode: 'active', code }
      })),
      handleIncomingCall: (code, callerId) => set((state) => ({
        studySession: { ...state.studySession, isOpen: true, mode: 'incoming', code, callerId }
      })),
      rejectCall: () => set((state) => ({
        studySession: { isOpen: false, mode: 'menu', code: null, callerId: undefined }
      })),

      // Personal Call (1-on-1)
      personalCall: { isActive: false, mode: 'idle', callId: null, otherUserId: null },
      startPersonalCall: (receiverId) => {
        const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        set((state) => ({
          personalCall: { isActive: true, mode: 'outgoing', callId, otherUserId: receiverId }
        }));
      },
      acceptPersonalCall: () => set((state) => ({
        personalCall: { ...state.personalCall, mode: 'connected' }
      })),
      endPersonalCall: (reason = 'user_ended') => set((state) => ({
        personalCall: { isActive: false, mode: 'idle', callId: null, otherUserId: null, callEndReason: reason }
      })),
      handleIncomingPersonalCall: (callerId, callId) => set((state) => ({
        personalCall: { isActive: true, mode: 'incoming', callId, otherUserId: callerId }
      })),

      // Legacy single token (implicit flow) — consider migrating to spotify.{...}
      spotifyToken: null,
      setSpotifyToken: (token) => set({ spotifyToken: token }),

      // PKCE tokens
      spotify: { accessToken: null, refreshToken: null, expiresAt: null },
      setSpotifyTokens: (t) => set({ spotify: t }),
      clearSpotifyTokens: () =>
        set({ spotify: { accessToken: null, refreshToken: null, expiresAt: null } }),

      // Prefer this to read a token in your UI/services
      getEffectiveSpotifyToken: () => {
        const { spotify, spotifyToken } = get();
        return spotify.accessToken || spotifyToken;
      },

      // Ensure a valid access token (refresh if expired) and return it
      ensureSpotifyAccessToken: async () => {
        const { spotify, setSpotifyTokens } = get();
        const now = Date.now();
        if (spotify.accessToken && spotify.expiresAt && now < spotify.expiresAt - 30_000) {
          return spotify.accessToken;
        }
        if (!spotify.refreshToken) return null;

        try {
          const data = await refreshAccessToken(spotify.refreshToken);
          // Note: Spotify may omit refresh_token on refresh; reuse the stored one in that case.
          // See community/dev notes about refresh_token not always rotating. [web:27][web:30][web:32]
          const expiresAt = Date.now() + (data.expires_in - 30) * 1000;
          setSpotifyTokens({
            accessToken: data.access_token,
            refreshToken: data.refresh_token || spotify.refreshToken,
            expiresAt,
          });
          return data.access_token;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
          // Clear only the access token so user can try login again if needed
          setSpotifyTokens({
            accessToken: null,
            refreshToken: spotify.refreshToken,
            expiresAt: null,
          });
          return null;
        }
      },

      // ---------- Spotify Player helpers ----------
      // POST /v1/me/player/next (requires user-modify-playback-state, Premium, active device)
      spotifySkipNext: async () => {
        const token = await get().ensureSpotifyAccessToken();
        if (!token) return { ok: false, status: 0, note: "Not connected" };
        const res = await fetch("https://api.spotify.com/v1/me/player/next", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 204) return { ok: true, status: 204, note: "Skipped" };
        if (res.status === 403)
          return { ok: false, status: 403, note: "Premium required or scope missing" };
        if (res.status === 404) return { ok: false, status: 404, note: "No active device" };
        return { ok: res.ok, status: res.status, note: await res.text().catch(() => "Error") };
      },

      // PUT /v1/me/player/play or /pause (requires user-modify-playback-state, Premium, active device)
      spotifyTogglePlayback: async (play: boolean) => {
        const token = await get().ensureSpotifyAccessToken();
        if (!token) return { ok: false, status: 0, note: "Not connected" };
        const endpoint = play ? "play" : "pause";
        const res = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 204) return { ok: true, status: 204, note: play ? "Playing" : "Paused" };
        if (res.status === 403)
          return { ok: false, status: 403, note: "Premium required or scope missing" };
        if (res.status === 404) return { ok: false, status: 404, note: "No active device" };
        return { ok: res.ok, status: res.status, note: await res.text().catch(() => "Error") };
      },

      // GET /v1/me/player/devices (requires user-read-playback-state)
      spotifyGetDevices: async () => {
        const token = await get().ensureSpotifyAccessToken();
        if (!token) return null;
        const res = await fetch("https://api.spotify.com/v1/me/player/devices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return (data?.devices ?? []) as Device[];
      },

      // PUT /v1/me/player (transfer playback) (requires user-modify-playback-state, Premium)
      spotifyTransferPlayback: async (deviceId: string, play = true) => {
        const token = await get().ensureSpotifyAccessToken();
        if (!token) return { ok: false, status: 0, note: "Not connected" };
        // The API expects { device_ids: [id], play } and returns 204 on success. [web:25][web:23]
        const res = await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ device_ids: [deviceId], play }),
        });
        if (res.status === 204) return { ok: true, status: 204, note: "Transferred" };
        if (res.status === 403)
          return { ok: false, status: 403, note: "Premium required or scope missing" };
        return { ok: res.ok, status: res.status, note: await res.text().catch(() => "Error") };
      },

      // GET /v1/me/player/currently-playing (requires user-read-currently-playing; 204 if nothing playing)
      spotifyGetCurrentlyPlaying: async () => {
        const token = await get().ensureSpotifyAccessToken();
        if (!token) return null;
        const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 204) return null;
        if (!res.ok) return null;
        return res.json();
      },

      // ---------- Logging ----------
      logSession: (minutes) => {
        if (!minutes || minutes <= 0) return;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        set((state) => {
          const history = [...state.sessionHistory];
          const idx = history.findIndex((h) => h.date === today);
          if (idx >= 0) {
            history[idx] = { ...history[idx], minutes: history[idx].minutes + minutes };
          } else {
            history.push({ date: today, minutes });
          }
          return { sessionHistory: history };
        });
      },

      // ---------- Task CRUD ----------
      setTasks: (updater) => set((state) => ({ tasks: updater(state.tasks) })),
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (taskId, data) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
        })),

      // ---------- Task control ----------
      setActiveTask: (id) => set({ activeTaskId: id }),

      startTask: (taskId) => {
        const { tasks } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Convert estimatedTimeMinutes to seconds
        const totalSeconds = task.estimatedTimeMinutes * 60;
        const remaining = task.remainingTime ?? totalSeconds;

        set((state) => ({
          activeTaskId: taskId,
          timerRemaining: remaining,
          timerActive: true,
          lastStartRemaining: remaining,
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: TaskStatus.InProgress, remainingTime: remaining }
              : t.status === TaskStatus.InProgress
                ? { ...t, status: TaskStatus.Todo }
                : t
          ),
        }));
      },

      pauseTask: () => {
        const { activeTaskId, timerRemaining, lastStartRemaining, logSession } = get();

        // Log minutes spent in this run
        if (activeTaskId != null && lastStartRemaining != null) {
          const spentSeconds = Math.max(0, lastStartRemaining - timerRemaining);
          if (spentSeconds > 0) logSession(Math.round(spentSeconds / 60));
        }

        // Persist current remaining time into the active task and set it back to TODO
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === activeTaskId ? { ...t, remainingTime: timerRemaining, status: TaskStatus.Todo } : t
          ),
          activeTaskId: null,
          timerActive: false,
          lastStartRemaining: null,
        }));
      },

      // ---------- Timer control ----------
      setFocusMode: (mode) =>
        set({
          focusMode: mode,
          timerRemaining: FOCUS_MODE_DURATIONS[mode],
          timerActive: false,
          activeTaskId: null,
          lastStartRemaining: null,
        }),

      setTimerActive: (active) => set({ timerActive: active }),

      setTimerRemaining: (seconds) => set({ timerRemaining: seconds }),

      resetTimer: () => {
        const mode = get().focusMode;
        set({
          timerRemaining: FOCUS_MODE_DURATIONS[mode],
          timerActive: false,
          activeTaskId: null,
          lastStartRemaining: null,
        });
      },

      // ---------- Tick ----------
      tick: () => {
        const { timerRemaining, timerActive, activeTaskId, tasks, lastStartRemaining, logSession } =
          get();
        if (!timerActive) return;

        const newRemaining = timerRemaining - 1;

        // Update the active task’s remaining time each tick
        const newTasks = tasks.map((t) => {
          if (t.id !== activeTaskId) return t;
          // Allow negative values for overtime
          const taskRemaining = (t.remainingTime ?? newRemaining) - 1;
          // Update timeSpentMinutes (accumulate 1 second = 1/60 minutes)
          const timeSpent = (t.timeSpentMinutes || 0) + (1 / 60);
          return { ...t, remainingTime: taskRemaining, timeSpentMinutes: timeSpent };
        });

        // Log session if we just crossed zero or are in overtime? 
        // Actually, let's keep logging simple: log when pausing or finishing.
        // If we are in overtime, we are still "active".

        set({
          timerRemaining: newRemaining,
          tasks: newTasks,
          // timerActive stays true
        });
      },

      // ---------- App reset ----------
      resetApp: () =>
        set({
          tasks: [],
          activeTaskId: null,
          focusMode: "Pomodoro",
          timerActive: false,
          timerRemaining: FOCUS_MODE_DURATIONS["Pomodoro"],
          sessionHistory: [],
          lastStartRemaining: null,
          spotifyToken: null,
          spotify: { accessToken: null, refreshToken: null, expiresAt: null },
          activePage: "Dashboard",
        }),
    }),
    {
      name: "zenith-app-storage",
      partialize: (state) => ({
        // Persist only what you need
        tasks: state.tasks,
        activeTaskId: state.activeTaskId,
        focusMode: state.focusMode,
        timerActive: state.timerActive,
        timerRemaining: state.timerRemaining,
        sessionHistory: state.sessionHistory,
        activePage: state.activePage,

        // Legacy token for old UI (safe to remove once migrated)
        spotifyToken: state.spotifyToken,

        // PKCE tokens
        spotify: state.spotify,
        // do NOT persist lastStartRemaining across reloads; it’s per-run
      }),
    }
  )
);
