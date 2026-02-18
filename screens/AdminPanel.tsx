
import React, { useState } from 'react';
import { Restaurant, FoodItem } from '../types';
import Button from '../components/Button';
import { db } from '../db';

interface AdminPanelProps {
  onBack: () => void;
  restaurants: Restaurant[];
  onUpdateRestaurants: (list: Restaurant[]) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, restaurants, onUpdateRestaurants }) => {
  const [editingRes, setEditingRes] = useState<Restaurant | null>(null);
  const [isAddingRes, setIsAddingRes] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

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

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-8 pb-32 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-[#FF00CC]">Owner HQ</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Master Control Panel</p>
        </div>
        <button onClick={onBack} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10">✕</button>
      </div>

      {!editingRes ? (
        <div className="space-y-6">
          <button 
            onClick={handleAddRestaurant}
            className="w-full p-8 bg-[#FF00CC] rounded-[35px] font-black uppercase tracking-widest text-sm shadow-xl shadow-pink-900/20 active:scale-95 transition-all"
          >
            Add Real Merchant +
          </button>

          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-500 mb-2">Existing Brands ({restaurants.length})</h3>
            {restaurants.map(res => (
              <div key={res.id} className="bg-[#1A1A1A] p-6 rounded-[35px] border border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <img src={res.image} className="w-14 h-14 rounded-2xl object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt={res.name} />
                  <div>
                    <h4 className="font-black text-lg tracking-tight leading-none">{res.name}</h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">{res.cuisine} • {res.items.length} Items</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingRes(res)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-[#FF00CC] transition-colors">✎</button>
                  <button onClick={() => handleDeleteRestaurant(res.id)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-red-500 transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in zoom-in-95 duration-300">
          <button onClick={() => setEditingRes(null)} className="text-[#FF00CC] font-black text-xs uppercase tracking-widest">← Back to Registry</button>
          
          <div className="bg-[#1A1A1A] p-10 rounded-[50px] border border-white/10 shadow-2xl">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Edit Brand</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Merchant Name</label>
                <input 
                  value={editingRes.name}
                  onChange={e => handleUpdateResField('name', e.target.value)}
                  className="w-full p-5 bg-black border border-white/10 rounded-2xl focus:border-[#FF00CC] outline-none font-black text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Cuisine Type</label>
                <input 
                  value={editingRes.cuisine}
                  onChange={e => handleUpdateResField('cuisine', e.target.value)}
                  className="w-full p-5 bg-black border border-white/10 rounded-2xl focus:border-[#FF00CC] outline-none font-black text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] p-10 rounded-[50px] border border-white/10 shadow-2xl">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 text-[#FF00CC]">Menu & Pricing</h3>
            
            <div className="bg-black p-6 rounded-[35px] border border-white/5 mb-8">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Add New Food Item</p>
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <input placeholder="Item Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-4 bg-[#111] rounded-xl border border-white/5 outline-none font-bold text-xs" />
                  <input placeholder="Price (₱)" type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-full p-4 bg-[#111] rounded-xl border border-white/5 outline-none font-bold text-xs" />
               </div>
               <button onClick={handleAddItem} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px]">Push to Menu +</button>
            </div>

            <div className="space-y-3">
              {editingRes.items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                   <div>
                      <h5 className="font-black text-sm">{item.name}</h5>
                      <p className="text-[10px] font-bold text-[#FF00CC]">₱{item.price}</p>
                   </div>
                   <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 font-black text-xs p-2 uppercase tracking-widest hover:opacity-50">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
