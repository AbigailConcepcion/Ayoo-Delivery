
import React, { useState, useEffect } from 'react';
import { ayooCloud } from '../api';
import { OrderRecord } from '../types';
import Button from '../components/Button';

const RiderDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<OrderRecord[]>([]);

  const refresh = () => {
    setTasks(ayooCloud.getAvailableRiderOrders());
  };

  useEffect(() => {
    refresh();
    return ayooCloud.subscribe(refresh);
  }, []);

  const handleUpdate = async (id: string, status: any) => {
    await ayooCloud.updateOrderStatus(id, status, { riderName: 'Rico (You)' });
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-8 pb-32">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-[#FF00CC]">Rider Log</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Duties</p>
        </div>
        <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-3xl">🛵</div>
      </div>

      <div className="space-y-6">
        {tasks.length === 0 ? (
          <div className="py-20 text-center opacity-20 flex flex-col items-center">
            <span className="text-7xl mb-4">🏜️</span>
            <p className="font-black uppercase tracking-widest text-sm">Roads are clear...</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white rounded-[50px] p-10 shadow-xl border border-gray-100 animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Pickup From</h4>
                  <h3 className="font-black text-2xl tracking-tight text-gray-900 leading-none">{task.restaurantName}</h3>
                </div>
                <div className="text-right">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Deliver To</h4>
                   <p className="font-black text-sm text-[#FF00CC] uppercase tracking-tighter truncate max-w-[100px]">{task.deliveryAddress}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl mb-8 border border-gray-100">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer</p>
                 <p className="font-black text-lg text-gray-900 uppercase leading-none">{task.customerName}</p>
              </div>

              <div className="w-full">
                {task.status === 'READY_FOR_PICKUP' && (
                  <Button onClick={() => handleUpdate(task.id, 'OUT_FOR_DELIVERY')} className="py-6 text-lg font-black uppercase tracking-widest pill-shadow">Accept & Pick Up</Button>
                )}
                {task.status === 'OUT_FOR_DELIVERY' && (
                  <Button onClick={() => handleUpdate(task.id, 'DELIVERED')} className="py-6 text-lg font-black uppercase tracking-widest bg-green-500 border-none">Finish Delivery</Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;
