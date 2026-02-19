
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Restaurant, FoodItem, Review, OrderRecord } from '../types';
import Button from '../components/Button';
import { streamHub, ayooCloud } from '../api';
import { GoogleGenAI, Modality } from '@google/genai';

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
  onAddToCart: (itemId: string) => void;
  onOpenCart: () => void;
  cartCount: number;
}

const RestaurantDetail: React.FC<RestaurantDetailProps> = ({ restaurant, onBack, onAddToCart, onOpenCart, cartCount }) => {
  const [activeTab, setActiveTab] = useState<'Menu' | 'Reviews'>('Menu');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const [showLiveCam, setShowLiveCam] = useState(false);
  const [liveFrame, setLiveFrame] = useState<string | null>(null);
  const [isIntercomActive, setIsIntercomActive] = useState(false);
  const [intercomStatus, setIntercomStatus] = useState<string>('Ready');
  
  const [localReviews] = useState<Review[]>(restaurant.reviews || []);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (showLiveCam) {
      const unsub = streamHub.onFrame((frame) => setLiveFrame(frame));
      return () => { unsub(); stopIntercom(); };
    }
  }, [showLiveCam]);

  const handleAdd = (item: FoodItem) => {
    onAddToCart(item.id);
    setToastMessage(`Added ${item.name} to cart`);
    setShowToast(true);
  };

  // MANUAL AUDIO HELPERS PER GUIDELINES
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startIntercom = async () => {
    if (isIntercomActive) return;
    
    try {
      setIntercomStatus('Syncing...');
      setIsIntercomActive(true);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: `You are the Chef at ${restaurant.name}. Be friendly, busy, and chef-like.`
        },
        callbacks: {
          onopen: () => setIntercomStatus('LIVE'),
          onmessage: async (msg) => {
            const audioB64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioB64 && audioContextRef.current) {
              const buffer = await decodeAudioData(decode(audioB64), audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              source.start();
            }
          },
          onerror: (e) => { console.error(e); stopIntercom(); },
          onclose: () => stopIntercom()
        }
      });
      
      const session = await sessionPromise;
      sessionRef.current = session;
      
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const micCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const micSource = micCtx.createMediaStreamSource(micStream);
      const processor = micCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        sessionPromise.then((s) => {
          s.sendRealtimeInput({ media: createBlob(inputData) });
        });
      };
      
      micSource.connect(processor);
      processor.connect(micCtx.destination);

    } catch (err) {
      console.error(err);
      stopIntercom();
    }
  };

  const stopIntercom = () => {
    if (sessionRef.current) sessionRef.current.close();
    setIsIntercomActive(false);
    setIntercomStatus('Offline');
  };

  const displayEntries = Object.entries(activeCategory === 'All' ? 
    (restaurant.items.reduce((acc, curr) => {
      if(!acc[curr.category]) acc[curr.category] = [];
      acc[curr.category].push(curr);
      return acc;
    }, {} as Record<string, FoodItem[]>)) : 
    { [activeCategory]: restaurant.items.filter(i => i.category === activeCategory) }
  ) as [string, FoodItem[]][];

  return (
    <div className="bg-white min-h-screen pb-32 overflow-y-auto scrollbar-hide">
      
      {showLiveCam && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-[50px] relative overflow-hidden shadow-2xl border-4 border-white/5">
              {liveFrame ? (
                <img src={liveFrame} className="w-full h-full object-cover" alt="Live Feed" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-black">
                   <div className="w-16 h-16 ayoo-gradient rounded-full animate-spin mb-6 opacity-30"></div>
                   <p className="text-white/40 font-black uppercase text-[10px] tracking-widest leading-relaxed">Awaiting High-Fi<br/>Merchant Stream...</p>
                </div>
              )}

              <div className="absolute top-10 left-8 right-8 flex justify-between items-center z-10">
                 <div className="bg-red-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Live Prep
                 </div>
                 <button onClick={() => setShowLiveCam(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-xl backdrop-blur-md">✕</button>
              </div>

              <div className="absolute bottom-10 left-8 right-8 z-10">
                 <div className="bg-black/60 backdrop-blur-xl p-6 rounded-[35px] border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                       <div>
                          <p className="text-[10px] font-black text-[#FF00CC] uppercase mb-1">Kitchen Intercom</p>
                          <h4 className="text-white font-black text-lg tracking-tighter uppercase leading-none">{intercomStatus}</h4>
                       </div>
                       {isIntercomActive && <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>}
                    </div>
                    <button 
                      onClick={isIntercomActive ? stopIntercom : startIntercom}
                      className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        isIntercomActive ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-black active:scale-95'
                      }`}
                    >
                      {isIntercomActive ? 'Disconnect Intercom' : '🎤 Talk to Head Chef'}
                    </button>
                 </div>
              </div>
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#FF00CC]/10 to-transparent animate-scan pointer-events-none"></div>
           </div>
        </div>
      )}

      <div className="relative h-80">
        <img src={restaurant.image} className="w-full h-full object-cover" alt={restaurant.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute top-8 left-6 right-6 flex justify-between items-center z-20">
          <button onClick={onBack} className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all">←</button>
          <div className="flex gap-3">
             {restaurant.hasLiveCam && (
               <button 
                 onClick={() => setShowLiveCam(true)}
                 className="h-14 bg-green-500 px-6 rounded-2xl flex items-center justify-center text-white font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-90 transition-all gap-2"
               >
                 <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                 Live Cam
               </button>
             )}
             <button onClick={onOpenCart} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#FF00CC] shadow-xl active:scale-90 transition-all relative">
                🛒
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>}
             </button>
          </div>
        </div>
        <div className="absolute bottom-12 left-8 right-8 text-white z-10">
            <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">{restaurant.name}</h2>
            <p className="text-white/80 font-bold text-xs uppercase tracking-widest">{restaurant.cuisine} • {restaurant.address}</p>
        </div>
      </div>

      <div className="bg-white sticky top-0 z-40 px-8 py-2 border-b border-gray-100 flex gap-10 justify-center">
         {['Menu', 'Reviews'].map((tab) => (
           <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-4 text-sm font-black uppercase tracking-widest relative transition-all ${activeTab === tab ? 'text-[#FF00CC]' : 'text-gray-300'}`}>
             {tab}
             {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 ayoo-gradient rounded-full"></div>}
           </button>
         ))}
      </div>

      <div className="p-8">
        {activeTab === 'Menu' ? (
          <div className="space-y-12">
            {displayEntries.map(([category, items]) => (
              <div key={category}>
                 <h3 className="font-black text-2xl text-gray-900 tracking-tighter uppercase mb-6">{category}</h3>
                 <div className="space-y-6">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-6 items-center">
                        <img src={item.image} className="w-24 h-24 rounded-3xl object-cover shadow-md" alt={item.name} />
                        <div className="flex-1">
                          <h4 className="font-black text-lg text-gray-900 leading-none mb-1">{item.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold mb-3">₱{item.price}</p>
                          <button onClick={() => handleAdd(item)} className="bg-gray-100 text-[#FF00CC] px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-pink-50 transition-colors">Add +</button>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
             <span className="text-5xl mb-4 inline-block">💬</span>
             <p className="font-black text-gray-300 uppercase tracking-widest text-xs">Community reviews encrypted</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetail;
