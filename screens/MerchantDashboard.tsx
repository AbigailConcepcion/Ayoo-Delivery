
import React, { useState, useEffect, useRef } from 'react';
import { ayooCloud } from '../api';
import { OrderRecord } from '../types';
import Button from '../components/Button';

interface MerchantDashboardProps {
  restaurantName: string;
}

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ restaurantName }) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const prevOrderCount = useRef(0);

  const refresh = () => {
    const fetched = ayooCloud.getMerchantOrders(restaurantName);
    if (fetched.length > prevOrderCount.current && prevOrderCount.current !== 0) {
      setNewOrderAlert(true);
      // In a real app, you'd play a sound here: new Audio('/notification.mp3').play();
    }
    setOrders(fetched);
    prevOrderCount.current = fetched.length;
  };

  useEffect(() => {
    refresh();
    return ayooCloud.subscribe(refresh);
  }, [restaurantName]);

  const handleUpdateStatus = async (id: string, status: any) => {
    await ayooCloud.updateOrderStatus(id, status);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 pb-32">
      <div className="flex justify-between items-center mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cloud Connected</p>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-[#FF00CC]">Merchant Hub</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{restaurantName}</p>
        </div>
        <div className="w-14 h-14 bg-[#1A1A1A] border border-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-2xl">🏪</div>
      </div>

      {newOrderAlert && (
        <div className="mb-8 p-6 bg-[#FF00CC] rounded-[30px] shadow-[0_0_40px_rgba(255,0,204,0.4)] animate-bounce flex justify-between items-center">
           <div className="flex items-center gap-4">
              <span className="text-3xl">🛎️</span>
              <p className="font-black uppercase tracking-tighter text-sm">New Incoming Order!</p>
           </div>
           <button onClick={() => setNewOrderAlert(false)} className="bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black">Dismiss</button>
        </div>
      )}

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
               <span className="text-4xl opacity-20">📡</span>
            </div>
            <p className="font-black uppercase tracking-widest text-xs text-gray-500">Listening for orders...</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-[#161616] rounded-[45px] p-8 border border-white/5 shadow-2xl animate-in slide-in-from-right-10 transition-all hover:border-white/10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-2xl tracking-tight leading-none mb-2">{order.customerName}</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-[#FF00CC] uppercase tracking-widest">{order.id}</span>
                     <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{order.date}</span>
                  </div>
                </div>
                <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                  order.status === 'PENDING' ? 'bg-pink-500 text-white' : 'bg-white/10 text-gray-400'
                }`}>
                  {order.status}
                </div>
              </div>

              <div className="bg-black/40 p-6 rounded-[30px] mb-8 space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="font-black text-white/90">{item.quantity}x {item.name}</span>
                    <span className="font-bold text-gray-500">₱{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                   <span className="text-[10px] font-black text-gray-500 uppercase">Total Value</span>
                   <span className="text-lg font-black text-[#FF00CC]">₱{order.total}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {order.status === 'PENDING' && (
                  <Button onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')} className="py-5 text-sm font-black uppercase tracking-widest shadow-pink-900/50">Accept Order</Button>
                )}
                {order.status === 'ACCEPTED' && (
                  <Button onClick={() => handleUpdateStatus(order.id, 'PREPARING')} className="py-5 text-sm font-black uppercase tracking-widest bg-yellow-400 !text-black border-none">Move to Kitchen</Button>
                )}
                {order.status === 'PREPARING' && (
                  <Button onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')} className="py-5 text-sm font-black uppercase tracking-widest bg-green-500 border-none">Ready for Pickup</Button>
                )}
                {order.status === 'READY_FOR_PICKUP' && (
                  <div className="flex items-center justify-center p-5 bg-white/5 rounded-[30px] border border-dashed border-white/10">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] animate-pulse">Waiting for Rider Dispatch...</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MerchantDashboard;
