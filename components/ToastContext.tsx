import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ToastContextType {
  showToast: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const showToast = (msg: string, duration = 2000) => {
    setMessage(msg);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = window.setTimeout(() => setMessage(null), duration);
    setTimeoutId(id);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[85%] z-[100] animate-in fade-in slide-in-from-top-4">
          <div className="bg-white rounded-3xl p-4 shadow-xl border-2 border-[#FF00CC]/10 flex items-center gap-4">
            <div className="w-10 h-10 ayoo-gradient rounded-xl flex items-center justify-center text-white">✓</div>
            <p className="text-gray-900 font-bold text-sm truncate">{message}</p>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
