import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { AppScreen, Restaurant, OrderRecord, Voucher, UserAccount, UserRole } from './types';
import Onboarding from './screens/Onboarding';
import Auth from './screens/Auth';
import NavBar from './components/NavBar';
import Logo from './components/Logo';
import Button from './components/Button';
import { db } from './db';
import { ayooCloud } from './api';
import { COLORS } from './constants';
import { calculateCheckoutBreakdown } from './src/utils/pricing';
import { ToastProvider, useToast } from './components/ToastContext';

const OWNER_EMAIL = 'ayoo.admin@gmail.com';

const ScreenFallback: React.FC = () => (
  <div className="h-screen bg-gradient-to-br from-[#FF1493] via-[#FF69B4] to-[#FF1493] flex items-center justify-center px-6">
    <div className="text-center">
      <Logo size="xl" variant="white" withSubtext={false} showWordmark={false} />
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/80 mt-6">Loading experience</p>
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
const OrderTracking = lazy(() => import('./screens/OrderTracking'));
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

  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [isGroupOrder, setIsGroupOrder] = useState(false);
  const isOwner = (currentUser?.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase();
  const { showToast } = useToast();

  const handleNavigate = (nextScreen: string) => {
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
  };

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

  useEffect(() => {
    const initApp = async () => {
      try {
        try {
          await db.connect();
          const [session, resList, config] = await Promise.all([
            db.getSession(),
            db.getRestaurants(),
            db.getSystemConfig()
          ]);

          setRestaurants(resList);
          setDeliveryFee(config.deliveryFee);

          // Force fresh sign-in whenever the app is opened.
          if (session) await db.logout();
          setCurrentUser(null);
          setScreen('AUTH');
        } catch (err: any) {
          const backendRequired = Boolean((db as any).ENV?.USE_REAL_BACKEND);
          if (backendRequired) {
            throw new Error('Real backend is enabled but not reachable. Please start the API server.');
          }
          console.warn('Backend connection issue, falling back to local storage', err.message);
          const [session, resList, config] = await Promise.all([
            db.getSession(),
            db.getRestaurants(),
            db.getSystemConfig()
          ]);
          setRestaurants(resList);
          setDeliveryFee(config.deliveryFee);
          if (session) await db.logout();
          setCurrentUser(null);
          setScreen('AUTH');
        }
      } catch (err: any) {
        setSyncError(err.message || "Unable to connect to Ayoo");
      } finally {
        setTimeout(() => setIsConnecting(false), 2000);
      }
    };
    initApp();

    return ayooCloud.subscribe(() => {
      if (currentUser) {
        db.getHistory(currentUser.email).then(setHistory);
        db.getSession().then(s => { if (s) setCurrentUser(s); });
      }
    });
  }, [loadUserData]);

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
    const finalTotal = pricing.total;

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

      const freshHistory = await db.getHistory(currentUser.email);
      setHistory(freshHistory);

      showToast("Order saved offline. Check history.");
      setScreen('TRACKING');
    }
  };

  const renderScreen = () => {
    if (syncError) return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
        <div className="w-24 h-24 rounded-[40px] flex items-center justify-center text-5xl mb-10 shadow-lg animate-bounce" style={{ backgroundColor: COLORS.primaryBg }}>📵</div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4" style={{ color: COLORS.black }}>Connection Issue</h2>
        <p className="text-gray-500 font-medium text-sm mb-12 leading-relaxed px-4">We're having trouble reaching our servers. Please check your internet connection and try again.</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );

    const customerHomeScreen = (
      <Home
        restaurants={restaurants}
        onSelectRestaurant={(r) => { setSelectedRestaurant(r); setScreen('RESTAURANT'); }}
        onOpenCart={() => setScreen('CART')}
        onNavigate={handleNavigate}
        cartCount={cartItems.length}
        points={currentUser?.points || 0}
        streak={currentUser?.streak || 0}
        badges={currentUser?.badges || []}
        deliveryCity={deliveryCity}
        onSetDeliveryCity={(c) => setDeliveryCity(c)}
        currentUser={currentUser}
        recentOrders={history}
      />
    );

    switch (screen) {
      case 'ONBOARDING': return <Onboarding onFinish={async () => { await db.setOnboardingSeen(true); setScreen('AUTH'); }} />;
      case 'AUTH': return <Auth onLogin={handleLogin} />;
      case 'MANUAL': return <AyooManual role={activeRole} onFinish={handleManualFinish} />;
      case 'SERVICES': return activeRole === 'CUSTOMER' ? customerHomeScreen : <Services user={currentUser} deliveryCity={deliveryCity} onNavigate={handleNavigate} />;
      case 'HOME': return customerHomeScreen;
      case 'SEARCH':
        return (
          <Search
            restaurants={restaurants}
            onSelectRestaurant={(r) => { setSelectedRestaurant(r); setScreen('RESTAURANT'); }}
            onOpenCart={() => setScreen('CART')}
            onNavigate={handleNavigate}
            cartCount={cartItems.length}
            deliveryCity={deliveryCity}
            onSetDeliveryCity={(c) => setDeliveryCity(c)}
            onBack={() => setScreen('HOME')}
          />
        );
      case 'MESSAGES': return currentUser ? <Messages currentUser={currentUser} onBack={() => setScreen('HOME')} onNavigate={handleNavigate} /> : <Auth onLogin={handleLogin} />;
      case 'GROCERIES': return <Groceries onBack={() => setScreen('HOME')} onNavigate={handleNavigate} />;
      case 'COURIER': return <Courier onBack={() => setScreen('HOME')} onNavigate={handleNavigate} />;
      case 'RIDES': return <Rides onBack={() => setScreen('HOME')} onNavigate={handleNavigate} />;
      case 'DINE_OUT': return <DineOut onBack={() => setScreen('HOME')} onNavigate={handleNavigate} />;
      case 'PHARMACY': return <Pharmacy onBack={() => setScreen('HOME')} onNavigate={handleNavigate} />;
      case 'RESTAURANT': return selectedRestaurant ? <RestaurantDetail restaurant={selectedRestaurant} onBack={() => setScreen('HOME')} onAddToCart={addToCart} onOpenCart={() => setScreen('CART')} cartCount={cartItems.length} /> : null;
      case 'CART': return <Cart items={cartItems} restaurants={restaurants} onBack={() => setScreen('HOME')} onCheckout={handleCheckout} onNavigateToTracking={() => setScreen('TRACKING')} isGroup={isGroupOrder} onStartGroup={() => setIsGroupOrder(true)} appliedVoucher={appliedVoucher} onUpdateQuantity={updateQuantity} customDeliveryFee={deliveryFee} />;
      case 'TRACKING': return <OrderTracking onBack={() => setScreen('HOME')} onNavigate={handleNavigate} orderItems={lastOrder} restaurant={selectedRestaurant} deliveryCity={deliveryCity} customerEmail={currentUser?.email || ''} currentUser={currentUser} onOpenMessages={(convoId) => { setScreen('MESSAGES'); }} />;
      case 'VOUCHERS': return <Vouchers onBack={() => setScreen('HOME')} onApply={(v) => { setAppliedVoucher(v); setScreen('CART'); }} onNavigate={handleNavigate} />;
      case 'HISTORY': return <History onBack={() => setScreen('HOME')} orders={history} onNavigate={handleNavigate} />;
      case 'PROFILE': return <Profile onBack={() => setScreen('HOME')} user={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} onUpdateUser={setCurrentUser} onSetRole={handleSetRole} />;
      case 'ADDRESSES': return <AddressesScreen onBack={() => setScreen('PROFILE')} email={currentUser?.email || ''} currentCity={deliveryCity} onSelectAddress={(addr) => {
        setDeliveryCity(addr.city);
        setDeliveryAddress(addr.details);
        if (typeof addr.deliveryFee === 'number' && !Number.isNaN(addr.deliveryFee)) setDeliveryFee(addr.deliveryFee);
      }} />;
      case 'PAYMENTS': return <PaymentsScreen onBack={() => setScreen('PROFILE')} email={currentUser?.email || ''} />;
      case 'PABILI': return <PabiliScreen onBack={() => setScreen('HOME')} email={currentUser?.email || ''} />;
      case 'MERCHANT_DASHBOARD': return <MerchantDashboard restaurantName={currentUser?.name || 'Ayoo Merchant'} onBack={() => setScreen('SERVICES')} onNavigate={handleNavigate} isOwner={isOwner} />;
      case 'RIDER_DASHBOARD': return <RiderDashboard onBack={() => setScreen('SERVICES')} onNavigate={handleNavigate} isOwner={isOwner} />;
      case 'ADMIN_PANEL':
        return isOwner
          ? <AdminPanel onBack={() => setScreen('PROFILE')} onNavigate={handleNavigate} restaurants={restaurants} onUpdateRestaurants={setRestaurants} />
          : <Profile onBack={() => setScreen('HOME')} user={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} onUpdateUser={setCurrentUser} onSetRole={handleSetRole} />;
      default: return null;
    }
  };

  const hideTopNavOnScreens: AppScreen[] = ['SERVICES', 'HOME', 'GROCERIES', 'COURIER', 'RIDES', 'DINE_OUT', 'PHARMACY', 'TRACKING', 'VOUCHERS', 'HISTORY', 'PROFILE', 'PABILI', 'MERCHANT_DASHBOARD', 'RIDER_DASHBOARD', 'ADMIN_PANEL', 'MESSAGES'];
  const shouldShowTopNav = currentUser && screen !== 'AUTH' && screen !== 'ONBOARDING' && screen !== 'MANUAL' && !hideTopNavOnScreens.includes(screen);

  return (
    <ToastProvider>
      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-gray-50 overflow-x-hidden overflow-y-auto scrollbar-hide">
        {isConnecting ? (
          <div className="max-w-md mx-auto h-screen bg-gradient-to-b from-[#FF1493] via-[#FF69B4] to-[#FF1493] flex flex-col items-center justify-center p-8">
            {/* AYOO LOGO - Full screen dramatic entrance with actual logo */}
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
              <div className="w-72 h-72 rounded-[60px] bg-white flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[bounce_2s_infinite] overflow-hidden">
                <img
                  src="https://d64gsuwffb70l.cloudfront.net/68eb2e4f3c019d04aff05499_1770844276236_36e2add8.jpg"
                  alt="Ayoo Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Brand Name */}
            <h1 className="text-7xl font-black text-white tracking-tighter mb-2 drop-shadow-lg">AYOO</h1>
            <p className="text-white/80 text-sm font-bold uppercase tracking-[0.4em] mb-16">Super App</p>

            <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div className="h-full bg-white rounded-full animate-progress shadow-lg" style={{ width: '70%' }}></div>
            </div>
            <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-white/90 animate-pulse text-center">Setting up your experience...</p>
          </div>
        ) : (
          <>
            {shouldShowTopNav && (
              <NavBar user={currentUser} onNavigate={handleNavigate} onLogout={handleLogout} isOwner={isOwner} />
            )}
            <Suspense fallback={<ScreenFallback />}>
              {renderScreen()}
            </Suspense>
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
    </ToastProvider>
  );
};

export default App;

