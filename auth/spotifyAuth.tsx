// src/auth/spotifyAuth.ts
import { generateCodeChallenge, generateCodeVerifier, randomState } from "./pkce";

export const SPOTIFY_CLIENT_ID = "c78fa3fb2fc34a76ae9f6771a403589f";
export const REDIRECT_URI = "https://zenith-puce-iota.vercel.app/callback";


export const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");

const LS_VERIFIER = "spotify_pkce_verifier";
const LS_STATE = "spotify_oauth_state";

export async function beginLogin() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = randomState();

  localStorage.setItem(LS_VERIFIER, verifier);
  localStorage.setItem(LS_STATE, state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  console.log('[Spotify Auth] Navigating to Spotify authorization...');

  // Simply navigate the Electron window to Spotify auth
  // After auth, Spotify redirects to the web URL, but we're still in Electron window
  window.location.href = authUrl;
}

export async function handleAuthRedirectIfPresent(
  acceptTokens: (d: { access_token: string; refresh_token: string; expires_in: number }) => void
) {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) {
    console.error("Spotify error:", error);
    window.history.replaceState({}, "", "/");
    return;
  }
  if (!code || !state) return;

  const expected = localStorage.getItem(LS_STATE) || "";
  localStorage.removeItem(LS_STATE);
  if (!expected || expected !== state) {
    console.error("State mismatch");
    window.history.replaceState({}, "", "/");
    return;
  }

  const verifier = localStorage.getItem(LS_VERIFIER) || "";
  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!res.ok) {
    console.error("Token exchange failed:", res.status, await res.text());
    window.history.replaceState({}, "", "/");
    return;
  }
  const data = await res.json();
  acceptTokens(data);
  window.history.replaceState({}, "", "/");
}
