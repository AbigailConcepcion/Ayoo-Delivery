import React from 'react';
import { AppScreen, UserAccount, UserRole } from '../types';

interface NavBarProps {
  user: UserAccount | null;
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
  isOwner?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ user, onNavigate, onLogout, isOwner = false }) => {
  const navItemsData: Array<{ key: AppScreen; label: string; visible: boolean }> = [
    { key: 'HOME', label: 'Home', visible: true },
    { key: 'TRACKING', label: 'Orders', visible: user?.role === UserRole.CUSTOMER },
    { key: 'MERCHANT_DASHBOARD', label: 'Merchant', visible: user?.role === UserRole.MERCHANT },
    { key: 'RIDER_DASHBOARD', label: 'Rider', visible: user?.role === UserRole.RIDER },
    { key: 'ADMIN_PANEL', label: 'Admin', visible: user?.role === UserRole.ADMIN || isOwner },
  ];

  const navItems = navItemsData.filter((item) => item.visible);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/50 bg-white/70 px-4 py-4 backdrop-blur-2xl shadow-[0_16px_40px_rgba(109,40,217,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('HOME')}
          className="rounded-[16px] bg-purple-600 px-4 py-2 text-sm font-bold tracking-wider text-white shadow-lg shadow-purple-200 transition-transform active:scale-95"
        >
          Ayoo
        </button>
        <div className="flex flex-wrap items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-wider text-purple-900/70">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="rounded-full px-3 py-1.5 transition-colors hover:bg-purple-50 hover:text-purple-700"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={onLogout}
            className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-600 transition-colors hover:bg-gray-200"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
