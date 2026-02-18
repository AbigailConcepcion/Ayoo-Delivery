
import React, { useState, useEffect } from 'react';
import { AppScreen, Voucher, UserAccount } from '../types';
import { db } from '../db';

interface VouchersProps {
  onBack: () => void;
  onApply: (v: Voucher) => void;
  onNavigate: (s: AppScreen) => void;
}

const Vouchers: React.FC<VouchersProps> = ({ onBack, onApply, onNavigate }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);

  const availableVouchers: Voucher[] = [
    { id: 'v1', code: 'AYOO2025', discount: 100, description: '₱100 off on your first order of the year!', type: 'fixed' },
    { id: 'v2', code: 'ILIGANPRIDE', discount: 15, description: '15% discount for local food lovers.', type: 'percent' },
    { id: 'v3', code: 'SQUADGOALS', discount: 50, description: '₱50 off for group orders over ₱500.', type: 'fixed' }
  ];

  useEffect(() => {
    const init = async () => {
      const session = await db.getSession();
      if (session) {
        setCurrentUser(session);
        const claimed = await db.getClaimedVouchers(session.email);
        setClaimedIds(claimed.map(v => v.id));
      }
    };
    init();
  }, []);

  const handleClaim = async (v: Voucher) => {
    if (!currentUser) return;
    await db.claimVoucher(currentUser.email, v);
    setClaimedIds(prev => [...prev, v.id]);
    onApply(v); // Instant apply after claim
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-24 overflow-y-auto scrollbar-hide">
      <div className="bg-[#FF00CC] p-10 rounded-b-[50px] shadow-xl text-white text-center">
         <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Ayoo Vouchers</h2>
         <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Claim your rewards below</p>
      </div>

      <div className="px-8 pt-10 space-y-6">
        {availableVouchers.map(v => {
          const isClaimed = claimedIds.includes(v.id);
          return (
            <div key={v.id} className={`bg-white p-6 rounded-[35px] border-2 border-dashed shadow-sm relative overflow-hidden group transition-all ${isClaimed ? 'border-gray-200 opacity-60' : 'border-pink-200'}`}>
               <div className="absolute -right-4 -top-4 w-16 h-16 ayoo-gradient rounded-full opacity-10 group-hover:scale-150 transition-transform"></div>
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <h3 className="text-xl font-black text-gray-900 tracking-tighter">{v.code}</h3>
                     <p className="text-[11px] font-bold text-gray-400 mt-1">{v.description}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl font-black text-[12px] ${isClaimed ? 'bg-gray-100 text-gray-400' : 'bg-pink-50 text-[#FF00CC]'}`}>
                     {v.type === 'percent' ? `${v.discount}%` : `₱${v.discount}`}
                  </div>
               </div>
               <button 
                 disabled={isClaimed}
                 onClick={() => handleClaim(v)}
                 className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all ${
                   isClaimed ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#FF00CC] text-white shadow-pink-100 active:scale-95'
                 }`}
               >
                  {isClaimed ? 'Voucher Claimed' : 'Claim & Use Now'}
               </button>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-8 py-5 flex justify-around items-center max-w-md mx-auto rounded-t-[45px] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] z-50">
        <button onClick={() => onNavigate('HOME')} className="flex flex-col items-center text-gray-300">
          <span className="text-2xl mb-1">🏠</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => onNavigate('VOUCHERS')} className="flex flex-col items-center text-[#FF00CC]">
          <span className="text-2xl mb-1">🎟️</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Voucher</span>
        </button>
        <button onClick={() => onNavigate('HISTORY')} className="flex flex-col items-center text-gray-300">
          <span className="text-2xl mb-1">📑</span>
          <span className="text-[10px] font-black uppercase tracking-widest">History</span>
        </button>
        <button onClick={() => onNavigate('PROFILE')} className="flex flex-col items-center text-gray-300">
          <span className="text-2xl mb-1">👤</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default Vouchers;
