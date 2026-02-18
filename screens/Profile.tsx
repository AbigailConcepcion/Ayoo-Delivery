
import React, { useState } from 'react';
import { AppScreen, UserAccount, UserRole } from '../types';
import { db } from '../db';
import Button from '../components/Button';

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
  const [showLaunchpad, setShowLaunchpad] = useState(false);
  const [avatarClicks, setAvatarClicks] = useState(0);

  if (!user) return null;

  const handleAvatarClick = () => {
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

  const productionChecklist = [
    { label: 'Supabase Database', status: 'Pending', desc: 'Replace LocalStorage with real SQL.' },
    { label: 'Vercel Hosting', status: 'Pending', desc: 'Deploy to a real URL for everyone.' },
    { label: 'Payment Gateway', status: 'Pending', desc: 'Connect GCash/Maya API.' },
    { label: 'Live GPS', status: 'Pending', desc: 'Use Google Maps real-time tracking.' }
  ];

  return (
    <div className="flex flex-col h-screen bg-white pb-24 overflow-y-auto scrollbar-hide">
      <div className="bg-[#FF00CC] pt-24 pb-20 px-10 rounded-b-[60px] shadow-xl text-white text-center relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
         <button onClick={onBack} className="absolute top-8 left-8 text-2xl font-black active:scale-90 transition-transform">←</button>
         
         <div 
            onClick={handleAvatarClick}
            className="w-32 h-32 ayoo-gradient rounded-[45px] mx-auto p-1.5 mb-6 shadow-2xl relative cursor-pointer active:scale-95 transition-transform"
         >
            <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} className="w-full h-full rounded-[42px] object-cover border-4 border-white" alt="Avatar" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xl shadow-lg">📸</div>
         </div>
         
         <h2 className="text-4xl font-black tracking-tighter uppercase leading-none mb-2">{user.name}</h2>
         <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{user.email}</p>
         <div className="mt-4 bg-white/20 px-6 py-2 rounded-2xl inline-block text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10">{user.role || 'CUSTOMER'}</div>
      </div>

      <div className="p-10 space-y-6">
         <button 
           onClick={() => setShowLaunchpad(!showLaunchpad)}
           className="w-full p-8 bg-black rounded-[35px] text-left relative overflow-hidden group shadow-2xl transition-all active:scale-[0.98]"
         >
            <div className="absolute top-0 right-0 bottom-0 w-32 ayoo-gradient opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="flex items-center gap-4 mb-2">
               <span className="text-2xl">🚀</span>
               <h3 className="text-white font-black text-lg tracking-tighter uppercase">Production Launchpad</h3>
            </div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Click to see what's needed to go live</p>
         </button>

         {showLaunchpad && (
           <div className="bg-gray-50 rounded-[40px] p-8 border border-gray-100 space-y-4 animate-in zoom-in-95">
              {productionChecklist.map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-3xl border border-gray-100">
                   <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xs grayscale opacity-50">❌</div>
                   <div>
                      <h4 className="font-black text-xs uppercase text-gray-900 tracking-tight">{item.label}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 leading-tight">{item.desc}</p>
                   </div>
                </div>
              ))}
              <p className="text-center text-[8px] font-black text-gray-400 uppercase tracking-widest pt-4">Ready to upgrade? Message Ayoo Support.</p>
           </div>
         )}

         <div className="bg-gray-50 rounded-[40px] p-8 space-y-4">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-2">Switch Duty Mode</h3>
            <div className="grid grid-cols-3 gap-3">
               {(['CUSTOMER', 'MERCHANT', 'RIDER'] as UserRole[]).map(r => (
                 <button 
                  key={r}
                  onClick={() => onSetRole(r)}
                  className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-tighter transition-all ${
                    user.role === r ? 'bg-[#FF00CC] text-white shadow-xl shadow-pink-100' : 'bg-white text-gray-400 border border-gray-100'
                  }`}
                 >
                   {r}
                 </button>
               ))}
            </div>
         </div>

         <div className="space-y-3">
            <button onClick={() => onNavigate('PAYMENTS')} className="w-full p-8 bg-gray-50 rounded-[35px] flex items-center justify-between group hover:bg-[#FF00CC] transition-all">
               <span className="font-black uppercase tracking-widest text-[10px] group-hover:text-white transition-colors">Digital Wallet</span>
               <span className="text-gray-300 group-hover:text-white transition-colors">→</span>
            </button>
            <button onClick={() => onNavigate('ADDRESSES')} className="w-full p-8 bg-gray-50 rounded-[35px] flex items-center justify-between group hover:bg-[#FF00CC] transition-all">
               <span className="font-black uppercase tracking-widest text-[10px] group-hover:text-white transition-colors">Delivery Hubs</span>
               <span className="text-gray-300 group-hover:text-white transition-colors">→</span>
            </button>
            <button onClick={onLogout} className="w-full p-8 bg-red-50 rounded-[35px] flex items-center justify-between group hover:bg-red-500 transition-all">
               <span className="font-black uppercase tracking-widest text-[10px] text-red-500 group-hover:text-white transition-colors">Deactivate Session</span>
               <span className="text-red-300 group-hover:text-white transition-colors">→</span>
            </button>
         </div>
      </div>
    </div>
  );
};

export default Profile;
