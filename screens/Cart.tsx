import React, { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import QRScanner from '../components/QRScanner';
import { Address, PaymentMethod, PaymentType, Restaurant, Voucher } from '../types';
import { db } from '../db';
import { ayooCloud } from '../api';
import { calculateCheckoutBreakdown } from '../src/utils/pricing';

const PLACEHOLDER_ITEM_CART = 'https://placehold.co/200x150/6D28D9/FFFFFF/png?text=Dish&font=roboto';

interface CartProps {
  items: { id: string; quantity: number }[];
  restaurants: Restaurant[];
  email?: string;
  currentAddress: string;
  onBack: () => void;
  onCheckout: (
    paymentMethod: PaymentMethod | null,
    isPaid: boolean,
    paymentMeta?: { orderId?: string; transactionId?: string; paymentId?: string; receiptUrl?: string }
  ) => void;
  onNavigateToTracking?: () => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  isGroup?: boolean;
  onStartGroup?: () => void;
  appliedVoucher?: Voucher | null;
  onApplyVoucher?: (voucher: Voucher | null) => void;
  customDeliveryFee?: number;
  tipAmount?: number;
  onTipChange?: (tip: number) => void;
  onSelectAddress?: (address: Address) => void;
}

const AVAILABLE_VOUCHERS: Voucher[] = [
  { id: 'v1', code: 'AYOO2025', discount: 100, description: 'P100 off on your next checkout.', type: 'fixed' },
  { id: 'v2', code: 'ILIGANPRIDE', discount: 15, description: '15% off for local favorites.', type: 'percent' },
  { id: 'v3', code: 'SQUADGOALS', discount: 50, description: 'P50 off for barkada orders.', type: 'fixed' },
];

const TIP_PRESETS = [0, 20, 40, 60, 100];

const Cart: React.FC<CartProps> = ({
  items,
  restaurants,
  email = '',
  currentAddress,
  onBack,
  onCheckout,
  onNavigateToTracking,
  onUpdateQuantity,
  isGroup,
  onStartGroup,
  appliedVoucher,
  onApplyVoucher,
  customDeliveryFee = 45,
  tipAmount = 0,
  onTipChange,
  onSelectAddress,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'DIGITAL' | 'CARD' | 'CASH'>('DIGITAL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [payStep, setPayStep] = useState(1);
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{ ref: string; txn: string; date: string; method: string; total: number } | null>(null);
  const [checkoutOrderId, setCheckoutOrderId] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showVoucherSheet, setShowVoucherSheet] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      const sessionEmail = email || (await db.getSession())?.email || '';
      const methods = await db.getPayments(sessionEmail);
      const codOption: PaymentMethod = { id: 'COD', type: 'COD' as PaymentType, balance: null };
      const allMethods = [...methods, codOption];
      setPaymentMethods(allMethods);
      if (allMethods.length > 0) {
        setSelectedMethod(allMethods[0]);
      }
    };

    void fetchPayments();
  }, [email]);

  useEffect(() => {
    const loadSupportData = async () => {
      const sessionEmail = email || (await db.getSession())?.email || '';
      if (!sessionEmail) return;

      const [addresses, claimed] = await Promise.all([
        db.getAddresses(sessionEmail),
        db.getClaimedVouchers(sessionEmail),
      ]);

      setSavedAddresses(addresses);
      setClaimedIds(claimed.map((voucher) => voucher.id));
    };

    void loadSupportData();
  }, [email]);

  const cartDetails = useMemo(() => {
    return items
      .map((cartItem) => {
        for (const restaurant of restaurants) {
          const item = restaurant.items.find((entry) => entry.id === cartItem.id);
          if (item) {
            return { ...item, quantity: cartItem.quantity };
          }
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [items, restaurants]);

  const subtotal = cartDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const pricing = calculateCheckoutBreakdown(subtotal, customDeliveryFee, appliedVoucher);
  const total = pricing.total + tipAmount;

  const filteredPaymentMethods = paymentMethods.filter((method) => {
    if (paymentFilter === 'CARD') return method.type === 'VISA' || method.type === 'MASTERCARD';
    if (paymentFilter === 'CASH') return method.type === 'CASH' || method.type === 'COD';
    return method.type === 'GCASH' || method.type === 'MAYA';
  });

  const addLog = (message: string) => {
    setHandshakeLogs((prev) => [...prev.slice(-4), message]);
  };

  const applyVoucherByCode = async (rawCode: string) => {
    const normalized = rawCode.trim().toUpperCase();
    const sessionEmail = email || (await db.getSession())?.email || '';
    const matchedVoucher = AVAILABLE_VOUCHERS.find((voucher) => voucher.code === normalized);

    if (!matchedVoucher) {
      setVoucherMessage('Voucher code not recognized.');
      return;
    }

    if (sessionEmail && !claimedIds.includes(matchedVoucher.id)) {
      await db.claimVoucher(sessionEmail, matchedVoucher);
      setClaimedIds((prev) => [...prev, matchedVoucher.id]);
    }

    onApplyVoucher?.(matchedVoucher);
    setVoucherMessage(matchedVoucher.code + ' applied to this checkout.');
    setVoucherCode('');
    setShowVoucherSheet(false);
  };

  const handleSecureCheckout = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);
    setPayStep(1);
    setHandshakeLogs([]);
    setErrorMessage(null);

    const sessionEmail = email || (await db.getSession())?.email || '';
    const tempId = 'AYO-' + String(Math.floor(Math.random() * 90000));
    setCheckoutOrderId(tempId);

    addLog('Connecting to Ayoo Backend API...');
    setTimeout(() => addLog('Handshaking with Payment Gateway...'), 800);
    setTimeout(() => addLog('Verifying SSL Certificates...'), 1600);
    setTimeout(() => addLog('Confirming funds with ' + selectedMethod.type + '...'), 2400);

    if (selectedMethod.type === 'COD') {
      setPayStep(3);
      setReceiptData({
        ref: 'COD',
        txn: '',
        date: new Date().toLocaleString(),
        method: 'COD',
        total,
      });
      setTimeout(() => {
        setIsProcessing(false);
        setShowReceipt(true);
      }, 500);
      return;
    }

    const result = await ayooCloud.processPayment(sessionEmail, selectedMethod, total, tempId);

    if (result.success) {
      if (result.pending && result.checkoutUrl) {
        setIsProcessing(false);
        window.open(result.checkoutUrl, '_blank', 'noopener,noreferrer');
        onCheckout(selectedMethod, false, {
          orderId: tempId,
          transactionId: result.transactionId,
          paymentId: result.reference,
          receiptUrl: result.checkoutUrl,
        });
        return;
      }

      setPayStep(3);
      setReceiptData({
        ref: result.reference,
        txn: result.transactionId,
        date: new Date().toLocaleString(),
        method: selectedMethod.type,
        total,
      });
      setTimeout(() => {
        setIsProcessing(false);
        setShowReceipt(true);
      }, 1500);
    } else {
      setPayStep(4);
      setErrorMessage(result.error || 'Identity verification failed.');
      setTimeout(() => setIsProcessing(false), 3500);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col pb-32 overflow-y-auto scrollbar-hide">
      {showQRScanner && (
        <QRScanner
          onClose={() => setShowQRScanner(false)}
          onScan={(result) => {
            setShowQRScanner(false);
            void applyVoucherByCode(result);
          }}
        />
      )}

      {showAddressSheet && (
        <div className="fixed inset-0 z-[400] bg-black/55 backdrop-blur-sm flex items-end p-4">
          <div className="w-full rounded-[36px] bg-white p-6 shadow-2xl max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-400">Delivery address</p>
                <h3 className="text-2xl font-black text-[#432067]">Pick where we deliver</h3>
              </div>
              <button type="button" onClick={() => setShowAddressSheet(false)} className="rounded-2xl bg-purple-50 px-3 py-2 text-xs font-black text-purple-600">
                Close
              </button>
            </div>
            <div className="space-y-3">
              {savedAddresses.length === 0 && (
                <div className="rounded-[24px] bg-[#FAF7FF] p-4 text-sm font-bold text-purple-500">
                  No saved addresses yet. Add one in your profile, or continue with your current delivery address.
                </div>
              )}
              {savedAddresses.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => {
                    onSelectAddress?.(address);
                    setShowAddressSheet(false);
                  }}
                  className="w-full rounded-[24px] border border-purple-100 bg-[#FAF7FF] p-4 text-left"
                >
                  <p className="text-sm font-black text-[#432067]">{address.label}</p>
                  <p className="mt-1 text-sm text-gray-500">{address.details}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-purple-400">
                    <span>{address.city}</span>
                    <span>{typeof address.deliveryFee === 'number' ? 'P' + String(address.deliveryFee) : 'Saved'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showVoucherSheet && (
        <div className="fixed inset-0 z-[410] bg-black/55 backdrop-blur-sm flex items-end p-4">
          <div className="w-full rounded-[36px] bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-400">Voucher center</p>
                <h3 className="text-2xl font-black text-[#432067]">Apply a deal</h3>
              </div>
              <button type="button" onClick={() => setShowVoucherSheet(false)} className="rounded-2xl bg-purple-50 px-3 py-2 text-xs font-black text-purple-600">
                Close
              </button>
            </div>

            <div className="rounded-[24px] bg-[#FAF7FF] p-4 mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-400">Scan or type a code</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Enter voucher code"
                  className="flex-1 rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold outline-none"
                />
                <button type="button" onClick={() => void applyVoucherByCode(voucherCode)} className="rounded-2xl bg-[#6D28D9] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
                  Apply
                </button>
              </div>
              <button type="button" onClick={() => setShowQRScanner(true)} className="mt-3 w-full rounded-2xl border border-purple-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-purple-600">
                Scan QR voucher
              </button>
              {voucherMessage && <p className="mt-3 text-sm font-bold text-purple-500">{voucherMessage}</p>}
            </div>

            <div className="space-y-3">
              {AVAILABLE_VOUCHERS.map((voucher) => {
                const isClaimed = claimedIds.includes(voucher.id);
                const isApplied = appliedVoucher?.id === voucher.id;
                return (
                  <div key={voucher.id} className="rounded-[24px] border border-purple-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[#432067]">{voucher.code}</p>
                        <p className="mt-1 text-sm text-gray-500">{voucher.description}</p>
                      </div>
                      <span className="rounded-full bg-[#FAF7FF] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-purple-500">
                        {voucher.type === 'percent' ? String(voucher.discount) + '%' : 'P' + String(voucher.discount)}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void applyVoucherByCode(voucher.code)}
                        className="flex-1 rounded-2xl bg-[#6D28D9] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
                      >
                        {isApplied ? 'Applied' : isClaimed ? 'Use now' : 'Claim and use'}
                      </button>
                      {isApplied && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyVoucher?.(null);
                            setVoucherMessage('Voucher removed from this checkout.');
                          }}
                          className="rounded-2xl border border-purple-100 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-purple-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                <span className="font-black text-2xl text-[#6D28D9]">P{receiptData?.total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={() =>
                onCheckout(selectedMethod, selectedMethod?.type !== 'COD', {
                  orderId: checkoutOrderId,
                  transactionId: receiptData?.txn || '',
                  paymentId: receiptData?.ref || '',
                })
              }
              className="pill-shadow py-5 font-black uppercase tracking-[0.1em]"
            >
              Track Real-time
            </Button>
          </div>
        </div>
      )}

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
                      <span className="opacity-50 mr-2">&gt;</span>
                      {log}
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
          <button onClick={onBack} className="text-[#6D28D9] text-2xl font-black">←</button>
          <h2 className="text-xl font-black uppercase tracking-tight leading-none">Checkout Central</h2>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setShowAddressSheet(true)} className="rounded-[24px] bg-white p-4 border border-gray-100 text-left shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-400">Deliver to</p>
            <p className="mt-2 text-sm font-black text-[#432067] line-clamp-2">{currentAddress}</p>
          </button>
          <button type="button" onClick={() => setShowVoucherSheet(true)} className="rounded-[24px] bg-white p-4 border border-gray-100 text-left shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-400">Voucher</p>
            <p className="mt-2 text-sm font-black text-[#432067]">{appliedVoucher ? appliedVoucher.code : 'Add a deal'}</p>
          </button>
        </div>

        {isGroup && (
          <div className="rounded-[28px] bg-[#FAF7FF] p-4 border border-purple-100">
            <p className="text-sm font-black text-[#432067]">Squad Order is active</p>
            <p className="mt-1 text-sm text-purple-500">Invite more people and settle together when the order arrives.</p>
          </div>
        )}
        {!isGroup && onStartGroup && (
          <button type="button" onClick={onStartGroup} className="w-full rounded-[26px] border border-purple-100 bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-purple-600">
            Start squad order
          </button>
        )}

        <div className="space-y-4">
          {cartDetails.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-[28px] flex justify-between items-center shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <img src={item.image || PLACEHOLDER_ITEM_CART} className="w-16 h-16 rounded-2xl object-cover" alt={item.name} />
                <div>
                  <h4 className="font-black text-sm text-gray-900 leading-none mb-1">{item.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">P{item.price} x {item.quantity}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-black text-gray-900">P{item.price * item.quantity}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-7 h-7 rounded-full bg-gray-100 font-black">-</button>
                  <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-7 h-7 rounded-full bg-purple-100 text-[#6D28D9] font-black">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-lg space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Authenticated Source</h3>
          <div className="flex gap-2 mb-4">
            {(['DIGITAL', 'CARD', 'CASH'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setPaymentFilter(filter)}
                className={[
                  'px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest',
                  paymentFilter === filter ? 'bg-[#6D28D9] text-white' : 'bg-gray-100 text-gray-500',
                ].join(' ')}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {filteredPaymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className={[
                  'flex-shrink-0 px-6 py-5 rounded-[28px] border-2 transition-all flex flex-col gap-1 items-center min-w-[150px]',
                  selectedMethod?.id === method.id ? 'border-[#6D28D9] bg-[#6D28D9]/5 scale-105 shadow-xl shadow-purple-100' : 'border-gray-100 bg-gray-50 opacity-60',
                ].join(' ')}
              >
                <span className={[
                  'text-[10px] font-black uppercase tracking-tighter',
                  method.type === 'GCASH' ? 'text-[#007DFE]' : method.type === 'MAYA' ? 'text-[#00D15F]' : 'text-gray-900',
                ].join(' ')}>
                  {method.type}
                </span>
                <span className="text-[14px] font-black tracking-tighter">
                  {method.balance === null || method.balance === undefined ? '—' : 'P' + String(method.balance.toFixed(0))}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-lg space-y-4 border border-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rider tip</h3>
            <span className="text-sm font-black text-purple-600">P{tipAmount.toFixed(0)}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {TIP_PRESETS.map((tip) => (
              <button
                key={tip}
                type="button"
                onClick={() => onTipChange?.(tip)}
                className={[
                  'rounded-xl px-2 py-3 text-[10px] font-black uppercase tracking-[0.16em]',
                  tipAmount === tip ? 'bg-[#6D28D9] text-white' : 'bg-gray-100 text-gray-500',
                ].join(' ')}
              >
                {tip === 0 ? 'No tip' : 'P' + String(tip)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-lg space-y-4 border border-gray-50">
          <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
            <span>Subtotal</span>
            <span>P{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
            <span>Delivery</span>
            <span className="text-green-500">P{pricing.deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
            <span>Service (2.5%)</span>
            <span>P{pricing.serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
            <span>VAT (12%)</span>
            <span>P{pricing.tax.toFixed(2)}</span>
          </div>
          {pricing.discount > 0 && (
            <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
              <span>Voucher</span>
              <span className="text-[#6D28D9]">-P{pricing.discount.toFixed(2)}</span>
            </div>
          )}
          {tipAmount > 0 && (
            <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
              <span>Rider Tip</span>
              <span>P{tipAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
            <span className="font-black text-gray-900 text-2xl tracking-tighter uppercase leading-none">Total</span>
            <span className="font-black text-4xl text-[#6D28D9] tracking-tighter">P{total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div className="p-8 bg-white border-t border-gray-100 fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-[50px] shadow-2xl z-[60]">
        <Button onClick={handleSecureCheckout} disabled={!selectedMethod || cartDetails.length === 0} className="pill-shadow py-6 text-xl font-black uppercase tracking-[0.1em]">
          {onNavigateToTracking ? 'Execute Transaction' : 'Checkout'}
        </Button>
      </div>
    </div>
  );
};

export default Cart;
