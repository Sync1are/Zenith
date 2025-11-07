import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TitleBar from './components/TitleBar'; // ✅ ADD THIS
import Tasks from './components/TasksPage';
import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import { TaskStatus } from "./types";

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('Dashboard');
  const tick = useAppStore((s) => s.tick)
  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard />;
      default:
        return (
          <div className="text-center p-8 bg-[#1C1C1E] rounded-2xl border border-gray-800">
            Content for {activePage} is not yet implemented.
          </div>
        );
      case 'Tasks':
        return <Tasks />;
    }

  };
  useEffect(() => {
    
  }, []);

  return (
    <div className="min-h-screen bg-[#111217] text-white flex flex-col">
      <TitleBar /> {/* ✅ NEW CUSTOM TITLEBAR */}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem={activePage} onSelect={setActivePage} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-10 overflow-y-auto">
          <Header currentPage={activePage} />
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
