// src/store/useSpotifyStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { beginLogin } from "../auth/spotifyAuth";

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

interface SpotifyState {
  // Tokens
  spotify: SpotifyTokens;
  setSpotifyTokens: (t: SpotifyTokens) => void;
  clearSpotifyTokens: () => void;

  // Lifecycle
  connect: () => void;
  disconnect: () => void;
  ensureSpotifyAccessToken: () => Promise<string | null>;
  acceptOAuthTokens: (data: { access_token: string; refresh_token: string; expires_in: number }) => void;

  // Player helpers
  getCurrentlyPlaying: () => Promise<any | null>;
  togglePlayback: (play: boolean) => Promise<{ ok: boolean; status: number; note: string }>;
  skipNext: () => Promise<{ ok: boolean; status: number; note: string }>;
  skipPrevious: () => Promise<{ ok: boolean; status: number; note: string }>;
  getDevices: () => Promise<Device[] | null>;
  transferPlayback: (deviceId: string, play?: boolean) => Promise<{ ok: boolean; status: number; note: string }>;
}

// Prefer env var in Vite/Electron for Client ID
const SPOTIFY_CLIENT_ID =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SPOTIFY_CLIENT_ID) ||
  process.env.SPOTIFY_CLIENT_ID ||
  "c78fa3fb2fc34a76ae9f6771a403589f";

// Internal refresh helper (PKCE: no client_secret)
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

export const useSpotifyStore = create<SpotifyState>()(
  persist(
    (set, get) => ({
      spotify: { accessToken: null, refreshToken: null, expiresAt: null },

      setSpotifyTokens: (t) => set({ spotify: t }),

      clearSpotifyTokens: () => set({ spotify: { accessToken: null, refreshToken: null, expiresAt: null } }),

      connect: () => {
        beginLogin();
      },

      disconnect: () => {
        set({ spotify: { accessToken: null, refreshToken: null, expiresAt: null } });
      },

      acceptOAuthTokens: async (data) => {
        const expiresAt = Date.now() + (data.expires_in - 30) * 1000;

        let secureRefreshToken = data.refresh_token;
        if (window.electronAPI?.spotify?.encryptToken) {
          try {
            secureRefreshToken = await window.electronAPI.spotify.encryptToken(data.refresh_token);
          } catch (e) {
            console.error("Failed to encrypt token", e);
          }
        }

        set({
          spotify: {
            accessToken: data.access_token,
            refreshToken: secureRefreshToken,
            expiresAt,
          },
        });
      },

      ensureSpotifyAccessToken: async () => {
        const { spotify } = get();
        const now = Date.now();
        if (spotify.accessToken && spotify.expiresAt && now < spotify.expiresAt - 30_000) {
          return spotify.accessToken;
        }
        if (!spotify.refreshToken) return null;
        try {
          if (window.electronAPI?.spotify?.refreshToken) {
            const data = await window.electronAPI.spotify.refreshToken(spotify.refreshToken);
            const expiresAt = Date.now() + (data.expires_in - 30) * 1000;

            let newRefreshToken = spotify.refreshToken;
            if (data.refresh_token) {
              newRefreshToken = await window.electronAPI.spotify.encryptToken(data.refresh_token);
            }

            set({
              spotify: {
                accessToken: data.access_token,
                refreshToken: newRefreshToken,
                expiresAt,
              },
            });
            return data.access_token;
          } else {
            // Fallback for non-Electron environments
            const data = await refreshAccessToken(spotify.refreshToken);
            const expiresAt = Date.now() + (data.expires_in - 30) * 1000;
            set({
              spotify: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || spotify.refreshToken,
                expiresAt,
              },
            });
            return data.access_token;
          }
        } catch (e) {
          console.error(e);
          set({ spotify: { accessToken: null, refreshToken: spotify.refreshToken, expiresAt: null } });
          return null;
        }
      },

      // ----- Player helpers -----
      getCurrentlyPlaying: async () => {
        const token = await get().ensureSpotifyAccessToken();
        if (!token) return null;
        const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 204 || !res.ok) return null;
        return res.json();
      },

      togglePlayback: async (play: boolean) => {
        const token = await get().ensureSpotifyAccessToken();
        if (!token) return { ok: false, status: 0, note: "Not connected" };
        const endpoint = play ? "play" : "pause";
        const res = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 204) return { ok: true, status: 204, note: play ? "Playing" : "Paused" };
        if (res.status === 403) return { ok: false, status: 403, note: "Premium or scope missing" };
        if (res.status === 404) return { ok: false, status: 404, note: "No active device" };
        return { ok: res.ok, status: res.status, note: await res.text().catch(() => "Error") };
      },

      skipNext: async () => {
        const token = await get().ensureSpotifyAccessToken();
        if (!token) return { ok: false, status: 0, note: "Not connected" };
        const res = await fetch("https://api.spotify.com/v1/me/player/next", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 204) return { ok: true, status: 204, note: "Skipped" };
        if (res.status === 403) return { ok: false, status: 403, note: "Premium or scope missing" };
        if (res.status === 404) return { ok: false, status: 404, note: "No active device" };
        return { ok: res.ok, status: res.status, note: await res.text().catch(() => "Error") };
      },

      skipPrevious: async () => {
        const token = await get().ensureSpotifyAccessToken();
        if (!token) return { ok: false, status: 0, note: "Not connected" };
        const res = await fetch("https://api.spotify.com/v1/me/player/previous", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 204) return { ok: true, status: 204, note: "Skipped Previous" };
        if (res.status === 403) return { ok: false, status: 403, note: "Premium or scope missing" };
        if (res.status === 404) return { ok: false, status: 404, note: "No active device" };
        return { ok: res.ok, status: res.status, note: await res.text().catch(() => "Error") };
      },

      getDevices: async () => {
        const token = await get().ensureSpotifyAccessToken();
        if (!token) return null;
        const res = await fetch("https://api.spotify.com/v1/me/player/devices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return (data?.devices ?? []) as Device[];
      },

      transferPlayback: async (deviceId: string, play = true) => {
        const token = await get().ensureSpotifyAccessToken();
        if (!token) return { ok: false, status: 0, note: "Not connected" };
        const res = await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ device_ids: [deviceId], play }),
        });
        if (res.status === 204) return { ok: true, status: 204, note: "Transferred" };
        if (res.status === 403) return { ok: false, status: 403, note: "Premium or scope missing" };
        return { ok: res.ok, status: res.status, note: await res.text().catch(() => "Error") };
      },
    }),
    {
      name: "spotify-store",
      partialize: (state) => ({ spotify: state.spotify }),
    }
  )
);
