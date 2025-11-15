import React from 'react';
import { SearchIcon, BellIcon } from './icons/IconComponents';

interface HeaderProps {
  currentPage: string;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setSidebarOpen }) => {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">{currentPage}</h1>
          <p className="text-gray-400">
            {currentPage === 'Dashboard' ? "Welcome back, let's be productive." : `Manage your ${currentPage.toLowerCase()}.`}
          </p>
        </div>
      </div>


      <div className="flex items-center space-x-6">
        <SearchIcon className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
        <BellIcon className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
        <img src="https://picsum.photos/id/237/200/200" alt="User avatar" className="h-10 w-10 rounded-full border-2 border-orange-500" />
      </div>
    </header>
  );
};

export default Header;
