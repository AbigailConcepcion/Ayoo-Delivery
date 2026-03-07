import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext';
import Button from '../components/Button';
import { Restaurant, OrderRecord, OrderStatus, UserAccount } from '../types';
import { ayooCloud } from '../api';
import { db } from '../db';

interface OrderTrackingProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  orderItems?: { id: string; quantity: number }[];
  restaurant?: Restaurant | null;
  deliveryCity: string;
  customerEmail: string;
  currentUser?: UserAccount | null;
  onOpenMessages?: (conversationId?: string) => void;
  onReorder?: (items: { id: string; quantity: number }[]) => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({
  onBack,
  restaurant,
  deliveryCity,
  customerEmail,
  currentUser,
  onOpenMessages,
  onReorder
}) => {
  const { showToast } = useToast();
  const [liveOrder, setLiveOrder] = useState<OrderRecord | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'rider', text: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SUMMARY' | 'TIMELINE'>('LIVE');

  const isOrderPaid = (order?: OrderRecord | null) => {
    if (!order) return false;
    return order.isPaid === true || Number(order.isPaid || 0) === 1;
  };

  const needsPayMongoSync = (order?: OrderRecord | null) => {
    if (!order) return false;
    const method = String(order.paymentMethod || '').toUpperCase();
    const isDigital = Boolean(method) && method !== 'COD' && method !== 'CASH';
    return isDigital && !isOrderPaid(order) && order.status !== 'CANCELLED';
  };

  // 1. QUANTUM ETA ENGINE: Dynamic time calculation based on status
  const calculateETA = (status?: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'Waiting for Store...';
      case 'ACCEPTED': return '15-20 mins';
      case 'PREPARING': return '10-15 mins';
      case 'READY_FOR_PICKUP': return '8-10 mins';
      case 'OUT_FOR_DELIVERY': return '3-5 mins';
      case 'DELIVERED': return 'Arrived!';
      case 'CANCELLED': return 'Order Cancelled';
      default: return 'Calculating...';
    }
  };

  // 2. ROBUST REFRESH LOGIC: Prevents "Sync Disruption" in Customer UI
  const refresh = async () => {
    try {
      const allOrders = await db.getAllLiveOrders();
      // Hanapin ang pinakabagong order na hindi pa tapos
      const myOrder = allOrders
        .filter(o => o.customerEmail === customerEmail && o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
        .sort((a, b) => Number(b.id) - Number(a.id))[0];

      if (myOrder) {
        if (needsPayMongoSync(myOrder)) {
          const synced = await ayooCloud.syncPayMongoOrder(myOrder.id);
          setLiveOrder(synced || myOrder);
        } else {
          setLiveOrder(myOrder);
        }
      } else {
        const lastOrder = await ayooCloud.getLiveOrder(customerEmail);
        if (lastOrder) {
          if (needsPayMongoSync(lastOrder)) {
            const synced = await ayooCloud.syncPayMongoOrder(lastOrder.id);
            setLiveOrder(synced || lastOrder);
          } else {
            setLiveOrder(lastOrder);
          }
        }
      }
    } catch (err) {
      console.error("Tracking Sync Fault:", err);
    }
  };

  useEffect(() => {
    refresh();
    const unsubscribe = ayooCloud.subscribe(refresh);
    const timer = setInterval(refresh, 5000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [customerEmail]);

  useEffect(() => {
    if (liveOrder?.status === 'DELIVERED') {
      setShowFeedbackModal(true);
    }
  }, [liveOrder?.status]);

  const getStatusIndex = (status?: OrderStatus) => {
    if (!status) return 0;
    const map: Record<string, number> = {
      'PENDING': 0,
      'ACCEPTED': 1,
      'PREPARING': 1,
      'READY_FOR_PICKUP': 2,
      'OUT_FOR_DELIVERY': 2,
      'DELIVERED': 3,
      'CANCELLED': 0
    };
    return map[status] ?? 0;
  };

  const statusIdx = getStatusIndex(liveOrder?.status);
  const progressMap = [10, 45, 80, 100];
  const currentProgress = progressMap[statusIdx];

  return (
    <div className="bg-white min-h-screen flex flex-col pb-32 overflow-hidden font-sans">
      {/* 3. DYNAMIC HEADER WITH ETA - ENHANCED GRAB-LIKE */}
      <div className="bg-gradient-to-r from-[#FF1493] via-[#FF69B4] to-[#FF1493] p-8 pb-16 rounded-b-[60px] text-white shadow-2xl relative z-20">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">←</button>
          <div className="flex gap-3">
            {liveOrder && liveOrder.status && liveOrder.status !== 'DELIVERED' && liveOrder.status !== 'CANCELLED' && (
              <button onClick={async () => {
                if (liveOrder) {
                  await ayooCloud.updateOrderStatus(liveOrder.id, 'CANCELLED');
                  await db.updateOrderStatus(liveOrder.id, 'CANCELLED');
                  setLiveOrder({ ...liveOrder, status: 'CANCELLED' } as any);
                  showToast('Order cancelled');
                }
              }} className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-lg">❌</button>
            )}
            {liveOrder && liveOrder.status === 'DELIVERED' && onReorder && (
              <button
                onClick={() => {
                  const reorderItems = liveOrder.items
                    .map((i: any) => ({ id: i.id, quantity: i.quantity }))
                    .filter((i: any) => Boolean(i.id));
                  if (reorderItems.length > 0) onReorder(reorderItems);
                }}
                className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-lg"
              >
                ↻
              </button>
            )}
            <button onClick={async () => {
              if (currentUser && liveOrder) {
                const riderEmail = liveOrder.riderEmail || '';
                const riderName = liveOrder.riderName || 'Rider';

                if (riderEmail) {
                  // Create or get conversation with rider
                  const convo = await db.getOrCreateConversation(
                    currentUser.email,
                    currentUser.name,
                    (currentUser.role || 'CUSTOMER') as 'CUSTOMER' | 'MERCHANT' | 'RIDER',
                    riderEmail,
                    riderName,
                    'RIDER',
                    liveOrder.id,
                    liveOrder.status
                  );
                  if (onOpenMessages) {
                    onOpenMessages(convo.id);
                  }
                } else {
                  showToast('No rider assigned yet');
                }
              } else {
                showToast('Please log in to use messaging');
              }
            }} className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-lg">💬</button>
          </div>
        </div>

        <h2 className="text-4xl font-black uppercase tracking-tighter leading-none drop-shadow-lg">
          {statusIdx === 3 ? '🎉 Arrived!' : '📍 Live Tracking'}
        </h2>

        {/* ETA CARD - GRAB STYLE */}
        <div className="bg-white/20 backdrop-blur-xl p-6 mt-6 rounded-[30px] border border-white/20 flex justify-between items-center shadow-xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Estimated Arrival</p>
            <h3 className="text-3xl font-black mt-1">{calculateETA(liveOrder?.status)}</h3>
          </div>
          <div className="text-right">
            <div className="flex gap-1 justify-end mb-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full ${i <= statusIdx + 1 ? 'bg-white' : 'bg-white/30'}`}></div>
              ))}
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Ayoo Express</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 space-y-10 overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-2xl">
          {(['LIVE', 'SUMMARY', 'TIMELINE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'bg-white text-[#FF00CC] shadow' : 'text-gray-500'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 4. QUANTUM MAP VISUALS */}
        {activeTab === 'LIVE' && (
          <div className="relative h-64 bg-gray-50 rounded-[45px] border-2 border-gray-100 overflow-hidden shadow-inner">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#FF00CC 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>

            <div className="absolute top-1/2 left-10 right-10 h-1 bg-gray-200 rounded-full -translate-y-1/2">
              <div className="h-full ayoo-gradient rounded-full transition-all duration-1000" style={{ width: `${currentProgress}%` }}></div>
            </div>

            <div className="absolute top-1/2 left-10 -translate-y-1/2 flex flex-col items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow-md"></div>
              <span className="text-[7px] font-black uppercase text-gray-400 mt-2 tracking-widest">Shop</span>
            </div>

            <div className="absolute top-1/2 right-10 -translate-y-1/2 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-sm transition-all ${statusIdx === 3 ? 'bg-green-500 scale-110' : 'bg-gray-300'}`}>
                {statusIdx === 3 ? '🏠' : '📍'}
              </div>
              <span className="text-[7px] font-black uppercase text-gray-400 mt-2 tracking-widest">Home</span>
            </div>

            {/* Animated Rider */}
            {statusIdx < 3 && (
              <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 z-10" style={{ left: `calc(10px + (100% - 80px) * ${currentProgress / 100})` }}>
                <div className="w-14 h-14 bg-white rounded-2xl shadow-xl border-2 border-[#FF00CC] flex items-center justify-center text-2xl animate-bounce">🛵</div>
              </div>
            )}
          </div>
        )}

        {!liveOrder ? (
          <div className="py-20 text-center opacity-40">
            <div className="w-12 h-1 bg-[#FF00CC]/20 mx-auto mb-4 rounded-full animate-pulse"></div>
            <p className="font-black uppercase tracking-widest text-[9px]">Awaiting Dispatch Node...</p>
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            {activeTab === 'SUMMARY' && (
              <div className="bg-white border-2 border-gray-50 rounded-[45px] p-8 shadow-sm">
                <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-6">Payment and Delivery Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="font-bold text-gray-500">Order ID</span><span className="font-black">{liveOrder.id}</span></div>
                  <div className="flex justify-between text-sm"><span className="font-bold text-gray-500">Restaurant</span><span className="font-black">{liveOrder.restaurantName}</span></div>
                  <div className="flex justify-between text-sm"><span className="font-bold text-gray-500">Payment</span><span className="font-black">{liveOrder.paymentMethod || 'COD'}</span></div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-500">Payment State</span>
                    <span className={`font-black ${isOrderPaid(liveOrder) ? 'text-green-600' : liveOrder.status === 'CANCELLED' ? 'text-red-500' : 'text-amber-500'}`}>
                      {isOrderPaid(liveOrder) ? 'SETTLED' : liveOrder.status === 'CANCELLED' ? 'FAILED' : 'PENDING CONFIRMATION'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm"><span className="font-bold text-gray-500">Delivery Address</span><span className="font-black text-right max-w-[180px]">{liveOrder.deliveryAddress}</span></div>
                </div>
              </div>
            )}

            {activeTab === 'TIMELINE' && (
              <div className="bg-white border-2 border-gray-50 rounded-[45px] p-8 shadow-sm">
                <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-6">Status Timeline</h3>
                <div className="space-y-4">
                  {(['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] as OrderStatus[]).map((status, idx) => {
                    const done = getStatusIndex(liveOrder.status) >= getStatusIndex(status);
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${done ? 'bg-[#FF00CC] text-white' : 'bg-gray-100 text-gray-400'}`}>{idx + 1}</div>
                        <p className={`text-xs font-black uppercase tracking-widest ${done ? 'text-gray-900' : 'text-gray-400'}`}>{status.replaceAll('_', ' ')}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RIDER INFO */}
            <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 flex items-center gap-5">
              <div className="w-16 h-16 ayoo-gradient rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {liveOrder.riderName?.[0] || 'R'}
              </div>
              <div>
                <h4 className="font-black text-xl text-gray-900 leading-none">{liveOrder.riderName || 'Looking for Rider'}</h4>
                <p className="text-[10px] font-bold text-[#FF00CC] uppercase tracking-[0.2em] mt-2">Active Logistics Partner</p>
              </div>
            </div>

            {/* ORDER ITEMS */}
            {activeTab !== 'TIMELINE' && (
              <div className="bg-white border-2 border-gray-50 rounded-[45px] p-8 shadow-sm">
                <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-6">Manifest Summary</h3>
                {liveOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center mb-4 last:mb-0">
                    <span className="text-sm font-black text-gray-800">{it.quantity}x {it.name}</span>
                    <span className="text-xs font-bold text-gray-400">₱{it.price * it.quantity}</span>
                  </div>
                ))}
                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-black text-lg text-gray-900">Total</span>
                  <span className="text-2xl font-black text-[#FF00CC]">₱{liveOrder.total}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. FEEDBACK MODAL (END OF FLOW) */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-2xl flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[60px] p-12 animate-in slide-in-from-bottom-20 duration-500 shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-10"></div>
            <div className="text-center mb-10">
              <span className="text-6xl inline-block mb-6">🎉</span>
              <h3 className="text-4xl font-black uppercase tracking-tighter text-gray-900 leading-none">Delivered!</h3>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-4">Help us improve the Ayoo Fleet</p>
            </div>
            <div className="flex justify-center gap-4 mb-10">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} className={`text-4xl transition-all ${rating >= star ? 'scale-125' : 'grayscale opacity-20'}`}>⭐</button>
              ))}
            </div>
            <Button
              onClick={async () => {
                setIsSubmitting(true);
                await ayooCloud.submitFeedback(liveOrder!.id, rating, comment, tip);
                setIsSubmitting(false);
                onBack();
              }}
              disabled={isSubmitting || rating === 0}
              className="py-6 text-xl font-black uppercase tracking-widest rounded-3xl"
            >
              {isSubmitting ? 'Finalizing...' : 'Close Tracker'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
