
import React, { useState } from 'react';
import Button from './components/Button';
import { Restaurant, Voucher, FoodItem } from './types';

interface CartProps {
  items: { id: string; quantity: number }[];
  restaurants: Restaurant[];
  onBack: () => void;
  onCheckout: () => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  isGroup?: boolean;
  onStartGroup?: () => void;
  appliedVoucher?: Voucher | null;
  customDeliveryFee?: number;
}

const Cart: React.FC<CartProps> = ({ items, restaurants, onBack, onCheckout, onUpdateQuantity, isGroup, onStartGroup, appliedVoucher, customDeliveryFee = 45 }) => {
  const [splitCount, setSplitCount] = useState(1);
  const [isSquadMode, setIsSquadMode] = useState(isGroup || false);

  const cartDetails = items.map(cartItem => {
    for (const res of restaurants) {
      const item = res.items.find((i: FoodItem) => i.id === cartItem.id);
      if (item) return { ...item, quantity: cartItem.quantity };
    }
    return null;
  }).filter(Boolean);

  const subtotal = cartDetails.reduce((acc, curr) => acc + (curr?.price || 0) * (curr?.quantity || 0), 0);
  const deliveryFee = customDeliveryFee;
  
  const discountAmount = appliedVoucher 
    ? (appliedVoucher.type === 'percent' ? (subtotal * appliedVoucher.discount / 100) : appliedVoucher.discount)
    : 0;
    
  const total = subtotal + deliveryFee - discountAmount;
  const splitAmount = total / Math.max(1, splitCount);

  const squadMembers = [
    { name: 'You', avatar: 'https://i.pravatar.cc/150?u=you' },
    { name: 'Kylie', avatar: 'https://i.pravatar.cc/150?u=kylie' },
    { name: 'Ben', avatar: 'https://i.pravatar.cc/150?u=ben' },
    { name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col pb-32 overflow-y-auto scrollbar-hide">
      <div className="bg-white p-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-[#6D28D9] text-2xl font-black">←</button>
          <h2 className="text-xl font-black uppercase tracking-tight">Your Cart</h2>
        </div>
        {!isSquadMode && items.length > 0 && (
          <button 
            onClick={() => { setIsSquadMode(true); if(onStartGroup) onStartGroup(); }} 
            className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-100 flex items-center gap-2"
          >
            🔥 Squad Order
          </button>
        )}
      </div>

      <div className="flex-1 p-6 space-y-6">
        {cartDetails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-8xl mb-6">🛒</span>
            <p className="text-gray-400 text-lg font-black uppercase tracking-tighter">Your cart is empty.</p>
            <Button onClick={onBack} variant="outline" className="mt-8" fullWidth={false}>Discover Food</Button>
          </div>
        ) : (
          <>
            {isSquadMode && (
              <div className="bg-orange-50 p-8 rounded-[40px] border-2 border-orange-100 animate-in zoom-in-95">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-orange-600 font-black text-xs uppercase tracking-widest">Active Squad Order</h3>
                    <button onClick={() => setIsSquadMode(false)} className="text-[9px] font-black text-orange-400 uppercase">Cancel</button>
                 </div>
                 <div className="flex -space-x-3 mb-8">
                    {squadMembers.slice(0, splitCount).map((m, i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg animate-in slide-in-from-left-4">
                        <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <button 
                      onClick={() => setSplitCount(prev => Math.min(4, prev + 1))}
                      className="w-12 h-12 rounded-full border-4 border-white bg-orange-200 flex items-center justify-center text-orange-600 font-black text-xl z-10"
                    >
                      +
                    </button>
                 </div>
                 <div className="bg-white p-6 rounded-[30px] shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-[10px] font-black text-gray-400 uppercase">Split among {splitCount} friends</p>
                       <span className="text-orange-600 font-black text-xl tracking-tighter">₱{splitAmount.toFixed(0)} / ea</span>
                    </div>
                    <p className="text-[8px] font-bold text-gray-300 uppercase leading-none">Each person pays their share on delivery</p>
                 </div>
                 <button className="w-full mt-4 py-3 bg-orange-600/10 text-orange-600 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-orange-100">Invite More Friends 🔗</button>
              </div>
            )}

            <div className="space-y-4">
              {cartDetails.map(item => (
                <div key={item!.id} className="bg-white p-5 rounded-[28px] flex justify-between items-center shadow-sm border border-gray-50">
                  <div className="flex items-center gap-4 flex-1">
                    <img src={item!.image} className="w-16 h-16 rounded-2xl object-cover" alt={item!.name} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm text-gray-900 tracking-tight mb-1 truncate">{item!.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">₱{item!.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-gray-50 rounded-2xl p-1">
                       <button onClick={() => onUpdateQuantity(item!.id, -1)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6D28D9] font-black">-</button>
                       <span className="w-6 text-center font-black text-sm text-gray-900">{item!.quantity}</span>
                       <button onClick={() => onUpdateQuantity(item!.id, 1)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6D28D9] font-black">+</button>
                    </div>
                    <span className="font-black text-gray-900 text-md min-w-[60px] text-right">₱{item!.price * item!.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-lg space-y-4 border border-gray-50">
              <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>₱{subtotal}</span>
              </div>
              <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <span>Delivery</span>
                <span className="text-green-500">₱{deliveryFee}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-[11px] font-black text-[#6D28D9] uppercase tracking-widest">
                  <span>Voucher: {appliedVoucher.code}</span>
                  <span>- ₱{discountAmount}</span>
                </div>
              )}
              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                <span className="font-black text-gray-900 text-2xl tracking-tighter uppercase leading-none">Total</span>
                <span className="font-black text-4xl text-[#6D28D9] tracking-tighter">₱{Math.max(0, total)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {cartDetails.length > 0 && (
        <div className="p-8 bg-white border-t border-gray-100 fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-[50px] shadow-2xl z-[60]">
          <Button onClick={onCheckout} className="pill-shadow py-6 text-xl font-black uppercase tracking-[0.2em]">
            {isSquadMode ? `Squad Up (₱${splitAmount.toFixed(0)} ea)` : 'Place Order'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Cart;
