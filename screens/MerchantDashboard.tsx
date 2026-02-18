
import React, { useState, useEffect } from 'react';
import { ayooCloud } from '../api';
import { OrderRecord, WalletTransaction } from '../types';
import { db } from '../db';
import Button from '../components/Button';

interface MerchantDashboardProps {
  restaurantName: string;
}

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ restaurantName }) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'wallet'>('orders');
  const [earnings, setEarnings] = useState(0);
  const [ledger, setLedger] = useState<WalletTransaction[]>([]);

  const refresh = async () => {
    const fetched = ayooCloud.getMerchantOrders(restaurantName);
    setOrders(fetched);

    const allUsers = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
    const me = allUsers.find((u: any) => u.name === restaurantName);
    if (me) {
      setEarnings(me.earnings || 0);
      const entries = await db.getLedger(me.email);
      setLedger(entries);
    }
  };

  useEffect(() => {
    refresh();
    return ayooCloud.subscribe(refresh);
  }, [restaurantName]);

  const handleUpdateStatus = async (id: string, status: any) => {
    await ayooCloud.updateOrderStatus(id, status);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 pb-32 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-[#FF00CC]">Merchant Hub</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{restaurantName}</p>
        </div>
        <div className="w-14 h-14 bg-[#1A1A1A] border border-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-2xl">🏪</div>
      </div>

      <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-[24px]">
        {['orders', 'menu', 'wallet'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)} 
            className={`flex-1 py-3.5 rounded-[18px] text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#FF00CC] text-white' : 'text-gray-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-[#161616] rounded-[40px] p-8 border border-white/5 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-2xl tracking-tight leading-none mb-1">{order.customerName}</h3>
                  <p className="text-[10px] font-black text-[#FF00CC] uppercase tracking-widest">{order.id}</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-xl text-[8px] font-black uppercase">{order.status}</div>
              </div>
              {order.status === 'PENDING' && <Button onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}>Accept Order</Button>}
              {order.status === 'ACCEPTED' && <Button onClick={() => handleUpdateStatus(order.id, 'PREPARING')} className="bg-yellow-400 !text-black">Start Prep</Button>}
              {order.status === 'PREPARING' && <Button onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')} className="bg-green-500">Ready</Button>}
            </div>
          ))}
        </div>
      ) : activeTab === 'wallet' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-5">
           <div className="bg-[#1A1A1A] p-10 rounded-[50px] border border-[#FF00CC]/30 shadow-2xl text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Settled Earnings</p>
              <h3 className="text-5xl font-black tracking-tighter text-[#FF00CC] mb-6">₱{earnings.toFixed(2)}</h3>
              <button className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest">Withdraw Funds</button>
           </div>
           
           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Transaction Ledger</h4>
              {ledger.length === 0 ? (
                <p className="text-center py-10 opacity-20 text-xs">No transactions yet.</p>
              ) : (
                ledger.map(entry => (
                  <div key={entry.id} className="bg-[#161616] p-6 rounded-[30px] border border-white/5 flex justify-between items-center">
                     <div>
                        <p className="text-xs font-black tracking-tight">{entry.description}</p>
                        <p className="text-[8px] font-bold text-gray-500 uppercase">{new Date(entry.timestamp).toLocaleDateString()}</p>
                     </div>
                     <span className={`text-sm font-black ${entry.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`}>
                        {entry.type === 'CREDIT' ? '+' : '-'} ₱{entry.amount.toFixed(0)}
                     </span>
                  </div>
                ))
              )}
           </div>
        </div>
      ) : (
        <div className="text-center py-24 opacity-20 text-xs font-black uppercase">Menu Editor Locked</div>
      )}
    </div>
  );
};

export default MerchantDashboard;
