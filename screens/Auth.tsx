import React, { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { UserAccount, UserRole } from '../types';
import { db } from '../db';
import { COLORS, IMAGES } from '../constants'; // Ginagamit ang bagong color palette

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
      const success = await db.updatePassword(email, password);
      if (success) {
        setShowSuccess(true);
        setTimeout(() => { setMode('LOGIN'); setShowSuccess(false); }, 1500);
      }
    }
    setIsSubmitting(false);
  };

  const renderLoginForm = () => (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-4xl font-black text-gray-900 mb-2 mt-2 text-center tracking-tighter uppercase leading-none">Welcome Back</h2>
      <p className="text-gray-400 text-center mb-10 font-bold leading-relaxed px-6 text-sm uppercase tracking-widest">Login to your account</p>

      <form className="space-y-6" onSubmit={handleAuth}>
        <div className="input-label-border">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            disabled={isSubmitting}
            className="w-full p-5 border border-gray-100 bg-gray-50 rounded-2xl focus:outline-none focus:border-[#FF1493] focus:bg-white transition-all text-gray-700 font-bold"
            required
          />
        </div>

        <div className="input-label-border">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              disabled={isSubmitting}
              className="w-full p-5 border border-gray-100 bg-gray-50 rounded-2xl focus:outline-none focus:border-[#FF1493] focus:bg-white transition-all text-gray-700 font-bold"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-xl opacity-50 active:scale-90 transition-transform">
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-[#FF1493] border-[#FF1493]' : 'bg-white border-gray-100 group-hover:border-pink-300'}`}>
              <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              {rememberMe && <span className="text-white text-[10px] font-black">✓</span>}
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remember Me</span>
          </label>
          <button type="button" onClick={() => { setMode('FORGOT'); setForgotStep(1); }} className="text-[10px] font-black text-[#FF1493] uppercase tracking-widest">Forgot Password?</button>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isSubmitting} className="pill-shadow py-5 text-xl font-black uppercase tracking-widest" style={{ backgroundColor: COLORS.primary }}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-400 font-bold text-sm">
          New to Ayoo?
          <button onClick={() => setMode('SIGNUP')} className="ml-2 text-[#FF1493] font-black hover:underline uppercase tracking-tighter">Create Account</button>
        </p>
      </div>
    </div>
  );

  const renderSignupForm = () => (
    <div className="animate-in fade-in duration-500">
      {/* Back Button */}
      <button onClick={() => setMode('LOGIN')} className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-[#FF1493] font-black mb-4 text-2xl -mt-2">←</button>

      <h2 className="text-4xl font-black text-gray-900 mb-2 text-center tracking-tighter uppercase leading-none">Create Account</h2>
      <p className="text-gray-400 text-center mb-8 font-bold leading-relaxed px-6 text-sm uppercase tracking-widest">Start your journey with Ayoo</p>

      <div className="flex gap-2 mb-8 bg-gray-50 p-1.5 rounded-[24px] border border-gray-100">
        {(['CUSTOMER', 'MERCHANT', 'RIDER'] as UserRole[]).map(role => (
          <button
            key={role}
            type="button"
            onClick={() => setSelectedRole(role)}
            className={`flex-1 py-3.5 rounded-[18px] text-[9px] font-black uppercase tracking-widest transition-all ${selectedRole === role ? 'bg-[#FF1493] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {role === 'CUSTOMER' ? '🛒' : role === 'MERCHANT' ? '🏪' : '🛵'}<br />{role}
          </button>
        ))}
      </div>

      <form className="space-y-5" onSubmit={handleAuth}>
        <div className="input-label-border">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">{selectedRole === 'MERCHANT' ? 'Business Name' : 'Full Name'}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-5 border border-gray-100 bg-gray-50 rounded-2xl focus:border-[#FF1493] font-bold outline-none" placeholder="Enter name" required />
        </div>
        <div className="input-label-border">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-5 border border-gray-100 bg-gray-50 rounded-2xl focus:border-[#FF1493] font-bold outline-none" placeholder="example@gmail.com" required />
        </div>
        <div className="input-label-border">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 border border-gray-100 bg-gray-50 rounded-2xl focus:border-[#FF1493] font-bold outline-none" placeholder="Min. 6 characters" required />
        </div>
        <div className="input-label-border">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-5 border border-gray-100 bg-gray-50 rounded-2xl focus:border-[#FF1493] font-bold outline-none" placeholder="Repeat password" required />
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isSubmitting} className="pill-shadow py-5 text-xl font-black uppercase tracking-widest" style={{ backgroundColor: COLORS.primary }}>
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-700 ease-in-out ${mode === 'LOGIN' || mode === 'SIGNUP' ? 'bg-[#FF1493]' : 'bg-white'}`}>
      {(mode === 'LOGIN' || mode === 'SIGNUP') && (
        <>
          <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-8 animate-in fade-in duration-700 min-h-[45vh]">
            <div className="absolute inset-0 bg-[#FF1493]"></div>
            <img
              src={IMAGES.logoPink}
              alt="Ayoo pink bg"
              className="absolute inset-0 w-full h-full object-cover scale-[2] opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#FF1493]/60 via-[#FF1493]/45 to-[#FF1493]/75"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Logo variant="white" size="2xl" withSubtext={false} showWordmark={false} />
            </div>
          </div>
          <div className="bg-white rounded-t-[50px] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] flex flex-col -mt-10 relative z-10">
            <div className="w-full max-w-sm mx-auto flex flex-col h-full">
              {mode === 'LOGIN' ? renderLoginForm() : renderSignupForm()}
            </div>
          </div>
        </>
      )}
      {mode === 'FORGOT' && (
        <div className="p-8 h-screen bg-white animate-in zoom-in-95">
          <button onClick={() => setMode('LOGIN')} className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-[#FF1493] font-black mb-10 text-2xl">←</button>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-none">Reset Password</h2>
          <p className="text-gray-400 font-bold mb-10 text-xs uppercase tracking-widest">Enter your email to reset</p>

          <form onSubmit={handleForgotPassword} className="space-y-8">
            <div className="input-label-border">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">Registered Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-5 border border-gray-100 bg-gray-50 rounded-2xl focus:border-[#FF1493] outline-none font-bold" required />
            </div>
            {forgotStep === 2 && (
              <div className="input-label-border animate-in slide-in-from-top-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-2">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 border border-[#FF1493] rounded-2xl outline-none font-bold" required />
              </div>
            )}
            <Button type="submit" disabled={isSubmitting} className="py-5 uppercase font-black tracking-widest" style={{ backgroundColor: COLORS.primary }}>
              {isSubmitting ? 'Loading...' : forgotStep === 1 ? 'Verify Email' : 'Update Password'}
            </Button>
          </form>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[200] bg-[#FF1493] flex items-center justify-center p-8">
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
