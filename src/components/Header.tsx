import React, { useState } from 'react';
// FIX: Use relative paths for component and context imports.
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { MenuIcon } from './icons/MenuIcon';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';

const getTitle = (pathname: string) => {
    switch (pathname) {
        case '/dashboard': return 'Global Dashboard';
        case '/trade-signals': return 'AI Trade Signals';
        case '/agents': return 'AI Agent Swarm';
        case '/risk': return 'Risk Guardian';
        case '/market-data': return 'Data Fusion Engine';
        case '/manipulation': return 'Anomaly Detection';
        case '/predatory-analysis': return 'Predatory Analysis';
        case '/system-status': return 'System Architecture';
        case '/trade-blotter': return 'Trade Blotter';
        case '/execution-core': return 'Autonomous Execution Core';
        case '/profile': return 'User Profile';
        default: return 'Autonomous Trading AI';
    }
};

const Header: React.FC = () => {
  const { toggleSidebar } = useUI();
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = getTitle(location.pathname);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="flex-shrink-0 bg-[var(--color-bg-secondary)]/80 backdrop-blur-sm px-4 md:px-6 lg:px-8 z-20">
      <div className="flex items-center justify-between h-20 border-b border-[var(--color-border)]">
        <div className="flex items-center">
            <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 -ml-2 mr-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                aria-label="Toggle sidebar"
            >
                <MenuIcon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative">
              <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[var(--color-border)]/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] focus:ring-[var(--color-accent)]">
                <img className="h-9 w-9 rounded-full object-cover border-2 border-[var(--color-border)]" src={user.profilePicture || `https://i.pravatar.cc/100?u=${user.username}`} alt="User" />
                <span className="hidden md:inline text-sm font-medium text-[var(--color-text-secondary)]">{user.fullName}</span>
                <ChevronDownIcon className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md shadow-lg py-1 z-50 animate-fade-in-fast">
                  <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-white">Profile</Link>
                  <button onClick={() => { logout(); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-[var(--color-accent-red)]/80 hover:bg-red-500/10 hover:text-[var(--color-accent-red)]">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
             <div className="text-sm text-[var(--color-text-secondary)]">Not Authenticated</div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;