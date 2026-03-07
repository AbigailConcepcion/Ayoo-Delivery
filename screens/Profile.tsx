
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppScreen, UserAccount, UserRole, WalletTransaction } from '../types';
import { db } from '../db';
import { PHILIPPINE_CITIES } from '../constants';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';

const OWNER_EMAIL = 'ayoo.admin@gmail.com'; 
const PROFILE_SETTINGS_KEY = 'ayoo_profile_settings_v1';

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
  const [settings, setSettings] = useState({
    pushAlerts: true,
    autoSync: true,
    compactMode: false
  });

  useEffect(() => {
    if (user) {
      db.getLedger(user.email).then(setLedger);
      setEditName(user.name);
      setEditAvatar(user.avatar || '');
      setEditCity(user.preferredCity || 'Iligan City');
      const raw = localStorage.getItem(`${PROFILE_SETTINGS_KEY}_${user.email.toLowerCase()}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setSettings({
              pushAlerts: parsed.pushAlerts !== false,
              autoSync: parsed.autoSync !== false,
              compactMode: parsed.compactMode === true
            });
          }
        } catch {
          // keep defaults if local settings are malformed
        }
      }
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

  const updateSetting = (key: 'pushAlerts' | 'autoSync' | 'compactMode', value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem(`${PROFILE_SETTINGS_KEY}_${user.email.toLowerCase()}`, JSON.stringify(next));
  };

  const levelProgress = useMemo(() => {
    const xp = Number(user.xp || 0);
    const level = Number(user.level || 1);
    const prevFloor = Math.max(0, (level - 1) * 1000);
    const nextFloor = level * 1000;
    const ratio = Math.min(1, Math.max(0, (xp - prevFloor) / Math.max(1, nextFloor - prevFloor)));
    return {
      percent: Math.round(ratio * 100),
      nextXp: nextFloor,
      remaining: Math.max(0, nextFloor - xp)
    };
  }, [user.level, user.xp]);

  const ledgerStats = useMemo(() => {
    const credit = ledger
      .filter(entry => entry.type === 'CREDIT')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const debit = ledger
      .filter(entry => entry.type === 'DEBIT')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const pending = ledger.filter(entry => entry.status === 'PENDING').length;
    return {
      credit,
      debit,
      pending,
      net: credit - debit
    };
  }, [ledger]);
  
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
         <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-[8px] font-black uppercase text-gray-400">Points</p>
              <p className="text-lg font-black text-[#FF00CC]">{user.points || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-[8px] font-black uppercase text-gray-400">XP</p>
              <p className="text-lg font-black text-[#FF00CC]">{Math.floor(user.xp || 0)}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-[8px] font-black uppercase text-gray-400">Role</p>
              <p className="text-xs font-black text-[#FF00CC]">{user.role || 'CUSTOMER'}</p>
            </div>
         </div>

         <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Level Progress</p>
              <p className="text-[10px] font-black uppercase text-[#FF00CC]">{levelProgress.percent}%</p>
            </div>
            <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-gray-100">
              <div className="h-full ayoo-gradient rounded-full transition-all" style={{ width: `${levelProgress.percent}%` }}></div>
            </div>
            <p className="text-[10px] font-bold text-gray-500 mt-3">
              {levelProgress.remaining} XP to reach {levelProgress.nextXp.toLocaleString()} XP.
            </p>
         </div>

         <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-100 space-y-4">
           <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Settings</h3>
           <button
             onClick={() => updateSetting('pushAlerts', !settings.pushAlerts)}
             className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between"
           >
             <span className="text-xs font-black text-gray-700">Push Alerts</span>
             <span className={`text-[10px] font-black uppercase ${settings.pushAlerts ? 'text-green-600' : 'text-gray-400'}`}>
               {settings.pushAlerts ? 'On' : 'Off'}
             </span>
           </button>
           <button
             onClick={() => updateSetting('autoSync', !settings.autoSync)}
             className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between"
           >
             <span className="text-xs font-black text-gray-700">Auto Sync</span>
             <span className={`text-[10px] font-black uppercase ${settings.autoSync ? 'text-green-600' : 'text-gray-400'}`}>
               {settings.autoSync ? 'On' : 'Off'}
             </span>
           </button>
           <button
             onClick={() => updateSetting('compactMode', !settings.compactMode)}
             className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between"
           >
             <span className="text-xs font-black text-gray-700">Compact Cards</span>
             <span className={`text-[10px] font-black uppercase ${settings.compactMode ? 'text-green-600' : 'text-gray-400'}`}>
               {settings.compactMode ? 'On' : 'Off'}
             </span>
           </button>
         </div>

         <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-100">
           <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-3">Wallet Snapshot</h3>
           <div className="grid grid-cols-2 gap-3">
             <div className="bg-white rounded-2xl p-4 border border-gray-100">
               <p className="text-[9px] font-black uppercase text-gray-400">Total Spend</p>
               <p className="text-sm font-black text-red-500">₱{ledgerStats.debit.toFixed(2)}</p>
             </div>
             <div className="bg-white rounded-2xl p-4 border border-gray-100">
               <p className="text-[9px] font-black uppercase text-gray-400">Total Credit</p>
               <p className="text-sm font-black text-green-600">₱{ledgerStats.credit.toFixed(2)}</p>
             </div>
             <div className="bg-white rounded-2xl p-4 border border-gray-100">
               <p className="text-[9px] font-black uppercase text-gray-400">Net</p>
               <p className={`text-sm font-black ${ledgerStats.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>₱{ledgerStats.net.toFixed(2)}</p>
             </div>
             <div className="bg-white rounded-2xl p-4 border border-gray-100">
               <p className="text-[9px] font-black uppercase text-gray-400">Pending</p>
               <p className="text-sm font-black text-amber-500">{ledgerStats.pending}</p>
             </div>
           </div>
         </div>

         {isOwner && (
           <div className="bg-gray-50 rounded-[40px] p-8 space-y-4 border border-gray-100">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-2">Ayoo Perspective</h3>
              <div className="grid grid-cols-3 gap-3">
                 {(['CUSTOMER', 'MERCHANT', 'RIDER'] as UserRole[]).map(r => (
                   <button key={r} onClick={() => onSetRole(r)} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-tighter transition-all ${user.role === r ? 'bg-[#FF00CC] text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}>{r}</button>
                 ))}
              </div>
           </div>
         )}

         <button onClick={resetManual} className="w-full p-8 bg-black rounded-[35px] text-left relative overflow-hidden group shadow-xl transition-all active:scale-95">
            <div className="absolute top-0 right-0 bottom-0 w-32 ayoo-gradient opacity-10"></div>
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <span className="text-2xl">📖</span>
                  <h3 className="text-white font-black text-lg tracking-tighter uppercase">Ayoo Manual</h3>
               </div>
               <span className="text-white opacity-40 text-[9px] font-black uppercase tracking-widest">Play</span>
            </div>
         </button>

         <button onClick={() => setShowLedger(!showLedger)} className="w-full p-6 bg-gray-50 rounded-[28px] text-left border border-gray-100">
           <div className="flex items-center justify-between">
             <h3 className="font-black text-sm uppercase tracking-widest text-gray-700">Transaction Summary</h3>
             <span className="text-xs font-black text-[#FF00CC]">{showLedger ? 'Hide' : 'Show'}</span>
           </div>
         </button>

         {showLedger && (
           <div className="bg-gray-50 rounded-[28px] p-6 border border-gray-100 space-y-3">
             {ledger.length === 0 ? (
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No transactions yet</p>
             ) : ledger.slice(0, 8).map((entry) => (
               <div key={entry.id} className="flex justify-between items-center bg-white rounded-xl p-3 border border-gray-100">
                 <div>
                   <p className="text-xs font-black">{entry.description}</p>
                   <p className="text-[9px] font-bold uppercase text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
                 </div>
                 <p className={`text-sm font-black ${entry.type === 'DEBIT' ? 'text-red-500' : 'text-green-500'}`}>
                   {entry.type === 'DEBIT' ? '-' : '+'}₱{entry.amount.toFixed(2)}
                 </p>
               </div>
             ))}
           </div>
         )}

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

      <BottomNav
        active="PROFILE"
        onNavigate={onNavigate}
        mode={isOwner ? 'operations' : 'customer'}
        showAdmin={isOwner}
      />
    </div>
  );
};

export default Profile;
