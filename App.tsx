import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { AppScreen, Restaurant, OrderRecord, Voucher, UserAccount, UserRole } from './types';
import Onboarding from './screens/Onboarding';
import Auth from './screens/Auth';
import NavBar from './components/NavBar';
import BottomNav from './components/BottomNav';
import Logo from './components/Logo';
import Button from './components/Button';
import { db } from './db';
import { ayooCloud, notificationHub } from './api';
import { COLORS } from './constants';
import { calculateCheckoutBreakdown } from './src/utils/pricing';
import { useToast } from './components/ToastContext';
import './theme.css';

// In production, this should always be an environment variable
const OWNER_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'ayoo.admin@gmail.com';

const ScreenFallback: React.FC = () => (
  <div className="h-screen bg-[radial-gradient(circle_at_top,_rgba(214,188,250,0.95),_rgba(139,92,246,0.82)_45%,_rgba(109,40,217,0.88)_100%)] flex items-center justify-center px-6">
    <div className="text-center">
      <Logo size="xl" variant="white" withSubtext={false} showWordmark={false} />
      <p className="text-xs font-medium text-white/80 mt-6 tracking-wide animate-pulse">Loading...</p>
    </div>
  </div>
);

// Lazy load all screens for better performance
const Services = lazy(() => import('./screens/Services'));
const Home = lazy(() => import('./screens/Home'));
const Groceries = lazy(() => import('./screens/Groceries'));
const Courier = lazy(() => import('./screens/Courier'));
const Rides = lazy(() => import('./screens/Rides'));
const Search = lazy(() => import('./screens/Search'));
const RestaurantDetail = lazy(() => import('./screens/RestaurantDetail'));
const Cart = lazy(() => import('./screens/Cart'));
const OrderTracking = lazy(() => import('./screens/RealtimeOrderTracking'));
const Vouchers = lazy(() => import('./screens/Vouchers'));
const History = lazy(() => import('./screens/History'));
const Profile = lazy(() => import('./screens/Profile'));
const AddressesScreen = lazy(() => import('./screens/Addresses'));
const PaymentsScreen = lazy(() => import('./screens/Payments'));
const PabiliScreen = lazy(() => import('./screens/Pabili'));
const MerchantDashboard = lazy(() => import('./screens/MerchantDashboard'));
const RiderDashboard = lazy(() => import('./screens/RiderDashboard'));
const AdminPanel = lazy(() => import('./screens/AdminPanel'));
const AyooManual = lazy(() => import('./screens/AyooManual'));
const Messages = lazy(() => import('./screens/Messages'));
const DineOut = lazy(() => import('./screens/DineOut'));
const Pharmacy = lazy(() => import('./screens/Pharmacy'));
const AIChat = lazy(() => import('./components/AIChat'));
const Community = lazy(() => import('./screens/Community'));

// --- UI Sub-components for better maintainability ---

const SplashScreen: React.FC = () => (
  <div className="max-w-[430px] mx-auto h-screen bg-[radial-gradient(circle_at_top,_rgba(214,188,250,0.98),_rgba(139,92,246,0.88)_44%,_rgba(109,40,217,0.92)_100%)] flex flex-col items-center justify-center p-8">
    <div className="relative mb-12">
      <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
      <div className="w-48 h-48 rounded-[40px] bg-white/95 flex items-center justify-center shadow-2xl animate-pulse overflow-hidden">
        <img src="/logo.png" alt="Ayoo Logo" className="w-full h-full object-cover" />
      </div>
    </div>
    <h1 className="text-5xl font-bold text-white tracking-tight mb-2 drop-shadow-lg">AYOO</h1>
    <p className="text-white/90 text-sm font-medium tracking-[0.2em] mb-16">Super App</p>
    <div className="w-64 h-2 bg-white/25 rounded-full overflow-hidden backdrop-blur-sm">
      <div className="h-full bg-white rounded-full animate-progress shadow-lg" style={{ width: '70%' }}></div>
    </div>
    <p className="mt-8 text-xs font-medium tracking-wide text-white/80 animate-pulse text-center">Initializing...</p>
  </div>
);

const SyncErrorView: React.FC<{ error: string }> = ({ error }) => (
  <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
    <div className="w-24 h-24 rounded-[40px] flex items-center justify-center text-5xl mb-10 shadow-lg animate-bounce" style={{ backgroundColor: COLORS.primaryBg }}>📵</div>
    <h2 className="text-3xl font-black uppercase tracking-tighter mb-4" style={{ color: COLORS.black }}>Connection Issue</h2>
    <p className="text-gray-500 font-medium text-sm mb-12 leading-relaxed px-4">{error || "We're having trouble reaching our servers. Please check your internet connection and try again."}</p>
    <Button onClick={() => window.location.reload()}>Try Again</Button>
  </div>
);

interface ScreenManagerProps {
  screen: AppScreen;
  currentUser: UserAccount | null;
  activeRole: UserRole;
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (r: Restaurant | null) => void;
  cartItems: { id: string; quantity: number }[];
  lastOrder: { id: string; quantity: number }[];
  history: OrderRecord[];
  deliveryCity: string;
  setDeliveryCity: (c: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (a: string) => void;
  deliveryFee: number;
  setDeliveryFee: (f: number) => void;
  cartTip: number;
  setCartTip: (t: number) => void;
  appliedVoucher: Voucher | null;
  setAppliedVoucher: (v: Voucher | null) => void;
  isGroupOrder: boolean;
  setIsGroupOrder: (b: boolean) => void;
  isOwner: boolean;
  onNavigate: (s: string) => void;
  onLogin: (u: UserAccount) => void;
  onLogout: () => void;
  onSetRole: (r: UserRole) => void;
  onManualFinish: () => void;
  onAddToCart: (id: string) => void;
  onUpdateQuantity: (id: string, d: number) => void;
  onCheckout: (pm?: any, paid?: boolean, meta?: any) => void;
  onUpdateUser: (u: UserAccount) => void;
  onUpdateRestaurants: (r: Restaurant[]) => void;
}

const ScreenManager: React.FC<ScreenManagerProps> = ({
  screen, currentUser, activeRole, restaurants, selectedRestaurant, setSelectedRestaurant,
  cartItems, lastOrder, history, deliveryCity, setDeliveryCity, deliveryAddress, setDeliveryAddress,
  deliveryFee, setDeliveryFee, cartTip, setCartTip, appliedVoucher, setAppliedVoucher,
  isGroupOrder, setIsGroupOrder, isOwner, onNavigate, onLogin, onLogout, onSetRole,
  onManualFinish, onAddToCart, onUpdateQuantity, onCheckout, onUpdateUser, onUpdateRestaurants
}) => {
  const customerHomeScreen = (
    <Home
      restaurants={restaurants}
      onSelectRestaurant={(r) => { setSelectedRestaurant(r); onNavigate('RESTAURANT'); }}
      onOpenCart={() => onNavigate('CART')}
      onNavigate={onNavigate}
      cartCount={cartItems.length}
      points={currentUser?.points || 0}
      streak={currentUser?.streak || 0}
      badges={currentUser?.badges || []}
      deliveryCity={deliveryCity}
      onSetDeliveryCity={setDeliveryCity}
      currentUser={currentUser}
      recentOrders={history}
    />
  );

  switch (screen) {
    case 'ONBOARDING': return <Onboarding onFinish={async () => { await db.setOnboardingSeen(true); onNavigate('AUTH'); }} />;
    case 'AUTH': return <Auth onLogin={onLogin} />;
    case 'MANUAL': return <AyooManual role={activeRole} onFinish={onManualFinish} />;
    case 'SERVICES': return <Services user={currentUser} deliveryCity={deliveryCity} onNavigate={onNavigate} />;
    case 'HOME': return customerHomeScreen;
    case 'SEARCH':
      return (
        <Search
          restaurants={restaurants}
          onSelectRestaurant={(r) => { setSelectedRestaurant(r); onNavigate('RESTAURANT'); }}
          onOpenCart={() => onNavigate('CART')}
          onNavigate={onNavigate}
          cartCount={cartItems.length}
          deliveryCity={deliveryCity}
          onSetDeliveryCity={setDeliveryCity}
          onBack={() => onNavigate('HOME')}
        />
      );
    case 'MESSAGES': return currentUser ? <Messages currentUser={currentUser} onBack={() => onNavigate('HOME')} onNavigate={onNavigate} /> : <Auth onLogin={onLogin} />;
    case 'GROCERIES': return <Groceries onBack={() => onNavigate('HOME')} onNavigate={onNavigate} />;
    case 'COURIER': return <Courier onBack={() => onNavigate('HOME')} onNavigate={onNavigate} />;
    case 'RIDES': return <Rides onBack={() => onNavigate('HOME')} onNavigate={onNavigate} />;
    case 'DINE_OUT': return <DineOut onBack={() => onNavigate('HOME')} onNavigate={onNavigate} />;
    case 'PHARMACY': return <Pharmacy onBack={() => onNavigate('HOME')} onNavigate={onNavigate} />;
    case 'RESTAURANT': return selectedRestaurant ? <RestaurantDetail restaurant={selectedRestaurant} onBack={() => onNavigate('HOME')} onAddToCart={onAddToCart} onOpenCart={() => onNavigate('CART')} cartCount={cartItems.length} /> : null;
    case 'CART': return <Cart items={cartItems} restaurants={restaurants} email={currentUser?.email || ''} currentAddress={deliveryAddress} onBack={() => onNavigate('HOME')} onCheckout={onCheckout} onNavigateToTracking={() => onNavigate('TRACKING')} isGroup={isGroupOrder} onStartGroup={() => setIsGroupOrder(true)} appliedVoucher={appliedVoucher} onApplyVoucher={setAppliedVoucher} onUpdateQuantity={onUpdateQuantity} customDeliveryFee={deliveryFee} tipAmount={cartTip} onTipChange={setCartTip} onSelectAddress={(addr) => { setDeliveryCity(addr.city); setDeliveryAddress(addr.details); if (typeof addr.deliveryFee === 'number' && !Number.isNaN(addr.deliveryFee)) setDeliveryFee(addr.deliveryFee); }} />;
    case 'TRACKING': return <OrderTracking onBack={() => onNavigate('HOME')} onNavigate={onNavigate} orderItems={lastOrder} restaurant={selectedRestaurant} deliveryCity={deliveryCity} customerEmail={currentUser?.email || ''} currentUser={currentUser} onOpenMessages={() => { onNavigate('MESSAGES'); }} />;
    case 'VOUCHERS': return <Vouchers onBack={() => onNavigate('HOME')} onApply={(v) => { setAppliedVoucher(v); onNavigate('CART'); }} onNavigate={onNavigate} />;
    case 'HISTORY': return <History onBack={() => onNavigate('HOME')} orders={history} onNavigate={onNavigate} />;
    case 'PROFILE': return <Profile onBack={() => onNavigate('HOME')} user={currentUser} onLogout={onLogout} onNavigate={onNavigate} onUpdateUser={onUpdateUser} onSetRole={onSetRole} />;
    case 'ADDRESSES': return <AddressesScreen onBack={() => onNavigate('PROFILE')} email={currentUser?.email || ''} currentCity={deliveryCity} onSelectAddress={(addr) => {
      setDeliveryCity(addr.city);
      setDeliveryAddress(addr.details);
      if (typeof addr.deliveryFee === 'number' && !Number.isNaN(addr.deliveryFee)) setDeliveryFee(addr.deliveryFee);
    }} />;
    case 'PAYMENTS': return <PaymentsScreen onBack={() => onNavigate('PROFILE')} email={currentUser?.email || ''} />;
    case 'PABILI': return <PabiliScreen onBack={() => onNavigate('HOME')} email={currentUser?.email || ''} />;
    case 'COMMUNITY': return <Community onBack={() => onNavigate('HOME')} onNavigate={onNavigate} currentUser={currentUser} />;
    case 'MERCHANT_DASHBOARD': return <MerchantDashboard restaurantName={currentUser?.name || 'Ayoo Merchant'} onBack={() => onNavigate('SERVICES')} onNavigate={onNavigate} isOwner={isOwner} />;
    case 'RIDER_DASHBOARD': return <RiderDashboard onBack={() => onNavigate('SERVICES')} onNavigate={onNavigate} isOwner={isOwner} />;
    case 'ADMIN_PANEL':
      return isOwner
        ? <AdminPanel onBack={() => onNavigate('PROFILE')} onNavigate={onNavigate} restaurants={restaurants} onUpdateRestaurants={onUpdateRestaurants} />
        : <Profile onBack={() => onNavigate('HOME')} user={currentUser} onLogout={onLogout} onNavigate={onNavigate} onUpdateUser={onUpdateUser} onSetRole={onSetRole} />;
    default: return null;
  }
};

// --- End Sub-components ---

const App: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [screen, setScreen] = useState<AppScreen>('ONBOARDING');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('CUSTOMER');
  const [deliveryCity, setDeliveryCity] = useState<string>('Iligan City');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Tibanga, Iligan City');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cartItems, setCartItems] = useState<{ id: string; quantity: number }[]>([]);
  const [lastOrder, setLastOrder] = useState<{ id: string; quantity: number }[]>([]);
  const [history, setHistory] = useState<OrderRecord[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(45);
  const [cartTip, setCartTip] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [isGroupOrder, setIsGroupOrder] = useState(false);
  const isOwner = (currentUser?.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase();
  const { showToast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast("Connection restored! ⚡");
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  const handleNavigate = useCallback((nextScreen: string) => {
    const rawTarget = nextScreen as AppScreen;
    const target = activeRole === 'CUSTOMER' && rawTarget === 'SERVICES' ? 'HOME' : rawTarget;
    if (!currentUser && target !== 'AUTH' && target !== 'ONBOARDING') {
      setScreen('AUTH');
      return;
    }
    if (target === 'ADMIN_PANEL' && !isOwner) {
      setScreen('HOME');
      return;
    }
    setScreen(target);
  }, [activeRole, currentUser, isOwner]);

  useEffect(() => {
    // Handle tap on notification popup or system tray
    const unsubscribeTap = notificationHub.onTap((data) => {
      if (data?.orderId) {
        handleNavigate('TRACKING');
      }
    });

    // Display in-app notification when a push is received in foreground
    const unsubscribeReceive = notificationHub.subscribe((n) => {
      if (n.body || n.title) {
        showToast(n.body || n.title || "New notification");
      }
    });

    return () => {
      unsubscribeTap();
      unsubscribeReceive();
    };
  }, [showToast, handleNavigate]);

  useEffect(() => {
    if (currentUser) {
      db.saveCart(currentUser.email, cartItems, appliedVoucher);
    }
  }, [cartItems, appliedVoucher, currentUser]);

  const loadUserData = useCallback(async (user: UserAccount) => {
    setCurrentUser(user);
    setActiveRole(user.role || 'CUSTOMER');
    if (user.preferredCity) {
      setDeliveryCity(user.preferredCity);
      setDeliveryAddress(`Default Address, ${user.preferredCity}`);
    }

    try {
      const [orders, cartData, config] = await Promise.all([
        db.getHistory(user.email),
        db.getCart(user.email),
        db.getSystemConfig()
      ]);
      setHistory(orders);
      setCartItems(cartData.items);
      setAppliedVoucher(cartData.voucher);
      setDeliveryFee(config.deliveryFee);
    } catch (e) {
      console.warn("Sync failed, operating in local mode.");
    }
  }, []);

  const initializeApp = useCallback(async () => {
    setIsConnecting(true);
    setSyncError(null);
    try {
      try {
        await db.connect();
        
        const [session, resList, config, hasSeenOnboarding] = await Promise.all([
          db.getSession(),
          db.getRestaurants(),
          db.getSystemConfig(),
          db.hasSeenOnboarding()
        ]);

        setRestaurants(resList);
        setDeliveryFee(config.deliveryFee);

        if (session) {
          await loadUserData(session);
          setScreen('HOME');
        } else {
          setScreen(hasSeenOnboarding ? 'AUTH' : 'ONBOARDING');
        }
      } catch (err: any) {
        const backendRequired = Boolean((db as any).ENV?.USE_REAL_BACKEND);
        if (backendRequired) {
          throw new Error('Real backend is enabled but not reachable. Please start the API server.');
        }
        
        const [session, resList, config, hasSeenOnboarding] = await Promise.all([
          db.getSession(),
          db.getRestaurants(),
          db.getSystemConfig(),
          db.hasSeenOnboarding()
        ]);
        setRestaurants(resList);
        setDeliveryFee(config.deliveryFee);
        
        if (session) {
          await loadUserData(session);
          setScreen('HOME');
        } else {
          setScreen(hasSeenOnboarding ? 'AUTH' : 'ONBOARDING');
        }
      }
    } catch (err: any) {
      console.error("[AppInit] Fatal Error:", err);
      setSyncError(err.message || "Unable to connect to Ayoo");
    } finally {
      setIsConnecting(false);
    }
  }, [loadUserData]);

  useEffect(() => {
    initializeApp();

    return ayooCloud.subscribe(() => {
      if (currentUser) {
        db.getHistory(currentUser.email).then(setHistory);
        db.getSession().then(s => { if (s) setCurrentUser(s); });
      }
    });
  }, [initializeApp, currentUser]);

  const handleSetRole = async (role: UserRole) => {
    setActiveRole(role);
    if (currentUser) {
      const updated = await db.updateProfile(currentUser.email, { role });
      if (updated) setCurrentUser(updated);
      const seen = updated?.manualsSeen || [];
      if (!seen.includes(role)) setScreen('MANUAL');
      else setScreen(role === 'MERCHANT' ? 'MERCHANT_DASHBOARD' : role === 'RIDER' ? 'RIDER_DASHBOARD' : 'HOME');
    }
  };

  const handleManualFinish = async () => {
    if (currentUser) {
      const seen = currentUser.manualsSeen || [];
      const updated = await db.updateProfile(currentUser.email, { manualsSeen: [...seen, activeRole] });
      if (updated) setCurrentUser(updated);
      if (activeRole === 'MERCHANT') setScreen('MERCHANT_DASHBOARD');
      else if (activeRole === 'RIDER') setScreen('RIDER_DASHBOARD');
      else setScreen('HOME');
    }
  };

  const handleLogin = async (user: UserAccount) => {
    await loadUserData(user);
    setScreen('HOME');
  };

  useEffect(() => {
    if (!currentUser?.email) return;

    const params = new URLSearchParams(window.location.search);
    const payMongoState = params.get('paymongo');
    const orderId = params.get('orderId');
    if (!payMongoState || !orderId) return;

    let cancelled = false;
    const syncFromReturn = async () => {
      try {
        await ayooCloud.syncPayMongoOrder(orderId);
        if (!cancelled) setScreen('TRACKING');
      } catch (err) {
        console.error('paymongo return sync failed', err);
      } finally {
        params.delete('paymongo');
        params.delete('orderId');
        const nextSearch = params.toString();
        const cleanUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    };

    syncFromReturn();
    return () => { cancelled = true; };
  }, [currentUser?.email]);

  const handleLogout = async () => {
    if (currentUser) await db.saveCart(currentUser.email, cartItems, appliedVoucher);
    await db.logout();
    setCurrentUser(null);
    setCartItems([]);
    setAppliedVoucher(null);
    setCartTip(0);
    setHistory([]);
    setScreen('AUTH');
  };

  const addToCart = (itemId: string) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing) return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: itemId, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(i => i.quantity > 0));
  };

  const handleCheckout = async (paymentMethod: any = null, isPaid: boolean = true, paymentMeta: { orderId?: string; transactionId?: string; paymentId?: string; receiptUrl?: string } = {}) => {
    if (!currentUser) return;
    const orderDetails = cartItems.map(cartItem => {
      let found = null;
      for (const res of restaurants) {
        const item = res.items.find(i => i.id === cartItem.id);
        if (item) { found = { name: item.name, quantity: cartItem.quantity, price: item.price, id: item.id }; break; }
      }
      return found!;
    }).filter(Boolean);

    if (orderDetails.length === 0) {
      showToast("Cannot place an empty order");
      return;
    }

    const subtotal = orderDetails.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const pricing = calculateCheckoutBreakdown(subtotal, deliveryFee, appliedVoucher);
    const finalTotal = pricing.total + cartTip;

    const newOrder: OrderRecord = {
      id: paymentMeta.orderId || `AYO-${Math.floor(Math.random() * 90000) + 10000}`,
      date: new Date().toLocaleDateString(),
      items: orderDetails,
      total: Math.max(0, finalTotal),
      status: 'PENDING',
      restaurantName: selectedRestaurant?.name || 'Ayoo Merchant',
      customerEmail: currentUser.email,
      customerName: currentUser.name,
      pointsEarned: Math.floor(pricing.subtotal / 10),
      tipAmount: cartTip,
      deliveryAddress: deliveryAddress || `Tibanga, ${deliveryCity}`,
      paymentMethod: paymentMethod?.type || 'COD',
      isPaid: isPaid ? 1 : 0,
      paymentId: paymentMeta.paymentId || paymentMethod?.id || null,
      transactionId: paymentMeta.transactionId || null,
      receiptUrl: paymentMeta.receiptUrl || null,
      riderEmail: undefined
    } as any;

    try {
      const res = await ayooCloud.placeOrder(newOrder);
      await db.saveOrder(currentUser.email, newOrder);

      const updated = await db.updateProfile(currentUser.email, {
        xp: (currentUser.xp || 0) + finalTotal,
        points: (currentUser.points || 0) + (newOrder.pointsEarned || 0)
      });
      if (updated) setCurrentUser(updated);

      await db.clearCart(currentUser.email);
      setLastOrder([...cartItems]);
      setCartItems([]);
      setAppliedVoucher(null);
      setCartTip(0);

      const freshHistory = await db.getHistory(currentUser.email);
      setHistory(freshHistory);

      if (res.success) {
        setScreen('TRACKING');
      } else {
        showToast("Order saved! Tracking started.");
        setScreen('TRACKING');
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      await db.saveOrder(currentUser.email, newOrder);
      await db.clearCart(currentUser.email);
      setLastOrder([...cartItems]);
      setCartItems([]);
      setAppliedVoucher(null);
      setCartTip(0);

      const freshHistory = await db.getHistory(currentUser.email);
      setHistory(freshHistory);

      showToast("Order saved offline. Check history.");
      setScreen('TRACKING');
    }
  };

  const hideTopNavOnScreens: AppScreen[] = ['SERVICES', 'HOME', 'GROCERIES', 'COURIER', 'RIDES', 'DINE_OUT', 'PHARMACY', 'TRACKING', 'VOUCHERS', 'HISTORY', 'PROFILE', 'PABILI', 'MERCHANT_DASHBOARD', 'RIDER_DASHBOARD', 'ADMIN_PANEL', 'MESSAGES'];
  const shouldShowTopNav = false;

  const screensWithBottomNav: AppScreen[] = [
    'HOME',
    'MESSAGES',
    'VOUCHERS',
    'HISTORY',
    'PROFILE',
    'MERCHANT_DASHBOARD',
    'RIDER_DASHBOARD',
    'ADMIN_PANEL',
  ];
  const shouldShowBottomNav = currentUser && screensWithBottomNav.includes(screen);

  return (
      <div className="app-shell max-w-[430px] mx-auto min-h-screen relative overflow-x-hidden overflow-y-auto scrollbar-hide lg:my-8 lg:rounded-[40px] lg:shadow-2xl lg:border-[8px] lg:border-gray-900 bg-gray-50">
        {isOffline && (
          <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest py-3 px-4 flex items-center justify-between gap-2 sticky top-0 z-[100] shadow-lg animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <span className="text-base">📡</span>
              Offline Mode • Limited Features
            </div>
            <button 
              onClick={() => initializeApp()}
              disabled={isConnecting}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl border border-white/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
            >
              {isConnecting ? 'Reconnecting...' : 'Retry ↻'}
            </button>
          </div>
        )}
        {syncError ? (
          <SyncErrorView error={syncError} />
        ) : isConnecting ? (
          <SplashScreen />
        ) : (
          <>
            <Suspense fallback={<ScreenFallback />}>
              <ScreenManager
                screen={screen}
                currentUser={currentUser}
                activeRole={activeRole}
                restaurants={restaurants}
                selectedRestaurant={selectedRestaurant}
                setSelectedRestaurant={setSelectedRestaurant}
                cartItems={cartItems}
                lastOrder={lastOrder}
                history={history}
                deliveryCity={deliveryCity}
                setDeliveryCity={setDeliveryCity}
                deliveryAddress={deliveryAddress}
                setDeliveryAddress={setDeliveryAddress}
                deliveryFee={deliveryFee}
                setDeliveryFee={setDeliveryFee}
                cartTip={cartTip}
                setCartTip={setCartTip}
                appliedVoucher={appliedVoucher}
                setAppliedVoucher={setAppliedVoucher}
                isGroupOrder={isGroupOrder}
                setIsGroupOrder={setIsGroupOrder}
                isOwner={isOwner}
                onNavigate={handleNavigate}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onSetRole={handleSetRole}
                onManualFinish={handleManualFinish}
                onAddToCart={addToCart}
                onUpdateQuantity={updateQuantity}
                onCheckout={handleCheckout}
                onUpdateUser={setCurrentUser}
                onUpdateRestaurants={setRestaurants}
              />
            </Suspense>
            {shouldShowBottomNav && (
              <BottomNav
                active={screen}
                onNavigate={handleNavigate}
                cartCount={cartItems.length}
                mode={activeRole === 'CUSTOMER' ? 'customer' : 'operations'}
                showAdmin={isOwner}
              />

            )}
            {screen !== 'ONBOARDING' && (
              <Suspense fallback={null}>
                <AIChat
                  restaurants={restaurants}
                  onAddToCart={addToCart}
                  onSelectRestaurant={(name) => {
                    const res = restaurants.find(r => r.name.toLowerCase().includes(name.toLowerCase()));
                    if (res) {
                      setSelectedRestaurant(res);
                      setScreen('RESTAURANT');
                      return true;
                    }
                    return false;
                  }}
                  onNavigate={handleNavigate}
                  context={screen === 'AUTH' ? 'login help' : 'general'}
                />
              </Suspense>
            )}
          </>
        )}
      </div>
  );
};

export default App;
