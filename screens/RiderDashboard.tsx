
import React, { useState, useEffect } from 'react';
import { ayooCloud } from '../api';
import { OrderRecord } from '../types';
import Button from '../components/Button';

const RiderDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<OrderRecord[]>([]);
  const [selectedTask, setSelectedTask] = useState<OrderRecord | null>(null);

  const refresh = () => {
    setTasks(ayooCloud.getAvailableRiderOrders());
  };

  useEffect(() => {
    refresh();
    return ayooCloud.subscribe(refresh);
  }, []);

  const handleUpdate = async (id: string, status: any) => {
    await ayooCloud.updateOrderStatus(id, status, { riderName: 'Rico (You)' });
    setSelectedTask(null);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-8 pb-32 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-[#FF00CC]">Rider Log</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Duty</p>
        </div>
        <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-3xl">🛵</div>
      </div>

      <div className="space-y-6">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-[50px] p-8 shadow-lg border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h4 className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Pick up</h4>
                  <p className="font-black text-xl leading-none">{task.restaurantName}</p>
               </div>
               <div className="text-right">
                  <h4 className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Drop off</h4>
                  <p className="font-black text-xs text-[#FF00CC]">{task.deliveryAddress}</p>
               </div>
            </div>
            <button 
              onClick={() => setSelectedTask(task)}
              className="w-full py-4 bg-gray-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-400 border border-gray-100 mb-4"
            >
              View Detailed Manifest →
            </button>
            <div className="flex gap-2">
              {task.status === 'READY_FOR_PICKUP' && <Button onClick={() => handleUpdate(task.id, 'OUT_FOR_DELIVERY')} className="py-4 text-xs font-black uppercase">Start Trip</Button>}
              {task.status === 'OUT_FOR_DELIVERY' && <Button onClick={() => handleUpdate(task.id, 'DELIVERED')} className="py-4 text-xs font-black uppercase bg-green-500">Delivered</Button>}
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-end">
           <div className="bg-white w-full rounded-t-[50px] p-10 animate-in slide-in-from-bottom-10">
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Order Manifest</h3>
              <p className="text-[10px] font-black text-[#FF00CC] uppercase tracking-widest mb-8">{selectedTask.id} • {selectedTask.customerName}</p>
              
              <div className="bg-gray-50 rounded-[35px] p-8 mb-8 space-y-4">
                 {selectedTask.items.map((item, i) => (
                   <div key={i} className="flex justify-between text-sm font-black text-gray-700">
                      <span>{item.quantity}x {item.name}</span>
                      <span>₱{item.price * item.quantity}</span>
                   </div>
                 ))}
                 <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 uppercase">Grand Total</span>
                    <span className="text-2xl font-black text-gray-900">₱{selectedTask.total}</span>
                 </div>
              </div>

              <div className="bg-pink-50 rounded-[24px] p-6 mb-10">
                 <p className="text-[10px] font-black text-[#FF00CC] uppercase mb-1">Special Instruction</p>
                 <p className="text-xs font-bold text-gray-600 italic">"Leave at the lobby guard. Please don't ring the doorbell."</p>
              </div>

              <Button onClick={() => setSelectedTask(null)} variant="outline">Close Details</Button>
           </div>
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;
