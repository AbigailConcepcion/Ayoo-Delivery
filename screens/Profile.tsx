
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppScreen, UserAccount, UserRole, WalletTransaction } from '../types';
import { db } from '../db';
import { PHILIPPINE_CITIES } from '../constants';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import { useToast } from '../components/ToastContext';

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
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [editCity, setEditCity] = useState(user?.preferredCity || 'Iligan City');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

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
    if (!editName.trim()) {
      showToast('Please enter your name');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await db.updateProfile(user.email, {
        name: editName.trim(),
        avatar: editAvatar.trim(),
        preferredCity: editCity
      });
      if (updated) {
        onUpdateUser(updated);
        showToast('Profile updated successfully!');
      }
      setIsEditing(false);
      setImagePreview(null);
    } catch (error) {
      showToast('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
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
          <div className="bg-white w-full max-w-md rounded-t-[50px] p-8 animate-in slide-in-from-bottom-10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Edit Profile</h3>
              <button onClick={() => { setIsEditing(false); setImagePreview(null); }} className="p-2">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col items-center mb-4">
              <div onClick={() => fileInputRef.current?.click()} className="w-28 h-28 ayoo-gradient rounded-full p-1 mb-3 relative cursor-pointer group shadow-xl">
                <img
                  src={imagePreview || editAvatar || `https://i.pravatar.cc/150?u=${user.email}`}
                  className="w-full h-full rounded-full object-cover border-4 border-white"
                  alt="Edit Avatar"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-2xl">📷</span>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <p className="text-xs font-semibold text-pink-500">Tap photo to change</p>
            </div>

            <div className="space-y-4">
              <div className="input-label-border">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Full Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold focus:border-pink-500 outline-none transition-all"
                  placeholder="Enter your name"
                />
              </div>
              <div className="input-label-border">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Preferred City</label>
                <select
                  value={editCity}
                  onChange={e => setEditCity(e.target.value)}
                  className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold appearance-none outline-none focus:border-pink-500 bg-white"
                >
                  {PHILIPPINE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setIsEditing(false); setImagePreview(null); }}
                className="flex-1 py-4 font-bold uppercase tracking-widest text-xs text-gray-500 bg-gray-100 rounded-2xl"
              >
                Cancel
              </button>
              <Button
                onClick={handleSaveProfile}
                className="flex-1 py-4 font-black uppercase tracking-widest text-xs"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-[#FF1493] via-[#FF69B4] to-[#FF00CC] pt-20 pb-16 px-8 rounded-b-[40px] shadow-xl text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-5 left-5 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>

        <button onClick={onBack} className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white font-bold hover:bg-white/30 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={() => setIsEditing(true)} className="absolute top-6 right-6 flex items-center gap-2 text-xs font-bold uppercase border border-white/30 px-4 py-2 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </button>

        <div onClick={handleAvatarClick} className="w-28 h-28 mx-auto mb-5 relative">
          <div className="absolute inset-0 bg-white/30 rounded-full blur-xl"></div>
          <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-br from-white/40 to-white/10">
            <img
              src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`}
              className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
              alt="Avatar"
            />
          </div>
          {isOwner && (
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-xs">⭐</span>
            </div>
          )}
        </div>
        <h2 className="text-3xl font-black tracking-tight uppercase mb-2 leading-none text-center">{user.name}</h2>
        <p className="text-xs font-medium uppercase tracking-widest opacity-80 text-center">{user.email}</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full">
          <span className="text-sm font-bold">Level {user.level || 1}</span>
          <span className="text-xs opacity-70">Explorer</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-4 text-center shadow-sm border border-pink-100">
            <div className="w-10 h-10 mx-auto mb-2 bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-lg">💎</span>
            </div>
            <p className="text-[9px] font-bold uppercase text-gray-500">Points</p>
            <p className="text-lg font-black text-[#FF00CC]">{user.points || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-4 text-center shadow-sm border border-purple-100">
            <div className="w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-lg">⚡</span>
            </div>
            <p className="text-[9px] font-bold uppercase text-gray-500">XP</p>
            <p className="text-lg font-black text-purple-600">{Math.floor(user.xp || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-4 text-center shadow-sm border border-amber-100">
            <div className="w-10 h-10 mx-auto mb-2 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <p className="text-[9px] font-bold uppercase text-gray-500">Role</p>
            <p className="text-xs font-black text-amber-600">{user.role || 'CUSTOMER'}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Level Progress</p>
            <p className="text-xs font-black text-[#FF00CC]">{levelProgress.percent}%</p>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF1493] to-[#FF69B4] rounded-full transition-all" style={{ width: `${levelProgress.percent}%` }}></div>
          </div>
          <p className="text-[10px] font-medium text-gray-500 mt-3">
            {levelProgress.remaining} XP to reach {levelProgress.nextXp.toLocaleString()} XP
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-2">Settings</h3>
          <button
            onClick={() => updateSetting('pushAlerts', !settings.pushAlerts)}
            className="w-full p-4 bg-gray-50 rounded-2xl flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.pushAlerts ? 'bg-pink-100' : 'bg-gray-200'}`}>
                <svg className={`w-5 h-5 ${settings.pushAlerts ? 'text-pink-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Push Alerts</span>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.pushAlerts ? 'bg-[#FF00CC]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${settings.pushAlerts ? 'translate-x-6' : ''}`}></div>
            </div>
          </button>
          <button
            onClick={() => updateSetting('autoSync', !settings.autoSync)}
            className="w-full p-4 bg-gray-50 rounded-2xl flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.autoSync ? 'bg-purple-100' : 'bg-gray-200'}`}>
                <svg className={`w-5 h-5 ${settings.autoSync ? 'text-purple-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Auto Sync</span>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.autoSync ? 'bg-[#FF00CC]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${settings.autoSync ? 'translate-x-6' : ''}`}></div>
            </div>
          </button>
          <button
            onClick={() => updateSetting('compactMode', !settings.compactMode)}
            className="w-full p-4 bg-gray-50 rounded-2xl flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.compactMode ? 'bg-amber-100' : 'bg-gray-200'}`}>
                <svg className={`w-5 h-5 ${settings.compactMode ? 'text-amber-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Compact Mode</span>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.compactMode ? 'bg-[#FF00CC]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${settings.compactMode ? 'translate-x-6' : ''}`}></div>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-4">Wallet Snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <p className="text-[10px] font-bold uppercase text-red-400">Total Spend</p>
              <p className="text-base font-black text-red-500">₱{ledgerStats.debit.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <p className="text-[10px] font-bold uppercase text-green-500">Total Credit</p>
              <p className="text-base font-black text-green-600">₱{ledgerStats.credit.toFixed(2)}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${ledgerStats.net >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-[10px] font-bold uppercase text-gray-400">Net</p>
              <p className={`text-base font-black ${ledgerStats.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>₱{ledgerStats.net.toFixed(2)}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <p className="text-[10px] font-bold uppercase text-amber-500">Pending</p>
              <p className="text-base font-black text-amber-500">{ledgerStats.pending}</p>
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

        <button onClick={resetManual} className="w-full p-5 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl relative overflow-hidden group shadow-lg transition-all active:scale-95">
          <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-[#FF1493] to-[#FF69B4] opacity-90"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">
                📖
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold text-base">Ayoo Manual</h3>
                <p className="text-white/60 text-xs">Learn how to use the app</p>
              </div>
            </div>
            <span className="text-white/40 text-xs font-bold uppercase tracking-widest group-hover:text-white">Play</span>
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
          <button onClick={() => onNavigate('ADDRESSES')} className="w-full p-5 bg-white rounded-3xl flex items-center justify-between group shadow-sm border border-gray-100 hover:border-pink-200 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-xl">
                📍
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-800">Delivery Pockets</h4>
                <p className="text-xs text-gray-400">Manage saved addresses</p>
              </div>
            </div>
            <span className="text-gray-300 group-hover:text-[#FF00CC] transition-colors">→</span>
          </button>
          <button onClick={() => onNavigate('PAYMENTS')} className="w-full p-5 bg-white rounded-3xl flex items-center justify-between group shadow-sm border border-gray-100 hover:border-purple-200 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-xl">
                💳
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-800">Payment Vault</h4>
                <p className="text-xs text-gray-400">Manage payment methods</p>
              </div>
            </div>
            <span className="text-gray-300 group-hover:text-[#FF00CC] transition-colors">→</span>
          </button>
          <button onClick={onLogout} className="w-full p-5 bg-red-50 rounded-3xl flex items-center justify-between group shadow-sm border border-red-100 hover:bg-red-500 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-xl group-hover:bg-white/20">
                🚪
              </div>
              <div className="text-left">
                <h4 className="font-bold text-red-500 group-hover:text-white">Secure Logout</h4>
                <p className="text-xs text-red-400 group-hover:text-white/70">Sign out of your account</p>
              </div>
            </div>
            <span className="text-red-300 group-hover:text-white transition-colors">→</span>
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
