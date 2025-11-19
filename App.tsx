import React, { useState, useEffect, useCallback } from "react";

// UI Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import TitleBar from "./components/TitleBar";
import Notifications from "./components/Notifications";
import TopNavBar from "./components/TopNavBar";

// Pages
import Dashboard from "./components/Dashboard";
import Tasks from "./components/TasksPage";
import CalendarPage from "./components/CalendarPage";
import FocusPage from "./components/FocusPage";
import AnalyticsPage from "./components/AnalyticsPage";
import SettingsPage from "./components/SettingsPage";
import ChatPage from "./components/ChatPage";

// Stores & Spotify
import { useAppStore } from "./store/useAppStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { useSpotifyStore } from "./store/useSpotifyStore";
import { useMessageStore } from "./store/useMessageStore";
import { beginLogin, handleAuthRedirectIfPresent } from "./auth/spotifyAuth";
import { AnimatePresence } from "framer-motion";

const App: React.FC = () => {
  const [activePage, setActivePage] = useState("Dashboard");

  // Messaging Store
  const { activeUserId } = useMessageStore();

  // Mobile drawer
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Theme Sync
  useEffect(() => {
    const settingsState = useSettingsStore.getState();
    const stop = settingsState.startSystemThemeSync();
    settingsState.applyThemeToDom();
    return () => stop();
  }, []);

  // Global tick timer
  useEffect(() => {
    const interval = setInterval(() => useAppStore.getState().tick(), 1000);
    return () => clearInterval(interval);
  }, []);

  // Spotify OAuth
  const acceptTokens = useSpotifyStore((s) => s.acceptOAuthTokens);
  useEffect(() => {
    handleAuthRedirectIfPresent(acceptTokens);
  }, [acceptTokens]);

  // Page Renderer
  const renderContent = useCallback(() => {
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
        return <AnalyticsPage />;
      case "Settings":
        return <SettingsPage />;
      default:
        return (
          <div className="p-6 bg-[#1C1C1E] rounded-xl border border-gray-700 text-gray-400">
            Page not implemented.
          </div>
        );
    }
  }, [activePage]);

  return (
    <div className="min-h-screen flex flex-col bg-[#111217] text-white">

      <TitleBar />
      <Notifications />

      {/* Top Navigation (User List) */}
      <TopNavBar />

      <div className="flex flex-1 overflow-hidden pt-4 relative">

        {/* Sidebar - Always Visible */}
        <Sidebar
          activeItem={activePage}
          onSelect={(page) => {
            setActivePage(page);
            setIsMobileDrawerOpen(false);
          }}
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        />

        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-full px-6 lg:px-10 py-6 md:pl-24">
            <Header
              currentPage={activePage}
              setSidebarOpen={setIsMobileDrawerOpen}
            />
            {renderContent()}
          </div>
        </main>

      </div>

      {/* Chat Overlay - Floating Window */}
      <AnimatePresence>
        {activeUserId && <ChatPage />}
      </AnimatePresence>
    </div>
  );
};

export default App;
