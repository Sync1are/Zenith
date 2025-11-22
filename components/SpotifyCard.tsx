import React, { useEffect, useState } from "react";
import { beginLogin } from "../auth/spotifyAuth";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { FastAverageColor } from "fast-average-color";

// --- SVG Icons ---
const IconProps = { className: "w-5 h-5" };
const SmallIconProps = { className: "w-4 h-4" };

const SpotifyLogo = ({ className = "w-8 h-8" }) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      fill="currentColor"
      d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12
         12-5.373 12-12S18.627 0 12 0zm5.923 17.585a.625.625 0
         01-.881.107c-2.3-1.412-5.143-1.733-8.532-.952a.625.625 0
         01-.685-.589.625.625 0 01.589-.685c3.64-.833
         6.743-.473 9.28 1.053a.625.625 0
         01.229.873zm1.12-2.733a.75.75 0
         01-1.056.128c-2.583-1.583-6.438-2.03-9.584-1.114a.75.75
         0 01-.818-.707.75.75 0
         01.707-.818c3.486-.995 7.693-.505 10.559
         1.28a.75.75 0 01-.06.942zm.13-2.983c-2.982-1.742-7.92-1.91-11.13-1.047a.875.875
         0 01-.986-.81.875.875 0 01.81-.985c3.653-.945 8.995-.74
         12.32 1.2a.875.875 0 01.375 1.135.875.875 0
         01-1.135.374z"
    />
  </svg>
);
const PlayIcon = ({ className = "w-6 h-6" }) => <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = ({ className = "w-6 h-6" }) => <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const PrevIcon = (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"></path></svg>;
const NextIcon = (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path></svg>;
const ShuffleIcon = (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"></path></svg>;
const RepeatIcon = (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"></path></svg>;
const PlaylistIcon = (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M2 16h8v-2H2v2zm0-4h12v-2H2v2zm0-4h12V6H2v2zm14 8v-6l5 3-5 3z"></path></svg>;
const CloseIcon = (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>;


// --- Main Component ---
const SpotifyCard: React.FC = () => {
  const { spotify, ensureSpotifyAccessToken, getCurrentlyPlaying, togglePlayback, skipNext, skipPrevious } = useSpotifyStore();

  const [track, setTrack] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [avgColor, setAvgColor] = useState("rgba(34,197,94,0.2)");
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const controls = useAnimation();
  const fac = new FastAverageColor();

  // --- Fetch current track ---
  const refresh = async () => {
    const token = await ensureSpotifyAccessToken();
    if (!token) return;
    const data = await getCurrentlyPlaying();
    if (data?.item) {
      const t = {
        name: data.item.name,
        artists: data.item.artists,
        album: data.item.album,
        is_playing: data.is_playing,
        progress_ms: data.progress_ms,
        duration_ms: data.item.duration_ms,
      };
      setTrack(t);
      setProgress((t.progress_ms / t.duration_ms) * 100);
    } else {
      setTrack(null);
    }
  };

  // --- Extract average color ---
  useEffect(() => {
    const img = track?.album?.images?.[1]?.url;
    if (!img) return;
    fac
      .getColorAsync(img, { crossOrigin: "Anonymous" })
      .then((color) => setAvgColor(color.rgba))
      .catch(() => setAvgColor("rgba(34,197,94,0.2)"));
  }, [track?.album?.images]);

  // --- Sync every 5s ---
  useEffect(() => {
    if (!spotify.accessToken) return;
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [spotify.accessToken]);

  // --- Local smooth progress updater ---
  useEffect(() => {
    if (!track || !track.is_playing) return;
    const tick = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (track.duration_ms / 1000)) * 0.2;
        return next >= 100 ? 100 : next;
      });
    }, 200);
    return () => clearInterval(tick);
  }, [track?.is_playing, track?.duration_ms]);

  // --- Pulse animation ---
  useEffect(() => {
    if (track?.is_playing) {
      controls.start({
        scale: [1, 1.05, 1],
        opacity: [0.6, 1, 0.6],
        transition: { repeat: Infinity, duration: 6, ease: "easeInOut" },
      });
    } else {
      controls.stop();
    }
  }, [track?.is_playing]);

  // --- Handlers ---
  const handleToggle = async () => {
    if (!track) return;
    await togglePlayback(!track.is_playing);
    setTimeout(refresh, 400);
  };
  const handlePrev = async () => {
    await skipPrevious();
    setTimeout(refresh, 400);
  };
  const handleNext = async () => {
    await skipNext();
    setTimeout(refresh, 400);
  };
  const loadPlaylists = async () => {
    const token = await ensureSpotifyAccessToken();
    if (!token) return;

    // Fetch user's playlists
    const res = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    // ✅ Custom featured playlists (public, pre-defined)
    const featured = [
      {
        id: "lofi_radio",
        name: "🌙 Lofi Radio",
        uri: "spotify:playlist:6zCID88oNjNv9zx6puDHKj?si=b6397d1c50134651",
        images: [
          { url: "https://img.pastemagazine.com/wp-content/avuploads/2021/04/15033731/gi79ifbaoxccktwww6p2.jpg" },
        ],
        tracks: { total: "∞" },
        type: "featured",
      },
      {
        id: "focus_vibes",
        name: "🧠 Focus Beats",
        uri: "spotify:playlist:4oLvLtb980kEA0qt8QcvmQ",
        images: [
          { url: "https://ichef.bbci.co.uk/images/ic/224x224/p0cjtr52.jpg.webp" },
        ],
        tracks: { total: 100 },
        type: "featured",
      },

    ];

    const userPlaylists = (data.items || []).map((p) => ({
      ...p,
      type: "user",
    }));

    setPlaylists([...featured, ...userPlaylists]);
    setShowPlaylists(true);
  };


  const playSelected = async (uri: string) => {
    const token = await ensureSpotifyAccessToken();
    if (!token) return;

    try {
      // 1️⃣ Enable shuffle
      await fetch("https://api.spotify.com/v1/me/player/shuffle?state=true", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      // 2️⃣ Start playback using the playlist URI
      await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context_uri: uri, // Play the selected playlist
          offset: { position: Math.floor(Math.random() * 10) }, // optional: start randomly
        }),
      });

      // 3️⃣ Hide overlay and refresh
      setShowPlaylists(false);
      setTimeout(refresh, 2000);
    } catch (err) {
      console.error("Failed to play playlist:", err);
    }
  };

  const formatTime = (ms: number) => {
    if (!ms) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, "0")}`;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-2xl p-4 shadow-2xl mt-6 transition-all">
      <motion.div
        animate={controls}
        className="absolute inset-0 blur-3xl opacity-50"
        style={{
          background: `conic-gradient(from 180deg at 50% 50%, ${avgColor} 0deg, rgba(0,0,0,0.5) 180deg, ${avgColor} 360deg)`,
        }}
      />

      <div className="relative z-10 flex flex-col h-full text-white">
        {!spotify.accessToken ? (
          <ConnectView />
        ) : !track ? (
          <EmptyView />
        ) : (
          <PlayerView
            track={track}
            progress={progress}
            formatTime={formatTime}
            handlePrev={handlePrev}
            handleToggle={handleToggle}
            handleNext={handleNext}
            loadPlaylists={loadPlaylists}
          />
        )}
      </div>

      <AnimatePresence>
        {showPlaylists && (
          <PlaylistView
            playlists={playlists}
            playSelected={playSelected}
            setShowPlaylists={setShowPlaylists}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- UI Subcomponents ---
const ConnectView = () => (
  <div className="flex items-center justify-between h-full gap-4">
    <div className="flex items-center gap-4">
      <SpotifyLogo className="w-12 h-12 text-white/80 flex-shrink-0" />
      <div>
        <h2 className="font-semibold text-base">Connect Spotify</h2>
        <p className="text-xs text-white/60">Control your music from here.</p>
      </div>
    </div>
    <button
      onClick={beginLogin}
      className="bg-[#1DB954] hover:bg-[#1ED760] px-4 py-2 rounded-full text-white font-bold text-sm transition-transform hover:scale-105"
    >
      Connect
    </button>
  </div>
);

const EmptyView = () => (
  <div className="flex items-center justify-center h-full text-center text-white/70 gap-4 py-8">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
    </svg>
    <div>
      <p className="font-semibold">No music playing</p>
      <p className="text-sm opacity-80">Your sound space is quiet.</p>
    </div>
  </div>
);

const PlayerView = ({ track, progress, formatTime, handlePrev, handleToggle, handleNext, loadPlaylists }) => (
  <div className="flex flex-row items-center h-full gap-4">
    <motion.img
      src={track?.album?.images?.[1]?.url || "/placeholder.png"}
      className="relative w-24 h-24 rounded-lg shadow-lg object-cover flex-shrink-0"
      alt={track.album?.name}
    />
    <div className="flex flex-col flex-1 h-full justify-between min-w-0 self-stretch py-1">
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-base truncate drop-shadow-md">{track.name}</p>
          <p className="text-sm opacity-80 truncate">{track.artists?.map((a: any) => a.name).join(", ")}</p>
        </div>
        <button onClick={loadPlaylists} className="p-2 -mr-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition flex-shrink-0">
          <PlaylistIcon {...SmallIconProps} />
        </button>
      </div>

      <div className="w-full">
        <div>
          <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-white h-1.5 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2, ease: "linear" }}
            />
          </div>
          <div className="flex justify-between text-xs opacity-70 mt-1">
            <span>{formatTime((progress / 100) * track.duration_ms)}</span>
            <span>{formatTime(track.duration_ms)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 -mb-1">
          <button className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"><ShuffleIcon {...SmallIconProps} /></button>
          <button onClick={handlePrev} className="p-2 rounded-full text-white/90 hover:bg-white/10 hover:text-white transition"><PrevIcon {...IconProps} /></button>
          <button onClick={handleToggle} className="bg-white text-black rounded-full p-2.5 shadow-lg transform transition-transform hover:scale-110 active:scale-100">
            {track.is_playing ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          </button>
          <button onClick={handleNext} className="p-2 rounded-full text-white/90 hover:bg-white/10 hover:text-white transition"><NextIcon {...IconProps} /></button>
          <button className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"><RepeatIcon {...SmallIconProps} /></button>
        </div>
      </div>
    </div>
  </div>
);

const PlaylistView = ({ playlists, playSelected, setShowPlaylists }) => {
  const featured = playlists.filter((p) => p.type === "featured");
  const userOwned = playlists.filter((p) => p.type === "user");

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col p-4 z-20"
    >
      <header className="flex items-center justify-between mb-4 flex-shrink-0 px-2">
        <h3 className="text-lg font-bold text-white/90">Select a Playlist</h3>
        <button
          onClick={() => setShowPlaylists(false)}
          className="p-2 rounded-full hover:bg-white/20 transition"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pr-1 space-y-6">
        {/* Featured Playlists */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
            Featured
          </h4>
          {featured.length === 0 ? (
            <p className="text-xs text-gray-500 px-1">No featured playlists available.</p>
          ) : (
            <div className="space-y-2">
              {featured.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => playSelected(pl.uri)}
                  className="flex items-center gap-4 w-full text-left bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition"
                >
                  <img
                    src={pl.images?.[0]?.url || "/placeholder.png"}
                    className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                    alt={pl.name}
                  />
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{pl.name}</p>
                    <p className="text-xs text-gray-400">
                      {pl.tracks?.total || "∞"} tracks
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User’s Playlists */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
            Yours
          </h4>
          {userOwned.length === 0 ? (
            <p className="text-xs text-gray-500 px-1">No playlists found in your account.</p>
          ) : (
            <div className="space-y-2">
              {userOwned.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => playSelected(pl.uri)}
                  className="flex items-center gap-4 w-full text-left bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition"
                >
                  <img
                    src={pl.images?.[0]?.url || "/placeholder.png"}
                    className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                    alt={pl.name}
                  />
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{pl.name}</p>
                    <p className="text-xs text-gray-400">
                      {pl.tracks?.total} tracks
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SpotifyCard;
