import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import FocusPage from "./components/FocusPage";
import Dashboard from "./components/Dashboard";
import TitleBar from "./components/TitleBar";
import Notifications from "./components/Notifications";
import Tasks from "./components/TasksPage";
import CalendarPage from "./components/CalendarPage";
import { useAppStore } from "./store/useAppStore";

// ✅ Spotify store + auth
import { useSpotifyStore } from "./store/useSpotifyStore";
import { beginLogin, handleAuthRedirectIfPresent } from "./auth/spotifyAuth";

const App: React.FC = () => {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // ========== GLOBAL TIMER ==========
  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.getState().tick();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ========== SIDEBAR RESPONSIVENESS ==========
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ========== TOUCH SWIPE (MOBILE) ==========
  useEffect(() => {
    if (window.innerWidth >= 768) return;
    let startX = 0;
    let startTime = 0;

    const handleStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startTime = Date.now();
    };
    const handleEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const diff = endX - startX;
      const duration = Date.now() - startTime;
      if (startX < 50 && diff > 100 && duration < 500) setIsMobileDrawerOpen(true);
      if (diff < -60) setIsMobileDrawerOpen(false);
    };

    window.addEventListener("touchstart", handleStart);
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchend", handleEnd);
    };
  }, []);

  // ========== DESKTOP MOUSE SWIPE ==========
  useEffect(() => {
    if (window.innerWidth >= 768) return;
    let isMouseDragging = false;
    let mouseStartX = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.clientX < 50) {
        isMouseDragging = true;
        mouseStartX = e.clientX;
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDragging && e.clientX - mouseStartX > 100) {
        setIsMobileDrawerOpen(true);
        isMouseDragging = false;
      }
    };
    const handleMouseUp = () => (isMouseDragging = false);

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // ========== SPOTIFY BOOTSTRAP ==========
  const acceptTokens = useSpotifyStore((s) => s.acceptOAuthTokens);
  const spotify = useSpotifyStore((s) => s.spotify);
  const skipNext = useSpotifyStore((s) => s.skipNext);
  const skipPrevious = useSpotifyStore((s) => s.skipPrevious);
  const togglePlayback = useSpotifyStore((s) => s.togglePlayback);
  const getCurrentlyPlaying = useSpotifyStore((s) => s.getCurrentlyPlaying);
  const ensureSpotifyAccessToken = useSpotifyStore((s) => s.ensureSpotifyAccessToken);

  // Complete PKCE OAuth flow if redirected from Spotify
  useEffect(() => {
    handleAuthRedirectIfPresent(acceptTokens);
  }, [acceptTokens]);

  // ========== QUICK GLOBAL SPOTIFY ACTIONS ==========
  const handleSkip = async () => {
    const res = await skipNext();
    alert(`Spotify: ${res.note}`);
  };

  const handlePrev = async () => {
    const res = await skipPrevious();
    alert(`Spotify: ${res.note}`);
  };

  const handleToggle = async () => {
    const data = await getCurrentlyPlaying();
    const isPlaying = data?.is_playing;
    const res = await togglePlayback(!isPlaying);
    alert(`Spotify: ${res.note}`);
  };

  // ========== PAGE RENDERER ==========
  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "Tasks":
        return <Tasks />;
      case "Calendar":
        return <CalendarPage />;
      case "Focus":
        return <FocusPage />;
      case "Analytics":
        return (
          <div className="text-center p-8 bg-[#1C1C1E] rounded-2xl border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Analytics</h2>
            <p className="text-gray-400">Analytics dashboard coming soon...</p>
          </div>
        );
      case "Settings":
        return (
          <div className="text-center p-8 bg-[#1C1C1E] rounded-2xl border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">⚙️ Settings</h2>
            <p className="text-gray-400">Settings panel coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="text-center p-8 bg-[#1C1C1E] rounded-2xl border border-gray-800">
            <p className="text-gray-400">Content for {activePage} not implemented.</p>
          </div>
        );
    }
  };

  // ========== APP UI ==========
  return (
    <div className="min-h-screen bg-[#111217] text-white flex flex-col">
      <TitleBar />
      <Notifications />

      {/* 🔊 Global Spotify Controls */}
      <div className="fixed top-2 right-4 z-40 flex items-center gap-2 bg-[#1C1C1E]/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 shadow-xl hidden">
        {!spotify.accessToken ? (
          <button
            onClick={() => beginLogin()}
            className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-lg text-white text-sm font-semibold"
          >
            Connect Spotify
          </button>
        ) : (
          <>
            <button
              onClick={handlePrev}
              className="hover:bg-white/10 px-3 py-1 rounded-lg text-sm transition"
              title="Previous track"
            >
              ⏮️
            </button>
            <button
              onClick={handleToggle}
              className="hover:bg-white/10 px-3 py-1 rounded-lg text-sm transition"
              title="Play / Pause"
            >
              ⏯️
            </button>
            <button
              onClick={handleSkip}
              className="hover:bg-white/10 px-3 py-1 rounded-lg text-sm transition"
              title="Next track"
            >
              ⏭️
            </button>
          </>
        )}
      </div>

      {/* Overlay for mobile drawer */}
      {isMobileDrawerOpen && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden pt-10">
        <Sidebar
          activeItem={activePage}
          onSelect={(page) => {
            setActivePage(page);
            setIsMobileDrawerOpen(false);
          }}
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-full px-4 sm:px-6 lg:px-10 py-6">
            <Header currentPage={activePage} setSidebarOpen={setIsMobileDrawerOpen} />
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
