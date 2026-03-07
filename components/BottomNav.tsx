import React from 'react';
import { AppScreen } from '../types';

interface BottomNavProps {
  active: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  mode?: 'customer' | 'operations';
  showAdmin?: boolean;
}

const baseClass = 'flex flex-col items-center';
const activeClass = 'text-[#FF00CC]';
const inactiveClass = 'text-gray-300';

const BottomNav: React.FC<BottomNavProps> = ({
  active,
  onNavigate,
  mode = 'customer',
  showAdmin = false,
}) => {
  const customerItems: { screen: AppScreen; icon: string; label: string }[] = [
    { screen: 'HOME', icon: '🏠', label: 'Home' },
    { screen: 'MESSAGES', icon: '💬', label: 'Messages' },
    { screen: 'VOUCHERS', icon: '🎟️', label: 'Voucher' },
    { screen: 'HISTORY', icon: '📑', label: 'Orders' },
    { screen: 'PROFILE', icon: '👤', label: 'Profile' },
  ];

  const operationsItems: { screen: AppScreen; icon: string; label: string }[] = [
    { screen: 'HOME', icon: '🏠', label: 'Home' },
    { screen: 'MESSAGES', icon: '💬', label: 'Messages' },
    { screen: 'MERCHANT_DASHBOARD', icon: '🏪', label: 'Merchant' },
    { screen: 'RIDER_DASHBOARD', icon: '🛵', label: 'Rider' },
    showAdmin
      ? { screen: 'ADMIN_PANEL', icon: '🛡️', label: 'Admin' }
      : { screen: 'PROFILE', icon: '👤', label: 'Profile' },
  ];

  const items = mode === 'operations' ? operationsItems : customerItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-8 py-5 flex justify-around items-center max-w-md mx-auto rounded-t-[45px] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] z-50">
      {items.map((item) => (
        <button
          key={item.screen}
          onClick={() => onNavigate(item.screen)}
          className={`${baseClass} ${active === item.screen ? activeClass : inactiveClass}`}
        >
          <span className="text-2xl mb-1">{item.icon}</span>
          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
