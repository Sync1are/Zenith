// src/components/SpotifyCallback.tsx
import React, { useEffect, useState } from "react";
import { useSpotifyStore } from "../store/useSpotifyStore";

const SpotifyCallback: React.FC = () => {
  const acceptTokens = useSpotifyStore((s) => s.acceptOAuthTokens);
  const [message, setMessage] = useState("Completing Spotify login…");

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          setMessage(`Authorization error: ${error}`);
          // go home after a moment
          setTimeout(() => (window.location.href = "/"), 1200);
          return;
        }

        if (!code || !state) {
          setMessage("Missing authorization code or state.");
          setTimeout(() => (window.location.href = "/"), 1200);
          return;
        }

        // Validate state saved before redirect
        const expectedState = localStorage.getItem("spotify_oauth_state") || "";
        localStorage.removeItem("spotify_oauth_state");
        if (!expectedState || expectedState !== state) {
          setMessage("State mismatch. Aborting.");
          setTimeout(() => (window.location.href = "/"), 1200);
          return;
        }

        // Exchange authorization code for tokens (PKCE, no client_secret)
        const verifier = localStorage.getItem("spotify_pkce_verifier") || "";
        const body = new URLSearchParams({
          client_id: "c78fa3fb2fc34a76ae9f6771a403589f", // or use env
          grant_type: "authorization_code",
          code,
          redirect_uri: "http://127.0.0.1:5173",
          code_verifier: verifier,
        });

        const res = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });

        if (!res.ok) {
          const txt = await res.text();
          setMessage(`Token exchange failed: ${res.status} ${txt}`);
          setTimeout(() => (window.location.href = "/"), 1500);
          return;
        }

        const data = await res.json();
        // Save into the spotify store (access, refresh, expiry)
        acceptTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
        });

        setMessage("Spotify connected. Redirecting…");
        // Clean query params and go home
        window.location.href = "/";
      } catch (e: any) {
        console.error(e);
        setMessage("Unexpected error completing Spotify login.");
        setTimeout(() => (window.location.href = "/"), 1500);
      }
    };

    run();
  }, [acceptTokens]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111217]">
      <div className="text-white text-lg">{message}</div>
    </div>
  );
};

export default SpotifyCallback;
