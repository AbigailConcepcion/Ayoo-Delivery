import React, { useMemo, useState } from 'react';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import { AppScreen } from '../types';

interface GroceriesProps {
  onBack: () => void;
  onNavigate: (screen: AppScreen) => void;
}

type GroceryItem = {
  id: string;
  name: string;
  price: number;
  unit: string;
  popular?: boolean;
};

type GroceryStore = {
  id: string;
  name: string;
  eta: string;
  rating: number;
  fee: number;
  items: GroceryItem[];
};

const STORES: GroceryStore[] = [
  {
    id: 'g1',
    name: 'Ayoo Mart',
    eta: '28-45 min',
    rating: 4.8,
    fee: 49,
    items: [
      { id: 'a1', name: 'Premium Rice', price: 62, unit: '/kg', popular: true },
      { id: 'a2', name: 'Fresh Eggs', price: 105, unit: '/dozen', popular: true },
      { id: 'a3', name: 'Whole Milk', price: 92, unit: '/1L' },
      { id: 'a4', name: 'Loaf Bread', price: 68, unit: '/pack' },
      { id: 'a5', name: 'Cooking Oil', price: 88, unit: '/500ml' }
    ]
  },
  {
    id: 'g2',
    name: 'City Fresh',
    eta: '24-40 min',
    rating: 4.7,
    fee: 45,
    items: [
      { id: 'b1', name: 'Chicken Breast', price: 175, unit: '/kg', popular: true },
      { id: 'b2', name: 'Tomato', price: 75, unit: '/kg' },
      { id: 'b3', name: 'Onion', price: 95, unit: '/kg' },
      { id: 'b4', name: 'Banana', price: 85, unit: '/kg' },
      { id: 'b5', name: 'Carrots', price: 80, unit: '/kg' }
    ]
  }
];

const Groceries: React.FC<GroceriesProps> = ({ onBack, onNavigate }) => {
  const [storeId, setStoreId] = useState(STORES[0].id);
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [scheduleMode, setScheduleMode] = useState<'NOW' | 'LATER'>('NOW');
  const [ecoPack, setEcoPack] = useState(true);
  const [showPlaced, setShowPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placingMsg, setPlacingMsg] = useState('');

  const currentStore = useMemo(
    () => STORES.find((store) => store.id === storeId) || STORES[0],
    [storeId]
  );

  const lineItems = useMemo(() => {
    return currentStore.items
      .filter((item) => Number(basket[item.id] || 0) > 0)
      .map((item) => ({ ...item, qty: basket[item.id] }));
  }, [basket, currentStore.items]);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [lineItems]
  );
  const platformFee = subtotal > 0 ? Math.max(12, Math.round(subtotal * 0.03)) : 0;
  const total = subtotal + currentStore.fee + platformFee;

  const changeQty = (itemId: string, delta: number) => {
    setBasket((prev) => {
      const next = Math.max(0, Number(prev[itemId] || 0) + delta);
      const updated = { ...prev, [itemId]: next };
      if (next === 0) delete updated[itemId];
      return updated;
    });
  };

  const placeOrder = async () => {
    if (lineItems.length === 0 || placing) return;
    setPlacing(true);
    setPlacingMsg('Locking grocery slot...');
    await new Promise(resolve => setTimeout(resolve, 420));
    setPlacingMsg('Assigning personal shopper...');
    await new Promise(resolve => setTimeout(resolve, 420));
    setPlacingMsg('Preparing basket checkout...');
    await new Promise(resolve => setTimeout(resolve, 420));
    setPlacing(false);
    setShowPlaced(true);
    setBasket({});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 overflow-y-auto scrollbar-hide">
      {showPlaced && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-white rounded-[35px] p-8 w-full max-w-sm text-center space-y-4">
            <p className="text-5xl">✅</p>
            <h3 className="text-xl font-black uppercase tracking-tight">Grocery Order Confirmed</h3>
            <p className="text-sm font-bold text-gray-500">A shopper is now preparing your basket from {currentStore.name}.</p>
            <Button onClick={() => { setShowPlaced(false); onNavigate('TRACKING'); }} className="py-4 text-sm font-black uppercase">
              Track Order
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#8B5CF6] text-2xl font-black">←</button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Groceries & Essentials</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fresh stock near you</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {STORES.map((store) => (
            <button
              key={store.id}
              onClick={() => setStoreId(store.id)}
              className={`min-w-[190px] rounded-2xl p-4 text-left border-2 ${
                store.id === currentStore.id ? 'border-[#8B5CF6] bg-[#8B5CF6]/5' : 'border-gray-100 bg-white'
              }`}
            >
              <p className="font-black text-sm">{store.name}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{store.eta} • ⭐ {store.rating}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5 space-y-4">
          {currentStore.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="font-black text-sm text-gray-900">
                  {item.name}
                  {item.popular && <span className="ml-2 text-[9px] uppercase tracking-widest text-[#8B5CF6]">popular</span>}
                </p>
                <p className="text-[11px] font-bold text-gray-500">₱{item.price} {item.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 rounded-full bg-gray-100 font-black">-</button>
                <span className="w-5 text-center font-black text-sm">{basket[item.id] || 0}</span>
                <button onClick={() => changeQty(item.id, 1)} className="w-8 h-8 rounded-full bg-purple-100 text-[#8B5CF6] font-black">+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Mode</p>
            <div className="flex gap-2">
              <button
                onClick={() => setScheduleMode('NOW')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${scheduleMode === 'NOW' ? 'bg-[#8B5CF6] text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                Now
              </button>
              <button
                onClick={() => setScheduleMode('LATER')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${scheduleMode === 'LATER' ? 'bg-[#8B5CF6] text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                Later
              </button>
            </div>
          </div>
          <label className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xs font-black text-gray-700">Eco Pack (less plastic)</span>
            <input type="checkbox" checked={ecoPack} onChange={(e) => setEcoPack(e.target.checked)} className="w-4 h-4 accent-[#8B5CF6]" />
          </label>
          {scheduleMode === 'LATER' && (
            <input
              type="datetime-local"
              className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:border-[#8B5CF6]"
            />
          )}
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5 space-y-2">
          <div className="flex justify-between text-xs font-black text-gray-500"><span>Items</span><span>₱{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-xs font-black text-gray-500"><span>Delivery</span><span>₱{currentStore.fee.toFixed(2)}</span></div>
          <div className="flex justify-between text-xs font-black text-gray-500"><span>Platform Fee</span><span>₱{platformFee.toFixed(2)}</span></div>
          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-lg font-black uppercase">Total</span>
            <span className="text-2xl font-black text-[#8B5CF6]">₱{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto p-4">
        <Button onClick={placeOrder} disabled={lineItems.length === 0 || placing} className="py-4 text-sm font-black uppercase tracking-widest">
          {placing ? placingMsg : 'Checkout Groceries'}
        </Button>
      </div>

      <BottomNav active="GROCERIES" onNavigate={onNavigate} mode="customer" />
    </div>
  );
};

export default Groceries;
