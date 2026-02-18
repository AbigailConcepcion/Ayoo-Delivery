
import React, { useState, useEffect, useRef } from 'react';
import Button from '../components/Button';
import { Restaurant, OrderRecord, OrderStatus, Address } from '../types';
import { ayooCloud } from '../api';
import { db } from '../db';

interface OrderTrackingProps {
  onBack: () => void;
  orderItems?: { id: string; quantity: number }[];
  restaurant?: Restaurant | null;
  deliveryCity: string;
  customerEmail: string;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ onBack, restaurant, deliveryCity, customerEmail }) => {
  const [liveOrder, setLiveOrder] = useState<OrderRecord | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReroute, setShowReroute] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'rider', text: string }[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = async () => {
      const order = await ayooCloud.getLiveOrder(customerEmail);
      if (order) setLiveOrder(order);
      const savedAddrs = await db.getAddresses(customerEmail);
      setAddresses(savedAddrs);
    };
    refresh();
    return ayooCloud.subscribe(refresh);
  }, [customerEmail]);

  useEffect(() => {
    if (liveOrder?.status === 'DELIVERED' && !showFeedbackModal) setShowFeedbackModal(true);
  }, [liveOrder?.status]);

  const getStatusIndex = (status?: OrderStatus) => {
    if (!status) return 0;
    const map: Record<string, number> = { 'PENDING': 0, 'ACCEPTED': 0, 'PREPARING': 1, 'READY_FOR_PICKUP': 1, 'OUT_FOR_DELIVERY': 2, 'DELIVERED': 3 };
    return map[status] ?? 0;
  };

  const statusIdx = getStatusIndex(liveOrder?.status);
  const canModify = statusIdx <= 1;

  // Map progress calculation (0 to 100)
  const progressMap = [10, 40, 75, 100];
  const currentProgress = progressMap[statusIdx];

  return (
    <div className="bg-white min-h-screen flex flex-col pb-32 overflow-hidden">
      <div className="bg-[#FF00CC] p-10 rounded-b-[60px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
          <button onClick={onBack} className="opacity-70 text-xl font-black">←</button>
          <div className="flex gap-2">
            <button onClick={() => setShowChat(true)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">💬</button>
          </div>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none relative z-10">Live Track</h2>
        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1 relative z-10">Order {liveOrder?.id || '---'}</p>
      </div>

      <div className="flex-1 p-8 space-y-10 overflow-y-auto scrollbar-hide">
        {/* QUANTUM MAP VISUAL */}
        <div className="relative h-64 bg-gray-50 rounded-[45px] border-2 border-gray-100 overflow-hidden group shadow-inner">
           {/* Grid Pattern */}
           <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#FF00CC 0.5px, transparent 0.5px)', backgroundSize: '20px 20px'}}></div>
           
           {/* Animated Path */}
           <div className="absolute top-1/2 left-10 right-10 h-1 bg-gray-200 rounded-full -translate-y-1/2">
              <div 
                className="h-full ayoo-gradient rounded-full transition-all duration-1000 ease-in-out" 
                style={{ width: `${currentProgress}%` }}
              ></div>
           </div>

           {/* Map Pins */}
           <div className="absolute top-1/2 left-10 -translate-y-1/2 flex flex-col items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow-md"></div>
              <span className="text-[7px] font-black uppercase text-gray-400 mt-2">Merchant</span>
           </div>
           
           <div className="absolute top-1/2 right-10 -translate-y-1/2 flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full border-4 border-white shadow-md flex items-center justify-center text-[10px] transition-all ${statusIdx === 3 ? 'bg-green-500' : 'bg-gray-300'}`}>
                 {statusIdx === 3 ? '🏠' : ''}
              </div>
              <span className="text-[7px] font-black uppercase text-gray-400 mt-2">Destination</span>
           </div>

           {/* Moving Rider */}
           <div 
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out z-10"
              style={{ left: `calc(10px + (100% - 80px) * ${currentProgress / 100})` }}
           >
              <div className="w-12 h-12 bg-white rounded-2xl shadow-xl border-2 border-[#FF00CC] flex items-center justify-center text-xl animate-bounce">
                 🛵
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                 <span className="text-[8px] font-black text-[#FF00CC] uppercase tracking-widest">{liveOrder?.status === 'OUT_FOR_DELIVERY' ? 'In Transit' : liveOrder?.status}</span>
              </div>
           </div>
        </div>

        {!liveOrder ? (
          <div className="py-10 text-center opacity-30 animate-pulse">
            <p className="font-black uppercase tracking-widest text-xs">Pinging Satellites...</p>
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 uppercase tracking-tight text-xs">Driver Details</h3>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-xl text-[8px] font-black uppercase animate-pulse">Verified Rider</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 ayoo-gradient rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                    {liveOrder.riderName?.[0] || '🛵'}
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-gray-900 leading-none">{liveOrder.riderName || 'Assigning...'}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Plate: AYO-778</p>
                  </div>
                  <button onClick={() => setShowChat(true)} className="ml-auto bg-white border border-gray-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-[#FF00CC] shadow-sm">Chat</button>
               </div>
            </div>

            <div className="space-y-3">
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4">Items</p>
               <div className="bg-white border-2 border-gray-50 rounded-[35px] p-6 space-y-4 shadow-sm">
                  {liveOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                       <span className="text-sm font-black text-gray-900">{it.quantity}x <span className="opacity-50">{it.name}</span></span>
                       <span className="text-xs font-bold text-gray-400">₱{it.price * it.quantity}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>

      {showChat && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-right-full duration-500">
           <div className="bg-[#FF00CC] p-8 flex items-center gap-4 text-white shadow-lg">
              <button onClick={() => setShowChat(false)} className="text-2xl font-black">✕</button>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl">🛵</div>
              <div>
                <h4 className="font-black uppercase tracking-widest text-xs leading-none">Rider Support</h4>
                <p className="text-[9px] opacity-70 mt-1">Live with {liveOrder?.riderName || 'Searching...'}</p>
              </div>
           </div>
           <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-gray-50">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-5 rounded-[28px] text-sm font-bold shadow-sm ${msg.role === 'user' ? 'bg-[#FF00CC] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                      {msg.text}
                   </div>
                </div>
              ))}
           </div>
           <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
              <input 
                type="text" 
                placeholder="Message rider..."
                className="flex-1 bg-gray-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none"
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
              />
              <button onClick={() => { if(chatMsg) { setChatHistory([...chatHistory, {role:'user', text:chatMsg}]); setChatMsg(''); } }} className="w-14 h-14 bg-[#FF00CC] text-white rounded-2xl flex items-center justify-center shadow-lg">🚀</button>
           </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-end justify-center">
           <div className="bg-white w-full max-w-md rounded-t-[50px] p-10 animate-in slide-in-from-bottom-10 shadow-2xl">
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
              <div className="text-center mb-10">
                <span className="text-6xl mb-4 inline-block">🍔✨</span>
                <h3 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Arrived!</h3>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">How was the experience?</p>
              </div>
              <div className="flex justify-center gap-4 mb-10">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)} className={`text-4xl transition-all ${rating >= star ? 'scale-110 grayscale-0' : 'grayscale opacity-20'}`}>⭐</button>
                ))}
              </div>
              <Button onClick={() => { setIsSubmitting(true); ayooCloud.submitFeedback(liveOrder!.id, rating, comment, tip).then(() => { setIsSubmitting(false); onBack(); }); }} disabled={isSubmitting || rating === 0} className="pill-shadow py-6 text-xl font-black uppercase tracking-widest">
                {isSubmitting ? 'Finalizing...' : 'Close Order'}
              </Button>
           </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
