import React from 'react';
import { SearchIcon, BellIcon } from './icons/IconComponents';

interface HeaderProps {
  currentPage: string;
}

const Header: React.FC<HeaderProps> = ({ currentPage }) => {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white">{currentPage}</h1>
        <p className="text-gray-400">
          {currentPage === 'Dashboard' ? "Welcome back, let's be productive." : `Manage your ${currentPage.toLowerCase()}.`}
        </p>
      </div>

      <div className="flex items-center space-x-6">
        <SearchIcon className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
        <BellIcon className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
        <img src="https://picsum.photos/id/237/200/200" className="h-10 w-10 rounded-full border-2 border-orange-500" />
      </div>
    </header>
  );
};

export default Header;
