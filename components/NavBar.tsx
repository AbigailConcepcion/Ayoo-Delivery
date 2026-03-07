import React from 'react';
import { UserAccount, UserRole } from '../types';

interface NavBarProps {
  user: UserAccount | null;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  isOwner?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ user, onNavigate, onLogout, isOwner = false }) => {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <button onClick={() => onNavigate('HOME')} className="font-black text-[#FF00CC] text-xl">Ayoo Delivery</button>
      <div className="flex gap-4">
        <button onClick={() => onNavigate('HOME')}>Home</button>
        {user?.role === UserRole.MERCHANT && <button onClick={() => onNavigate('MERCHANT_DASHBOARD')}>Merchant Dashboard</button>}
        {user?.role === UserRole.RIDER && <button onClick={() => onNavigate('RIDER_DASHBOARD')}>Rider Dashboard</button>}
        {user?.role === UserRole.CUSTOMER && <button onClick={() => onNavigate('TRACKING')}>My Orders</button>}
        {(user?.role === UserRole.ADMIN || isOwner) && <button onClick={() => onNavigate('ADMIN_PANEL')}>Admin Panel</button>}
        <button onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default NavBar;
