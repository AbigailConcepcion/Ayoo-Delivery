import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppScreen, UserAccount, UserRole, WalletTransaction } from '../types';
import { db } from '../db';
import { ayooCloud } from '../api';
import { PHILIPPINE_CITIES } from '../constants';
import Button from '../components/Button';

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

  const isOwner = user?.email.toLowerCase() === OWNER_EMAIL.toLowerCase();

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
          setSettings(parsed || settings);
        } catch {}
      }
    }
  }, [user]);

  if (!user) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem(`${PROFILE_SETTINGS_KEY}_${user.email.toLowerCase()}`, JSON.stringify(next));
  };

  const levelProgress = useMemo(() => {
    const xp = Number(user.xp || 0);
    const level = Number(user.level || 1);
    const prev = (level - 1) * 1000;
    const next = level * 1000;
    const ratio = Math.min(1, (xp - prev) / (next - prev));
    return { percent: ratio * 100, nextXp: next, remaining: Math.max(0, next - xp) };
  }, [user.xp, user.level]);

  const ledgerStats = useMemo(() => {
    const credit = ledger.filter(t => t.type === 'CREDIT').reduce((s, t) => s + Number(t.amount), 0);
    const debit = ledger.filter(t => t.type === 'DEBIT').reduce((s, t) => s + Number(t.amount), 0);
    return { credit, debit, net: credit - debit };
  }, [ledger]);

  const handleAvatarClick = () => {
    if (!isOwner) return;
    const next = avatarClicks + 1;
    if (next >= 3) {
      setAvatarClicks(0);
      setShowPinPrompt(true);
    } else {
      setAvatarClicks(next);
      setTimeout(() => setAvatarClicks(0), 1000);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // PRODUCTION: Never check PINs on the client. 
    // Send to a secure backend endpoint that returns a session token if valid.
    const isAuthorized = await ayooCloud.verifyAdminPin(user.email, pin);
    if (isAuthorized) {
      onNavigate('ADMIN_PANEL');
      setShowPinPrompt(false);
      setPin('');
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 500);
    }
  };

const handleSaveProfile = async () => {
    const updated = await db.updateProfile(user.email, { 
      name: editName.trim(), 
      avatar: editAvatar.trim(), 
      preferredCity: editCity 
    });
    if (updated) {
      onUpdateUser(updated);
      setIsEditing(false);
    }
  };

  // Grab/FoodPanda-style modals (unchanged)
  const renderPinModal = () => (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur flex items-center justify-center p-6">
      <div className={`bg-white/95 w-full max-w-sm rounded-3xl p-8 shadow-2xl border ${pinError ? 'border-red-400 animate-shake' : 'border-purple-200'}`}>
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-xl">🔐</div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Admin Access</h3>
        </div>
        <form onSubmit={handlePinSubmit}>
          <input 
            type="password" 
            value={pin} onChange={e => setPin(e.target.value)} 
            maxLength={4}
            className="w-full p-5 text-2xl font-bold text-center tracking-widest bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none mb-6 text-purple-600"
            placeholder="••••"
          />
          <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all">Enter</Button>
        </form>
      </div>
    </div>
  );

  const renderEditModal = () => (
    <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-in fade-in">
        <h3 className="text-2xl font-bold text-gray-900 text-center">Edit Profile</h3>
        <div className="flex flex-col items-center mb-6">
          <div onClick={() => fileInputRef.current?.click()} className="w-28 h-28 relative cursor-pointer group shadow-xl rounded-full overflow-hidden mb-3">
            <img src={editAvatar || `https://i.pravatar.cc/200?u=${user.email}`} alt="Avatar" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/80 to-pink-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
              <span className="text-2xl">✏️</span>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
            <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl font-semibold focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
            <select value={editCity} onChange={e => setEditCity(e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl font-semibold focus:border-purple-500 focus:outline-none appearance-none bg-gradient-to-r from-gray-50 to-white">
              {PHILIPPINE_CITIES.slice(0, 10).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSaveProfile} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl">Save</Button>
          <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1 font-bold py-4 rounded-xl border-gray-200">Cancel</Button>
        </div>
      </div>
    </div>
  );

  // Main Grab/FoodPanda layout
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Pin modal */}
      {showPinPrompt && renderPinModal()}
      {/* Edit modal */}
      {isEditing && renderEditModal()}

      {/* Clean Hero Header */}
      <div className="bg-white px-6 pt-6 pb-8 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <button onClick={onBack} className="p-2 -ml-1 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all">
            <span className="text-xl">←</span>
          </button>
          <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all">
            Edit Profile
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div onClick={handleAvatarClick} className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-1 shadow-xl cursor-pointer hover:scale-105 transition-all">
            <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isOwner ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                {user.role || 'Customer'}
              </span>
              <div className="ml-4 flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all" style={{width: `${levelProgress.percent}%`}} />
              </div>
              <span className="text-xs font-semibold text-gray-600 ml-2">{levelProgress.percent}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4 flex-1">
        {/* Wallet Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-xl">💳</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Wallet</h3>
                <p className="text-sm text-gray-500">Net balance</p>
              </div>
            </div>
            <button onClick={() => setShowLedger(!showLedger)} className="text-purple-600 text-sm font-semibold hover:text-purple-700">
              {showLedger ? 'Hide' : 'Details'} →
            </button>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-2xl font-bold">
              <span>₱{ledgerStats.net.toFixed(0)}</span>
              <span className={`text-sm ${ledgerStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {ledgerStats.net >= 0 ? '+' : ''}{ledgerStats.net.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Total Credits: ₱{ledgerStats.credit.toFixed(0)}</span>
              <span>Total Spent: ₱{ledgerStats.debit.toFixed(0)}</span>
            </div>
          </div>
          
          {/* Ledger Preview */}
          {showLedger && (
            <div className="space-y-2 max-h-40 overflow-y-auto -mx-3 px-3 pb-3">
              {ledger.slice(0, 5).map(t => (
                <div key={t.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm">{t.description}</span>
                  <span className={`font-bold text-sm ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'CREDIT' ? '+' : '-'}₱{Number(t.amount).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => onNavigate('ADDRESSES')} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all shadow-lg">
              <span className="text-xl">📍</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Addresses</h4>
            <p className="text-sm text-gray-500">Manage delivery spots</p>
          </button>
          <button onClick={() => onNavigate('PAYMENTS')} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all shadow-lg">
              <span className="text-xl">💰</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Payments</h4>
            <p className="text-sm text-gray-500">Payment methods</p>
          </button>
          <button onClick={() => onNavigate('VOUCHERS')} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all shadow-lg">
              <span className="text-xl">🎟️</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Vouchers</h4>
            <p className="text-sm text-gray-500">Redeem rewards</p>
          </button>
          <button onClick={() => onNavigate('HISTORY')} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all shadow-lg">
              <span className="text-xl">📋</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Orders</h4>
            <p className="text-sm text-gray-500">Order history</p>
          </button>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
              <span className="text-lg">⚙️</span>
            </div>
            Settings
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer" onClick={() => updateSetting('pushAlerts', !settings.pushAlerts)}>
              <div>
                <div className="font-semibold text-gray-900">Push Notifications</div>
                <div className="text-sm text-gray-500">Order updates & promotions</div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-all relative ${settings.pushAlerts ? 'bg-purple-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 transition-all ${settings.pushAlerts ? 'right-0.5 translate-x-full' : 'left-0.5'}`} />
              </div>
            </label>
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer" onClick={() => updateSetting('autoSync', !settings.autoSync)}>
              <div>
                <div className="font-semibold text-gray-900">Auto Sync</div>
                <div className="text-sm text-gray-500">Background data sync</div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-all relative ${settings.autoSync ? 'bg-purple-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 transition-all ${settings.autoSync ? 'right-0.5 translate-x-full' : 'left-0.5'}`} />
              </div>
            </label>
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer" onClick={() => updateSetting('compactMode', !settings.compactMode)}>
              <div>
                <div className="font-semibold text-gray-900">Compact Mode</div>
                <div className="text-sm text-gray-500">Smaller card layouts</div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-all relative ${settings.compactMode ? 'bg-purple-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 transition-all ${settings.compactMode ? 'right-0.5 translate-x-full' : 'left-0.5'}`} />
              </div>
            </label>
          </div>
        </div>

        {/* Owner Role Switch */}
        {isOwner && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm border border-purple-200">
            <h3 className="font-bold text-lg text-purple-900 mb-4">Ayoo Mode</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['CUSTOMER', 'MERCHANT', 'RIDER'] as UserRole[]).map(role => (
                <button 
                  key={role} 
                  onClick={() => onSetRole(role)} 
                  className={`py-4 px-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                    user.role === role 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg' 
                      : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Prominent Logout CTA */}
      <div className="px-6 pb-[160px]">
        <button 
          onClick={onLogout}
          className="w-full sticky bottom-0 z-40 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-6 rounded-3xl shadow-2xl hover:shadow-3xl hover:from-red-600 hover:to-red-700 active:scale-[0.98] transition-all text-lg flex items-center justify-center space-x-3 bg-white/80 backdrop-blur-xl border-t border-red-200/50"
        >
          <span className="text-2xl">🚪</span>
          <span>Secure Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
