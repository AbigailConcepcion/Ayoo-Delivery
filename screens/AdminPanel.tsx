import React, { useState, useEffect, useRef } from 'react';
import { Restaurant, FoodItem, UserAccount, OrderRecord, AppScreen, LeaderboardEntry, LeaderboardPeriod, LeaderboardType } from '../types';
import { db } from '../db';
import { ayooCloud } from '../api';
import { GLOBAL_REGISTRY_KEY } from '../constants';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';

interface AdminPanelProps {
  onBack: () => void;
  onNavigate: (screen: AppScreen) => void;
  restaurants: Restaurant[];
  onUpdateRestaurants: (list: Restaurant[]) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, onNavigate, restaurants, onUpdateRestaurants }) => {
  const [editingRes, setEditingRes] = useState<Restaurant | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);
  const [liveOrders, setLiveOrders] = useState<OrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'merchants' | 'users' | 'dispatch' | 'system' | 'leaderboard'>('merchants');
  const [deliveryFee, setDeliveryFee] = useState(45);
  const [masterPin, setMasterPin] = useState('1234');

  // Leaderboard state
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('month');
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('customers');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Menu Editing State
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const merchantFileRef = useRef<HTMLInputElement>(null);

  const refreshData = async () => {
    const registry = await db.getRegistryUsers();
    setRegisteredUsers(registry);
    setLiveOrders(await db.getAllLiveOrders());
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

  // Load leaderboard data when period or type changes
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        let data: LeaderboardEntry[] = [];
        if ((db as any).ENV?.USE_REAL_BACKEND) {
          if (leaderboardType === 'customers') {
            data = await ayooCloud.getCustomerLeaderboard(leaderboardPeriod);
          } else if (leaderboardType === 'merchants') {
            data = await ayooCloud.getMerchantLeaderboard(leaderboardPeriod);
          } else {
            data = await ayooCloud.getRiderLeaderboard(leaderboardPeriod);
          }
        } else {
          if (leaderboardType === 'customers') {
            data = await db.getCustomerLeaderboard(leaderboardPeriod);
          } else if (leaderboardType === 'merchants') {
            data = await db.getMerchantLeaderboard(leaderboardPeriod);
          } else {
            data = await db.getRiderLeaderboard(leaderboardPeriod);
          }
        }
        setLeaderboardData(data);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    loadLeaderboard();
  }, [leaderboardPeriod, leaderboardType]);

  const handleForceAssign = async (orderId: string, riderEmail: string) => {
    if (!riderEmail) return;
    const rider = registeredUsers.find(u => u.email === riderEmail);
    if (!rider) return;
    if (window.confirm(`Force assign order ${orderId} to ${rider.name}?`)) {
      if ((db as any).ENV?.USE_REAL_BACKEND) {
        await db.updateOrderStatus(orderId, 'ACCEPTED', { riderEmail: rider.email, riderName: rider.name });
      } else {
        await ayooCloud.forceAssignOrder(orderId, rider.email, rider.name);
      }
      refreshData();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'MERCHANT' | 'ITEM') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'MERCHANT' && editingRes) {
          setEditingRes({ ...editingRes, image: base64 });
        } else if (target === 'ITEM' && editingItem) {
          setEditingItem({ ...editingItem, image: base64 });
        }
      };
      reader.readAsDataURL(file);
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
        <div className="flex flex-col">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-[#FF00CC]">Owner HQ</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Logistics Engine</p>
        </div>
        {/* explicit return button with arrow and label */}
        <button onClick={onBack} className="flex items-center gap-2 px-4 h-12 bg-white/5 rounded-2xl text-white border border-white/10 active:scale-90 transition-all">
          ← Back
        </button>
      </div>

      {!editingRes && (
        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-[24px] overflow-x-auto scrollbar-hide border border-white/5">
          {(['merchants', 'users', 'dispatch', 'leaderboard', 'system'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-4 rounded-[18px] text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#FF00CC] text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}>
              {tab}
            </button>
          ))}
        </div>
      )}

      {!editingRes ? (
        activeTab === 'merchants' ? (
          <div className="space-y-6">
            <button onClick={() => setEditingRes({ name: '', cuisine: '', image: '', items: [] } as any)} className="w-full p-8 bg-[#FF00CC] rounded-[35px] font-black uppercase tracking-widest text-sm active:scale-95 transition-all shadow-xl shadow-pink-900/10">Add Merchant +</button>
            {restaurants.map(res => (
              <div key={res.id} className="bg-[#1A1A1A] p-6 rounded-[35px] border border-white/5 flex items-center justify-between group hover:border-pink-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <img src={res.image} className="w-14 h-14 rounded-2xl object-cover border border-white/10" alt={res.name} />
                  <div>
                    <h4 className="font-black text-lg tracking-tight leading-none uppercase">{res.name}</h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">{res.items.length} items • {res.cuisine}</p>
                  </div>
                </div>
                <button onClick={() => setEditingRes(res)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-[#FF00CC] transition-all">✎</button>
              </div>
            ))}
          </div>
        ) : activeTab === 'dispatch' ? (
          <div className="space-y-6">
            <div className="bg-[#1A1A1A] p-10 rounded-[45px] border border-white/5 text-center mb-4 shadow-inner">
              <div className="w-16 h-1 bg-[#FF00CC]/20 rounded-full mx-auto mb-6"></div>
              <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest">Dispatch Heatmap</h4>
              <div className="flex justify-center gap-4 h-24 items-end">
                {[40, 70, 30, 90, 50, 80].map((h, i) => (
                  <div key={i} className="w-4 ayoo-gradient rounded-t-lg transition-all opacity-40" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
            {liveOrders.map(order => (
              <div key={order.id} className="bg-[#1A1A1A] p-8 rounded-[40px] border border-white/5 relative shadow-xl">
                <div className="flex justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-black text-lg truncate leading-none mb-1 uppercase tracking-tighter">{order.customerName}</h4>
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
                  <div className="w-12 h-12 bg-[#FF00CC]/10 rounded-2xl flex items-center justify-center font-black text-[#FF00CC] text-xs border border-pink-500/20">{u.name[0]}</div>
                  <div>
                    <h4 className="font-black text-sm tracking-tight uppercase leading-none">{u.name}</h4>
                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">{u.role} • {u.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'leaderboard' ? (
          <div className="space-y-6">
            {/* Leaderboard Type Selector */}
            <div className="flex gap-2 mb-6 bg-[#1A1A1A] p-2 rounded-2xl">
              {(['customers', 'merchants', 'riders'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setLeaderboardType(type)}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${leaderboardType === type ? 'bg-[#FF00CC] text-white' : 'text-gray-500 hover:text-gray-400'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 mb-6 bg-[#1A1A1A] p-2 rounded-2xl">
              {(['week', 'month', 'all'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setLeaderboardPeriod(period)}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${leaderboardPeriod === period ? 'bg-green-500 text-white' : 'text-gray-500 hover:text-gray-400'}`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Leaderboard Data */}
            {leaderboardLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-[#FF00CC] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : leaderboardData.length > 0 ? (
              <div className="space-y-3">
                {leaderboardData.slice(0, 20).map(entry => (
                  <div key={entry.userId} className="bg-[#1A1A1A] p-5 rounded-[30px] border border-white/5 flex items-center gap-4 hover:border-[#FF00CC]/30 transition-all">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${entry.rank === 1 ? 'bg-yellow-400 text-black' : entry.rank === 2 ? 'bg-gray-300 text-black' : entry.rank === 3 ? 'bg-orange-300 text-black' : 'bg-white/10 text-gray-500'}`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-sm uppercase tracking-tight">{entry.name}</h4>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">
                        {leaderboardType === 'customers' && `${entry.ordersCount} orders • ₱${(entry.totalSpent || 0).toFixed(0)} total`}
                        {leaderboardType === 'merchants' && `${entry.completedOrders} orders • ⭐ ${(entry.averageRating || 0).toFixed(1)} rating • ₱${(entry.earnings || 0).toFixed(0)} earned`}
                        {leaderboardType === 'riders' && `${entry.deliveriesCount} deliveries • ⭐ ${(entry.riderRating || 0).toFixed(1)} rating • ₱${(entry.earnings || 0).toFixed(0)} earned`}
                      </p>
                    </div>
                    {entry.rank <= 3 && (
                      <span className="text-2xl">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#1A1A1A] p-12 rounded-[40px] border border-white/5 text-center">
                <p className="text-5xl mb-4">📊</p>
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest">No data available</p>
                <p className="text-gray-600 text-[10px] mt-2">Start making orders to see rankings!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#1A1A1A] p-10 rounded-[45px] border border-white/5 space-y-8 shadow-2xl">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Base Delivery Fee (₱)</label>
              <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} className="w-full p-5 bg-black border border-white/10 rounded-3xl font-black text-xl text-[#FF00CC] outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Master Root PIN</label>
              <input type="text" maxLength={4} value={masterPin} onChange={e => setMasterPin(e.target.value)} className="w-full p-5 bg-black border border-white/10 rounded-3xl font-black text-xl text-green-400 tracking-[0.5em] text-center outline-none" />
            </div>
            <button onClick={saveSystemConfig} className="w-full py-5 ayoo-gradient rounded-3xl font-black uppercase tracking-widest text-[10px]">Sync Logistics</button>
          </div>
        )
      ) : (
        /* BRAND FORGE: MENU EDITOR */
        <div className="animate-in slide-in-from-right-10 duration-500 pb-20">
          <button onClick={() => setEditingRes(null)} className="text-[#FF00CC] font-black text-xs uppercase tracking-widest mb-10 flex items-center gap-2">
            ← Return to list
          </button>

          <div className="bg-[#1A1A1A] p-10 rounded-[50px] border border-white/10 space-y-8 mb-10 shadow-2xl">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-[#FF00CC] text-center">Merchant Brand Identity</h3>

            <div className="flex flex-col items-center">
              <div onClick={() => merchantFileRef.current?.click()} className="w-40 h-40 ayoo-gradient rounded-[40px] p-1 mb-2 relative cursor-pointer group shadow-xl">
                <img src={editingRes.image || 'https://via.placeholder.com/150'} className="w-full h-full rounded-[38px] object-cover border-2 border-white/10" alt="Brand Logo" />
                <div className="absolute inset-0 bg-black/50 rounded-[38px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                  <span className="text-3xl">📸</span>
                  <span className="text-[8px] font-black uppercase">Change Logo</span>
                </div>
              </div>
              <input ref={merchantFileRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'MERCHANT')} className="hidden" />
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">Primary Visual Node</p>
            </div>

            <div className="space-y-4">
              <input placeholder="Merchant Name" value={editingRes.name} onChange={e => setEditingRes({ ...editingRes, name: e.target.value })} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black outline-none focus:border-[#FF00CC] text-sm" />
              <input placeholder="Cuisine Category" value={editingRes.cuisine} onChange={e => setEditingRes({ ...editingRes, cuisine: e.target.value })} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black outline-none focus:border-[#FF00CC] text-sm" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-black uppercase tracking-tighter text-white">Menu Forge</h3>
              <button onClick={() => setEditingItem({ name: '', price: 0, description: '', category: 'All', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200' } as any)} className="bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white border border-white/5 hover:bg-[#FF00CC]">Add Item +</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {editingRes.items.map(item => (
                <div key={item.id} className="bg-[#1A1A1A] p-6 rounded-[35px] border border-white/5 flex items-center justify-between group hover:border-pink-500/20">
                  <div className="flex items-center gap-4">
                    <img src={item.image} className="w-12 h-12 rounded-xl object-cover border border-white/5" alt={item.name} />
                    <div>
                      <h4 className="font-black text-sm tracking-tight uppercase leading-none">{item.name}</h4>
                      <p className="text-[10px] text-[#FF00CC] font-black uppercase mt-1">₱{item.price}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingItem(item)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">✎</button>
                    <button onClick={() => setEditingRes({ ...editingRes, items: editingRes.items.filter(i => i.id !== item.id) })} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-all">✕</button>
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
            <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in zoom-in-95">
              <div className="bg-[#1A1A1A] w-full max-w-sm rounded-[50px] p-10 border border-white/10 shadow-2xl">
                <h3 className="text-xl font-black uppercase text-center mb-8 tracking-tighter">Item Blueprint</h3>

                <div className="flex flex-col items-center mb-8">
                  <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 ayoo-gradient rounded-[32px] p-1 relative cursor-pointer group shadow-xl">
                    <img src={editingItem.image} className="w-full h-full rounded-[30px] object-cover" alt="Item Preview" />
                    <div className="absolute inset-0 bg-black/50 rounded-[30px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                      <span className="text-2xl">📸</span>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'ITEM')} className="hidden" />
                  <p className="text-[8px] font-black uppercase text-gray-500 tracking-[0.2em] mt-2">Dish Image</p>
                </div>

                <div className="space-y-4">
                  <input placeholder="Dish Name" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black outline-none focus:border-pink-500 text-sm" />
                  <input placeholder="Price" type="number" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black outline-none focus:border-pink-500 text-sm" />
                  <input placeholder="Category (e.g. Burgers)" value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })} className="w-full p-5 bg-black border border-white/10 rounded-2xl font-black outline-none focus:border-pink-500 text-sm" />
                  <div className="flex flex-col gap-3 pt-4">
                    <Button onClick={handleSaveMenuItem} className="py-5 font-black uppercase tracking-widest text-[10px]">Save Blueprint</Button>
                    <button onClick={() => setEditingItem(null)} className="text-[10px] font-black text-gray-500 uppercase tracking-widest py-2">Abort</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <BottomNav active="ADMIN_PANEL" onNavigate={onNavigate} mode="operations" showAdmin />
    </div>
  );
};

export default AdminPanel;
