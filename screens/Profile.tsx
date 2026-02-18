
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
  
  // PIN Security States
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (user) {
      db.getLedger(user.email).then(setLedger);
    }
  }, [user]);

  if (!user) return null;

  const isOwner = user.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  
  const level = user.level || 1;
  const xp = user.xp || 0;
  const progress = (xp % 5000) / 5000 * 100;
  
  const handleAvatarClick = () => {
    if (!isOwner) return;
    const next = avatarClicks + 1;
    if (next >= 3) {
      setShowPinPrompt(true);
      setAvatarClicks(0);
    } else {
      setAvatarClicks(next);
      setTimeout(() => setAvatarClicks(0), 1000);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const config = await db.getSystemConfig();
    const masterPin = config.masterPin || '1234';

    if (pin === masterPin) {
      onNavigate('ADMIN_PANEL');
      setShowPinPrompt(false);
      setPin('');
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 500);
      setPin('');
    }
  };

  const handleSave = async () => {
    const updated = await db.updateProfile(user.email, { name: name.trim() });
    if (updated) onUpdateUser(updated);
    setIsEditing(false);
  };

  const resetManual = async () => {
    if (!user) return;
    const currentSeen = user.manualsSeen || [];
    const roleToRemove = user.role || 'CUSTOMER';
    const updatedSeen = currentSeen.filter(r => r !== roleToRemove);
    const updated = await db.updateProfile(user.email, { manualsSeen: updatedSeen });
    if (updated) {
      onUpdateUser(updated);
      onNavigate('MANUAL');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white pb-24 overflow-y-auto scrollbar-hide">
      
      {showPinPrompt && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className={`bg-[#1A1A1A] w-full max-w-xs rounded-[50px] p-10 border border-white/10 shadow-2xl transition-all ${pinError ? 'animate-shake border-red-500' : ''}`}>
              <div className="text-center mb-8">
                 <div className="w-16 h-16 ayoo-gradient rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🛡️</div>
                 <h3 className="text-white font-black uppercase tracking-tighter text-xl">Root Access</h3>
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Enter Master PIN</p>
              </div>
              <form onSubmit={handlePinSubmit}>
                 <input 
                    type="password" 
                    maxLength={4} 
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="••••"
                    autoFocus
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-center text-3xl tracking-[0.5em] text-[#FF00CC] font-black focus:outline-none focus:border-[#FF00CC] mb-6"
                 />
                 <Button type="submit" className="py-4 font-black uppercase tracking-widest text-xs">Authorize</Button>
              </form>
           </div>
        </div>
      )}

      {showLedger && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-right-full duration-500 flex flex-col">
           <div className="bg-black p-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowLedger(false)} className="text-2xl font-black">←</button>
                <h3 className="text-xl font-black uppercase tracking-tighter">Financial Statement</h3>
              </div>
           </div>
           <div className="flex-1 p-8 overflow-y-auto space-y-4 bg-gray-50">
              {ledger.map(txn => (
                <div key={txn.id} className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100 flex justify-between items-center group">
                   <div>
                      <p className="font-black text-xs text-gray-900 leading-none">{txn.description}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">{new Date(txn.timestamp).toLocaleDateString()}</p>
                   </div>
                   <span className={`font-black text-sm ${txn.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`}>
                      {txn.type === 'CREDIT' ? '+' : '-'} ₱{txn.amount.toFixed(0)}
                   </span>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="bg-[#FF00CC] pt-24 pb-20 px-10 rounded-b-[60px] shadow-xl text-white text-center relative">
         <button onClick={onBack} className="absolute top-8 left-8 text-2xl font-black">←</button>
         <div onClick={handleAvatarClick} className="w-32 h-32 ayoo-gradient rounded-[45px] mx-auto p-1.5 mb-6 shadow-2xl relative cursor-pointer group">
            <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} className="w-full h-full rounded-[42px] object-cover border-4 border-white" alt="Avatar" />
         </div>
         <h2 className="text-4xl font-black tracking-tighter uppercase mb-2" onClick={() => setIsEditing(true)}>
           {user.name}
         </h2>
         <div className="mt-6 bg-white/10 backdrop-blur-md rounded-[30px] p-6 border border-white/20">
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
               <div className="h-full ayoo-gradient transition-all duration-1000" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">Level {level} Explorer</p>
         </div>
      </div>

      <div className="p-10 space-y-6">
         <div className="bg-gray-50 rounded-[40px] p-8 space-y-4">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-2">Switch Perspective</h3>
            <div className="grid grid-cols-3 gap-3">
               {(['CUSTOMER', 'MERCHANT', 'RIDER'] as UserRole[]).map(r => (
                 <button key={r} onClick={() => onSetRole(r)} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-tighter transition-all ${user.role === r ? 'bg-[#FF00CC] text-white shadow-xl shadow-pink-100' : 'bg-white text-gray-400 border border-gray-100'}`}>{r}</button>
               ))}
            </div>
         </div>

         <button onClick={resetManual} className="w-full p-8 bg-black rounded-[35px] text-left relative overflow-hidden group shadow-2xl transition-all active:scale-95">
            <div className="absolute top-0 right-0 bottom-0 w-32 ayoo-gradient opacity-20"></div>
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <span className="text-2xl">📖</span>
                  <h3 className="text-white font-black text-lg tracking-tighter uppercase">Review Protocol</h3>
               </div>
               <span className="text-white opacity-40 text-[9px] font-black uppercase tracking-widest">Show Manual</span>
            </div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2">Re-read the guide for {user.role}</p>
         </button>

         <div className="space-y-3">
            <button onClick={() => onNavigate('PAYMENTS')} className="w-full p-8 bg-gray-50 rounded-[35px] flex items-center justify-between group hover:bg-[#FF00CC] transition-all">
               <span className="font-black uppercase tracking-widest text-[10px] group-hover:text-white">Wallet & Cards</span>
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
