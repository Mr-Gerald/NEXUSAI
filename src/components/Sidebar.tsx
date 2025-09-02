


import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
// FIX: Use relative paths for component and context imports.
import { LogoIcon } from './icons/LogoIcon';
import { DashboardIcon } from './icons/DashboardIcon';
import { AgentsIcon } from './icons/AgentsIcon';
import { RiskIcon } from './icons/RiskIcon';
import { DataIcon } from './icons/DataIcon';
import { SystemIcon } from './icons/SystemIcon';
import { ManipulationIcon } from './icons/ManipulationIcon';
import { PredictiveIcon } from './icons/PredictiveIcon';
import { SignalIcon } from './icons/SignalIcon';
import { useUI } from '../contexts/UIContext';
import { CloseIcon } from './icons/CloseIcon';
import { MenuIcon } from './icons/MenuIcon';
import { BlotterIcon } from './icons/BlotterIcon';
import { ExecutionIcon } from './icons/ExecutionIcon';
import { UserIcon } from './icons/UserIcon';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { name: 'Execution Core', href: '/execution-core', icon: ExecutionIcon },
  { name: 'Predatory Analysis', href: '/predatory-analysis', icon: PredictiveIcon },
  { name: 'AI Trade Signals', href: '/trade-signals', icon: SignalIcon },
  { name: 'Trade Blotter', href: '/trade-blotter', icon: BlotterIcon },
  { name: 'Agent Swarm', href: '/agents', icon: AgentsIcon },
  { name: 'Risk Guardian', href: '/risk', icon: RiskIcon },
  { name: 'Manipulation', href: '/manipulation', icon: ManipulationIcon },
  { name: 'Market Data', href: '/market-data', icon: DataIcon },
  { name: 'System Status', href: '/system-status', icon: SystemIcon },
  { name: 'User Profile', href: '/profile', icon: UserIcon },
];

const NavItem: React.FC<{ to: string; icon: React.ElementType; isSidebarOpen: boolean; children: React.ReactNode }> = ({ to, icon: Icon, isSidebarOpen, children }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <NavLink
            to={to}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                isActive
                    ? 'bg-[var(--color-accent)] text-white shadow-[0_0_15px_rgba(88,166,255,0.3)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
            }`}
        >
            <Icon className={`h-5 w-5 transition-all ${isSidebarOpen ? 'mr-3' : 'mr-0'}`} />
            <span className={`transition-all duration-200 ${isSidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'}`}>{children}</span>
             {!isSidebarOpen && (
                <span className="absolute left-full ml-4 w-auto p-2 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg scale-0 group-hover:scale-100 transition-transform duration-200 origin-left z-50">
                    {children}
                </span>
            )}
        </NavLink>
    );
};


const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useUI();

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      <aside className={`fixed lg:relative z-40 flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] h-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}`}>
        <div className={`flex items-center justify-between h-20 px-4 border-b border-[var(--color-border)]`}>
            <div className={`flex items-center overflow-hidden transition-opacity duration-300 ${isSidebarOpen ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
              <LogoIcon className="h-10 w-10 text-[var(--color-accent)]" />
              <span className="ml-3 text-2xl font-black text-[var(--color-text-primary)] whitespace-nowrap">NexusAI</span>
            </div>
          <button onClick={toggleSidebar} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" aria-label="Toggle sidebar">
            {isSidebarOpen ? <CloseIcon className="h-6 w-6"/> : <MenuIcon className="h-6 w-6 hidden lg:block" />}
          </button>
        </div>
        <nav className="flex-1 flex flex-col space-y-2 p-4">
          {navigation.map((item) => (
            <NavItem key={item.name} to={item.href} icon={item.icon} isSidebarOpen={isSidebarOpen}>
              {item.name}
            </NavItem>
          ))}
        </nav>
        <div className="p-4 flex-shrink-0">
            <div className={`p-4 rounded-lg bg-black/20 border border-[var(--color-border)] transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                <div className="flex items-center">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-green)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-accent-green)]"></span>
                    </div>
                    <p className="text-sm text-[var(--color-accent-green)] font-semibold ml-2">System Operational</p>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">All agents active and normal.</p>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;