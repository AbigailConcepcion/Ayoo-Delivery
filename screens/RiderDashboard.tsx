
import React, { useState, useEffect, useCallback } from 'react';
import { ayooCloud } from '../api';
import { OrderRecord, UserAccount } from '../types';
import { db } from '../db';
import Button from '../components/Button';

const RiderDashboard: React.FC = () => {
  const [marketTasks, setMarketTasks] = useState<OrderRecord[]>([]);
  const [myDuty, setMyDuty] = useState<OrderRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [earnings, setEarnings] = useState(0);
  const [activeTab, setActiveTab] = useState<'market' | 'duty' | 'wallet'>('duty');

  const refresh = useCallback(async () => {
    const session = await db.getSession();
    if (session) {
      setCurrentUser(session);
      const zone = session.preferredCity || 'Iligan City';
      setMarketTasks(ayooCloud.getMarketOrders(zone));
      setMyDuty(ayooCloud.getMyRiderTasks(session.email));
      
      const allUsers = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
      const me = allUsers.find((u: any) => u.email === session.email);
      if (me) setEarnings(me.earnings || 0);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsub = ayooCloud.subscribe(refresh);
    return () => unsub();
  }, [refresh]);

  const handleUpdate = async (id: string, status: any) => {
    if (!currentUser) return;
    await ayooCloud.updateOrderStatus(id, status, { 
      riderName: currentUser.name, 
      riderEmail: currentUser.email 
    });
    refresh();
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-8 pb-32 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-[#FF00CC]">Rider Log</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Fleet Commander</p>
        </div>
        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-2xl">🛵</div>
      </div>

      <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-[24px] border border-white/5">
        <button onClick={() => setActiveTab('duty')} className={`flex-1 py-3.5 rounded-[18px] text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'duty' ? 'bg-[#FF00CC] text-white' : 'text-gray-500'}`}>Duty</button>
        <button onClick={() => setActiveTab('market')} className={`flex-1 py-3.5 rounded-[18px] text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'market' ? 'bg-[#FF00CC] text-white' : 'text-gray-500'}`}>Market</button>
        <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-3.5 rounded-[18px] text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'wallet' ? 'bg-[#FF00CC] text-white' : 'text-gray-500'}`}>Wallet</button>
      </div>

      {activeTab === 'wallet' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-5">
           <div className="bg-[#1A1A1A] p-10 rounded-[50px] border border-green-500/30 shadow-2xl text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">My Total Earnings</p>
              <h3 className="text-5xl font-black tracking-tighter text-green-400 mb-6">₱{earnings.toFixed(2)}</h3>
              <button className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest">Cash Out Now</button>
           </div>
           <div className="bg-[#161616] p-8 rounded-[35px] border border-white/5">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-4">Daily Breakdown</h4>
              <div className="flex justify-between items-center text-xs font-bold py-2 border-b border-white/5">
                 <span className="text-gray-400">Task Payouts</span>
                 <span>₱{(earnings * 0.7).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold py-2">
                 <span className="text-gray-400">Total Tips</span>
                 <span className="text-yellow-400">₱{(earnings * 0.3).toFixed(0)}</span>
              </div>
           </div>
        </div>
      ) : activeTab === 'duty' ? (
        <div className="space-y-6">
           {myDuty.length === 0 ? (
             <div className="py-24 text-center opacity-20 uppercase font-black text-xs">Clear skies, no orders.</div>
           ) : (
             myDuty.map(task => (
               <div key={task.id} className="bg-[#1A1A1A] p-10 rounded-[50px] border-2 border-[#FF00CC]/30 shadow-2xl relative overflow-hidden">
                  <div className="mb-8">
                     <p className="text-[9px] font-black text-[#FF00CC] uppercase tracking-widest mb-1">Status: {task.status}</p>
                     <h4 className="font-black text-2xl tracking-tighter leading-none mb-1">{task.restaurantName}</h4>
                     <p className="text-[10px] font-bold text-gray-500 uppercase">{task.deliveryAddress}</p>
                  </div>
                  {task.status === 'READY_FOR_PICKUP' && <Button onClick={() => handleUpdate(task.id, 'OUT_FOR_DELIVERY')} className="py-5 ayoo-gradient">I've Arrived</Button>}
                  {task.status === 'OUT_FOR_DELIVERY' && <Button onClick={() => handleUpdate(task.id, 'DELIVERED')} className="py-5 bg-green-500">Confirm Delivery</Button>}
               </div>
             ))
           )}
        </div>
      ) : (
        <div className="py-20 text-center opacity-20 uppercase font-black tracking-widest text-xs">Market View Placeholder</div>
      )}
    </div>
  );
};

export default RiderDashboard;
