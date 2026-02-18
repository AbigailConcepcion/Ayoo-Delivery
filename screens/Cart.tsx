
import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { MOCK_RESTAURANTS } from '../constants';
import { Voucher, PaymentMethod, PaymentType } from '../types';
import { db } from '../db';
import { ayooCloud } from '../api';

interface CartProps {
  items: { id: string; quantity: number }[];
  onBack: () => void;
  onCheckout: () => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  isGroup?: boolean;
  onStartGroup?: () => void;
  appliedVoucher?: Voucher | null;
  customDeliveryFee?: number;
}

const Cart: React.FC<CartProps> = ({ items, onBack, onCheckout, onUpdateQuantity, isGroup, onStartGroup, appliedVoucher, customDeliveryFee = 45 }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payStep, setPayStep] = useState(1);
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    const fetchPay = async () => {
      const email = (await db.getSession())?.email || '';
      const methods = await db.getPayments(email);
      setPaymentMethods(methods);
      if (methods.length > 0) setSelectedMethod(methods[0]);
    };
    fetchPay();
  }, []);

  const cartDetails = items.map(cartItem => {
    for (const res of MOCK_RESTAURANTS) {
      const item = res.items.find(i => i.id === cartItem.id);
      if (item) return { ...item, quantity: cartItem.quantity };
    }
    return null;
  }).filter(Boolean);

  const subtotal = cartDetails.reduce((acc, curr) => acc + (curr?.price || 0) * (curr?.quantity || 0), 0);
  const deliveryFee = customDeliveryFee;
  const discountAmount = appliedVoucher ? (appliedVoucher.type === 'percent' ? (subtotal * appliedVoucher.discount / 100) : appliedVoucher.discount) : 0;
  const total = subtotal + deliveryFee - discountAmount;

  const addLog = (msg: string) => setHandshakeLogs(prev => [...prev.slice(-4), msg]);

  const handleSecureCheckout = async () => {
    if (!selectedMethod) return;
    setIsProcessing(true);
    setPayStep(1);
    setHandshakeLogs([]);
    setErrorMessage(null);

    const email = (await db.getSession())?.email || '';
    const tempId = `AYO-${Math.floor(Math.random()*90000)}`;

    addLog("Connecting to Ayoo Backend API...");
    setTimeout(() => addLog("Handshaking with Payment Gateway..."), 800);
    setTimeout(() => addLog("Verifying SSL Certificates..."), 1600);
    setTimeout(() => addLog(`Confirming Funds with ${selectedMethod.type}...`), 2400);

    const res = await ayooCloud.processPayment(email, selectedMethod, total, tempId);
    
    if (res.success) {
      setPayStep(3);
      setReceiptData({
        ref: res.reference,
        txn: res.transactionId,
        date: new Date().toLocaleString(),
        method: selectedMethod.type,
        total: total
      });
      setTimeout(() => {
        setIsProcessing(false);
        setShowReceipt(true);
      }, 1500);
    } else {
      setPayStep(4);
      setErrorMessage(res.error || 'Identity Verification Failed');
      setTimeout(() => setIsProcessing(false), 3500);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col pb-32 overflow-y-auto scrollbar-hide">
      
      {/* PRODUCTION RECEIPT MODAL */}
      {showReceipt && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8">
           <div className="bg-white w-full max-w-sm rounded-[50px] overflow-hidden shadow-2xl animate-in zoom-in-95 p-10 relative">
              <div className="absolute top-0 left-0 right-0 h-2 ayoo-gradient"></div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">📜</div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Verified Slip</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saved to Cloud Vault</p>
              </div>

              <div className="space-y-4 border-y border-gray-100 py-6 mb-8">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                   <span>Ref No.</span>
                   <span className="text-gray-900">{receiptData?.ref}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                   <span>Gateway</span>
                   <span className="text-gray-900">{receiptData?.method}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                   <span className="font-black text-xs uppercase text-gray-900">Paid Total</span>
                   <span className="font-black text-2xl text-[#FF00CC]">₱{receiptData?.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                 <Button onClick={onCheckout} className="pill-shadow py-5 font-black uppercase tracking-[0.1em]">Track Real-time</Button>
              </div>
           </div>
        </div>
      )}

      {/* SECURE GATEWAY OVERLAY */}
      {isProcessing && (
        <div className="fixed inset-0 z-[500] bg-black flex flex-col animate-in fade-in duration-300">
           <div className="bg-[#1A1A1A] p-6 flex items-center justify-between text-white border-b border-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 ayoo-gradient rounded-xl flex items-center justify-center font-black text-[12px]">ay</div>
                 <span className="text-[10px] font-black uppercase tracking-widest">Ayoo API Gateway</span>
              </div>
              <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1.5">
                 <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-[8px] font-black text-green-500">ENCRYPTED</span>
              </div>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              {payStep <= 2 && (
                <div className="animate-in zoom-in-95">
                  <div className="w-32 h-32 rounded-[45px] bg-white/5 border border-white/10 flex items-center justify-center mb-10 mx-auto shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 ayoo-gradient opacity-10 animate-pulse"></div>
                    <span className="text-5xl animate-bounce">🛡️</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-white">Authorizing...</h3>
                  
                  <div className="bg-[#0A0A0A] p-6 rounded-[30px] border border-white/5 text-left w-full max-w-[280px] font-mono space-y-2">
                     {handshakeLogs.map((log, i) => (
                       <p key={i} className="text-[9px] text-green-500/80 animate-in slide-in-from-left-2">
                          <span className="opacity-50 mr-2">&gt;</span>{log}
                       </p>
                     ))}
                  </div>
                </div>
              )}

              {payStep === 4 && (
                <div className="animate-in shake">
                   <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-[35px] flex items-center justify-center text-5xl mx-auto mb-8 border border-red-500/30">✕</div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-white">Denied</h3>
                   <p className="text-red-400 font-black text-xs uppercase bg-red-500/10 px-6 py-2 rounded-full inline-block">{errorMessage}</p>
                   <p className="text-gray-500 font-bold text-[8px] mt-10 uppercase tracking-[0.3em]">Session Terminated by Host</p>
                </div>
              )}
           </div>
        </div>
      )}

      <div className="bg-white p-6 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-[#FF00CC] text-2xl font-black">←</button>
          <h2 className="text-xl font-black uppercase tracking-tight leading-none">Checkout Central</h2>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-4">
          {cartDetails.map(item => (
            <div key={item!.id} className="bg-white p-5 rounded-[28px] flex justify-between items-center shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <img src={item!.image} className="w-16 h-16 rounded-2xl object-cover" alt={item!.name} />
                <div>
                  <h4 className="font-black text-sm text-gray-900 leading-none mb-1">{item!.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">₱{item!.price} x {item!.quantity}</p>
                </div>
              </div>
              <span className="font-black text-gray-900">₱{item!.price * item!.quantity}</span>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-lg space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Authenticated Source</h3>
           <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {paymentMethods.map(m => (
                <button 
                  key={m.id} 
                  onClick={() => setSelectedMethod(m)}
                  className={`flex-shrink-0 px-6 py-5 rounded-[28px] border-2 transition-all flex flex-col gap-1 items-center min-w-[150px] ${
                    selectedMethod?.id === m.id ? 'border-[#FF00CC] bg-[#FF00CC]/5 scale-105 shadow-xl shadow-pink-100' : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${
                    m.type === 'GCASH' ? 'text-[#007DFE]' : m.type === 'MAYA' ? 'text-[#00D15F]' : 'text-gray-900'
                  }`}>{m.type}</span>
                  <span className="text-[14px] font-black tracking-tighter">₱{m.balance?.toFixed(0) || '0'}</span>
                </button>
              ))}
           </div>
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
          <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
            <span className="font-black text-gray-900 text-2xl tracking-tighter uppercase leading-none">Total</span>
            <span className="font-black text-4xl text-[#FF00CC] tracking-tighter">₱{total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div className="p-8 bg-white border-t border-gray-100 fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-[50px] shadow-2xl z-[60]">
        <Button onClick={handleSecureCheckout} disabled={!selectedMethod} className="pill-shadow py-6 text-xl font-black uppercase tracking-[0.1em]">
          Execute Transaction
        </Button>
      </div>
    </div>
  );
};

export default Cart;
