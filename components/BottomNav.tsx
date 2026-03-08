import React, { useState, useEffect } from 'react';
import { AppScreen } from '../types';
import { db } from '../db';

// Custom SVG Icons Components
const HomeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const MessageIcon: React.FC<{ size?: number; className?: string }> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const TicketIcon: React.FC<{ size?: number; className?: string }> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
    <path d="M13 5v2"></path>
    <path d="M13 17v2"></path>
    <path d="M13 11v2"></path>
  </svg>
);

const OrdersIcon: React.FC<{ size?: number; className?: string }> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const UserIcon: React.FC<{ size?: number; className?: string }> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const StoreIcon: React.FC<{ size?: number; className?: string }> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m7.5 4.27 9 5.15"></path>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
    <path d="m3.3 7 8.7 5 8.7-5"></path>
    <path d="M12 22V12"></path>
  </svg>
);

const BikeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 17h6l3-7H5"></path>
    <path d="M8 10l-2 6h7l-2-6"></path>
    <circle cx="6" cy="17" r="2"></circle>
    <circle cx="16" cy="17" r="2"></circle>
  </svg>
);

const ShieldIcon: React.FC<{ size?: number; className?: string }> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

interface BottomNavProps {
  active: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  mode?: 'customer' | 'operations';
  showAdmin?: boolean;
  hasActiveOrder?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({
  active,
  onNavigate,
  mode = 'customer',
  showAdmin = false,
  hasActiveOrder: propHasActiveOrder,
}) => {
  const [hasActiveOrder, setHasActiveOrder] = useState(propHasActiveOrder || false);

  // Check for active orders when component mounts
  useEffect(() => {
    const checkActiveOrders = async () => {
      try {
        const liveOrders = await db.getAllLiveOrders();
        const hasActive = liveOrders && liveOrders.length > 0;
        setHasActiveOrder(hasActive);
      } catch (error) {
        console.error('Error checking active orders:', error);
      }
    };

    checkActiveOrders();

    const interval = setInterval(checkActiveOrders, 10000);

    return () => clearInterval(interval);
  }, []);

  const showActiveIndicator = propHasActiveOrder !== undefined ? propHasActiveOrder : hasActiveOrder;

  interface NavItem {
    screen: AppScreen;
    icon: React.ReactNode;
    label: string;
  }

  const customerItems: NavItem[] = [
    { screen: 'HOME', icon: <HomeIcon size={22} />, label: 'Home' },
    { screen: 'MESSAGES', icon: <MessageIcon size={22} />, label: 'Messages' },
    { screen: 'VOUCHERS', icon: <TicketIcon size={22} />, label: 'Voucher' },
    { screen: 'HISTORY', icon: <OrdersIcon size={22} />, label: 'Orders' },
    { screen: 'PROFILE', icon: <UserIcon size={22} />, label: 'Profile' },
  ];

  const operationsItems: NavItem[] = [
    { screen: 'HOME', icon: <HomeIcon size={22} />, label: 'Home' },
    { screen: 'MESSAGES', icon: <MessageIcon size={22} />, label: 'Messages' },
    { screen: 'MERCHANT_DASHBOARD', icon: <StoreIcon size={22} />, label: 'Merchant' },
    { screen: 'RIDER_DASHBOARD', icon: <BikeIcon size={22} />, label: 'Rider' },
    showAdmin
      ? { screen: 'ADMIN_PANEL', icon: <ShieldIcon size={22} />, label: 'Admin' }
      : { screen: 'PROFILE', icon: <UserIcon size={22} />, label: 'Profile' },
  ];

  const items = mode === 'operations' ? operationsItems : customerItems;

  const getIconColor = (isActive: boolean) => {
    if (isActive) return '#FF00CC';
    return '#9CA3AF';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-4 py-3 flex justify-around items-center max-w-md mx-auto rounded-t-[32px] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] z-50">
      {items.map((item) => {
        const isActive = active === item.screen;
        return (
          <button
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 relative min-w-[60px] ${isActive
              ? 'bg-gradient-to-b from-pink-50 to-white shadow-sm'
              : 'hover:bg-gray-50'
              }`}
          >
            <div className="relative">
              <span
                className="block transition-transform duration-200"
                style={{ color: getIconColor(isActive) }}
              >
                {item.icon}
              </span>
              {item.screen === 'HISTORY' && showActiveIndicator && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
              )}
            </div>
            <span
              className={`text-[9px] font-semibold mt-1.5 tracking-wide ${isActive ? 'text-[#FF00CC]' : 'text-gray-400'
                }`}
            >
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#FF00CC] rounded-full"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
