
import React from 'react';
import { AppScreen, OrderRecord } from '../types';

interface HistoryProps {
  onBack: () => void;
  orders: OrderRecord[];
  onNavigate: (s: AppScreen) => void;
}

const History: React.FC<HistoryProps> = ({ onBack, orders, onNavigate }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-24 overflow-y-auto scrollbar-hide">
      <div className="bg-[#FF00CC] p-10 rounded-b-[60px] shadow-xl text-white relative">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Your Log</h2>
            <div className="bg-white/20 p-3 rounded-2xl flex flex-col items-center border border-white/20">
               <span className="text-[8px] font-black uppercase tracking-widest">Orders</span>
               <span className="text-xl font-black">{orders.length}</span>
            </div>
         </div>
         <p className="text-[10px] font-bold opacity-70 tracking-widest uppercase mt-1">Synced to Ayoo Cloud Hub</p>
         
         {/* Wave SVG Decor */}
         <div className="absolute -bottom-1 left-0 right-0 h-4 bg-gray-50 rounded-t-full"></div>
      </div>

      <div className="px-8 pt-10 space-y-8">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
             <div className="w-24 h-24 bg-pink-50 rounded-[40px] flex items-center justify-center text-5xl mb-6 grayscale opacity-40">🍽️</div>
             <p className="text-gray-400 font-black uppercase tracking-widest text-sm mb-6">You haven't ordered yet</p>
             <button 
                onClick={() => onNavigate('HOME')} 
                className="bg-[#FF00CC] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-pink-100"
             >
                Start Your Journey
             </button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white p-8 rounded-[45px] shadow-sm border border-gray-100 group hover:border-[#FF00CC]/30 transition-all duration-300">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <p className="text-[9px] font-black text-[#FF00CC] uppercase tracking-widest mb-1">{order.id}</p>
                     <h3 className="font-black text-xl text-gray-900 leading-none">{order.restaurantName}</h3>
                     <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{order.date}</p>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                       order.status === 'DELIVERED' ? 'bg-green-50 text-green-600' : 'bg-pink-50 text-[#FF00CC]'
                     }`}>
                        {order.status}
                     </span>
                     <span className="text-[8px] font-bold text-gray-300 mt-2 uppercase">Ref: AY-CLOUD-01</span>
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

               <div className="pt-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                     <span className="text-[9px] font-black text-gray-400 uppercase">Secure Payment</span>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Value</p>
                     <span className="font-black text-[#FF00CC] text-2xl tracking-tighter">₱{order.total}</span>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-8 py-5 flex justify-around items-center max-w-md mx-auto rounded-t-[45px] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] z-50">
        <button onClick={() => onNavigate('HOME')} className="flex flex-col items-center text-gray-300">
          <span className="text-2xl mb-1">🏠</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => onNavigate('VOUCHERS')} className="flex flex-col items-center text-gray-300">
          <span className="text-2xl mb-1">🎟️</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Voucher</span>
        </button>
        <button onClick={() => onNavigate('HISTORY')} className="flex flex-col items-center text-[#FF00CC]">
          <span className="text-2xl mb-1">📑</span>
          <span className="text-[10px] font-black uppercase tracking-widest">History</span>
        </button>
        <button onClick={() => onNavigate('PROFILE')} className="flex flex-col items-center text-gray-300">
          <span className="text-2xl mb-1">👤</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default History;
