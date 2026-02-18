
import React, { useState, useEffect } from 'react';
import { Restaurant, FoodItem, UserAccount } from '../types';
import { db } from '../db';

interface AdminPanelProps {
  onBack: () => void;
  restaurants: Restaurant[];
  onUpdateRestaurants: (list: Restaurant[]) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, restaurants, onUpdateRestaurants }) => {
  const [editingRes, setEditingRes] = useState<Restaurant | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'merchants' | 'users' | 'system'>('merchants');
  const [deliveryFee, setDeliveryFee] = useState(45);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  useEffect(() => {
    const init = async () => {
      const registry = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
      setRegisteredUsers(registry);
      const config = await db.getSystemConfig();
      setDeliveryFee(config.deliveryFee);
    };
    init();
  }, []);

  const saveSystemConfig = async () => {
    await db.saveSystemConfig({ deliveryFee });
    alert('Global Ayoo Pricing Updated!');
  };

  const handleAddRestaurant = async () => {
    const newRes: Restaurant = {
      id: `RES-${Date.now()}`,
      name: 'New Restaurant',
      rating: 5.0,
      deliveryTime: '25-35 min',
      cuisine: 'Fast Food',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
      items: [],
      isPartner: true,
      address: 'Iligan City'
    };
    const updated = [...restaurants, newRes];
    await db.saveRestaurants(updated);
    onUpdateRestaurants(updated);
    setEditingRes(newRes);
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (!window.confirm('Delete this restaurant and all its items?')) return;
    const updated = restaurants.filter(r => r.id !== id);
    await db.saveRestaurants(updated);
    onUpdateRestaurants(updated);
  };

  const handleUpdateResField = async (field: keyof Restaurant, value: any) => {
    if (!editingRes) return;
    const updatedRes = { ...editingRes, [field]: value };
    setEditingRes(updatedRes);
    const updatedList = restaurants.map(r => r.id === editingRes.id ? updatedRes : r);
    await db.saveRestaurants(updatedList);
    onUpdateRestaurants(updatedList);
  };

  const handleAddItem = async () => {
    if (!editingRes || !newItemName || !newItemPrice) return;
    const newItem: FoodItem = {
      id: `ITEM-${Date.now()}`,
      name: newItemName,
      price: Number(newItemPrice),
      description: 'Newly added delicious item.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      category: 'Main Course'
    };
    const updatedItems = [...editingRes.items, newItem];
    const updatedRes = { ...editingRes, items: updatedItems };
    setEditingRes(updatedRes);
    const updatedList = restaurants.map(r => r.id === editingRes.id ? updatedRes : r);
    await db.saveRestaurants(updatedList);
    onUpdateRestaurants(updatedList);
    setNewItemName('');
    setNewItemPrice('');
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!editingRes) return;
    const updatedItems = editingRes.items.filter(i => i.id !== itemId);
    const updatedRes = { ...editingRes, items: updatedItems };
    setEditingRes(updatedRes);
    const updatedList = restaurants.map(r => r.id === editingRes.id ? updatedRes : r);
    await db.saveRestaurants(updatedList);
    onUpdateRestaurants(updatedList);
  };

  const deleteUser = (email: string) => {
    if (window.confirm(`Delete account for ${email}? This cannot be undone.`)) {
      const updated = registeredUsers.filter(u => u.email !== email);
      localStorage.setItem('ayoo_user_registry_v11', JSON.stringify(updated));
      setRegisteredUsers(updated);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-8 pb-32 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-[#FF00CC]">Owner HQ</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Master Control Panel</p>
        </div>
        <button onClick={onBack} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all">✕</button>
      </div>

      {!editingRes && (
        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-[24px]">
          {(['merchants', 'users', 'system'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 rounded-[18px] text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#FF00CC] text-white shadow-lg' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {!editingRes ? (
        activeTab === 'merchants' ? (
          <div className="space-y-6">
            <button onClick={handleAddRestaurant} className="w-full p-8 bg-[#FF00CC] rounded-[35px] font-black uppercase tracking-widest text-sm shadow-xl shadow-pink-900/20 active:scale-95 transition-all">Add Merchant +</button>
            <div className="grid grid-cols-1 gap-4">
              {restaurants.map(res => (
                <div key={res.id} className="bg-[#1A1A1A] p-6 rounded-[35px] border border-white/5 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <img src={res.image} className="w-12 h-12 rounded-xl object-cover" alt={res.name} />
                    <div>
                      <h4 className="font-black text-lg tracking-tight leading-none">{res.name}</h4>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">₱{res.items.length} items</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingRes(res)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-[#FF00CC] transition-colors">✎</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'users' ? (
          <div className="space-y-6">
            {registeredUsers.map(u => (
              <div key={u.email} className="bg-[#1A1A1A] p-6 rounded-[35px] border border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-4 min-w-0">
                  <img src={u.avatar || `https://i.pravatar.cc/150?u=${u.email}`} className="w-10 h-10 rounded-xl" />
                  <div className="min-w-0">
                    <h4 className="font-black text-md truncate">{u.name}</h4>
                    <p className="text-[9px] text-[#FF00CC] font-bold">{u.email}</p>
                  </div>
                </div>
                <button onClick={() => deleteUser(u.email)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-red-500 transition-colors shrink-0">✕</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8 animate-in zoom-in-95">
             <div className="bg-[#1A1A1A] p-10 rounded-[45px] border border-white/5">
                <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Global Logistics</h3>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Base Delivery Fee (₱)</label>
                      <input 
                        type="number" 
                        value={deliveryFee} 
                        onChange={e => setDeliveryFee(Number(e.target.value))}
                        className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black text-white" 
                      />
                   </div>
                   <button onClick={saveSystemConfig} className="w-full py-5 ayoo-gradient rounded-2xl font-black uppercase tracking-widest text-xs">Update Cloud Pricing</button>
                </div>
             </div>
          </div>
        )
      ) : (
        <div className="space-y-10 animate-in zoom-in-95 duration-300">
          <button onClick={() => setEditingRes(null)} className="text-[#FF00CC] font-black text-xs uppercase tracking-widest">← Back</button>
          <div className="bg-[#1A1A1A] p-10 rounded-[50px] border border-white/10 shadow-2xl">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Edit Brand</h3>
            <div className="space-y-6">
              <input value={editingRes.name} onChange={e => handleUpdateResField('name', e.target.value)} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black" />
              <input value={editingRes.cuisine} onChange={e => handleUpdateResField('cuisine', e.target.value)} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black" />
            </div>
          </div>

          <div className="bg-[#1A1A1A] p-10 rounded-[50px] border border-white/10">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 text-[#FF00CC]">Menu Controls</h3>
            <div className="bg-black p-6 rounded-[35px] border border-white/5 mb-8">
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <input placeholder="Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-4 bg-[#111] rounded-xl border border-white/5 font-bold text-xs" />
                  <input placeholder="Price" type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-full p-4 bg-[#111] rounded-xl border border-white/5 font-bold text-xs" />
               </div>
               <button onClick={handleAddItem} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px]">Add Item</button>
            </div>
            {editingRes.items.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5 mb-3">
                 <div>
                    <h5 className="font-black text-sm">{item.name}</h5>
                    <p className="text-[10px] font-bold text-[#FF00CC]">₱{item.price}</p>
                 </div>
                 <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 font-black text-xs">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
