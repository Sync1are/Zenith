
import React from 'react';
import { SearchIcon, BellIcon } from './icons/IconComponents';

interface HeaderProps {
    currentPage: string;
}

const Header: React.FC<HeaderProps> = ({ currentPage }) => {
  const welcomeMessage = currentPage === 'Dashboard' 
    ? "Welcome back, let's be productive today!" 
    : `Manage your ${currentPage.toLowerCase()} here.`;

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white">{currentPage}</h1>
        <p className="text-gray-400">{welcomeMessage}</p>
      </div>
      <div className="flex items-center space-x-6">
        <button 
            onClick={() => alert('Search functionality is not yet implemented.')}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Search"
        >
          <SearchIcon className="h-6 w-6" />
        </button>
        <button 
            onClick={() => alert('Notifications are not yet implemented.')}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="View notifications"
        >
          <BellIcon className="h-6 w-6" />
        </button>
        <img
          src="https://picsum.photos/id/237/200/200"
          alt="User Avatar"
          className="h-10 w-10 rounded-full object-cover border-2 border-orange-500"
        />
      </div>
    </header>
  );
};

export default Header;
