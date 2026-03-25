import React from 'react';
import { AppScreen } from '../types';

interface BottomNavProps {
  active: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  cartCount?: number;
  mode?: 'customer' | 'operations';
  showAdmin?: boolean;
}

const baseClass = 'flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 transition-all';
const activeClass = 'bg-[#F4EDFF] text-primaryDark shadow-[0_10px_24px_rgba(109,40,217,0.12)]';
const inactiveClass = 'text-gray-400 hover:bg-purple-50 hover:text-primaryDark';

const BottomNav: React.FC<BottomNavProps> = ({
  active,
  onNavigate,
  cartCount = 0,
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
    <div
      className="fixed left-1/2 z-50 flex w-[calc(100%-24px)] max-w-[430px] -translate-x-1/2 items-center justify-around rounded-[30px] border border-gray-200 bg-white px-4 py-3 shadow-2xl shadow-purple-100/50"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {items.map((item) => (
        <button
          key={item.screen}
          onClick={() => onNavigate(item.screen)}
          className={`${baseClass} ${active === item.screen ? activeClass : inactiveClass}`}
        >
          <div className="relative">
            <span className="text-2xl">{item.icon}</span>
            {cartCount > 0 && item.screen === 'CART' && (
              <span className="absolute -top-2 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
