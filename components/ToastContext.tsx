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
        <div className="fixed top-24 left-1/2 z-[100] w-[85%] -translate-x-1/2 animate-in">
          <div className="flex items-center gap-4 rounded-[28px] border border-purple-200 bg-white/95 p-4 shadow-[0_18px_45px_rgba(109,40,217,0.18)] backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-700 via-purple-500 to-purple-300 text-white shadow-lg">
              ✓
            </div>
            <p className="truncate text-sm font-bold text-purple-950">{message}</p>
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
