
import React, { useState, useEffect } from 'react';
import { Restaurant, FoodItem, UserAccount, OrderRecord } from '../types';
import { db } from '../db';
import { ayooCloud } from '../api';
import Button from '../components/Button';

interface AdminPanelProps {
  onBack: () => void;
  restaurants: Restaurant[];
  onUpdateRestaurants: (list: Restaurant[]) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, restaurants, onUpdateRestaurants }) => {
  const [editingRes, setEditingRes] = useState<Restaurant | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);
  const [liveOrders, setLiveOrders] = useState<OrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'merchants' | 'users' | 'dispatch' | 'system'>('merchants');
  const [deliveryFee, setDeliveryFee] = useState(45);
  const [masterPin, setMasterPin] = useState('1234');
  
  // Menu Editing State
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  const refreshData = async () => {
    const registry = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
    setRegisteredUsers(registry);
    setLiveOrders(ayooCloud.getAllLiveOrders());
    const config = await db.getSystemConfig();
    setDeliveryFee(config.deliveryFee);
    setMasterPin(config.masterPin || '1234');
    const resList = await db.getRestaurants();
    onUpdateRestaurants(resList);
  };

  useEffect(() => {
    refreshData();
    return ayooCloud.subscribe(refreshData);
  }, []);

  const handleForceAssign = async (orderId: string, riderEmail: string) => {
    if (!riderEmail) return;
    const rider = registeredUsers.find(u => u.email === riderEmail);
    if (!rider) return;
    if (window.confirm(`Force assign order ${orderId} to ${rider.name}?`)) {
      await ayooCloud.forceAssignOrder(orderId, rider.email, rider.name);
      refreshData();
    }
  };

  const saveSystemConfig = async () => {
    await db.saveSystemConfig({ deliveryFee, masterPin });
    alert('Logistics Hub Synchronized.');
  };

  const handleSaveRes = async () => {
    if (!editingRes) return;
    let updatedList;
    if (restaurants.find(r => r.id === editingRes.id)) {
      updatedList = restaurants.map(r => r.id === editingRes.id ? editingRes : r);
    } else {
      updatedList = [...restaurants, { ...editingRes, id: Date.now().toString(), items: editingRes.items || [], rating: 5.0, deliveryTime: '20-30 min' }];
    }
    await db.saveRestaurants(updatedList);
    onUpdateRestaurants(updatedList);
    setEditingRes(null);
  };

  const handleSaveMenuItem = () => {
    if (!editingRes || !editingItem) return;
    let newItems;
    if (editingRes.items.find(i => i.id === editingItem.id)) {
      newItems = editingRes.items.map(i => i.id === editingItem.id ? editingItem : i);
    } else {
      newItems = [...editingRes.items, { ...editingItem, id: Date.now().toString() }];
    }
    setEditingRes({ ...editingRes, items: newItems });
    setEditingItem(null);
  };

  const riders = registeredUsers.filter(u => u.role === 'RIDER');

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-8 pb-32 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-[#FF00CC]">Owner HQ</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Logistics Engine</p>
        </div>
        <button onClick={onBack} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all">✕</button>
      </div>

      {!editingRes && (
        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-[24px] overflow-x-auto scrollbar-hide border border-white/5">
          {(['merchants', 'users', 'dispatch', 'system'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-4 rounded-[18px] text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#FF00CC] text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}>
              {tab}
            </button>
          ))}
        </div>
      )}

      {!editingRes ? (
        activeTab === 'merchants' ? (
          <div className="space-y-6">
            <button onClick={() => setEditingRes({ name: '', cuisine: '', image: '', items: [] } as any)} className="w-full p-8 bg-[#FF00CC] rounded-[35px] font-black uppercase tracking-widest text-sm active:scale-95 transition-all">Add Merchant +</button>
            {restaurants.map(res => (
              <div key={res.id} className="bg-[#1A1A1A] p-6 rounded-[35px] border border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <img src={res.image} className="w-12 h-12 rounded-xl object-cover" alt={res.name} />
                  <div>
                    <h4 className="font-black text-lg tracking-tight leading-none">{res.name}</h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">{res.items.length} items • {res.cuisine}</p>
                  </div>
                </div>
                <button onClick={() => setEditingRes(res)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-[#FF00CC] transition-all">✎</button>
              </div>
            ))}
          </div>
        ) : activeTab === 'dispatch' ? (
          <div className="space-y-6">
            {/* Visual Heatmap Placeholder */}
            <div className="bg-[#1A1A1A] p-10 rounded-[45px] border border-white/5 text-center mb-4">
               <div className="w-16 h-1 bg-[#FF00CC]/20 rounded-full mx-auto mb-6"></div>
               <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6">Dispatch Heatmap</h4>
               <div className="flex justify-center gap-4 h-24 items-end">
                  {[40, 70, 30, 90, 50, 80].map((h, i) => (
                    <div key={i} className="w-4 bg-[#FF00CC]/20 rounded-t-lg transition-all" style={{ height: `${h}%` }}></div>
                  ))}
               </div>
            </div>
            {liveOrders.map(order => (
              <div key={order.id} className="bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 relative">
                 <div className="flex justify-between mb-4">
                   <div className="flex-1">
                     <h4 className="font-black text-lg truncate leading-none mb-1">{order.customerName}</h4>
                     <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tight">{order.restaurantName} → {order.deliveryAddress}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[#FF00CC] font-black uppercase text-[9px] mb-1">{order.status}</p>
                     <p className="text-white font-black text-xl">₱{order.total}</p>
                   </div>
                 </div>
                 <div className="pt-6 border-t border-white/5">
                   <select 
                     onChange={(e) => handleForceAssign(order.id, e.target.value)}
                     value={order.riderEmail || ''}
                     className="w-full p-4 bg-black border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#FF00CC] outline-none"
                   >
                     <option value="">-- Send to Fleet Market --</option>
                     {riders.map(r => <option key={r.email} value={r.email}>{r.name.toUpperCase()}</option>)}
                   </select>
                 </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'users' ? (
          <div className="space-y-4">
            {registeredUsers.map(u => (
              <div key={u.email} className="bg-[#1A1A1A] p-6 rounded-[35px] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#FF00CC]/10 rounded-xl flex items-center justify-center font-black text-[#FF00CC] text-xs">{u.name[0]}</div>
                  <div>
                    <h4 className="font-black text-sm tracking-tight">{u.name}</h4>
                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{u.role} • {u.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1A1A1A] p-10 rounded-[45px] border border-white/5 space-y-8">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Base Delivery Fee (₱)</label>
                <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} className="w-full p-5 bg-black border border-white/10 rounded-3xl font-black text-xl text-[#FF00CC]" />
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Master Root PIN</label>
                <input type="text" maxLength={4} value={masterPin} onChange={e => setMasterPin(e.target.value)} className="w-full p-5 bg-black border border-white/10 rounded-3xl font-black text-xl text-green-400 tracking-[0.5em] text-center" />
             </div>
             <button onClick={saveSystemConfig} className="w-full py-5 ayoo-gradient rounded-3xl font-black uppercase tracking-widest text-[10px]">Sync Logistics</button>
          </div>
        )
      ) : (
        /* BRAND FORGE: MENU EDITOR */
        <div className="animate-in slide-in-from-right-10 duration-500 pb-20">
          <button onClick={() => setEditingRes(null)} className="text-[#FF00CC] font-black text-xs uppercase tracking-widest mb-10 flex items-center gap-2">← Discard Changes</button>
          
          <div className="bg-[#1A1A1A] p-10 rounded-[50px] border border-white/10 space-y-6 mb-10">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-[#FF00CC]">Merchant Identity</h3>
            <input placeholder="Merchant Name" value={editingRes.name} onChange={e => setEditingRes({...editingRes, name: e.target.value})} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black outline-none focus:border-[#FF00CC]" />
            <input placeholder="Cuisine Category" value={editingRes.cuisine} onChange={e => setEditingRes({...editingRes, cuisine: e.target.value})} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black outline-none focus:border-[#FF00CC]" />
            <input placeholder="Logo/Image URL" value={editingRes.image} onChange={e => setEditingRes({...editingRes, image: e.target.value})} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black outline-none focus:border-[#FF00CC]" />
          </div>

          <div className="space-y-6">
             <div className="flex justify-between items-center px-4">
                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Menu Forge</h3>
                <button onClick={() => setEditingItem({ name: '', price: 0, description: '', category: 'All', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200' } as any)} className="bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white border border-white/5 hover:bg-[#FF00CC]">Add Item +</button>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {editingRes.items.map(item => (
                   <div key={item.id} className="bg-[#1A1A1A] p-6 rounded-[35px] border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <img src={item.image} className="w-10 h-10 rounded-xl object-cover" alt={item.name} />
                         <div>
                            <h4 className="font-black text-sm tracking-tight">{item.name}</h4>
                            <p className="text-[10px] text-[#FF00CC] font-black">₱{item.price}</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => setEditingItem(item)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10">✎</button>
                         <button onClick={() => setEditingRes({ ...editingRes, items: editingRes.items.filter(i => i.id !== item.id) })} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20">✕</button>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="fixed bottom-10 left-8 right-8 z-[100]">
             <Button onClick={handleSaveRes} className="ayoo-gradient py-6 text-xl font-black uppercase tracking-widest shadow-2xl shadow-pink-900/40">Sync Merchant To Cloud</Button>
          </div>

          {/* Item Editor Overlay */}
          {editingItem && (
             <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8">
                <div className="bg-[#1A1A1A] w-full max-w-sm rounded-[50px] p-10 border border-white/10 shadow-2xl animate-in zoom-in-95">
                   <h3 className="text-xl font-black uppercase text-center mb-8">Item Blueprint</h3>
                   <div className="space-y-6">
                      <input placeholder="Dish Name" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black outline-none" />
                      <input placeholder="Price" type="number" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black outline-none" />
                      <input placeholder="Category (e.g. Burgers)" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black outline-none" />
                      <div className="flex flex-col gap-3 pt-4">
                         <Button onClick={handleSaveMenuItem} className="py-5 font-black uppercase">Save Blueprint</Button>
                         <button onClick={() => setEditingItem(null)} className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Abort</button>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
