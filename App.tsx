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
import AnalyticsPage from "./components/AnalyticsPage";

// Stores
import { useAppStore } from "./store/useAppStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { useSpotifyStore } from "./store/useSpotifyStore";
import { useMessageStore } from "./store/useMessageStore";
import { useCalendarStore } from "./store/useCalendarStore";
import { useFocusStore } from "./store/useFocusStore";
import { handleAuthRedirectIfPresent } from "./auth/spotifyAuth";
import { useFirebaseSync } from "./utils/firebaseSync";

// Animations
import { AnimatePresence, motion } from "framer-motion";

import LiveBackground from "./components/LiveBackground";
import StudySessionModal from './components/StudySessionModal';
import MigrationLoadingScreen from './components/MigrationLoadingScreen';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './config/firebase';
import { useMigrationStore } from './store/useMigrationStore';
import { useSuperFocus } from "./hooks/useSuperFocus";

const App: React.FC = () => {
  // 🌙 Navigation
  const activePage = useAppStore((s) => s.activePage);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const superFocus = useSuperFocus();

  // 🌙 Migration state
  const isMigrating = useMigrationStore((s) => s.isMigrating);

  // Study Session State
  const { studySession, setStudySessionOpen, handleIncomingCall } = useAppStore();

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

  // 🔥 Firebase Store Sync (only when user is logged in)
  useFirebaseSync({
    collectionName: 'app-state',
    store: useAppStore,
    selector: (state) => ({
      tasks: state.tasks,
      sessionHistory: state.sessionHistory,
      focusMode: state.focusMode,
      timerRemaining: state.timerRemaining,
      activePage: state.activePage,
      spotify: state.spotify,
    }),
  });

  useFirebaseSync({
    collectionName: 'calendar-state',
    store: useCalendarStore,
  });

  useFirebaseSync({
    collectionName: 'settings-state',
    store: useSettingsStore,
  });

  useFirebaseSync({
    collectionName: 'focus-state',
    store: useFocusStore,
  });

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

  // 4. Listen for incoming calls (Global)
  useEffect(() => {
    if (!currentUser) return;

    // We listen to a specific document for incoming calls
    // This requires a backend trigger or client-side write to `users/{userId}/incoming_call`
    // Since we implemented `sendMessage` with `call_invite` type, we can listen to that?
    // But `sendMessage` writes to `chats/{chatId}/messages`.

    // Ideally, we should have a separate listener for "invites".
    // For now, let's assume the `StudySessionModal` handles the "active" state.
    // But for "ringing", we need to know when someone calls us.

    // If we rely on `call_invite` messages, the user has to be in the chat to see it.
    // To make it global, we need a global listener.

    // Let's implement a simple listener on the user's profile for a "currentCall" field?
    // Or just rely on the chat message notification?

    // Given the constraints, let's stick to the chat message for now.
    // If the user gets a message with type 'call_invite', we could trigger the modal?
    // But we don't have a global message listener for ALL chats.

    // Let's add a listener to `users/{userId}/incoming_call/active`
    const callRef = doc(db, "users", currentUser.id, "incoming_call", "active");
    const unsub = onSnapshot(callRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.sessionCode && !studySession.isOpen) {
          handleIncomingCall(data.sessionCode, data.callerId);
        }
      }
    });

    return () => unsub();
  }, [currentUser, studySession.isOpen]);

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

  return (
    <div className="min-h-screen flex flex-col text-white relative">
      {/* 🔄 Migration Loading Screen */}
      <MigrationLoadingScreen isVisible={isMigrating} />

      {/* 🌿 Live Environment Background (Fixed z-0) */}
      <LiveBackground />

      {/* Auth Flow */}
      {!currentUser ? (
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          {isSignup ? (
            <SignUpPage onNavigateToLogin={() => setIsSignup(false)} />
          ) : (
            <LoginPage
              onLoginSuccess={() => setActivePage("Dashboard")}
              onNavigateToSignup={() => setIsSignup(true)}
            />
          )}
        </div>
      ) : (
        /* Content Wrapper (z-10) */
        <div className="relative z-10 flex flex-col h-full min-h-screen">
          {/* Hide TitleBar in Super Focus Mode */}
          <AnimatePresence>
            {!superFocus.isActive && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="z-50"
              >
                <TitleBar />
              </motion.div>
            )}
          </AnimatePresence>
          <NotificationSystem />

          {/* Hide TopNavBar in Super Focus Mode */}
          <AnimatePresence>
            {!superFocus.isActive && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <TopNavBar
                  activeServer={activeServerId}
                  onSelect={(id) => setActiveServerId(id)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-1 overflow-hidden pt-4 relative">

            {/* Hide Sidebar in Super Focus Mode */}
            <AnimatePresence>
              {!superFocus.isActive && (
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="h-full"
                >
                  <Sidebar
                    activeItem={activePage}
                    onSelect={(page) => {
                      setActivePage(page);
                      setIsMobileDrawerOpen(false);
                    }}
                    isMobileDrawerOpen={isMobileDrawerOpen}
                    setIsMobileDrawerOpen={setIsMobileDrawerOpen}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <main className="flex-1 overflow-y-auto w-full">
              <div className={`max-w-full px-6 lg:px-10 py-6 transition-all duration-500 ${!superFocus.isActive ? 'md:pl-24' : 'pl-0'}`}>
                {/* Hide Header in Super Focus Mode */}
                <AnimatePresence>
                  {!superFocus.isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <Header
                        currentPage={activePage}
                        setSidebarOpen={setIsMobileDrawerOpen}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 🚀 ANIMATED PAGE TRANSITION START */}
                {/* 🍃 NATURAL / SUBTLE DRIFT */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePage}
                    initial={{ opacity: 0, y: 8 }}   // Starts 8px down, invisible
                    animate={{ opacity: 1, y: 0 }}   // Floats up to natural position
                    exit={{ opacity: 0, y: -8 }}     // Floats up and vanishes
                    transition={{
                      duration: 0.2,
                      ease: "easeOut"                // Natural deceleration
                    }}
                    className="w-full h-full"
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
                {/* 🚀 ANIMATED PAGE TRANSITION END */}

              </div>
            </main>

          </div>

          {/* Chat overlay */}
          <AnimatePresence>
            {activeUserId && <ChatPage />}
          </AnimatePresence>

          {/* Study Session Modal (Global) */}
          <StudySessionModal />
        </div>
      )}
    </div>
  );
};

export default App;
