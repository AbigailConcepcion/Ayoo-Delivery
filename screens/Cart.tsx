
import React from 'react';
import Button from '../components/Button';
import { MOCK_RESTAURANTS } from '../constants';
import { GroupMember, Voucher } from '../types';

interface CartProps {
  items: { id: string; quantity: number }[];
  onBack: () => void;
  onCheckout: () => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  isGroup?: boolean;
  onStartGroup?: () => void;
  groupMembers?: GroupMember[];
  activity?: string;
  appliedVoucher?: Voucher | null;
  customDeliveryFee?: number;
}

const Cart: React.FC<CartProps> = ({ items, onBack, onCheckout, onUpdateQuantity, isGroup, onStartGroup, groupMembers = [], activity, appliedVoucher, customDeliveryFee = 45 }) => {
  const cartDetails = items.map(cartItem => {
    for (const res of MOCK_RESTAURANTS) {
      const item = res.items.find(i => i.id === cartItem.id);
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

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col pb-32 overflow-y-auto scrollbar-hide">
      <div className="bg-white p-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-[#FF00CC] text-2xl font-black">←</button>
          <h2 className="text-xl font-black uppercase tracking-tight">Your Cart</h2>
        </div>
        {!isGroup && items.length > 0 && (
          <button onClick={onStartGroup} className="bg-pink-50 text-[#FF00CC] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-pink-100">+ Squad Order</button>
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
            <div className="space-y-4">
              {cartDetails.map(item => (
                <div key={item!.id} className="bg-white p-5 rounded-[28px] flex justify-between items-center shadow-sm border border-gray-50 group hover:border-[#FF00CC]/20 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <img src={item!.image} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt={item!.name} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm text-gray-900 tracking-tight mb-1 truncate">{item!.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">₱{item!.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                       <button onClick={() => onUpdateQuantity(item!.id, -1)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#FF00CC] font-black text-xl hover:bg-white active:scale-90">-</button>
                       <span className="w-6 text-center font-black text-sm text-gray-900">{item!.quantity}</span>
                       <button onClick={() => onUpdateQuantity(item!.id, 1)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#FF00CC] font-black text-xl hover:bg-white active:scale-90">+</button>
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
                <span>Delivery (Standard)</span>
                <span className="text-green-500 font-black">₱{deliveryFee}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-[11px] font-black text-[#FF00CC] uppercase tracking-widest">
                  <span>Voucher: {appliedVoucher.code}</span>
                  <span>- ₱{discountAmount}</span>
                </div>
              )}
              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                <span className="font-black text-gray-900 text-2xl tracking-tighter uppercase leading-none">Total</span>
                <span className="font-black text-4xl text-[#FF00CC] tracking-tighter">₱{Math.max(0, total)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {cartDetails.length > 0 && (
        <div className="p-8 bg-white border-t border-gray-100 fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-[50px] shadow-[0_-20px_50px_rgba(0,0,0,0.05)] z-[60]">
          <Button onClick={onCheckout} className="pill-shadow py-6 text-xl font-black uppercase tracking-[0.2em]">Place Order</Button>
        </div>
      )}
    </div>
  );
};

export default Cart;
