
import React, { useState, useEffect, useMemo } from 'react';
import Button from '../components/Button';
import { Restaurant, OrderRecord, OrderStatus } from '../types';
import { ayooCloud } from '../api';

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

  useEffect(() => {
    const refresh = async () => {
      const order = await ayooCloud.getLiveOrder(customerEmail);
      if (order) {
        setLiveOrder(order);
        if (order.status === 'DELIVERED') setShowFeedbackModal(true);
      }
    };
    refresh();
    return ayooCloud.subscribe(refresh);
  }, [customerEmail]);

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

  return (
    <div className="bg-white min-h-screen flex flex-col pb-32">
      <div className="bg-[#FF00CC] p-10 rounded-b-[60px] text-white">
        <button onClick={onBack} className="mb-6 opacity-70">← Dashboard</button>
        <h2 className="text-3xl font-black uppercase tracking-tighter">Track Order</h2>
        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{liveOrder?.id || 'Looking for order...'}</p>
      </div>

      <div className="p-8 flex-1">
        {!liveOrder ? (
          <div className="py-20 text-center opacity-30">
            <span className="text-6xl">🔍</span>
            <p className="font-black uppercase tracking-widest text-sm mt-4">Scanning Ayoo Cloud...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className={`flex items-start gap-8 transition-all ${idx > statusIdx ? 'opacity-20' : 'opacity-100'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-4 ${
                  idx === statusIdx ? 'bg-[#FF00CC] text-white border-pink-100 animate-pulse' : 
                  idx < statusIdx ? 'bg-green-500 text-white border-green-100' : 'bg-gray-100 text-gray-400 border-white'
                }`}>
                  {idx < statusIdx ? '✓' : step.icon}
                </div>
                <div className="pt-2">
                  <h4 className="font-black text-xl uppercase tracking-tighter leading-none mb-1">{step.label}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {idx === statusIdx ? 'Current Stage' : idx < statusIdx ? 'Completed' : 'Upcoming'}
                  </p>
                </div>
              </div>
            ))}

            <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 uppercase tracking-tight">Vibe Details</h3>
                  <span className="bg-[#FF00CC] text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest">Live</span>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <span>Merchant</span>
                    <span className="text-gray-900">{liveOrder.restaurantName}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <span>Rider</span>
                    <span className="text-[#FF00CC]">{liveOrder.riderName || 'Assigning...'}</span>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {showFeedbackModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-8">
           <div className="bg-white rounded-[50px] p-12 text-center shadow-2xl animate-in zoom-in-95">
              <span className="text-6xl mb-6 inline-block">🍔✨</span>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Delivered!</h3>
              <p className="text-gray-400 font-bold text-xs uppercase mb-8">Hope you enjoyed your Ayoo experience.</p>
              <Button onClick={() => onBack()} className="pill-shadow py-5 font-black uppercase tracking-widest">Back Home</Button>
           </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
