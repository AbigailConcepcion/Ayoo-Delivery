import React, { useState, useEffect, useCallback } from 'react';
import { ayooCloud, locationHub } from '../api';
import { OrderRecord, UserAccount, AppScreen } from '../types';
import { db } from '../db';
import { GLOBAL_REGISTRY_KEY } from '../constants';
import Button from '../components/Button';

interface RiderDashboardProps {
  onBack: () => void;
  onNavigate: (screen: AppScreen) => void;
  isOwner?: boolean;
}

const RiderDashboard: React.FC<RiderDashboardProps> = ({ onBack, onNavigate, isOwner = false }) => {
  const [marketTasks, setMarketTasks] = useState<OrderRecord[]>([]);
  const [myDuty, setMyDuty] = useState<OrderRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [earnings, setEarnings] = useState(0);
  const [activeTab, setActiveTab] = useState<'market' | 'duty' | 'wallet'>('duty');
  const [watchId, setWatchId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const session = await db.getSession();
    if (session) {
      setCurrentUser(session);
      const zone = session.preferredCity || 'Iligan City';
      if ((db as any).ENV?.USE_REAL_BACKEND) {
        setMarketTasks(await db.getMarketOrders(zone));
        setMyDuty(await db.getMyRiderTasks(session.email));
      } else {
        setMarketTasks(await ayooCloud.getMarketOrders(zone));
        setMyDuty(await ayooCloud.getMyRiderTasks(session.email));
      }

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

  // REALTIME GPS TRACKING
  useEffect(() => {
    const activeTask = myDuty.find(t => ['OUT_FOR_DELIVERY', 'ACCEPTED', 'PREPARING'].includes(t.status));
    
    if (activeTask && currentUser && 'geolocation' in navigator) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading } = pos.coords;
          locationHub.broadcastLocation(activeTask.id, {
            lat: latitude,
            lng: longitude,
            heading: heading || 0
          });
        },
        (err) => console.warn('GPS Error', err),
        { enableHighAccuracy: true, maximumAge: 2000 }
      );
      setWatchId(id);
    } else {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [myDuty, currentUser]);

  const handleUpdate = async (id: string, status: OrderRecord['status']) => {
    if (!currentUser) return;
    if ((db as any).ENV?.USE_REAL_BACKEND) {
      await db.updateOrderStatus(id, status, {
        riderName: currentUser.name,
        riderEmail: currentUser.email
      });
    } else {
      await ayooCloud.updateOrderStatus(id, status, {
        riderName: currentUser.name,
        riderEmail: currentUser.email
      });
    }
    refresh();
  };

  const handleAcceptTask = async (task: OrderRecord) => {
    if (!currentUser) return;
    if ((db as any).ENV?.USE_REAL_BACKEND) {
      await db.updateOrderStatus(task.id, 'ACCEPTED', {
        riderName: currentUser.name,
        riderEmail: currentUser.email
      });
    } else {
      await ayooCloud.updateOrderStatus(task.id, 'ACCEPTED', {
        riderName: currentUser.name,
        riderEmail: currentUser.email
      });
    }
    setActiveTab('duty');
    refresh();
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6 pb-32 overflow-y-auto scrollbar-hide">
      {/* HEADER - GRAB STYLE RIDER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Ayoo Rider</h2>
          <p className="text-xs font-medium text-gray-400 mt-1">Fleet Partner</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-4 py-2 bg-white/10 rounded-lg text-white/90 border border-white/5 active:scale-95 transition-all font-medium text-xs hover:bg-white/20">
            Back
          </button>
          <div className="w-14 h-14 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-purple-900/30">🛵</div>
        </div>
      </div>

      {/* TABS - GRAB STYLE */}
      <div className="flex gap-1 mb-8 bg-zinc-800 p-1 rounded-xl border border-white/5">
        <button onClick={() => setActiveTab('duty')} className={`flex-1 py-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'duty' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Duty ({myDuty.length})</button>
        <button onClick={() => setActiveTab('market')} className={`flex-1 py-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'market' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Market ({marketTasks.length})</button>
        <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'wallet' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Wallet</button>
      </div>

      {activeTab === 'wallet' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-5">
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center">
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Total Earnings</p>
            <h3 className="text-4xl font-bold tracking-tight text-white mb-6">₱{earnings.toFixed(2)}</h3>
            <button className="w-full py-4 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors">Cash Out Now</button>
          </div>
        </div>
      ) : activeTab === 'duty' ? (
        <div className="space-y-6">
          {myDuty.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-gray-500 font-medium text-sm mb-4">No active assignments</p>
              <button onClick={() => setActiveTab('market')} className="text-purple-400 font-semibold text-sm hover:text-purple-300 transition-colors">Check Market</button>
            </div>
          ) : (
            myDuty.map((task: OrderRecord) => (
              <div key={task.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-lg relative overflow-hidden animate-in slide-in-from-bottom-2">
                <div className="mb-8">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-1 rounded-md">{task.status.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-bold text-white">₱{task.total}</span>
                  </div>
                  <h4 className="font-bold text-xl tracking-tight text-white mb-1">{task.restaurantName}</h4>
                  <p className="text-xs font-medium text-gray-400">{task.deliveryAddress}</p>
                </div>
                {task.status === 'READY_FOR_PICKUP' && <Button onClick={() => handleUpdate(task.id, 'OUT_FOR_DELIVERY')} className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-sm">I've Arrived at Merchant</Button>}
                {task.status === 'OUT_FOR_DELIVERY' && <Button onClick={() => handleUpdate(task.id, 'DELIVERED')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-sm">Confirm Drop-off</Button>}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {marketTasks.length === 0 ? (
            <div className="py-24 text-center text-gray-500 text-sm font-medium">Market is currently empty.</div>
          ) : (
            marketTasks.map(task => (
              <div key={task.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex flex-col gap-4">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-bold text-lg text-white mb-1">{task.restaurantName}</h4>
                    <p className="text-xs text-gray-400">{task.deliveryAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold text-lg">₱{(task.total * 0.1).toFixed(0)}</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Payout</p>
                  </div>
                </div>
                <button onClick={() => handleAcceptTask(task)} className="w-full py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors">Accept Task</button>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default RiderDashboard;
