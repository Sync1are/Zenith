import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('Dashboard');

  const renderContent = () => {
    switch(activePage) {
      case 'Dashboard':
        return <Dashboard />;
      default:
        return (
          <div className="text-center p-8 bg-[#1C1C1E] rounded-2xl border border-gray-800">
            Content for {activePage} is not yet implemented.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#111217] text-white flex">
      <Sidebar activeItem={activePage} onSelect={setActivePage} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Header currentPage={activePage} />
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
