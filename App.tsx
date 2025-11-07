import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TitleBar from './components/TitleBar';
import Tasks from './components/TasksPage';
import { useAppStore } from "./store/useAppStore";

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('Dashboard');

  // ✅ Call global tick once per second (stays active across page switches)
  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.getState().tick();
    }, 1000);

    return () => clearInterval(interval); // cleanup on hot reload
  }, []);

  const renderContent = () => {
    if (activePage === "Dashboard") return <Dashboard />;
    if (activePage === "Tasks") return <Tasks />;

    return (
      <div className="text-center p-8 bg-[#1C1C1E] rounded-2xl border border-gray-800">
        Content for {activePage} is not yet implemented.
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#111217] text-white flex flex-col">
      <TitleBar />

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
