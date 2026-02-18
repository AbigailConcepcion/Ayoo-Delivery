
import React, { useState, useEffect, useRef } from 'react';
import { ayooCloud } from '../api';
import { OrderRecord, Restaurant, FoodItem } from '../types';
import { db } from '../db';
import Button from '../components/Button';

interface MerchantDashboardProps {
  restaurantName: string;
}

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ restaurantName }) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [myRes, setMyRes] = useState<Restaurant | null>(null);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Main Course' });
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const prevOrderCount = useRef(0);

  const refresh = async () => {
    const fetched = ayooCloud.getMerchantOrders(restaurantName);
    if (fetched.length > prevOrderCount.current && prevOrderCount.current !== 0) {
      setNewOrderAlert(true);
    }
    setOrders(fetched);
    prevOrderCount.current = fetched.length;

    const allRes = await db.getRestaurants();
    const found = allRes.find(r => r.name === restaurantName);
    if (found) setMyRes(found);
  };

  useEffect(() => {
    refresh();
    return ayooCloud.subscribe(refresh);
  }, [restaurantName]);

  const handleUpdateStatus = async (id: string, status: any) => {
    await ayooCloud.updateOrderStatus(id, status);
  };

  const addItemToMenu = async () => {
    if (!myRes || !newItem.name || !newItem.price) return;
    const items = [...myRes.items, {
      id: `ITEM-${Date.now()}`,
      name: newItem.name,
      price: Number(newItem.price),
      description: 'A delicious addition from the merchant!',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      category: newItem.category
    }];
    await db.updateMerchantMenu(myRes.id, items);
    setNewItem({ name: '', price: '', category: 'Main Course' });
    refresh();
  };

  const removeItemFromMenu = async (itemId: string) => {
    if (!myRes) return;
    const items = myRes.items.filter(i => i.id !== itemId);
    await db.updateMerchantMenu(myRes.id, items);
    refresh();
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

      <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-[24px]">
        <button onClick={() => setActiveTab('orders')} className={`flex-1 py-4 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-[#FF00CC] text-white shadow-lg' : 'text-gray-500'}`}>Orders</button>
        <button onClick={() => setActiveTab('menu')} className={`flex-1 py-4 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'menu' ? 'bg-[#FF00CC] text-white shadow-lg' : 'text-gray-500'}`}>Menu Lab</button>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-6 animate-in slide-in-from-left-5">
          {orders.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center opacity-20">
              <span className="text-4xl mb-4">📡</span>
              <p className="font-black uppercase tracking-widest text-xs text-gray-500">Listening for orders...</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-[#161616] rounded-[45px] p-8 border border-white/5 shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-2xl tracking-tight leading-none mb-2">{order.customerName}</h3>
                    <p className="text-[10px] font-black text-[#FF00CC] uppercase tracking-widest">{order.id}</p>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-xl text-[8px] font-black uppercase">{order.status}</div>
                </div>
                <div className="bg-black/40 p-6 rounded-[30px] mb-8 space-y-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs font-bold text-gray-300">
                      <span>{item.quantity}x {item.name}</span>
                      <span>₱{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                {order.status === 'PENDING' && <Button onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}>Accept Order</Button>}
                {order.status === 'ACCEPTED' && <Button onClick={() => handleUpdateStatus(order.id, 'PREPARING')} className="bg-yellow-400 !text-black">Kitchen Dispatch</Button>}
                {order.status === 'PREPARING' && <Button onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')} className="bg-green-500">Ready for Rider</Button>}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-5">
           <div className="bg-[#1A1A1A] p-8 rounded-[45px] border border-white/5">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Add New Creation</h3>
              <div className="space-y-4">
                 <input placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black" />
                 <input placeholder="Price (₱)" type="number" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black" />
                 <button onClick={addItemToMenu} className="w-full py-5 ayoo-gradient rounded-2xl font-black uppercase tracking-widest text-xs">Push to Menu</button>
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-500 px-4">Current Inventory ({myRes?.items.length})</h4>
              {myRes?.items.map(item => (
                <div key={item.id} className="bg-[#161616] p-6 rounded-[35px] flex justify-between items-center border border-white/5">
                   <div>
                      <h5 className="font-black text-sm">{item.name}</h5>
                      <p className="text-[10px] font-black text-[#FF00CC] mt-1">₱{item.price}</p>
                   </div>
                   <button onClick={() => removeItemFromMenu(item.id)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-red-500">✕</button>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;
