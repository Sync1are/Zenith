import React, { useState, useEffect, useCallback } from "react";

// UI Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import TitleBar from "./components/TitleBar";
import NotificationSystem from "./components/Notifications";
import TopNavBar from "./components/TopNavBar";

// Pages
import Dashboard from "./components/Dashboard";
import Tasks from "./components/TasksPage";
import CalendarPage from "./components/CalendarPage";
import FocusPage from "./components/FocusPage";
import SettingsPage from "./components/SettingsPage";
import ChatPage from "./components/ChatPage";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";

// Stores
import { useAppStore } from "./store/useAppStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { useSpotifyStore } from "./store/useSpotifyStore";
import { useMessageStore } from "./store/useMessageStore";
import { handleAuthRedirectIfPresent } from "./auth/spotifyAuth";

import { AnimatePresence } from "framer-motion";

const App: React.FC = () => {
  // 🌙 Navigation
  const activePage = useAppStore((s) => s.activePage);
  const setActivePage = useAppStore((s) => s.setActivePage);

  const [isSignup, setIsSignup] = useState(false);

  // 🌙 Messaging store
  const currentUser = useMessageStore((s) => s.currentUser);
  const activeUserId = useMessageStore((s) => s.activeUserId);
  const subscribeToUsers = useMessageStore((s) => s.subscribeToUsers);
  const subscribeToMessages = useMessageStore((s) => s.subscribeToMessages);
  const initAuth = useMessageStore((s) => s.initAuth);
  const isLoading = useMessageStore((s) => s.isLoading);

  // 🌙 Mobile drawer
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // 🌙 TopNav Server Tabs
  const [activeServerId, setActiveServerId] = useState("home");

  // Theme Sync
  useEffect(() => {
    const settings = useSettingsStore.getState();
    const stop = settings.startSystemThemeSync();
    settings.applyThemeToDom();
    return () => stop();
  }, []);

  // Initialize Auth
  useEffect(() => {
    const unsub = initAuth();

    // Safety timeout: if Firebase takes too long, stop loading
    const timer = setTimeout(() => {
      if (useMessageStore.getState().isLoading) {
        useMessageStore.setState({ isLoading: false });
      }
    }, 4000);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  // Messaging Subscriptions
  // 1. Subscribe to Users
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToUsers();
    return () => unsubscribe();
  }, [currentUser]);

  // 2. Subscribe to Active Chat Messages
  useEffect(() => {
    if (currentUser && activeUserId) {
      const unsub = subscribeToMessages(activeUserId);
      return () => unsub();
    }
  }, [currentUser, activeUserId]);

  // 3. Subscribe to Notifications (Global)
  const { subscribeToNotifications } = useMessageStore();
  useEffect(() => {
    if (currentUser) {
      const unsub = subscribeToNotifications();
      return () => unsub();
    }
  }, [currentUser]);

  // Tick timer
  useEffect(() => {
    const interval = setInterval(() => useAppStore.getState().tick(), 1000);
    return () => clearInterval(interval);
  }, []);

  // Spotify OAuth
  const acceptTokens = useSpotifyStore((s) => s.acceptOAuthTokens);
  useEffect(() => {
    handleAuthRedirectIfPresent(acceptTokens);
  }, [acceptTokens]);

  // Page switcher
  const renderContent = useCallback(() => {
    switch (activePage) {
      case "Dashboard": return <Dashboard />;
      case "Tasks": return <Tasks />;
      case "Calendar": return <CalendarPage />;
      case "Focus": return <FocusPage />;
      case "Analytics": return <AnalyticsPage />;
      case "Settings": return <SettingsPage />;
      default:
        return (
          <div className="p-6 bg-[#1C1C1E] rounded-xl border border-gray-700 text-gray-400">
            Page not implemented.
          </div>
        );
    }
  }, [activePage]);

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111217]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // AUTH FLOW
  if (!currentUser) {
    if (isSignup) {
      return <SignUpPage onNavigateToLogin={() => setIsSignup(false)} />;
    }
    return (
      <LoginPage
        onLoginSuccess={() => setActivePage("Dashboard")}
        onNavigateToSignup={() => setIsSignup(true)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#111217] text-white">

      <TitleBar />
      <NotificationSystem />

      {/* FIXED: TopNavBar now receives required props */}
      <TopNavBar
        activeServer={activeServerId}
        onSelect={(id) => setActiveServerId(id)}
      />

      <div className="flex flex-1 overflow-hidden pt-4 relative">

        {/* Sidebar */}
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

      {/* Chat overlay */}
      <AnimatePresence>
        {activeUserId && <ChatPage />}
      </AnimatePresence>
    </div>
  );
};

export default App;
