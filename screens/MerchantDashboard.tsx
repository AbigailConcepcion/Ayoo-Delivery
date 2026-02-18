
import React, { useState, useEffect, useRef } from 'react';
import { ayooCloud, streamHub } from '../api';
import { OrderRecord, WalletTransaction, FoodItem, Restaurant } from '../types';
import { db } from '../db';
import Button from '../components/Button';

interface MerchantDashboardProps {
  restaurantName: string;
}

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ restaurantName }) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'wallet' | 'live'>('orders');
  const [earnings, setEarnings] = useState(0);
  const [myRes, setMyRes] = useState<Restaurant | null>(null);
  
  // LIVE STREAM STATES
  const [isLive, setIsLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refresh = async () => {
    const fetched = ayooCloud.getMerchantOrders(restaurantName);
    setOrders(fetched);
    const allRes = await db.getRestaurants();
    const res = allRes.find(r => r.name === restaurantName);
    if (res) setMyRes(res);
  };

  useEffect(() => {
    refresh();
    return ayooCloud.subscribe(refresh);
  }, [restaurantName]);

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
            const frame = canvasRef.current.toDataURL('image/webp', 0.5);
            streamHub.broadcastFrame(myRes?.id || 'unknown', frame);
          }
        }
      }, 150); // ~6-7 FPS for simulation

      return () => clearInterval(interval);
    } catch (err) {
      console.error(err);
      alert("Camera access required for Live Prep Cam.");
    }
  };

  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsLive(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 pb-32 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-[#FF00CC]">Kitchen Hub</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{restaurantName}</p>
        </div>
        <div className="flex items-center gap-3">
           {isLive && <div className="bg-red-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase animate-pulse">LIVE</div>}
           <div className="w-14 h-14 bg-[#1A1A1A] border border-white/10 rounded-2xl flex items-center justify-center text-2xl">🏪</div>
        </div>
      </div>

      <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-[24px]">
        {['orders', 'menu', 'wallet', 'live'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3.5 rounded-[18px] text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#FF00CC] text-white' : 'text-gray-500'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'live' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-5">
           <div className="bg-[#1A1A1A] p-10 rounded-[50px] border border-white/10 relative overflow-hidden">
              <div className="relative aspect-video bg-black rounded-3xl overflow-hidden mb-8 border border-white/5">
                 <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isLive ? 'opacity-100' : 'opacity-0'}`} />
                 <canvas ref={canvasRef} className="hidden" />
                 {!isLive && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Camera Node Idle</p>
                      <p className="text-xs font-bold text-gray-600">Start your Live Prep stream to increase customer trust by 40%.</p>
                   </div>
                 )}
              </div>
              <Button 
                onClick={isLive ? stopStreaming : startStreaming} 
                className={isLive ? 'bg-red-500' : 'ayoo-gradient'}
              >
                {isLive ? 'End Live Stream' : 'Go Live Now'}
              </Button>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#161616] p-6 rounded-[35px] border border-white/5">
                 <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Viewer Count</p>
                 <h4 className="text-xl font-black">{isLive ? Math.floor(Math.random() * 10) + 1 : 0}</h4>
              </div>
              <div className="bg-[#161616] p-6 rounded-[35px] border border-white/5">
                 <p className="text-[8px] font-black text-gray-500 uppercase mb-1">AI Hygiene</p>
                 <h4 className="text-xl font-black text-green-400">{isLive ? '99.8%' : '---'}</h4>
              </div>
           </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
           {orders.map(order => (
            <div key={order.id} className="bg-[#161616] rounded-[40px] p-8 border border-white/5">
              <div className="flex justify-between mb-4">
                <h3 className="font-black text-xl">{order.customerName}</h3>
                <span className="text-[9px] font-black text-[#FF00CC]">{order.status}</span>
              </div>
              <Button onClick={() => ayooCloud.updateOrderStatus(order.id, 'PREPARING')}>Update Status</Button>
            </div>
           ))}
        </div>
      ) : (
        <div className="py-20 text-center opacity-40">Section Under Construction</div>
      )}
    </div>
  );
};

export default MerchantDashboard;
