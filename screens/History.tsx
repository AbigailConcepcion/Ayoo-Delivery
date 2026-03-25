
import React from 'react';
import { AppScreen, OrderRecord } from '../types';
import BottomNav from '../components/BottomNav';

interface HistoryProps {
  onBack: () => void;
  orders: OrderRecord[];
  onNavigate: (s: AppScreen) => void;
}

const History: React.FC<HistoryProps> = ({ onBack, orders, onNavigate }) => {
  const mockOrders: OrderRecord[] = [
    {
      id: 'AYO-10842',
      date: 'Mar 20, 2026',
      items: [
        { id: 'jb-1', name: 'Chickenjoy 2pc', quantity: 1, price: 189 },
        { id: 'tea-7', name: 'Brown Sugar Milk Tea', quantity: 2, price: 120 },
      ],
      total: 474,
      status: 'DELIVERED',
      restaurantName: 'Jollibee Iligan',
      customerEmail: 'demo@ayoo.app',
      customerName: 'Ayoo Demo',
      deliveryAddress: 'Tibanga, Iligan City',
      tipAmount: 35,
      paymentMethod: 'GCASH',
      isPaid: 1,
      rating: 5,
    },
    {
      id: 'AYO-10841',
      date: 'Mar 20, 2026',
      items: [
        { id: 'ph-2', name: 'Pepperoni Pizza', quantity: 1, price: 349 },
        { id: 'soda-4', name: 'Lemon Soda', quantity: 2, price: 55 },
      ],
      total: 504,
      status: 'OUT_FOR_DELIVERY',
      restaurantName: 'Pizza Haven',
      customerEmail: 'demo@ayoo.app',
      customerName: 'Ayoo Demo',
      deliveryAddress: 'Pala-o, Iligan City',
      paymentMethod: 'MAYA',
      isPaid: 1,
    },
    {
      id: 'AYO-10837',
      date: 'Mar 19, 2026',
      items: [
        { id: 'kr-3', name: 'Korean Wings Box', quantity: 1, price: 259 },
      ],
      total: 304,
      status: 'PREPARING',
      restaurantName: 'Seoul Cravings',
      customerEmail: 'demo@ayoo.app',
      customerName: 'Ayoo Demo',
      deliveryAddress: 'Del Carmen, Iligan City',
      paymentMethod: 'COD',
      isPaid: 0,
    },
  ];

  const displayOrders = orders.length > 0 ? orders : mockOrders;
  const statusTone = (status: OrderRecord['status']) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-50 text-green-600';
      case 'OUT_FOR_DELIVERY':
        return 'bg-blue-50 text-blue-600';
      case 'PREPARING':
        return 'bg-amber-50 text-amber-600';
      case 'CANCELLED':
        return 'bg-red-50 text-red-500';
      default:
        return 'bg-purple-50 text-[#6D28D9]';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F7F2FF] pb-24 overflow-y-auto scrollbar-hide">
      <div className="bg-[#6D28D9] p-10 rounded-b-[60px] shadow-xl text-white relative">
         <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Your Orders</h2>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">Live statuses and recent deliveries</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl flex flex-col items-center border border-white/20">
               <span className="text-[8px] font-black uppercase tracking-widest">Orders</span>
               <span className="text-xl font-black">{displayOrders.length}</span>
            </div>
         </div>
         <p className="text-[10px] font-bold opacity-70 tracking-widest uppercase mt-1">Synced to Ayoo Cloud Hub</p>
         
         <div className="absolute -bottom-1 left-0 right-0 h-4 bg-gray-50 rounded-t-full"></div>
      </div>

      <div className="px-8 pt-10 space-y-8 pb-28">
        {displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
             <div className="w-24 h-24 bg-purple-50 rounded-[40px] flex items-center justify-center text-5xl mb-6 grayscale opacity-40">🍽️</div>
             <p className="text-gray-400 font-black uppercase tracking-widest text-sm mb-6">You haven't ordered yet</p>
             <button 
                onClick={() => onNavigate('HOME')} 
                className="bg-[#6D28D9] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-purple-100"
             >
                Start Your Journey
             </button>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[26px] border border-white/70 bg-white/90 p-4 text-center shadow-sm">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Delivered</p>
              <p className="mt-2 text-2xl font-black text-green-600">{displayOrders.filter((order) => order.status === 'DELIVERED').length}</p>
            </div>
            <div className="rounded-[26px] border border-white/70 bg-white/90 p-4 text-center shadow-sm">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Active</p>
              <p className="mt-2 text-2xl font-black text-[#6D28D9]">{displayOrders.filter((order) => order.status !== 'DELIVERED' && order.status !== 'CANCELLED').length}</p>
            </div>
            <div className="rounded-[26px] border border-white/70 bg-white/90 p-4 text-center shadow-sm">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Spend</p>
              <p className="mt-2 text-2xl font-black text-[#4C1D95]">₱{displayOrders.reduce((sum, order) => sum + order.total, 0)}</p>
            </div>
          </div>
          {displayOrders.map(order => (
            <div key={order.id} className="bg-white p-8 rounded-[45px] shadow-sm border border-gray-100 group hover:border-[#6D28D9]/30 transition-all duration-300">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <p className="text-[9px] font-black text-[#6D28D9] uppercase tracking-widest mb-1">{order.id}</p>
                     <h3 className="font-black text-xl text-gray-900 leading-none">{order.restaurantName}</h3>
                     <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{order.date}</p>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${statusTone(order.status)}`}>
                        {order.status}
                     </span>
                     {order.rating && (
                        <div className="mt-2 flex gap-0.5">
                           {Array.from({length: 5}).map((_, i) => (
                              <span key={i} className={`text-[8px] ${i < (order.rating || 0) ? 'grayscale-0' : 'grayscale opacity-30'}`}>⭐</span>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
               
               <div className="bg-gray-50/50 p-6 rounded-[30px] space-y-3 mb-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] font-bold text-gray-600">
                       <span className="font-black">{item.quantity}x <span className="opacity-70">{item.name}</span></span>
                       <span className="text-gray-400">₱{item.price * item.quantity}</span>
                    </div>
                  ))}
               </div>

               <div className="mb-6 grid grid-cols-4 gap-2">
                 {(['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'] as const).map((status) => {
                   const reached = ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].indexOf(order.status) >= ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'].indexOf(status);
                   return (
                     <div key={status} className={`rounded-2xl px-2 py-3 text-center text-[8px] font-black uppercase tracking-widest ${reached ? 'bg-[#F4EDFF] text-[#6D28D9]' : 'bg-gray-50 text-gray-300'}`}>
                       {status.replaceAll('_', ' ')}
                     </div>
                   );
                 })}
               </div>

               <div className="pt-4 flex justify-between items-center border-t border-gray-50 mt-4">
                  <div className="flex items-center gap-4">
                     {order.tipAmount ? (
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-gray-400 uppercase">Tip Given</span>
                           <span className="text-[10px] font-black text-green-500">₱{order.tipAmount} 🛵</span>
                        </div>
                     ) : (
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                           <span className="text-[9px] font-black text-gray-400 uppercase">Secure Payment</span>
                        </div>
                     )}
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Paid</p>
                     <span className="font-black text-[#6D28D9] text-2xl tracking-tighter">₱{order.total + (order.tipAmount || 0)}</span>
                  </div>
               </div>
            </div>
          ))}
          </>
        )}
      </div>

      <BottomNav active="HISTORY" onNavigate={onNavigate} mode="customer" />
    </div>
  );
};

export default History;
