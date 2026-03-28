import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppScreen, UserAccount, UserRole, WalletTransaction } from '../types';
import { db } from '../db';
import { PHILIPPINE_CITIES } from '../constants';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import { useToast } from '../components/ToastContext';
import { getDisplayAvatar, isValidAvatar, generateAvatar } from '../src/utils/avatar';

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
        // Store the base64 data URL
        const base64Data = reader.result as string;
        setEditAvatar(base64Data);
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
    <div className="flex flex-col h-screen bg-gray-50 pb-24 overflow-y-auto scrollbar-hide">

      {showPinPrompt && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`bg-[#1A1A1A] w-full max-w-xs rounded-3xl p-8 border border-white/10 shadow-2xl transition-all ${pinError ? 'animate-shake border-red-500' : ''}`}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-[#C084FC] to-[#A855F7] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-white font-bold uppercase tracking-tight text-lg">Root Access</h3>
            </div>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-center text-2xl tracking-[0.5em] text-[#C084FC] font-bold focus:outline-none focus:border-[#A855F7] mb-5"
              />
              <Button type="submit">Authorize</Button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-md flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold uppercase tracking-tight">Edit Profile</h3>
              <button onClick={() => { setIsEditing(false); setImagePreview(null); }} className="p-2 -mr-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Avatar Edit */}
            <div className="flex flex-col items-center mb-2">
              <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-gradient-to-r from-[#C084FC] to-[#A855F7] rounded-full p-0.5 mb-3 relative cursor-pointer group shadow-lg flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  <img
                    src={imagePreview || (editAvatar && isValidAvatar(editAvatar) ? editAvatar : generateAvatar(editName || user!.name, user!.email))}
                    className="w-full h-full object-cover"
                    alt="Edit Avatar"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = generateAvatar(editName || user!.name, user!.email);
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <p className="text-xs font-medium text-[#C084FC]">Tap photo to change</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Full Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-3.5 border-2 border-gray-100 rounded-xl font-medium focus:border-[#C084FC] outline-none transition-all text-gray-800"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Preferred City</label>
                <select
                  value={editCity}
                  onChange={e => setEditCity(e.target.value)}
                  className="w-full p-3.5 border-2 border-gray-100 rounded-xl font-medium appearance-none outline-none focus:border-[#C084FC] bg-white text-gray-800"
                >
                  {PHILIPPINE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setIsEditing(false); setImagePreview(null); }}
                className="flex-1 py-3.5 font-semibold uppercase tracking-wider text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleSaveProfile}
                className="flex-1 py-3.5 font-semibold uppercase tracking-wider text-sm"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-[#C084FC] via-[#A855F7] to-[#C084FC] pt-24 pb-16 px-6 rounded-b-[32px] shadow-lg text-white relative overflow-visible">
        {/* Decorative elements - subtle */}
        <div className="absolute top-8 right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>

        <button onClick={onBack} className="absolute top-5 left-5 w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white font-bold hover:bg-white/30 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={() => setIsEditing(true)} className="absolute top-5 right-5 flex items-center gap-2 text-xs font-bold uppercase border border-white/30 px-4 py-2 rounded-xl backdrop-blur-md hover:bg-white/20 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </button>

        {/* Avatar - Fixed to prevent cutting off */}
        <div onClick={handleAvatarClick} className="w-24 h-24 mx-auto mb-4 relative flex-shrink-0">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
          <div className="relative w-full h-full rounded-full p-0.5 bg-gradient-to-br from-white/50 to-white/10">
            <div className="w-full h-full rounded-full overflow-hidden bg-white/20">
              <img
                src={getDisplayAvatar(user.avatar, user.name, user.email)}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = generateAvatar(user.name, user.email);
                }}
              />
            </div>
          </div>
          {isOwner && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <svg className="w-4 h-4 text-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 .921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784 .57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81 .588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}
        </div>
        <h2 className="text-2xl font-black tracking-tight uppercase mb-1 leading-none text-center">{user.name}</h2>
        <p className="text-xs font-medium opacity-80 text-center mb-3">{user.email}</p>
        <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-xl">
          <span className="text-sm font-bold">Level {user.level || 1}</span>
          <span className="text-xs opacity-70">Explorer</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-md border border-gray-100">
            <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-[#E9D5FF] to-[#F3E8FF] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#C084FC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08 .402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[10px] font-bold uppercase text-gray-500">Points</p>
            <p className="text-lg font-black text-[#C084FC]">{user.points || 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-md border border-gray-100">
            <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-[10px] font-bold uppercase text-gray-500">XP</p>
            <p className="text-lg font-black text-purple-600">{Math.floor(user.xp || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-md border border-gray-100">
            <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-[10px] font-bold uppercase text-gray-500">Role</p>
            <p className="text-xs font-black text-amber-600">{user.role || 'CUSTOMER'}</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Level Progress</p>
            <p className="text-xs font-black text-[#C084FC]">{levelProgress.percent}%</p>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#C084FC] to-[#A855F7] rounded-full transition-all" style={{ width: `${levelProgress.percent}%` }}></div>
          </div>
          <p className="text-[10px] font-medium text-gray-500 mt-2">
            {levelProgress.remaining} XP to reach {levelProgress.nextXp.toLocaleString()} XP
          </p>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 space-y-2">
          <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">Settings</h3>
          <button
            onClick={() => updateSetting('pushAlerts', !settings.pushAlerts)}
            className="w-full p-3 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${settings.pushAlerts ? 'bg-[#E9D5FF]' : 'bg-gray-200'}`}>
                <svg className={`w-4 h-4 ${settings.pushAlerts ? 'text-[#C084FC]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Push Alerts</span>
            </div>
            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.pushAlerts ? 'bg-gradient-to-r from-[#C084FC] to-[#A855F7]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${settings.pushAlerts ? 'translate-x-5' : ''}`}></div>
            </div>
          </button>
          <button
            onClick={() => updateSetting('autoSync', !settings.autoSync)}
            className="w-full p-3 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${settings.autoSync ? 'bg-purple-100' : 'bg-gray-200'}`}>
                <svg className={`w-4 h-4 ${settings.autoSync ? 'text-purple-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Auto Sync</span>
            </div>
            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.autoSync ? 'bg-gradient-to-r from-[#C084FC] to-[#A855F7]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${settings.autoSync ? 'translate-x-5' : ''}`}></div>
            </div>
          </button>
          <button
            onClick={() => updateSetting('compactMode', !settings.compactMode)}
            className="w-full p-3 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${settings.compactMode ? 'bg-amber-100' : 'bg-gray-200'}`}>
                <svg className={`w-4 h-4 ${settings.compactMode ? 'text-amber-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Compact Mode</span>
            </div>
            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.compactMode ? 'bg-gradient-to-r from-[#C084FC] to-[#A855F7]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${settings.compactMode ? 'translate-x-5' : ''}`}></div>
            </div>
          </button>
        </div>

        {/* Wallet Snapshot */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">Wallet Snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <p className="text-[10px] font-bold uppercase text-red-400">Total Spend</p>
              <p className="text-base font-black text-red-500">₱{ledgerStats.debit.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-[10px] font-bold uppercase text-green-600">Total Credit</p>
              <p className="text-base font-black text-green-600">₱{ledgerStats.credit.toFixed(2)}</p>
            </div>
            <div className={`rounded-xl p-3 border ${ledgerStats.net >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-[10px] font-bold uppercase text-gray-400">Net</p>
              <p className={`text-base font-black ${ledgerStats.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>₱{ledgerStats.net.toFixed(2)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-[10px] font-bold uppercase text-amber-500">Pending</p>
              <p className="text-base font-black text-amber-500">{ledgerStats.pending}</p>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
            <h3 className="font-bold text-[10px] uppercase tracking-wider text-gray-400 mb-1">Ayoo Perspective</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['CUSTOMER', 'MERCHANT', 'RIDER'] as UserRole[]).map(r => (
                <button key={r} onClick={() => onSetRole(r)} className={`py-3 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${user.role === r ? 'bg-gradient-to-r from-[#C084FC] to-[#A855F7] text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'}`}>{r}</button>
              ))}
            </div>
          </div>
        )}

        {/* Ayoo Manual Button */}
        <button onClick={resetManual} className="w-full p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl relative overflow-hidden group shadow-lg transition-all active:scale-[0.98]">
          <div className="absolute top-0 right-0 bottom-0 w-28 bg-gradient-to-l from-[#C084FC] to-[#A855F7] opacity-90"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332 .477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332 .477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332 .477-4.5 1.253" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold text-sm">Ayoo Manual</h3>
                <p className="text-white/60 text-xs">Learn how to use the app</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555 .832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </button>

        {/* Transaction Summary Toggle */}
        <button onClick={() => setShowLedger(!showLedger)} className="w-full p-4 bg-gray-50 rounded-2xl text-left border border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-700">Transaction Summary</h3>
          <span className="text-xs font-bold text-[#C084FC]">{showLedger ? 'Hide' : 'Show'}</span>
        </button>

        {/* Transaction List */}
        {showLedger && (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
            {ledger.length === 0 ? (
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center py-4">No transactions yet</p>
            ) : ledger.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex justify-between items-center bg-white rounded-xl p-3 border border-gray-100">
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800">{entry.description}</p>
                  <p className="text-[9px] font-medium text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
                <p className={`text-sm font-bold ${entry.type === 'DEBIT' ? 'text-red-500' : 'text-green-500'}`}>
                  {entry.type === 'DEBIT' ? '-' : '+'}₱{entry.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-2">
          <button onClick={() => onNavigate('ADDRESSES')} className="w-full p-4 bg-white rounded-2xl flex items-center justify-between group shadow-sm border border-gray-100 hover:border-purple-200 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E9D5FF] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#C084FC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-800 text-sm">Delivery Pockets</h4>
                <p className="text-xs text-gray-400">Manage saved addresses</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-[#C084FC] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button onClick={() => onNavigate('PAYMENTS')} className="w-full p-4 bg-white rounded-2xl flex items-center justify-between group shadow-sm border border-gray-100 hover:border-purple-200 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-800 text-sm">Payment Vault</h4>
                <p className="text-xs text-gray-400">Manage payment methods</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-[#C084FC] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button onClick={onLogout} className="w-full p-4 bg-red-50 rounded-2xl flex items-center justify-between group shadow-sm border border-red-100 hover:bg-red-500 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-white/20">
                <svg className="w-5 h-5 text-red-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-red-500 group-hover:text-white text-sm">Secure Logout</h4>
                <p className="text-xs text-red-400 group-hover:text-white/70">Sign out of your account</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-red-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <BottomNav
        active="PROFILE"
        onNavigate={onNavigate}
        mode={isOwner ? 'operations' : 'customer'}
        showAdmin={isOwner}
        user={user}
      />
    </div>
  );
};

export default Profile;

