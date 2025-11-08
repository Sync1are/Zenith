import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FocusPage from './components/FocusPage';
import Dashboard from './components/Dashboard';
import TitleBar from './components/TitleBar';
import Notifications from './components/Notifications';
import Tasks from './components/TasksPage';
import CalendarPage from './components/CalendarPage';
import { useAppStore } from "./store/useAppStore";

const App: React.FC = () => {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // ✅ Global timer (runs regardless of active page)
  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.getState().tick();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ Auto toggle sidebar based on screen size
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Swipe gesture (mobile) - from left edge
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
      const duration = Date.now() - startTime;
      const diff = endX - startX;

      // Swipe from left edge (within 50px) to the right
      if (startX < 50 && diff > 100 && duration < 500) {
        setIsMobileDrawerOpen(true);
      }

      // Swipe left to close
      if (diff < -60) {
        setIsMobileDrawerOpen(false);
      }
    };

    window.addEventListener("touchstart", handleStart);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchend", handleEnd);
    };
  }, []);

  // ✅ Mouse drag gesture (desktop, from left edge)
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
      if (isMouseDragging) {
        const dragDistance = e.clientX - mouseStartX;
        if (dragDistance > 100) {
          setIsMobileDrawerOpen(true);
          isMouseDragging = false;
        }
      }
    };

    const handleMouseUp = () => {
      isMouseDragging = false;
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const renderContent = () => {
    if (activePage === "Dashboard") return <Dashboard />;
    if (activePage === "Tasks") return <Tasks />;
    if (activePage === "Calendar") return <CalendarPage />;
    if (activePage === "Focus") return <FocusPage />;
    if (activePage === "Analytics") return (
      <div className="text-center p-8 bg-[#1C1C1E] rounded-2xl border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-4">📊 Analytics</h2>
        <p className="text-gray-400">Analytics dashboard coming soon...</p>
      </div>
    );
    if (activePage === "Settings") return (
      <div className="text-center p-8 bg-[#1C1C1E] rounded-2xl border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-4">⚙️ Settings</h2>
        <p className="text-gray-400">Settings panel coming soon...</p>
      </div>
    );

    return (
      <div className="text-center p-8 bg-[#1C1C1E] rounded-2xl border border-gray-800">
        Content for {activePage} is not yet implemented.
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#111217] text-white flex flex-col">
      <TitleBar />
      <Notifications /> 

      {/* Mobile overlay - for drawer */}
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
            {/* Responsive padding for ALL pages is controlled right here */}
            <Header 
              currentPage={activePage}
              setSidebarOpen={setIsMobileDrawerOpen}
            />
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
