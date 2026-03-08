import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { notificationManager, AyooNotification } from '../src/utils/notifications';

interface ToastContextType {
  showToast: (message: string, duration?: number, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showNotification: (notification: AyooNotification) => void;
  notifications: AyooNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<AyooNotification[]>([]);

  // Load initial notifications
  useEffect(() => {
    setNotifications(notificationManager.getAll());
  }, []);

  // Subscribe to new notifications
  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev]);

      // Auto-show toast for important notifications
      if (notification.sound || notification.type === 'ALERT') {
        setMessage(notification.title);
        setMessageType(notification.type === 'ORDER_DELIVERED' ? 'success' : 'info');

        if (timeoutId) clearTimeout(timeoutId);
        const id = window.setTimeout(() => setMessage(null), 4000);
        setTimeoutId(id);
      }
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const showToast = useCallback((msg: string, duration = 3000, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setMessage(msg);
    setMessageType(type);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = window.setTimeout(() => setMessage(null), duration);
    setTimeoutId(id);
  }, [timeoutId]);

  const showNotification = useCallback((notification: AyooNotification) => {
    notificationManager.send(notification);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    notificationManager.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationManager.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Get color based on notification type
  const getToastColors = (type: string) => {
    switch (type) {
      case 'success':
        return { bg: 'bg-green-500', icon: '✓' };
      case 'error':
        return { bg: 'bg-red-500', icon: '✕' };
      case 'warning':
        return { bg: 'bg-amber-500', icon: '⚠' };
      default:
        return { bg: 'bg-[#FF1493]', icon: '🔔' };
    }
  };

  return (
    <ToastContext.Provider value={{
      showToast,
      showNotification,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead
    }}>
      {children}

      {/* Toast Notification */}
      {message && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[85%] z-[100] animate-in fade-in slide-in-from-top-4">
          <div className={`${getToastColors(messageType).bg} rounded-3xl p-4 shadow-xl flex items-center gap-4`}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white text-lg font-black">
              {getToastColors(messageType).icon}
            </div>
            <p className="text-white font-bold text-sm truncate">{message}</p>
          </div>
        </div>
      )}

      {/* Notification Bell Indicator (for apps) */}
      {unreadCount > 0 && (
        <div className="fixed top-20 right-6 z-[90]">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
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

// Hook for using notifications in any component
export const useNotifications = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useNotifications must be used within a ToastProvider');
  }
  return context;
};

