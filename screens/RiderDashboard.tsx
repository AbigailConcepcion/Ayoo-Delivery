
import React, { useState, useEffect, useCallback } from 'react';
import { ayooCloud } from '../api';
import { OrderRecord, UserAccount } from '../types';
import { db } from '../db';
import { GLOBAL_REGISTRY_KEY } from '../constants';
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
      
      const allUsers = JSON.parse(localStorage.getItem(GLOBAL_REGISTRY_KEY) || '[]');
      const me = allUsers.find((u: any) => u.email.toLowerCase() === session.email.toLowerCase());
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

  const handleAcceptTask = async (task: OrderRecord) => {
    if (!currentUser) return;
    await ayooCloud.updateOrderStatus(task.id, 'ACCEPTED', {
      riderName: currentUser.name,
      riderEmail: currentUser.email
    });
    setActiveTab('duty');
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
        <button onClick={() => setActiveTab('duty')} className={`flex-1 py-3.5 rounded-[18px] text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'duty' ? 'bg-[#FF00CC] text-white' : 'text-gray-500'}`}>Duty ({myDuty.length})</button>
        <button onClick={() => setActiveTab('market')} className={`flex-1 py-3.5 rounded-[18px] text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'market' ? 'bg-[#FF00CC] text-white' : 'text-gray-500'}`}>Market ({marketTasks.length})</button>
        <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-3.5 rounded-[18px] text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'wallet' ? 'bg-[#FF00CC] text-white' : 'text-gray-500'}`}>Wallet</button>
      </div>

      {activeTab === 'wallet' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-5">
           <div className="bg-[#1A1A1A] p-10 rounded-[50px] border border-green-500/30 shadow-2xl text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">My Total Earnings</p>
              <h3 className="text-5xl font-black tracking-tighter text-green-400 mb-6">₱{earnings.toFixed(2)}</h3>
              <button className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest">Cash Out Now</button>
           </div>
        </div>
      ) : activeTab === 'duty' ? (
        <div className="space-y-6">
           {myDuty.length === 0 ? (
             <div className="py-24 text-center">
                <p className="text-gray-600 font-black text-[10px] uppercase tracking-[0.3em] mb-4">No active assignments</p>
                <button onClick={() => setActiveTab('market')} className="text-[#FF00CC] font-black uppercase text-[8px] tracking-widest border border-[#FF00CC]/20 px-6 py-2 rounded-full">Check Market</button>
             </div>
           ) : (
             myDuty.map(task => (
               <div key={task.id} className="bg-[#1A1A1A] p-10 rounded-[50px] border-2 border-[#FF00CC]/30 shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                  <div className="mb-8">
                     <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-black text-[#FF00CC] uppercase tracking-widest border border-[#FF00CC]/30 px-2 py-0.5 rounded-lg">{task.status}</span>
                        <span className="text-[10px] font-black">₱{task.total}</span>
                     </div>
                     <h4 className="font-black text-2xl tracking-tighter leading-none mb-1">{task.restaurantName}</h4>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{task.deliveryAddress}</p>
                  </div>
                  {task.status === 'READY_FOR_PICKUP' && <Button onClick={() => handleUpdate(task.id, 'OUT_FOR_DELIVERY')} className="py-5 ayoo-gradient">I've Arrived at Merchant</Button>}
                  {task.status === 'OUT_FOR_DELIVERY' && <Button onClick={() => handleUpdate(task.id, 'DELIVERED')} className="py-5 bg-green-500">Confirm Drop-off</Button>}
               </div>
             ))
           )}
        </div>
      ) : (
        <div className="space-y-6">
           {marketTasks.length === 0 ? (
             <div className="py-24 text-center opacity-20 uppercase font-black text-[10px] tracking-widest">Market is currently dry.</div>
           ) : (
             marketTasks.map(task => (
               <div key={task.id} className="bg-[#161616] p-8 rounded-[40px] border border-white/5 flex flex-col gap-6">
                  <div className="flex justify-between">
                     <div>
                        <h4 className="font-black text-lg tracking-tight leading-none mb-1">{task.restaurantName}</h4>
                        <p className="text-[9px] font-bold text-gray-500 uppercase">{task.deliveryAddress}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-green-400 font-black text-xl">₱{(task.total * 0.1).toFixed(0)}</p>
                        <p className="text-[7px] text-gray-600 font-black uppercase">Est. Payout</p>
                     </div>
                  </div>
                  <button onClick={() => handleAcceptTask(task)} className="w-full py-4 bg-white text-black rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl">Accept Task</button>
               </div>
             ))
           )}
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;
