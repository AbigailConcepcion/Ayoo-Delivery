
import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { PaymentMethod } from '../types';
import { db } from '../db';

interface PaymentsProps {
  onBack: () => void;
  email: string;
}

const Payments: React.FC<PaymentsProps> = ({ onBack, email }) => {
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const data = await db.getPayments(email);
      setPayments(data);
      setIsLoading(false);
    };
    fetch();
  }, [email]);

  const handleAdd = async () => {
    if (cardNumber.length < 16) return;
    setIsLoading(true);
    const item: PaymentMethod = { 
      id: Date.now().toString(), 
      type: cardNumber.startsWith('4') ? 'VISA' : 'MASTERCARD', 
      last4: cardNumber.slice(-4), 
      expiry 
    };
    const updated = [...payments, item];
    await db.savePayments(email, updated);
    setPayments(updated);
    setCardNumber('');
    setExpiry('');
    setShowForm(false);
    setIsLoading(false);
  };

  const handleRemove = async (id: string) => {
    setIsLoading(true);
    const updated = payments.filter(p => p.id !== id);
    await db.savePayments(email, updated);
    setPayments(updated);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="bg-white p-6 flex items-center justify-between shadow-sm z-10 border-b border-gray-100">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-[#FF00CC] text-2xl font-black">←</button>
            <h2 className="text-xl font-black uppercase tracking-tighter">Wallet</h2>
         </div>
         {isLoading && (
            <div className="w-5 h-5 border-3 border-[#FF00CC] border-t-transparent rounded-full animate-spin"></div>
         )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto scrollbar-hide space-y-6">
         {isLoading && payments.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-20">
             <div className="w-12 h-12 bg-[#FF00CC] rounded-full animate-ping mb-6"></div>
             <p className="font-black text-xs uppercase tracking-widest">Accessing Vault...</p>
           </div>
         ) : payments.length === 0 && !showForm ? (
           <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
              <span className="text-7xl mb-6">💳</span>
              <p className="font-black uppercase tracking-widest text-sm">Secure your wallet with a card.</p>
           </div>
         ) : (
           payments.map(p => (
             <div key={p.id} className="relative h-56 ayoo-gradient rounded-[45px] p-10 shadow-2xl flex flex-col justify-between text-white overflow-hidden group animate-in slide-in-from-bottom-5">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
                <div className="flex justify-between items-start z-10">
                   <span className="text-3xl font-black italic tracking-tighter uppercase">{p.type}</span>
                   <button 
                     onClick={() => handleRemove(p.id)} 
                     disabled={isLoading}
                     className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                   >
                     ✕
                   </button>
                </div>
                <div className="z-10">
                   <p className="text-2xl font-mono tracking-[0.3em] mb-6 drop-shadow-lg">•••• •••• •••• {p.last4}</p>
                   <div className="flex justify-between items-end">
                      <div className="flex gap-8">
                         <div>
                            <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Holder</p>
                            <p className="font-black text-xs uppercase tracking-tight leading-none">Juan Dela Cruz</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Expires</p>
                            <p className="font-black text-xs uppercase tracking-tight leading-none">{p.expiry}</p>
                         </div>
                      </div>
                      <div className="w-16 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                         <div className="w-8 h-8 bg-white/30 rounded-lg"></div>
                      </div>
                   </div>
                </div>
             </div>
           ))
         )}

         {showForm && (
           <div className="bg-white p-10 rounded-[50px] shadow-2xl border-2 border-[#FF00CC]/10 animate-in zoom-in-95">
              <h3 className="font-black text-2xl mb-8 uppercase tracking-tighter leading-none">New Payment</h3>
              <div className="space-y-6">
                 <div className="input-label-border">
                    <label>Card Number</label>
                    <input 
                      type="text" 
                      maxLength={16}
                      value={cardNumber} 
                      onChange={e => setCardNumber(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:border-[#FF00CC] outline-none font-black text-sm tracking-widest transition-all"
                    />
                 </div>
                 <div className="input-label-border">
                    <label>Expiry Date</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY"
                      value={expiry} 
                      onChange={e => setExpiry(e.target.value)}
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:border-[#FF00CC] outline-none font-black text-sm transition-all"
                    />
                 </div>
                 <div className="flex flex-col gap-3 pt-6">
                    <Button onClick={handleAdd} disabled={isLoading} className="pill-shadow py-6 font-black uppercase tracking-widest">
                       {isLoading ? 'Processing...' : 'Secure Card'}
                    </Button>
                    <button 
                      onClick={() => setShowForm(false)} 
                      className="py-4 text-[10px] font-black uppercase tracking-widest text-gray-400"
                    >
                      Go Back
                    </button>
                 </div>
              </div>
           </div>
         )}
      </div>

      {!showForm && (
        <div className="p-8 bg-white/80 backdrop-blur-xl border-t border-gray-100 rounded-t-[50px]">
           <Button onClick={() => setShowForm(true)} className="pill-shadow py-6 font-black uppercase tracking-[0.2em] active:scale-95 transition-all">
              Add New Method
           </Button>
        </div>
      )}
    </div>
  );
};

export default Payments;
