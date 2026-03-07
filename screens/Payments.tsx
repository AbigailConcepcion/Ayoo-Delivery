
import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { PaymentMethod, PaymentType } from '../types';
import { db } from '../db';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentsProps {
  onBack: () => void;
  email: string;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_KEY || '');

const Payments: React.FC<PaymentsProps> = ({ onBack, email }) => {
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'CARD' | 'EWALLET'>('CARD');

  // Card Form
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cardToken, setCardToken] = useState('');

  // Wallet Form
  const [walletType, setWalletType] = useState<PaymentType>('GCASH');
  const [phone, setPhone] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const data = await db.getPayments(email);
      setPayments(data);
      setIsLoading(false);
    };
    fetch();
  }, [email]);

  const handleAddCard = async (params?: { token?: string; last4?: string; brand?: string }) => {
    const token = params?.token || cardToken;
    const hasManualCard = cardNumber.length >= 16;
    if (!token && !hasManualCard) return;
    setIsLoading(true);
    const resolvedBrand = (params?.brand || (cardNumber.startsWith('4') ? 'VISA' : 'MASTERCARD')).toUpperCase();
    const item: PaymentMethod = {
      id: Date.now().toString(),
      type: resolvedBrand === 'VISA' ? 'VISA' : 'MASTERCARD',
      last4: params?.last4 || cardNumber.slice(-4),
      expiry,
      token: token || undefined
    };
    const updated = [...payments, item];
    await db.savePayments(email, updated);
    setPayments(updated);
    setCardNumber('');
    setExpiry('');
    setShowForm(false);
    setIsLoading(false);
  };

  // component used when Stripe key present
  const CardEntry: React.FC = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setProcessing(true);
      const card = elements.getElement(CardElement);
      if (card) {
        const result = await stripe.createToken(card);
        if (result.error) {
          alert(result.error.message);
        } else {
          await handleAddCard({
            token: result.token?.id,
            last4: result.token?.card?.last4 || undefined,
            brand: result.token?.card?.brand || undefined
          });
        }
      }
      setProcessing(false);
    };
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
        <button type="submit" disabled={!stripe || processing} className="pill-shadow py-6 font-black uppercase w-full px-6 rounded-2xl bg-[#FF00CC] text-white hover:shadow-lg transition-all active:scale-95">
          Secure Card
        </button>
      </form>
    );
  };

  const startWalletLink = () => {
    if (phone.length < 10) return;
    setOtpMode(true);
  };

  const finalizeWalletLink = async () => {
    if (otp.length < 4) return;
    setIsLoading(true);
    const item: PaymentMethod = {
      id: Date.now().toString(),
      type: walletType,
      phoneNumber: phone,
      balance: 0
    };
    const updated = [...payments, item];
    await db.savePayments(email, updated);
    setPayments(updated);
    setPhone('');
    setOtp('');
    setOtpMode(false);
    setShowForm(false);
    setIsLoading(false);
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm("Unlink this payment source?")) return;
    setIsLoading(true);
    const updated = payments.filter(p => p.id !== id);
    await db.savePayments(email, updated);
    setPayments(updated);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Bills & Load Header - Without extra top nav, just back button */}
      <div className="bg-gradient-to-r from-[#00BCD4] to-[#26C6DA] p-6 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white text-2xl font-black">←</button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">Bills & Load</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Pay bills & buy load instantly</p>
          </div>
        </div>
        {isLoading && (
          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto scrollbar-hide space-y-6">
        {payments.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
            <span className="text-7xl mb-6">💳</span>
            <p className="font-black uppercase tracking-widest text-sm">Secure your account with a payment source.</p>
          </div>
        ) : (
          payments.map(p => (
            <div key={p.id} className={`relative h-52 rounded-[45px] p-8 shadow-2xl flex flex-col justify-between text-white overflow-hidden group animate-in slide-in-from-bottom-5 ${p.type === 'GCASH' ? 'bg-[#007DFE]' :
                p.type === 'MAYA' ? 'bg-[#00D15F]' : 'ayoo-gradient'
              }`}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
              <div className="flex justify-between items-start z-10">
                <span className="text-2xl font-black italic tracking-tighter uppercase">{p.type}</span>
                <button
                  onClick={() => handleRemove(p.id)}
                  disabled={isLoading}
                  className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                  ✕
                </button>
              </div>
              <div className="z-10">
                {p.phoneNumber ? (
                  <p className="text-2xl font-mono tracking-widest mb-4">09** *** {p.phoneNumber.slice(-4)}</p>
                ) : (
                  <p className="text-2xl font-mono tracking-[0.3em] mb-4">•••• {p.last4}</p>
                )}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Status</p>
                    <p className="font-black text-xs uppercase tracking-tight leading-none">Verified Secure</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Wallet Balance</p>
                    <p className="font-black text-xl tracking-tighter">₱{p.balance?.toFixed(0) || '---'}</p>
                  </div>
                </div>
                {p.balance != null && (
                  <button onClick={async () => {
                    const amt = parseFloat(prompt('Top-up amount (PHP)') || '0');
                    if (!amt || amt <= 0) return;
                    setIsLoading(true);
                    const newBal = await db.topUpPayment(email, p.id, amt);
                    setPayments(payments.map(x => x.id === p.id ? { ...x, balance: newBal } : x));
                    setIsLoading(false);
                  }} className="mt-3 px-4 py-2 bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest">Top Up</button>
                )}
              </div>
            </div>
          ))
        )}

        {showForm && (
          <div className="bg-white p-10 rounded-[50px] shadow-2xl border-2 border-[#FF00CC]/10 animate-in zoom-in-95">
            <div className="flex gap-2 mb-8 bg-gray-50 p-1 rounded-2xl">
              <button onClick={() => setActiveTab('CARD')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'CARD' ? 'bg-[#FF00CC] text-white shadow-lg' : 'text-gray-400'}`}>Card</button>
              <button onClick={() => setActiveTab('EWALLET')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'EWALLET' ? 'bg-[#FF00CC] text-white shadow-lg' : 'text-gray-400'}`}>E-Wallet</button>
            </div>

            {activeTab === 'CARD' ? (
              stripePromise ? (
                <Elements stripe={stripePromise}>
                  <CardEntry />
                </Elements>
              ) : (
                <div className="space-y-6">
                  <div className="input-label-border">
                    <label>Card Number</label>
                    <input type="text" maxLength={16} value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:border-[#FF00CC] outline-none font-black text-sm tracking-widest" />
                  </div>
                  <div className="input-label-border">
                    <label>Expiry Date</label>
                    <input type="text" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:border-[#FF00CC] outline-none font-black text-sm" />
                  </div>
                  <div className="input-label-border">
                    <label>Stripe Token (for testing)</label>
                    <input type="text" placeholder="tok_visa" value={cardToken} onChange={e => setCardToken(e.target.value)} className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:border-[#FF00CC] outline-none font-black text-sm" />
                  </div>
                  <Button onClick={() => handleAddCard({ token: cardToken })} disabled={isLoading} className="pill-shadow py-6 font-black uppercase">Secure Card</Button>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {!otpMode ? (
                  <>
                    <div className="flex gap-4">
                      <button onClick={() => setWalletType('GCASH')} className={`flex-1 p-4 rounded-2xl border-2 transition-all ${walletType === 'GCASH' ? 'border-[#007DFE] bg-[#007DFE]/5' : 'border-gray-100'}`}>
                        <span className="font-black text-[#007DFE] text-[10px]">GCash</span>
                      </button>
                      <button onClick={() => setWalletType('MAYA')} className={`flex-1 p-4 rounded-2xl border-2 transition-all ${walletType === 'MAYA' ? 'border-[#00D15F] bg-[#00D15F]/5' : 'border-gray-100'}`}>
                        <span className="font-black text-[#00D15F] text-[10px]">Maya</span>
                      </button>
                    </div>
                    <div className="input-label-border">
                      <label>Registered Phone</label>
                      <input type="text" maxLength={11} value={phone} onChange={e => setPhone(e.target.value)} placeholder="09XX XXX XXXX" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:border-[#FF00CC] outline-none font-black text-sm tracking-widest" />
                    </div>
                    <Button onClick={startWalletLink} className="pill-shadow py-6 font-black uppercase bg-black">Request OTP</Button>
                  </>
                ) : (
                  <div className="animate-in slide-in-from-right-10">
                    <div className="text-center mb-6">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Verify it's you</p>
                      <p className="text-xs font-bold text-gray-600">Enter the 4-digit code sent to your phone</p>
                    </div>
                    <input type="text" maxLength={4} value={otp} onChange={e => setOtp(e.target.value)} placeholder="0 0 0 0" className="w-full p-5 bg-gray-100 border-2 border-[#FF00CC] rounded-3xl text-center font-black text-2xl tracking-[0.5em] outline-none mb-6" autoFocus />
                    <Button onClick={finalizeWalletLink} className="py-6 font-black uppercase bg-[#FF00CC]">Verify & Link</Button>
                    <button onClick={() => setOtpMode(false)} className="w-full mt-4 text-[9px] font-black uppercase text-gray-400">Back</button>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => { setShowForm(false); setOtpMode(false); }} className="w-full mt-6 text-[10px] font-black uppercase text-gray-300">Nevermind</button>
          </div>
        )}
      </div>

      {!showForm && (
        <div className="p-8 bg-white border-t border-gray-100 rounded-t-[50px]">
          <Button onClick={() => setShowForm(true)} className="pill-shadow py-6 font-black uppercase tracking-[0.2em]">
            Connect New Pay Source
          </Button>
        </div>
      )}
    </div>
  );
};

export default Payments;
