
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_RESTAURANTS, CATEGORIES, PHILIPPINE_CITIES } from '../constants';
import { Restaurant, UserBadge, AppScreen } from '../types';
import { GoogleGenAI } from "@google/genai";

interface HomeProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenCart: () => void;
  onNavigate: (s: AppScreen) => void;
  cartCount: number;
  points: number;
  streak: number;
  badges: UserBadge[];
  deliveryCity: string;
  onSetDeliveryCity: (city: string) => void;
}

const Home: React.FC<HomeProps> = ({ 
  onSelectRestaurant, 
  onOpenCart, 
  onNavigate, 
  cartCount, 
  points, 
  streak, 
  badges, 
  deliveryCity, 
  onSetDeliveryCity 
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'IDLE' | 'FETCHING' | 'ERROR'>('IDLE');

  const MOODS = [
    { name: 'Lazy', icon: '😴' },
    { name: 'Stressed', icon: '😫' },
    { name: 'Celebratory', icon: '🥳' },
    { name: 'Fit', icon: '🥗' },
    { name: 'Spicy', icon: '🌶️' }
  ];

  const handleGetCurrentLocation = () => {
    setGeoStatus('FETCHING');
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, we'd reverse-geocode this via Google Maps API
          // For now, we simulate finding the user is in Iligan
          console.log("Coords:", position.coords.latitude, position.coords.longitude);
          onSetDeliveryCity('Iligan City');
          setGeoStatus('IDLE');
          setShowLocationPicker(false);
        },
        (error) => {
          console.error("Geo Error", error);
          setGeoStatus('ERROR');
        }
      );
    } else {
      setGeoStatus('ERROR');
    }
  };

  const askAiForMood = async (mood: string) => {
    setSelectedMood(mood);
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `User feels ${mood}. Recommend one restaurant from: ${MOCK_RESTAURANTS.map(r => r.name).join(', ')}. Mention a specific dish. 15 words max.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      const text = response.text || "Pizza House is perfect!";
      setAiSuggestion(text);
      const match = MOCK_RESTAURANTS.find(r => text.toLowerCase().includes(r.name.toLowerCase()));
      if (match) setRecommendedId(match.id);
    } catch (err) {
      setAiSuggestion("Pizza House is perfect for that vibe!");
      setRecommendedId('4');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredRestaurants = useMemo(() => {
    let list = MOCK_RESTAURANTS.filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase()) || 
      r.cuisine.toLowerCase().includes(search.toLowerCase())
    );
    if (selectedCategory) {
      list = list.filter(r => r.cuisine.toLowerCase().includes(selectedCategory.toLowerCase()));
    }
    if (recommendedId) {
      const rec = list.find(r => r.id === recommendedId);
      const others = list.filter(r => r.id !== recommendedId);
      return rec ? [rec, ...others] : list;
    }
    return list;
  }, [search, recommendedId, selectedCategory]);

  return (
    <div className="flex flex-col h-screen bg-white pb-24 overflow-y-auto scroll-smooth scrollbar-hide">
      
      {showLocationPicker && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end justify-center">
           <div className="bg-white w-full max-w-md rounded-t-[50px] p-10 animate-in slide-in-from-bottom-10 shadow-2xl">
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-center">Ayoo GPS</h3>
              
              <button 
                onClick={handleGetCurrentLocation}
                disabled={geoStatus === 'FETCHING'}
                className="w-full mb-6 p-6 ayoo-gradient rounded-[30px] flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
              >
                {geoStatus === 'FETCHING' ? '📡 Locating...' : '📍 Use Current Location'}
              </button>

              <div className="space-y-3 max-h-[30vh] overflow-y-auto scrollbar-hide pb-6 border-t border-gray-100 pt-6">
                 {PHILIPPINE_CITIES.map(city => (
                   <button 
                    key={city}
                    onClick={() => { onSetDeliveryCity(city); setShowLocationPicker(false); }}
                    className={`w-full p-6 rounded-[30px] flex items-center justify-between border-2 transition-all ${
                      deliveryCity === city ? 'bg-[#FF00CC]/5 border-[#FF00CC]' : 'bg-gray-50 border-gray-100'
                    }`}
                   >
                     <span className={`font-black uppercase tracking-widest text-xs ${deliveryCity === city ? 'text-[#FF00CC]' : 'text-gray-900'}`}>{city}</span>
                     {deliveryCity === city && <div className="w-6 h-6 bg-[#FF00CC] rounded-full flex items-center justify-center text-white text-[10px]">✓</div>}
                   </button>
                 ))}
              </div>
              <button onClick={() => setShowLocationPicker(false)} className="w-full py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Close</button>
           </div>
        </div>
      )}

      <div className="bg-[#FF00CC] p-6 rounded-b-[45px] shadow-xl sticky top-0 z-40 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setShowLocationPicker(true)}>
            <div className="w-14 h-14 ayoo-gradient rounded-[18px] flex items-center justify-center p-[2.5px] shadow-lg">
                <div className="bg-white w-full h-full rounded-[16px] flex items-center justify-center font-black text-[#FF00CC] text-xl">ay</div>
            </div>
            <div className="text-white">
              <p className="text-[10px] opacity-80 font-black uppercase tracking-[0.2em] mb-1">Delivering to</p>
              <p className="font-extrabold text-xl tracking-tighter flex items-center gap-1">
                {deliveryCity} <span className="text-[10px]">▼</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl flex flex-col items-center border border-white/20">
                <span className="text-[8px] font-black text-white/70 uppercase mb-1">Points</span>
                <span className="text-white font-black text-xs">🪙 {points}</span>
             </div>
             <button onClick={onOpenCart} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center relative text-[#FF00CC] shadow-xl active:scale-95">
                🛒
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FF00CC]">{cartCount}</span>}
              </button>
          </div>
        </div>
        
        <div className="relative mb-6">
          <input type="text" placeholder="Search food or cuisine..." className="w-full p-4 pl-12 rounded-2xl bg-white focus:outline-none font-bold text-gray-800" value={search} onChange={(e) => setSearch(e.target.value)} />
          <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all ${
                selectedCategory === cat.name ? 'bg-white text-[#FF00CC]' : 'bg-white/10 text-white'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pt-8 flex gap-4 overflow-x-auto scrollbar-hide">
         <div className="flex-shrink-0 bg-orange-50 p-6 rounded-[35px] border-2 border-orange-100 flex items-center gap-4 min-w-[200px]">
            <div className="text-4xl animate-bounce">🔥</div>
            <div>
               <p className="text-[10px] font-black text-orange-500 uppercase leading-none mb-1 tracking-widest">Streak</p>
               <h4 className="font-black text-gray-900 text-xl leading-none">{streak} Days</h4>
            </div>
         </div>
      </div>

      <div className="px-6 pt-8">
        <h3 className="font-black text-lg text-gray-900 mb-4 tracking-tighter uppercase">Vibe Check ✨</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {MOODS.map(mood => (
            <button key={mood.name} onClick={() => askAiForMood(mood.name)} className={`flex-shrink-0 px-6 py-4 rounded-[28px] flex flex-col items-center gap-2 transition-all ${selectedMood === mood.name ? 'bg-[#FF00CC] text-white' : 'bg-white border border-gray-100 text-gray-700'}`}>
              <span className="text-2xl">{mood.icon}</span>
              <span className="text-[10px] font-black uppercase">{mood.name}</span>
            </button>
          ))}
        </div>
      </div>

      {aiSuggestion && (
        <div className="mx-6 mt-6 p-6 bg-pink-50 rounded-[35px] border-2 border-[#FF00CC]/10 shadow-lg animate-in zoom-in-95">
            <p className="text-[10px] font-black text-[#FF00CC] uppercase mb-1">🤖 Ayoo AI Says</p>
            <p className="text-gray-700 font-bold italic leading-snug">"{aiSuggestion}"</p>
        </div>
      )}

      <div className="px-6 pt-8 pb-10">
        <h3 className="font-black text-2xl text-gray-900 tracking-tighter mb-6">Nearby Merchants</h3>
        <div className="grid grid-cols-1 gap-8">
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.slice(0, 15).map(res => (
              <div key={res.id} className={`bg-white rounded-[40px] overflow-hidden shadow-sm border-2 cursor-pointer transition-all hover:shadow-xl ${res.id === recommendedId ? 'border-[#FF00CC]' : 'border-gray-100'}`} onClick={() => onSelectRestaurant(res)}>
                <div className="h-56 overflow-hidden relative">
                  <img src={res.image} alt={res.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black text-[#FF00CC]">🛵 {res.deliveryTime}</div>
                </div>
                <div className="p-6">
                  <h4 className="font-black text-xl text-gray-900 tracking-tight">{res.name}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Free Delivery</span>
                    <span className="text-[#FF00CC] font-black text-[10px] uppercase">View Menu →</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-30">
               <span className="text-6xl mb-4">🏜️</span>
               <p className="font-black uppercase tracking-widest text-sm">No matches found</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-8 py-5 flex justify-around items-center max-w-md mx-auto rounded-t-[45px] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] z-50">
        <button onClick={() => onNavigate('HOME')} className="flex flex-col items-center text-[#FF00CC]">
          <span className="text-2xl mb-1">🏠</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => onNavigate('VOUCHERS')} className="flex flex-col items-center text-gray-300">
          <span className="text-2xl mb-1">🎟️</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Voucher</span>
        </button>
        <button onClick={() => onNavigate('HISTORY')} className="flex flex-col items-center text-gray-300">
          <span className="text-2xl mb-1">📑</span>
          <span className="text-[10px] font-black uppercase tracking-widest">History</span>
        </button>
        <button onClick={() => onNavigate('PROFILE')} className="flex flex-col items-center text-gray-300">
          <span className="text-2xl mb-1">👤</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default Home;
