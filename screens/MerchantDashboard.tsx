import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { ayooCloud, streamHub } from '../api';
import { OrderRecord, FoodItem, Restaurant, AppScreen } from '../types';
import { db } from '../db';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';

interface MerchantDashboardProps {
  restaurantName: string;
  onBack: () => void;
  onNavigate: (screen: AppScreen) => void;
  isOwner?: boolean;
}

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ restaurantName, onBack, onNavigate, isOwner = false }) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'wallet' | 'live'>('orders');
  const [myRes, setMyRes] = useState<Restaurant | null>(null);

  // MENU EDITING
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LIVE STREAM
  const [isLive, setIsLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refresh = async () => {
    let fetched: OrderRecord[] = [];
    if (db.constructor && (db as any).ENV && (db as any).ENV.USE_REAL_BACKEND) {
      fetched = await db.getMerchantOrders(restaurantName);
    } else {
      fetched = ayooCloud.getMerchantOrders(restaurantName);
    }
    setOrders(fetched);
    const allRes = await db.getRestaurants();
    const res = allRes.find(r => r.name === restaurantName);
    if (res) setMyRes(res);
  };

  useEffect(() => {
    refresh();
    return ayooCloud.subscribe(refresh);
  }, [restaurantName]);

  const handleSaveMenu = async (items: FoodItem[]) => {
    if (myRes) {
      await db.updateMerchantMenu(myRes.id, items);
      refresh();
    }
  };

  const handleUpdateItem = async () => {
    if (!myRes || !editingItem) return;
    const items = myRes.items.map(i => i.id === editingItem.id ? editingItem : i);
    await handleSaveMenu(items);
    setEditingItem(null);
  };

  const handleAddItem = async () => {
    if (!myRes) return;
    const newItem: FoodItem = {
      id: Date.now().toString(),
      name: 'New Item',
      price: 0,
      description: 'Describe this delicious dish...',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
      category: 'Main Course'
    };
    await handleSaveMenu([...myRes.items, newItem]);
    setEditingItem(newItem);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingItem) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingItem({ ...editingItem, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!myRes || !window.confirm("Remove item?")) return;
    await handleSaveMenu(myRes.items.filter(i => i.id !== id));
  };

  // LIVE STREAM LOGIC
  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsLive(true);
      const interval = setInterval(() => {
        if (canvasRef.current && videoRef.current && isLive) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);
            streamHub.broadcastFrame(myRes?.id || 'unknown', canvasRef.current.toDataURL('image/webp', 0.5));
          }
        }
      }, 150);
      return () => clearInterval(interval);
    } catch (err) { 
      alert("Camera required.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 pb-32 overflow-y-auto scrollbar-hide">
      {/* Modal for editing item */}
      {editingItem && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95">
          <div className="bg-[#1A1A1A] w-full max-w-sm rounded-[50px] p-8 border border-white/10 shadow-2xl space-y-5">
<h3 className="text-xl font-black uppercase text-primaryDark text-center">Edit Menu Item</h3>

            <div className="flex flex-col items-center">
              <div onClick={() => fileInputRef.current?.click()} className="w-36 h-36 bg-gradient-to-br from-primaryDark via-primary to-primaryLight rounded-[35px] p-1 relative cursor-pointer group mb-2 shadow-xl shadow-purple-500/25">
                <img src={editingItem.image} className="w-full h-full rounded-[32px] object-cover" alt="Item Preview" />
                <div className="absolute inset-0 bg-black/60 rounded-[32px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                  <span className="text-3xl mb-1">📸</span>
                  <span className="text-[8px] font-black uppercase">Change Photo</span>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <p className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Menu Item Photo</p>
            </div>

            <div className="space-y-3">
              <input 
                value={editingItem.name} 
                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} 
                className="w-full p-4 bg-black border border-white/10 rounded-2xl font-bold text-sm text-white" 
                placeholder="Item Name" 
              />
              <input 
                type="number" 
                value={editingItem.price} 
                onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })} 
                className="w-full p-4 bg-black border border-white/10 rounded-2xl font-bold text-sm text-white" 
                placeholder="Price (₱)" 
              />
              <textarea 
                value={editingItem.description} 
                onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} 
                className="w-full p-4 bg-black border border-white/10 rounded-2xl font-bold text-xs h-20 text-white" 
                placeholder="Description" 
              />
            </div>

            <Button onClick={handleUpdateItem} className="bg-gradient-to-r from-primaryDark via-primary to-primaryLight">
              Save Changes
            </Button>
            <button onClick={() => setEditingItem(null)} className="w-full py-3 text-xs font-bold uppercase text-gray-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
            <div className="flex justify-between items-center mb-8">
        <div>
        <h2 className="bg-gradient-to-br bg-clip-text text-transparent text-2xl font-black uppercase tracking-tighter" style={{backgroundImage: 'linear-gradient(135deg, var(--primaryDark), var(--primary), var(--primaryLight))'}}>
            Ayoo Merchant
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            {restaurantName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="px-5 h-12 bg-white/10 rounded-2xl text-white border border-white/10 active:scale-90 transition-all font-bold text-sm"
          >
            ← Back
          </button>
          <div className="w-14 h-14 bg-gradient-to-br from-primaryDark via-primary to-primaryLight rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-purple-500/30">
            🏪
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-white/10 p-1 rounded-[24px] border border-white/5">
{['orders', 'menu', 'wallet', 'live'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)} 
            className={`flex-1 py-3.5 rounded-[18px] text-[9px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-gradient-to-r from-primaryDark via-primary to-primaryLight text-white shadow-lg shadow-purple-500/25' 
                : 'text-gray-400 hover:text-gray-300'
            }`} 
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'menu' ? (
        <div className="space-y-6 animate-in slide-in-from-right-5">
          <Button 
            onClick={handleAddItem} 
            className="bg-white text-black py-5 font-black uppercase tracking-widest text-[10px]"
          >
            Add New Menu Item +
          </Button>
          <div className="grid grid-cols-1 gap-4">
            {myRes?.items.map((item: FoodItem, i: number) => (
              <div key={item.id} className="bg-[#161616] p-6 rounded-[35px] border border-white/5 flex items-center justify-center group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <img 
                    src={item.image} 
                    className="w-14 h-14 rounded-2xl object-cover border border-white/10" 
                    alt={item.name} 
                  />
                  <div>
                    <h4 className="font-black text-sm tracking-tight">{item.name}</h4>
                    <p className="text-[10px] text-primaryDark font-black uppercase">₱{item.price}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingItem(item)} 
                    className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-[#6D28D9] transition-all"
                  >
                    ✎
                  </button>
                  <button 
                    onClick={() => handleDeleteItem(item.id)} 
                    className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="py-24 text-center opacity-30 font-black uppercase text-xs tracking-widest">
              Awaiting fresh orders...
            </div>
          ) : (
              orders.map((order: OrderRecord, i: number) => (
              <div key={order.id} className="bg-[#161616] rounded-[40px] p-8 border border-white/5 animate-in slide-in-from-bottom-5">
                <div className="flex justify-between mb-4">
                  <h3 className="font-black text-xl leading-none uppercase tracking-tighter">
                    {order.customerName}
                  </h3>
                  <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${
                    order.status === 'DELIVERED' 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-[#6D28D9]/10 text-[#6D28D9]'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button 
                    onClick={async () => {
                      if ((db as any).ENV?.USE_REAL_BACKEND) {
                        await db.updateOrderStatus(order.id, 'PREPARING');
                      } else {
                        ayooCloud.updateOrderStatus(order.id, 'PREPARING');
                      }
                    }} 
                    className="flex-1 py-3 bg-white/5 text-[9px] font-black tracking-widest uppercase"
                  >
                    Prepare
                  </Button>
                  <Button 
                    onClick={async () => {
                      if ((db as any).ENV?.USE_REAL_BACKEND) {
                        await db.updateOrderStatus(order.id, 'READY_FOR_PICKUP');
                      } else {
                        ayooCloud.updateOrderStatus(order.id, 'READY_FOR_PICKUP');
                      }
                    }} 
                    className="flex-1 py-3 bg-[#6D28D9] text-[9px] font-black tracking-widest uppercase shadow-lg shadow-purple-900/20"
                  >
                    Ready
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'live' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-5">
          <div className="bg-[#1A1A1A] p-10 rounded-[50px] border border-white/10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-red-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-2">
                <div className={`w-1.5 h-1.5 bg-white rounded-full ${isLive ? 'animate-pulse' : 'opacity-20'}`}></div>
                Prep Cam
              </div>
            </div>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full aspect-video bg-black rounded-3xl mb-8 border border-white/5" 
            />
            <canvas ref={canvasRef} className="hidden" />
            <Button 
              onClick={startStreaming} 
              className={isLive ? 'bg-red-500 font-black' : 'ayoo-gradient font-black'}
            >
              {isLive ? 'Stop Broadcast' : 'Go Live Now'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center opacity-40 uppercase font-black text-xs tracking-[0.3em]">
          Vault Management Encrypted
        </div>
      )}

      <BottomNav active="MERCHANT_DASHBOARD" onNavigate={onNavigate} mode="operations" showAdmin={isOwner} />
    </div>
  );
};

export default MerchantDashboard;
