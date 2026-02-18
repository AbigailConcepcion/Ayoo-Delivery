
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
  
  // Feedback states
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat states
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'rider', text: string }[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = async () => {
      const order = await ayooCloud.getLiveOrder(customerEmail);
      if (order) {
        setLiveOrder(order);
      }
      const savedAddrs = await db.getAddresses(customerEmail);
      setAddresses(savedAddrs);
    };
    refresh();
    return ayooCloud.subscribe(refresh);
  }, [customerEmail]);

  useEffect(() => {
    if (liveOrder?.status === 'DELIVERED' && !showFeedbackModal) {
      setShowFeedbackModal(true);
    }
  }, [liveOrder?.status]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleCancel = async () => {
    if (!liveOrder) return;
    if (window.confirm("Sure you want to drop this vibe? Cancellations are final.")) {
      await ayooCloud.cancelOrder(liveOrder.id);
      onBack();
    }
  };

  const handleReroute = async (addr: Address) => {
    if (!liveOrder) return;
    await ayooCloud.updateOrderAddress(liveOrder.id, `${addr.label}: ${addr.details}, ${addr.city}`);
    setShowReroute(false);
  };

  const sendChatMessage = () => {
    if (!chatMsg.trim()) return;
    const newHistory = [...chatHistory, { role: 'user' as const, text: chatMsg }];
    setChatHistory(newHistory);
    setChatMsg('');
    
    // Simulating Rider Reply
    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'rider' as const, text: "Copy that! I'm on it. 🛵💨" }]);
    }, 1500);
  };

  const timelineSteps = [
    { label: 'Confirmed', status: 'PENDING', icon: '📝' },
    { label: 'Kitchen', status: 'PREPARING', icon: '🍳' },
    { label: 'On the Way', status: 'OUT_FOR_DELIVERY', icon: '🛵' },
    { label: 'Delivered', status: 'DELIVERED', icon: '✅' }
  ];

  const getStatusIndex = (status?: OrderStatus) => {
    if (!status) return 0;
    const map: Record<string, number> = {
      'PENDING': 0, 'ACCEPTED': 0, 'PREPARING': 1, 'READY_FOR_PICKUP': 1, 'OUT_FOR_DELIVERY': 2, 'DELIVERED': 3
    };
    return map[status] ?? 0;
  };

  const statusIdx = getStatusIndex(liveOrder?.status);
  const canModify = statusIdx <= 1; // PENDING or PREPARING

  const handleFeedbackSubmit = async () => {
    if (!liveOrder) return;
    setIsSubmitting(true);
    await ayooCloud.submitFeedback(liveOrder.id, rating, comment, tip);
    setTimeout(() => {
      setIsSubmitting(false);
      onBack();
    }, 1000);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col pb-32 overflow-hidden">
      <div className="bg-[#FF00CC] p-10 rounded-b-[60px] text-white shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="opacity-70 text-xl font-black">←</button>
          <div className="flex gap-2">
            <button onClick={() => setShowChat(true)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">💬</button>
          </div>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Vibe Check</h2>
        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">ID: {liveOrder?.id || 'SYNCHING...'}</p>
      </div>

      <div className="p-8 flex-1 overflow-y-auto scrollbar-hide">
        {!liveOrder ? (
          <div className="py-20 text-center opacity-30">
            <span className="text-6xl animate-pulse">🛰️</span>
            <p className="font-black uppercase tracking-widest text-sm mt-4">Connecting to Ayoo Satellites...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className={`flex items-start gap-8 transition-all duration-700 ${idx > statusIdx ? 'opacity-20 scale-95' : 'opacity-100 scale-100'}`}>
                <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center text-2xl shadow-lg border-4 ${
                  idx === statusIdx ? 'bg-[#FF00CC] text-white border-pink-100 animate-pulse' : 
                  idx < statusIdx ? 'bg-green-500 text-white border-green-100' : 'bg-gray-100 text-gray-400 border-white'
                }`}>
                  {idx < statusIdx ? '✓' : step.icon}
                </div>
                <div className="pt-1">
                  <h4 className="font-black text-xl uppercase tracking-tighter leading-none mb-1">{step.label}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {idx === statusIdx ? 'Ongoing' : idx < statusIdx ? 'Finalized' : 'Upcoming'}
                  </p>
                </div>
              </div>
            ))}

            <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 shadow-inner">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Logistics Dashboard</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    <span className="bg-[#FF00CC] text-white px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest">Cloud Live</span>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <span>Merchant</span>
                    <span className="text-gray-900">{liveOrder.restaurantName}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <span>Rider</span>
                    <span className="text-[#FF00CC]">{liveOrder.riderName || 'Searching...'}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Destination</p>
                    <p className="text-[11px] font-bold text-gray-600 truncate">{liveOrder.deliveryAddress}</p>
                  </div>
               </div>
            </div>

            {canModify && (
              <div className="grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => setShowReroute(true)}
                  className="bg-white border-2 border-gray-100 p-6 rounded-[30px] flex flex-col items-center gap-2 active:scale-95 transition-all"
                 >
                    <span className="text-2xl">📍</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Reroute</span>
                 </button>
                 <button 
                  onClick={handleCancel}
                  className="bg-red-50 border-2 border-red-100 p-6 rounded-[30px] flex flex-col items-center gap-2 active:scale-95 transition-all"
                 >
                    <span className="text-2xl">🛑</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Cancel</span>
                 </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reroute Modal */}
      {showReroute && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-end">
           <div className="bg-white w-full rounded-t-[50px] p-10 animate-in slide-in-from-bottom-10 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 text-center">Reroute Delivery</h3>
              <div className="space-y-4">
                 {addresses.map(a => (
                   <button 
                    key={a.id} 
                    onClick={() => handleReroute(a)}
                    className="w-full p-6 bg-gray-50 rounded-[30px] text-left flex justify-between items-center border-2 border-transparent hover:border-[#FF00CC] transition-all"
                   >
                     <div>
                        <p className="font-black uppercase tracking-widest text-xs text-gray-900">{a.label}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{a.details}</p>
                     </div>
                     <span>→</span>
                   </button>
                 ))}
              </div>
              <button onClick={() => setShowReroute(false)} className="w-full py-6 mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nevermind</button>
           </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-right-full duration-500">
           <div className="bg-[#FF00CC] p-8 flex items-center gap-4 text-white shadow-lg">
              <button onClick={() => setShowChat(false)} className="text-2xl font-black">✕</button>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl">🛵</div>
              <div>
                <h4 className="font-black uppercase tracking-widest text-xs leading-none">Rider Support</h4>
                <p className="text-[9px] opacity-70 mt-1">Chatting with {liveOrder?.riderName || 'Searching...'}</p>
              </div>
           </div>
           <div ref={chatScrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 bg-gray-50">
              {chatHistory.length === 0 && (
                <div className="text-center py-20 opacity-20">
                   <p className="font-black uppercase tracking-widest text-[10px]">No messages yet</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                   <div className={`max-w-[80%] p-5 rounded-[28px] text-sm font-bold shadow-sm ${
                     msg.role === 'user' ? 'bg-[#FF00CC] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                   }`}>
                      {msg.text}
                   </div>
                </div>
              ))}
           </div>
           <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
              <input 
                type="text" 
                placeholder="Message rider..."
                className="flex-1 bg-gray-100 rounded-2xl px-6 py-4 font-bold text-sm focus:outline-none"
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
              />
              <button 
                onClick={sendChatMessage}
                className="w-14 h-14 bg-[#FF00CC] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
              >
                🚀
              </button>
           </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-end justify-center">
           <div className="bg-white w-full max-w-md rounded-t-[50px] p-10 animate-in slide-in-from-bottom-10 shadow-2xl">
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
              <div className="text-center mb-10">
                <span className="text-6xl mb-4 inline-block">🍔✨</span>
                <h3 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Ayoo! It's Here.</h3>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Rate the experience</p>
              </div>
              <div className="flex justify-center gap-4 mb-10">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)} className={`text-4xl transition-all ${rating >= star ? 'scale-110 grayscale-0' : 'grayscale opacity-20'}`}>⭐</button>
                ))}
              </div>
              <Button onClick={handleFeedbackSubmit} disabled={isSubmitting || rating === 0} className="pill-shadow py-6 text-xl font-black uppercase tracking-widest">
                {isSubmitting ? 'Finalizing...' : 'Close Order'}
              </Button>
           </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
