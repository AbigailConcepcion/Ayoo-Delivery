
import React, { useState, useRef, useEffect } from 'react';
import { AppScreen, UserAccount, UserRole, WalletTransaction } from '../types';
import { db } from '../db';
import Button from '../components/Button';

const OWNER_EMAIL = 'ayoo.admin@gmail.com'; 

interface ProfileProps {
  onBack: () => void;
  user: UserAccount | null;
  onLogout: () => void;
  onNavigate: (s: AppScreen) => void;
  onUpdateUser: (user: UserAccount) => void;
  onSetRole: (role: UserRole) => void;
}

const Profile: React.FC<ProfileProps> = ({ onBack, user, onLogout, onNavigate, onUpdateUser, onSetRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [showLedger, setShowLedger] = useState(false);
  const [ledger, setLedger] = useState<WalletTransaction[]>([]);
  const [avatarClicks, setAvatarClicks] = useState(0);

  useEffect(() => {
    if (user) {
      db.getLedger(user.email).then(setLedger);
    }
  }, [user]);

  if (!user) return null;

  const isOwner = user.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  
  const level = user.level || 1;
  const xp = user.xp || 0;
  const xpToNext = (level * 5000);
  const progress = (xp % 5000) / 5000 * 100;
  
  const handleAvatarClick = () => {
    if (!isOwner) return;
    const next = avatarClicks + 1;
    if (next >= 3) {
      onNavigate('ADMIN_PANEL');
      setAvatarClicks(0);
    } else {
      setAvatarClicks(next);
      setTimeout(() => setAvatarClicks(0), 1000);
    }
  };

  const handleSave = async () => {
    const updated = await db.updateProfile(user.email, { name: name.trim() });
    if (updated) onUpdateUser(updated);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white pb-24 overflow-y-auto scrollbar-hide">
      
      {showLedger && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-right-full duration-500 flex flex-col">
           <div className="bg-black p-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowLedger(false)} className="text-2xl font-black">←</button>
                <h3 className="text-xl font-black uppercase tracking-tighter">Financial Statement</h3>
              </div>
              <button className="bg-white/10 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/10">Export PDF</button>
           </div>
           <div className="flex-1 p-8 overflow-y-auto space-y-4 bg-gray-50">
              <div className="bg-white p-8 rounded-[40px] mb-4 shadow-sm border border-gray-100">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Payouts to date</p>
                 <h4 className="text-4xl font-black tracking-tighter text-gray-900">₱{user.earnings?.toFixed(2) || '0.00'}</h4>
              </div>

              {ledger.length === 0 ? (
                <div className="py-20 text-center opacity-20 uppercase font-black tracking-widest text-xs">No records found.</div>
              ) : (
                ledger.map(txn => (
                  <div key={txn.id} className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100 flex justify-between items-center group">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <p className="font-black text-xs text-gray-900 leading-none">{txn.description}</p>
                           <span className="text-[7px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md font-black">SETTLED</span>
                        </div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                           {new Date(txn.timestamp).toLocaleDateString()} • {txn.referenceId}
                        </p>
                     </div>
                     <span className={`font-black text-sm ${txn.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`}>
                        {txn.type === 'CREDIT' ? '+' : '-'} ₱{txn.amount.toFixed(0)}
                     </span>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      <div className="bg-[#FF00CC] pt-24 pb-20 px-10 rounded-b-[60px] shadow-xl text-white text-center relative">
         <button onClick={onBack} className="absolute top-8 left-8 text-2xl font-black">←</button>
         <div onClick={handleAvatarClick} className="w-32 h-32 ayoo-gradient rounded-[45px] mx-auto p-1.5 mb-6 shadow-2xl relative cursor-pointer group">
            <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} className="w-full h-full rounded-[42px] object-cover border-4 border-white group-hover:scale-95 transition-transform" alt="Avatar" />
         </div>
         <div className="flex flex-col items-center">
            {isEditing ? (
              <div className="flex items-center gap-2 mb-2">
                <input value={name} onChange={e => setName(e.target.value)} className="bg-white/20 border border-white/30 rounded-xl px-4 py-1 text-center font-black text-2xl text-white outline-none" autoFocus />
                <button onClick={handleSave} className="text-xl">✅</button>
              </div>
            ) : (
              <h2 className="text-4xl font-black tracking-tighter uppercase mb-2 flex items-center gap-2 cursor-pointer" onClick={() => setIsEditing(true)}>
                {user.name} <span className="text-xs opacity-30 font-black">EDIT</span>
              </h2>
            )}
         </div>
         <div className="mt-6 bg-white/10 backdrop-blur-md rounded-[30px] p-6 border border-white/20">
            <div className="flex justify-between items-end mb-2">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Level {level}</p>
                  <h4 className="text-xl font-black tracking-tighter leading-none">Ayoo Legend</h4>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest">{xp} / {xpToNext} XP</p>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
               <div className="h-full ayoo-gradient transition-all duration-1000" style={{ width: `${progress}%` }}></div>
            </div>
         </div>
      </div>

      <div className="p-10 space-y-6">
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-6 rounded-[35px] border border-gray-100 cursor-pointer" onClick={() => setShowLedger(true)}>
               <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Ledger Bal</p>
               <h4 className="text-2xl font-black text-gray-900 tracking-tighter">₱{user.earnings?.toFixed(0) || '0'}</h4>
            </div>
            <div className="bg-gray-50 p-6 rounded-[35px] border border-gray-100">
               <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Tokens</p>
               <h4 className="text-2xl font-black text-[#FF00CC] tracking-tighter">🪙 {user.points}</h4>
            </div>
         </div>

         <button onClick={() => setShowLedger(true)} className="w-full p-8 bg-black rounded-[35px] text-left relative overflow-hidden group shadow-2xl transition-all active:scale-95">
            <div className="absolute top-0 right-0 bottom-0 w-32 ayoo-gradient opacity-20"></div>
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <span className="text-2xl">📊</span>
                  <h3 className="text-white font-black text-lg tracking-tighter uppercase">Wallet Ledger</h3>
               </div>
               <span className="text-white opacity-40 text-xs">VIEW</span>
            </div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2">Verified transaction history</p>
         </button>

         <div className="bg-gray-50 rounded-[40px] p-8 space-y-4">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-2">Security Hub</h3>
            <div className="grid grid-cols-3 gap-3">
               {(['CUSTOMER', 'MERCHANT', 'RIDER'] as UserRole[]).map(r => (
                 <button key={r} onClick={() => onSetRole(r)} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-tighter transition-all ${user.role === r ? 'bg-[#FF00CC] text-white shadow-xl shadow-pink-100' : 'bg-white text-gray-400 border border-gray-100'}`}>{r}</button>
               ))}
            </div>
         </div>

         <div className="space-y-3">
            <button onClick={() => onNavigate('PAYMENTS')} className="w-full p-8 bg-gray-50 rounded-[35px] flex items-center justify-between group hover:bg-[#FF00CC] transition-all">
               <span className="font-black uppercase tracking-widest text-[10px] group-hover:text-white">Linked Payment Sources</span>
               <span className="text-gray-300 group-hover:text-white">→</span>
            </button>
            <button onClick={onLogout} className="w-full p-8 bg-red-50 rounded-[35px] flex items-center justify-between hover:bg-red-500 transition-all group">
               <span className="font-black uppercase tracking-widest text-[10px] text-red-500 group-hover:text-white">Sign Out</span>
               <span className="text-red-300 group-hover:text-white">→</span>
            </button>
         </div>
      </div>
    </div>
  );
};

export default Profile;
