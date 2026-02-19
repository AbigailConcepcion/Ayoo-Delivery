
import React, { useState, useEffect, useRef } from 'react';
import { AppScreen, UserAccount, UserRole, WalletTransaction } from '../types';
import { db } from '../db';
import { PHILIPPINE_CITIES } from '../constants';
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
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [editCity, setEditCity] = useState(user?.preferredCity || 'Iligan City');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLedger, setShowLedger] = useState(false);
  const [ledger, setLedger] = useState<WalletTransaction[]>([]);
  const [avatarClicks, setAvatarClicks] = useState(0);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (user) {
      db.getLedger(user.email).then(setLedger);
      setEditName(user.name);
      setEditAvatar(user.avatar || '');
      setEditCity(user.preferredCity || 'Iligan City');
    }
  }, [user]);

  if (!user) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isOwner = user.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  
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

  const handleSaveProfile = async () => {
    const updated = await db.updateProfile(user.email, { 
      name: editName.trim(), 
      avatar: editAvatar.trim(), 
      preferredCity: editCity 
    });
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
              </div>
              <form onSubmit={handlePinSubmit}>
                 <input 
                    type="password" 
                    maxLength={4} 
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-center text-3xl tracking-[0.5em] text-[#FF00CC] font-black focus:outline-none focus:border-[#FF00CC] mb-6"
                 />
                 <Button type="submit">Authorize</Button>
              </form>
           </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-md flex items-end justify-center">
           <div className="bg-white w-full max-w-md rounded-t-[50px] p-10 animate-in slide-in-from-bottom-10 shadow-2xl space-y-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-center">Update Identity</h3>
              
              <div className="flex flex-col items-center mb-4">
                 <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 ayoo-gradient rounded-[35px] p-1 mb-2 relative cursor-pointer group shadow-xl">
                    <img src={editAvatar || `https://i.pravatar.cc/150?u=${user.email}`} className="w-full h-full rounded-[32px] object-cover border-2 border-white" alt="Edit Avatar" />
                    <div className="absolute inset-0 bg-black/40 rounded-[32px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                       <span className="text-2xl">📸</span>
                    </div>
                 </div>
                 <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                 <p className="text-[9px] font-black uppercase text-pink-500 tracking-widest">Tap photo to change</p>
              </div>

              <div className="space-y-4">
                 <div className="input-label-border">
                    <label>Full Name</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold focus:border-pink-500 outline-none transition-all" />
                 </div>
                 <div className="input-label-border">
                    <label>Preferred City</label>
                    <select value={editCity} onChange={e => setEditCity(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold appearance-none outline-none focus:border-pink-500">
                       {PHILIPPINE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>
              <Button onClick={handleSaveProfile} className="py-5 font-black uppercase tracking-widest text-xs">Save Vault Changes</Button>
              <button onClick={() => setIsEditing(false)} className="w-full text-[10px] font-black uppercase text-gray-400 py-2">Cancel</button>
           </div>
        </div>
      )}

      <div className="bg-[#FF00CC] pt-24 pb-20 px-10 rounded-b-[60px] shadow-xl text-white text-center relative">
         <button onClick={onBack} className="absolute top-8 left-8 text-2xl font-black">←</button>
         <button onClick={() => setIsEditing(true)} className="absolute top-8 right-8 text-[10px] font-black uppercase border border-white/20 px-4 py-2 rounded-full backdrop-blur-md">Edit</button>
         
         <div onClick={handleAvatarClick} className="w-32 h-32 ayoo-gradient rounded-[45px] mx-auto p-1.5 mb-6 shadow-2xl relative cursor-pointer">
            <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} className="w-full h-full rounded-[42px] object-cover border-4 border-white" alt="Avatar" />
         </div>
         <h2 className="text-4xl font-black tracking-tighter uppercase mb-2 leading-none">{user.name}</h2>
         <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Level {user.level || 1} Explorer</p>
      </div>

      <div className="p-10 space-y-6">
         <div className="bg-gray-50 rounded-[40px] p-8 space-y-4 border border-gray-100">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-2">Ayoo Perspective</h3>
            <div className="grid grid-cols-3 gap-3">
               {(['CUSTOMER', 'MERCHANT', 'RIDER'] as UserRole[]).map(r => (
                 <button key={r} onClick={() => onSetRole(r)} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-tighter transition-all ${user.role === r ? 'bg-[#FF00CC] text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}>{r}</button>
               ))}
            </div>
         </div>

         <button onClick={resetManual} className="w-full p-8 bg-black rounded-[35px] text-left relative overflow-hidden group shadow-xl transition-all active:scale-95">
            <div className="absolute top-0 right-0 bottom-0 w-32 ayoo-gradient opacity-10"></div>
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <span className="text-2xl">📖</span>
                  <h3 className="text-white font-black text-lg tracking-tighter uppercase">Review Protocol</h3>
               </div>
               <span className="text-white opacity-40 text-[9px] font-black uppercase tracking-widest">Play</span>
            </div>
         </button>

         <div className="space-y-3">
            <button onClick={() => onNavigate('ADDRESSES')} className="w-full p-8 bg-gray-50 rounded-[35px] flex items-center justify-between group hover:bg-[#FF00CC] transition-all">
               <span className="font-black uppercase tracking-widest text-[10px] group-hover:text-white">Delivery Pockets</span>
               <span className="text-gray-300 group-hover:text-white">→</span>
            </button>
            <button onClick={() => onNavigate('PAYMENTS')} className="w-full p-8 bg-gray-50 rounded-[35px] flex items-center justify-between group hover:bg-[#FF00CC] transition-all">
               <span className="font-black uppercase tracking-widest text-[10px] group-hover:text-white">Payment Vault</span>
               <span className="text-gray-300 group-hover:text-white">→</span>
            </button>
            <button onClick={onLogout} className="w-full p-8 bg-red-50 rounded-[35px] flex items-center justify-between group hover:bg-red-500 transition-all">
               <span className="font-black uppercase tracking-widest text-[10px] text-red-500 group-hover:text-white">Secure Logout</span>
               <span className="text-red-300 group-hover:text-white">→</span>
            </button>
         </div>
      </div>
    </div>
  );
};

export default Profile;
