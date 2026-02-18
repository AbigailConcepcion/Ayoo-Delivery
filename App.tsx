
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
import AIChat from './components/AIChat';
import Logo from './components/Logo';
import Button from './components/Button';
import SystemStatus from './components/SystemStatus';
import { db } from './db';
import { ayooCloud } from './api';

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
      console.warn("User data fetch failed, staying offline.");
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        const connected = await db.connect();
        if (!connected && (db as any).constructor.ENV.USE_REAL_BACKEND) {
          throw new Error("Ayoo Production Nodes are unreachable. Check your BASE_URL.");
        }

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
        setSyncError(err.message || "Failed to connect to Ayoo Nodes");
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
  }, [loadUserData, currentUser]);

  const handleSetRole = (role: UserRole) => {
    setActiveRole(role);
    if (currentUser) {
       db.updateProfile(currentUser.email, { role });
    }
    setScreen(role === 'MERCHANT' ? 'MERCHANT_DASHBOARD' : role === 'RIDER' ? 'RIDER_DASHBOARD' : 'HOME');
  };

  const handleSetDeliveryCity = async (city: string) => {
    setDeliveryCity(city);
    if (currentUser) {
      const updated = await db.updateProfile(currentUser.email, { preferredCity: city });
      if (updated) setCurrentUser(updated);
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

  const handleCheckout = async () => {
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
      total: finalTotal,
      status: 'PENDING',
      restaurantName: selectedRestaurant?.name || 'Jollibee Iligan',
      customerEmail: currentUser.email,
      customerName: currentUser.name,
      deliveryAddress: `Tibanga, ${deliveryCity}`,
      pointsEarned: Math.floor(finalTotal / 10)
    };

    const res = await ayooCloud.placeOrder(newOrder);
    if (res.success) {
      await db.saveOrder(currentUser.email, newOrder);
      
      const newXp = (currentUser.xp || 0) + finalTotal;
      const newPoints = (currentUser.points || 0) + (newOrder.pointsEarned || 0);
      const newLevel = Math.floor(newXp / 5000) + 1;
      
      const updated = await db.updateProfile(currentUser.email, { 
        xp: newXp, 
        points: newPoints, 
        level: newLevel 
      });
      if (updated) setCurrentUser(updated);

      await db.clearCart(currentUser.email);
      setLastOrder([...cartItems]);
      setCartItems([]);
      setAppliedVoucher(null);
      setScreen('TRACKING');
    }
  };

  const handleAiSelectRestaurant = (name: string) => {
    const found = restaurants.find(r => r.name.toLowerCase().includes(name.toLowerCase()));
    if (found) {
      setSelectedRestaurant(found);
      setScreen('RESTAURANT');
      return true;
    }
    return false;
  };

  const renderScreen = () => {
    if (syncError) return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
         <div className="w-24 h-24 ayoo-gradient rounded-[40px] flex items-center justify-center text-5xl mb-10 shadow-[0_0_60px_rgba(255,0,204,0.3)] animate-pulse">📡</div>
         <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Cloud Sync Fault</h2>
         <p className="text-gray-400 font-bold text-sm mb-12 leading-relaxed px-4">
            The app is in "Production Mode" but the Ayoo Server at <code className="text-[#FF00CC] break-all">{(db as any).constructor.ENV.BASE_URL}</code> is not responding.
         </p>
         <div className="flex flex-col w-full gap-4">
            <Button onClick={() => window.location.reload()} className="pill-shadow">Re-Ping Nodes</Button>
            <button 
              onClick={() => { (db as any).constructor.ENV.USE_REAL_BACKEND = false; window.location.reload(); }}
              className="py-4 text-[10px] font-black text-white/40 uppercase tracking-widest"
            >
              Switch back to Local Nodes
            </button>
         </div>
      </div>
    );

    switch (screen) {
      case 'ONBOARDING': return <Onboarding onFinish={() => { db.setOnboardingSeen(true); setScreen('AUTH'); }} />;
      case 'AUTH': return <Auth onLogin={handleLogin} />;
      case 'HOME': return <Home 
          restaurants={restaurants}
          onSelectRestaurant={(r) => { setSelectedRestaurant(r); setScreen('RESTAURANT'); }} 
          onOpenCart={() => setScreen('CART')} 
          onNavigate={(s) => setScreen(s)}
          cartCount={cartItems.length} points={currentUser?.points || 0} streak={currentUser?.streak || 0} badges={currentUser?.badges || []}
          deliveryCity={deliveryCity} onSetDeliveryCity={handleSetDeliveryCity}
        />;
      case 'RESTAURANT': return selectedRestaurant ? <RestaurantDetail restaurant={selectedRestaurant} onBack={() => setScreen('HOME')} onAddToCart={addToCart} onOpenCart={() => setScreen('CART')} cartCount={cartItems.length} /> : null;
      case 'CART': return <Cart items={cartItems} onBack={() => setScreen('HOME')} onCheckout={handleCheckout} isGroup={isGroupOrder} onStartGroup={() => setIsGroupOrder(true)} appliedVoucher={appliedVoucher} onUpdateQuantity={updateQuantity} customDeliveryFee={deliveryFee} />;
      case 'TRACKING': return <OrderTracking onBack={() => setScreen('HOME')} orderItems={lastOrder} restaurant={selectedRestaurant} deliveryCity={deliveryCity} customerEmail={currentUser?.email || ''} />;
      case 'VOUCHERS': return <Vouchers onBack={() => setScreen('HOME')} onApply={(v) => {setAppliedVoucher(v); setScreen('CART');}} onNavigate={(s) => setScreen(s)} />;
      case 'HISTORY': return <History onBack={() => setScreen('HOME')} orders={history} onNavigate={(s) => setScreen(s)} />;
      case 'PROFILE': return <Profile onBack={() => setScreen('HOME')} user={currentUser} onLogout={handleLogout} onNavigate={(s) => setScreen(s)} onUpdateUser={setCurrentUser} onSetRole={handleSetRole} />;
      case 'ADDRESSES': return <AddressesScreen onBack={() => setScreen('PROFILE')} email={currentUser?.email || ''} currentCity={deliveryCity} />;
      case 'PAYMENTS': return <PaymentsScreen onBack={() => setScreen('PROFILE')} email={currentUser?.email || ''} />;
      case 'MERCHANT_DASHBOARD': return <MerchantDashboard restaurantName={currentUser?.name || 'Jollibee Iligan'} />;
      case 'RIDER_DASHBOARD': return <RiderDashboard />;
      case 'ADMIN_PANEL': 
        if (currentUser?.email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
          setScreen('HOME');
          return null;
        }
        return <AdminPanel onBack={() => setScreen('PROFILE')} restaurants={restaurants} onUpdateRestaurants={setRestaurants} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-gray-50 overflow-hidden">
      {isConnecting ? (
        <div className="max-w-md mx-auto h-screen bg-white flex flex-col items-center justify-center p-12">
          <Logo size="lg" withSubtext={false} />
          <div className="mt-12 flex flex-col items-center">
             <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-[#FF00CC] animate-progress"></div>
             </div>
             <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#FF00CC]/40 animate-pulse text-center">
               Securing Ayoo Cloud Connection...
             </p>
          </div>
        </div>
      ) : (
        <>
          <SystemStatus />
          {renderScreen()}
        </>
      )}
      {['HOME', 'RESTAURANT', 'CART', 'VOUCHERS', 'HISTORY', 'PROFILE', 'TRACKING', 'MERCHANT_DASHBOARD', 'RIDER_DASHBOARD'].includes(screen) && (
        <AIChat 
          restaurants={restaurants}
          onAddToCart={addToCart}
          onSelectRestaurant={handleAiSelectRestaurant}
          onNavigate={(s) => setScreen(s)}
        />
      )}
    </div>
  );
};

export default App;
