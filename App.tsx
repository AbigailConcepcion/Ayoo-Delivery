import React, { useState, useEffect, useCallback } from 'react';
import { AppScreen, Restaurant, OrderRecord, Voucher, UserAccount, UserRole } from './types';
import Onboarding from './screens/Onboarding';
import Auth from './screens/Auth';
import Home from './screens/Home';
import RestaurantDetail from './screens/RestaurantDetail';
import Cart from './screens/Cart';
import OrderTracking from './screens/OrderTracking';
import Vouchers from './screens/Vouchers';
import History from './screens/History';
import Profile from './screens/Profile';
import AddressesScreen from './screens/Addresses';
import PaymentsScreen from './screens/Payments';
import MerchantDashboard from './screens/MerchantDashboard';
import RiderDashboard from './screens/RiderDashboard';
import AdminPanel from './screens/AdminPanel';
import AyooManual from './screens/AyooManual';
import AIChat from './components/AIChat';
import Logo from './components/Logo';
import Button from './components/Button';
import SystemStatus from './components/SystemStatus';
import { db } from './db';
import { ayooCloud } from './api';
import { COLORS } from './constants'; // Import para sa brand colors

const OWNER_EMAIL = 'ayoo.admin@gmail.com';

const App: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [screen, setScreen] = useState<AppScreen>('ONBOARDING');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('CUSTOMER');
  const [deliveryCity, setDeliveryCity] = useState<string>('Iligan City');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cartItems, setCartItems] = useState<{ id: string; quantity: number }[]>([]);
  const [lastOrder, setLastOrder] = useState<{ id: string; quantity: number }[]>([]);
  const [history, setHistory] = useState<OrderRecord[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(45);
  
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [isGroupOrder, setIsGroupOrder] = useState(false);

  useEffect(() => {
    if (currentUser) {
      db.saveCart(currentUser.email, cartItems, appliedVoucher);
    }
  }, [cartItems, appliedVoucher, currentUser]);

  const loadUserData = useCallback(async (user: UserAccount) => {
    setCurrentUser(user);
    setActiveRole(user.role || 'CUSTOMER');
    if (user.preferredCity) setDeliveryCity(user.preferredCity);
    
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
          const [session, hasSeenOnboarding, resList, config] = await Promise.all([
            db.getSession(),
            db.hasSeenOnboarding(),
            db.getRestaurants(),
            db.getSystemConfig()
          ]);
          
          setRestaurants(resList);
          setDeliveryFee(config.deliveryFee);

          if (session) {
            await loadUserData(session);
            setScreen(session.role === 'MERCHANT' ? 'MERCHANT_DASHBOARD' : session.role === 'RIDER' ? 'RIDER_DASHBOARD' : 'HOME');
          } else {
            setScreen(hasSeenOnboarding ? 'AUTH' : 'ONBOARDING');
          }
        } catch (err: any) {
          console.warn('Backend connection issue, falling back to local storage', err.message);
          (db as any).ENV.USE_REAL_BACKEND = false;
          const [session, hasSeenOnboarding, resList, config] = await Promise.all([
            db.getSession(),
            db.hasSeenOnboarding(),
            db.getRestaurants(),
            db.getSystemConfig()
          ]);
          setRestaurants(resList);
          setDeliveryFee(config.deliveryFee);
          if (session) {
            await loadUserData(session);
            setScreen(session.role === 'MERCHANT' ? 'MERCHANT_DASHBOARD' : session.role === 'RIDER' ? 'RIDER_DASHBOARD' : 'HOME');
          } else {
            setScreen(hasSeenOnboarding ? 'AUTH' : 'ONBOARDING');
          }
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

  // Logic for logout, login, etc remains same...
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
      setScreen(activeRole === 'MERCHANT' ? 'MERCHANT_DASHBOARD' : activeRole === 'RIDER' ? 'RIDER_DASHBOARD' : 'HOME');
    }
  };

  const handleLogin = async (user: UserAccount) => {
    await loadUserData(user);
    setScreen(user.role === 'MERCHANT' ? 'MERCHANT_DASHBOARD' : user.role === 'RIDER' ? 'RIDER_DASHBOARD' : 'HOME');
  };

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

  const handleCheckout = async (paymentMethod: any = null, isPaid: boolean = true) => {
    if (!currentUser) return;
    const orderDetails = cartItems.map(cartItem => {
      let found = null;
      for (const res of restaurants) {
        const item = res.items.find(i => i.id === cartItem.id);
        if (item) { found = { name: item.name, quantity: cartItem.quantity, price: item.price }; break; }
      }
      return found!;
    });
    const subtotal = orderDetails.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const finalTotal = subtotal + deliveryFee - (appliedVoucher ? (appliedVoucher.type === 'percent' ? (subtotal * appliedVoucher.discount / 100) : appliedVoucher.discount) : 0);

    const newOrder: OrderRecord = {
      id: `AYO-${Math.floor(Math.random() * 90000) + 10000}`,
      date: new Date().toLocaleDateString(),
      items: orderDetails,
      total: Math.max(0, finalTotal),
      status: 'PENDING',
      restaurantName: selectedRestaurant?.name || 'Ayoo Merchant',
      customerEmail: currentUser.email,
      customerName: currentUser.name,
      deliveryAddress: `Tibanga, ${deliveryCity}`,
      pointsEarned: Math.floor(finalTotal / 10),
      paymentMethod: paymentMethod?.type || 'COD',
      isPaid: isPaid ? 1 : 0,
      paymentId: paymentMethod?.id || null
    } as any;

    const res = await ayooCloud.placeOrder(newOrder);
    if (res.success) {
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

    switch (screen) {
      case 'ONBOARDING': return <Onboarding onFinish={() => { db.setOnboardingSeen(true); setScreen('AUTH'); }} />;
      case 'AUTH': return <Auth onLogin={handleLogin} />;
      case 'MANUAL': return <AyooManual role={activeRole} onFinish={handleManualFinish} />;
      case 'HOME': return <Home 
          restaurants={restaurants}
          onSelectRestaurant={(r) => { setSelectedRestaurant(r); setScreen('RESTAURANT'); }} 
          onOpenCart={() => setScreen('CART')} 
          onNavigate={(s) => setScreen(s)}
          cartCount={cartItems.length} points={currentUser?.points || 0} streak={currentUser?.streak || 0} badges={currentUser?.badges || []}
          deliveryCity={deliveryCity} onSetDeliveryCity={(c) => setDeliveryCity(c)}
        />;
      case 'RESTAURANT': return selectedRestaurant ? <RestaurantDetail restaurant={selectedRestaurant} onBack={() => setScreen('HOME')} onAddToCart={addToCart} onOpenCart={() => setScreen('CART')} cartCount={cartItems.length} /> : null;
      case 'CART': return <Cart items={cartItems} onBack={() => setScreen('HOME')} onCheckout={handleCheckout} isGroup={isGroupOrder} onStartGroup={() => setIsGroupOrder(true)} appliedVoucher={appliedVoucher} onUpdateQuantity={updateQuantity} customDeliveryFee={deliveryFee} />;
      case 'TRACKING': return <OrderTracking onBack={() => setScreen('HOME')} orderItems={lastOrder} restaurant={selectedRestaurant} deliveryCity={deliveryCity} customerEmail={currentUser?.email || ''} />;
      case 'VOUCHERS': return <Vouchers onBack={() => setScreen('HOME')} onApply={(v) => {setAppliedVoucher(v); setScreen('CART');}} onNavigate={(s) => setScreen(s)} />;
      case 'HISTORY': return <History onBack={() => setScreen('HOME')} orders={history} onNavigate={(s) => setScreen(s)} />;
      case 'PROFILE': return <Profile onBack={() => setScreen('HOME')} user={currentUser} onLogout={handleLogout} onNavigate={(s) => setScreen(s)} onUpdateUser={setCurrentUser} onSetRole={handleSetRole} />;
      case 'ADDRESSES': return <AddressesScreen onBack={() => setScreen('PROFILE')} email={currentUser?.email || ''} currentCity={deliveryCity} />;
      case 'PAYMENTS': return <PaymentsScreen onBack={() => setScreen('PROFILE')} email={currentUser?.email || ''} />;
      case 'MERCHANT_DASHBOARD': return <MerchantDashboard restaurantName={currentUser?.name || 'Ayoo Merchant'} />;
      case 'RIDER_DASHBOARD': return <RiderDashboard />;
      case 'ADMIN_PANEL': return <AdminPanel onBack={() => setScreen('PROFILE')} restaurants={restaurants} onUpdateRestaurants={setRestaurants} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-gray-50 overflow-hidden">
      {isConnecting ? (
        <div className="max-w-md mx-auto h-screen bg-white flex flex-col items-center justify-center p-12">
          <Logo size="lg" withSubtext={false} />
          <div className="mt-12 flex flex-col items-center">
             <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 animate-progress" style={{ backgroundColor: COLORS.primary }}></div>
             </div>
             <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 animate-pulse text-center">Getting things ready...</p>
          </div>
        </div>
      ) : (
        <>
          <SystemStatus />
          {renderScreen()}
          {screen !== 'ONBOARDING' && (
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
              onNavigate={(s) => setScreen(s)}
              context={screen === 'AUTH' ? 'login help' : 'general'}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;