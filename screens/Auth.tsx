
import React, { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { UserAccount, UserRole } from '../types';
import { db } from '../db';
import { GLOBAL_REGISTRY_KEY } from '../constants';

interface AuthProps {
  onLogin: (user: UserAccount) => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [registryCount, setRegistryCount] = useState(0);

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

  // Load remembered credentials on mount
  useEffect(() => {
    const loadRemembered = async () => {
      const saved = await db.getRemembered();
      if (saved && mode === 'LOGIN') {
        setEmail(saved.email);
        setPassword(saved.password);
        setRememberMe(true);
      }
      
      const raw = localStorage.getItem(GLOBAL_REGISTRY_KEY);
      const reg = raw ? JSON.parse(raw) : [];
      setRegistryCount(reg.length);
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
      setErrorMessage('Please enter a valid email identity.');
      setShowError(true);
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMessage('Secret key must be at least 6 characters.');
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
          setErrorMessage('Invalid credentials. Identity not verified.');
          setShowError(true);
          setIsSubmitting(false);
        }
      } else if (mode === 'SIGNUP') {
        if (!name.trim()) {
           setErrorMessage('Full name/Business name is required.');
           setShowError(true);
           setIsSubmitting(false);
           return;
        }
        if (cleanPass !== confirmPassword.trim()) {
           setErrorMessage('Secret keys do not match.');
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
          // Auto login after signup
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
      setErrorMessage('Cloud Vault synchronization failure.');
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
         setErrorMessage('Email not found in registry.');
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
      <p className="text-gray-400 text-center mb-10 font-bold leading-relaxed px-6 text-sm uppercase tracking-widest">Secure Entry Point</p>

      <form className="space-y-6" onSubmit={handleAuth}>
        <div className="input-label-border">
          <label>Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            disabled={isSubmitting}
            className="w-full p-5 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#FF00CC] transition-all text-gray-700 font-bold"
            required
          />
        </div>

        <div className="input-label-border">
          <label>Secret Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              disabled={isSubmitting}
              className="w-full p-5 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#FF00CC] transition-all text-gray-700 font-bold"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-xl filter grayscale active:scale-90 transition-transform">
                {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-[#FF00CC] border-[#FF00CC]' : 'bg-white border-gray-100 group-hover:border-pink-300'}`}>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                  />
                  {rememberMe && <span className="text-white text-[10px] font-black">✓</span>}
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Keep me signed in</span>
            </label>
            <button type="button" onClick={() => { setMode('FORGOT'); setForgotStep(1); }} className="text-[10px] font-black text-[#FF00CC] uppercase tracking-widest">Recovery?</button>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isSubmitting} className="pill-shadow py-5 text-xl font-black uppercase tracking-widest">
            {isSubmitting ? 'Verifying...' : 'Sign In'}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center flex flex-col gap-4">
          <p className="text-gray-400 font-bold text-sm">
              New to Ayoo? 
              <button onClick={() => setMode('SIGNUP')} className="ml-2 text-[#FF00CC] font-black hover:underline uppercase tracking-tighter">Create Account</button>
          </p>
          
          <div className="flex items-center justify-center gap-6 mt-4 opacity-40">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-900">Ayoo Vault: {registryCount} Accounts</span>
            </div>
            <button onClick={() => db.flushRegistry()} className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:underline">Flush Registry</button>
          </div>
      </div>
    </div>
  );

  const renderSignupForm = () => (
    <div className="flex-1 flex flex-col p-8 pt-12 animate-in slide-in-from-right-full duration-500 bg-white overflow-y-auto scrollbar-hide">
      <div className="mb-8 flex justify-center"><Logo variant="colored" size="sm" withSubtext={false} /></div>
      <div className="w-full max-w-sm mx-auto">
        <h2 className="text-4xl font-black text-gray-900 mb-2 text-center tracking-tighter uppercase leading-none">Join the Fleet</h2>
        <p className="text-gray-400 text-center mb-8 font-bold leading-relaxed px-6 text-sm uppercase tracking-widest">New Identity Protocol</p>
        
        <div className="flex gap-2 mb-10 bg-gray-50 p-1.5 rounded-[24px] border border-gray-100">
           {(['CUSTOMER', 'MERCHANT', 'RIDER'] as UserRole[]).map(role => (
             <button 
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`flex-1 py-3.5 rounded-[18px] text-[9px] font-black uppercase tracking-widest transition-all ${
                  selectedRole === role ? 'bg-[#FF00CC] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
                }`}
             >
                {role === 'CUSTOMER' ? '🛒' : role === 'MERCHANT' ? '🏪' : '🛵'}<br/>{role}
             </button>
           ))}
        </div>

        <form className="space-y-6 pb-20" onSubmit={handleAuth}>
          <div className="input-label-border">
            <label>{selectedRole === 'MERCHANT' ? 'Business Name' : 'Full Name'}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-5 border border-gray-200 rounded-2xl focus:border-[#FF00CC] font-bold outline-none" required />
          </div>
          <div className="input-label-border">
            <label>Email Identity</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-5 border border-gray-200 rounded-2xl focus:border-[#FF00CC] font-bold outline-none" required />
          </div>
          <div className="input-label-border">
            <label>Secret Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 border border-gray-200 rounded-2xl focus:border-[#FF00CC] font-bold outline-none" required />
          </div>
          <div className="input-label-border">
            <label>Confirm Secret</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-5 border border-gray-200 rounded-2xl focus:border-[#FF00CC] font-bold outline-none" required />
          </div>
          
          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="pill-shadow py-5 text-xl font-black uppercase tracking-widest">
              {isSubmitting ? 'Registering...' : 'Initialize Profile'}
            </Button>
            <button onClick={() => setMode('LOGIN')} className="w-full mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Back to Login</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-700 ease-in-out ${mode === 'LOGIN' ? 'bg-[#FF00CC]' : 'bg-white'}`}>
      {mode === 'LOGIN' && (
        <>
          <div className="flex-[0.4] flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
            <Logo variant="white" size="lg" withSubtext={false} />
          </div>
          <div className="flex-[0.6] bg-white rounded-t-[50px] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] floating-card flex flex-col">
            <div className="w-full max-w-sm mx-auto flex flex-col h-full">
              {renderLoginForm()}
            </div>
          </div>
        </>
      )}
      {mode === 'SIGNUP' && renderSignupForm()}
      {mode === 'FORGOT' && (
         <div className="p-8 h-screen bg-white animate-in zoom-in-95">
           <button onClick={() => setMode('LOGIN')} className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-[#FF00CC] font-black mb-10 text-2xl">←</button>
           <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-none">Recover Vault</h2>
           <p className="text-gray-400 font-bold mb-10 text-xs uppercase tracking-widest">Registry Verification</p>
           
           <form onSubmit={handleForgotPassword} className="space-y-8">
              <div className="input-label-border">
                 <label>Registered Email</label>
                 <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-5 border border-gray-200 rounded-2xl focus:border-[#FF00CC] outline-none font-bold" required />
              </div>
              {forgotStep === 2 && (
                <div className="input-label-border animate-in slide-in-from-top-4">
                  <label>New Secret Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 border border-[#FF00CC] rounded-2xl outline-none font-bold" required />
                </div>
              )}
              <Button type="submit" disabled={isSubmitting} className="py-5 uppercase font-black tracking-widest">
                {isSubmitting ? 'Syncing...' : forgotStep === 1 ? 'Verify Email' : 'Update Vault'}
              </Button>
           </form>
         </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-md flex items-center justify-center p-8">
           <div className="bg-white rounded-[40px] p-10 shadow-2xl border-2 border-green-500 animate-in zoom-in-95 text-center">
              <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl">✓</div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2 leading-none">Authorized!</h3>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Decrypting Ayoo Cloud session...</p>
           </div>
        </div>
      )}
      
      {showError && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[92%] z-[200] bg-white rounded-[30px] p-6 shadow-2xl border-2 border-red-500 animate-in slide-in-from-top-10 flex items-center gap-4">
           <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center text-xl shrink-0 font-black text-xs uppercase">Fault</div>
           <p className="text-red-600 font-black uppercase tracking-tight text-xs leading-tight">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default Auth;
