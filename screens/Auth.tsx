import React, { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { UserAccount, UserRole } from '../types';
import { db } from '../db';
import { COLORS, IMAGES } from '../constants';
import { generateAvatar } from '../src/utils/avatar';

interface AuthProps {
  onLogin: (user: UserAccount) => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('CUSTOMER');

  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);

  useEffect(() => {
    const loadRemembered = async () => {
      const saved = await db.getRemembered();
      if (saved && mode === 'LOGIN') {
        setEmail(saved.email);
        setPassword(saved.password);
        setRememberMe(true);
      }
    };
    loadRemembered();
  }, [mode]);

  const validateEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setShowError(false);
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = password.trim();

    if (!validateEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      setShowError(true);
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      setShowError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'LOGIN') {
        const user = await db.login(cleanEmail, cleanPass, rememberMe);
        if (user) {
          setShowSuccess(true);
          setTimeout(() => onLogin(user), 1200);
        } else {
          setErrorMessage('Invalid email or password.');
          setShowError(true);
          setIsSubmitting(false);
        }
      } else if (mode === 'SIGNUP') {
        if (!name.trim()) {
          setErrorMessage('Full name or Business name is required.');
          setShowError(true);
          setIsSubmitting(false);
          return;
        }
        if (cleanPass !== confirmPassword.trim()) {
          setErrorMessage('Passwords do not match.');
          setShowError(true);
          setIsSubmitting(false);
          return;
        }

        const newUser: UserAccount = {
          name: name.trim(),
          email: cleanEmail,
          password: cleanPass,
          avatar: generateAvatar(name.trim(), cleanEmail),
          points: 500,
          xp: 0,
          level: 1,
          streak: 1,
          badges: [],
          role: selectedRole
        };

        const res = await db.register(newUser);
        if (res.success) {
          setShowSuccess(true);
          setTimeout(async () => {
            const loggedIn = await db.login(cleanEmail, cleanPass, rememberMe);
            if (loggedIn) onLogin(loggedIn);
          }, 1500);
        } else {
          setErrorMessage(res.message);
          setShowError(true);
          setIsSubmitting(false);
        }
      }
    } catch (err) {
      setErrorMessage('Connection failed. Please try again.');
      setShowError(true);
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (forgotStep === 1) {
      const user = await db.getUserByEmail(email);
      if (user) setForgotStep(2);
      else {
        setErrorMessage('Email not found.');
        setShowError(true);
      }
    } else {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        setShowError(true);
        setIsSubmitting(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        setShowError(true);
        setIsSubmitting(false);
        return;
      }
      const success = await db.updatePassword(email, password);
      if (success) {
        setShowSuccess(true);
        setTimeout(() => { setMode('LOGIN'); setShowSuccess(false); setForgotStep(1); setPassword(''); setConfirmPassword(''); }, 1500);
      } else {
        setErrorMessage('Failed to update password. Please try again.');
        setShowError(true);
      }
    }
    setIsSubmitting(false);
  };

  const renderLoginForm = () => (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-gray-900 mb-2 mt-2 text-center tracking-tight uppercase leading-none">Welcome Back</h2>
      <p className="text-gray-400 text-center mb-8 font-medium leading-relaxed px-6 text-sm uppercase tracking-wider">Login to your account</p>

      <form className="space-y-5" onSubmit={handleAuth}>
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2 block ml-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            disabled={isSubmitting}
            className="w-full p-3.5 border-2 border-gray-100 bg-gray-50 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-white transition-all text-gray-700 font-medium"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2 block ml-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              disabled={isSubmitting}
              className="w-full p-3.5 border-2 border-gray-100 bg-gray-50 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-white transition-all text-gray-700 font-medium"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showPassword ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858 .908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-purple-500 border-purple-500' : 'bg-white border-gray-200 group-hover:border-purple-300'}`}>
              <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              {rememberMe && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Remember Me</span>
          </label>
          <button type="button" onClick={() => { setMode('FORGOT'); setForgotStep(1); }} className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Forgot Password?</button>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isSubmitting} className="py-4 text-base font-bold uppercase tracking-wider">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400 font-medium text-sm">
          New to Ayoo?
          <button onClick={() => setMode('SIGNUP')} className="ml-2 text-purple-500 font-bold hover:underline uppercase tracking-tight">Create Account</button>
        </p>
      </div>
    </div>
  );

  const renderSignupForm = () => (
    <div className="animate-in fade-in duration-500">
      <button onClick={() => setMode('LOGIN')} className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 font-bold mb-3 -mt-1">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center tracking-tight uppercase leading-none">Create Account</h2>
      <p className="text-gray-400 text-center mb-6 font-medium leading-relaxed px-6 text-sm uppercase tracking-wider">Start your journey with Ayoo</p>

      <div className="flex gap-2 mb-6 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
        {(['CUSTOMER', 'MERCHANT', 'RIDER'] as UserRole[]).map(role => (
          <button
            key={role}
            type="button"
            onClick={() => setSelectedRole(role)}
            className={`flex-1 py-3 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${selectedRole === role ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {role === 'CUSTOMER' ? '🛒' : role === 'MERCHANT' ? '🏪' : '🛵'}<span className="text-[8px]">{role}</span>
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleAuth}>
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2 block ml-1">{selectedRole === 'MERCHANT' ? 'Business Name' : 'Full Name'}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3.5 border-2 border-gray-100 bg-gray-50 rounded-xl focus:border-purple-400 font-medium outline-none" placeholder="Enter name" required />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2 block ml-1">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3.5 border-2 border-gray-100 bg-gray-50 rounded-xl focus:border-purple-400 font-medium outline-none" placeholder="example@gmail.com" required />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2 block ml-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3.5 border-2 border-gray-100 bg-gray-50 rounded-xl focus:border-purple-400 font-medium outline-none" placeholder="Min. 6 characters" required />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2 block ml-1">Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3.5 border-2 border-gray-100 bg-gray-50 rounded-xl focus:border-purple-400 font-medium outline-none" placeholder="Repeat password" required />
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isSubmitting} className="py-4 text-base font-bold uppercase tracking-wider">
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-700 ease-in-out ${mode === 'LOGIN' || mode === 'SIGNUP' ? 'bg-gradient-to-b from-purple-400 to-purple-500' : 'bg-white'}`}>
      {(mode === 'LOGIN' || mode === 'SIGNUP') && (
        <>
          <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 min-h-[40vh]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-500"></div>
            <img
              src={IMAGES.logoPurple}
              alt="Ayoo purple bg"
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-purple-400/50 via-transparent to-purple-400/60"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Logo variant="white" size="2xl" withSubtext={false} showWordmark={false} />
            </div>
          </div>
          <div className="bg-white rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col -mt-8 relative z-10">
            <div className="w-full max-w-sm mx-auto flex flex-col h-full">
              {mode === 'LOGIN' ? renderLoginForm() : renderSignupForm()}
            </div>
          </div>
        </>
      )}
      {mode === 'FORGOT' && (
        <div className="p-8 h-screen bg-white animate-in zoom-in-95">
          <button onClick={() => setMode('LOGIN')} className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-[#C084FC] font-black mb-10 text-2xl">←</button>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-none">Reset Password</h2>
          <p className="text-gray-400 font-bold mb-10 text-xs uppercase tracking-widest">Enter your email to reset</p>

          <form onSubmit={handleForgotPassword} className="space-y-8">
            <div className="input-label-border">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">Registered Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-5 border border-gray-100 bg-gray-50 rounded-2xl focus:border-[#C084FC] outline-none font-bold" required />
            </div>
            {forgotStep === 2 && (
              <div className="input-label-border animate-in slide-in-from-top-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 border border-[#C084FC] rounded-2xl outline-none font-bold" required />
              </div>
            )}
            {forgotStep === 2 && (
              <div className="input-label-border animate-in slide-in-from-top-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-5 border border-[#C084FC] rounded-2xl outline-none font-bold" required />
              </div>
            )}
            <Button type="submit" disabled={isSubmitting} className="py-5 uppercase font-black tracking-widest" style={{ backgroundColor: COLORS.primary }}>
              {isSubmitting ? 'Loading...' : forgotStep === 1 ? 'Verify Email' : 'Update Password'}
            </Button>
          </form>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[200] bg-[#C084FC] flex items-center justify-center p-8">
          <div className="animate-in zoom-in-95 text-center">
            <Logo variant="white" size="2xl" withSubtext={true} showWordmark={false} />
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white mt-8 mb-2 leading-none">Welcome to Ayoo!</h3>
            <p className="text-white/80 font-bold text-xs uppercase tracking-widest">Logging you in...</p>
          </div>
        </div>
      )}

      {showError && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[92%] z-[200] bg-white rounded-[30px] p-6 shadow-2xl border-b-4 border-red-500 animate-in slide-in-from-top-10 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0 font-black">!</div>
          <p className="text-red-600 font-black uppercase tracking-tight text-xs leading-tight">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default Auth;
