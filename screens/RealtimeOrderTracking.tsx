import React, { useEffect, useState, useMemo } from 'react';
import { AppScreen, OrderRecord, Restaurant, UserAccount } from '../types';
import { db } from '../db';
import { ayooCloud, locationHub } from '../api';
import Button from '../components/Button';
import { useToast } from '../components/ToastContext';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet default icons in Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface RealtimeOrderTrackingProps {
  onBack: () => void;
  onNavigate: (screen: AppScreen) => void;
  orderItems: { id: string; quantity: number }[];
  restaurant: Restaurant | null;
  deliveryCity: string;
  customerEmail: string;
  currentUser: UserAccount | null;
  onOpenMessages: (convoId: string) => void;
}

const RiderMarker = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 1.5 });
  }, [lat, lng, map]);
  
  const riderIcon = useMemo(() => L.divIcon({
    className: 'bg-transparent transition-transform duration-[1500ms] ease-linear',
    html: '<div class="text-3xl drop-shadow-xl">🛵</div>',
    iconSize: [40, 40]
  }), []);

  return (
    <Marker position={[lat, lng]} icon={riderIcon}>
      <Popup>Your Rider</Popup>
    </Marker>
  );
};

const RealtimeOrderTracking: React.FC<RealtimeOrderTrackingProps> = ({ 
  onBack, onNavigate, restaurant, customerEmail, currentUser 
}) => {
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [riderLoc, setRiderLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [riderPath, setRiderPath] = useState<[number, number][]>([]);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [tip, setTip] = useState(0);
  const [comment, setComment] = useState('');
  const { showToast } = useToast();

  // Poll for Active Order
  useEffect(() => {
    const fetchOrder = async () => {
      const history = await db.getHistory(customerEmail);
      // Find most recent active order
      const current = history.find(o => ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status)) || history[0];
      if (current) setActiveOrder(current);
    };
    fetchOrder();
    const sub = ayooCloud.subscribe(fetchOrder);
    return () => sub();
  }, [customerEmail]);

  // Poll for Rider Location
  useEffect(() => {
    if (!activeOrder) return;
    
    // Check for Delivered state to trigger review
    if (activeOrder.status === 'DELIVERED' && !activeOrder.rating) {
      setShowReview(true);
    }

    const unsub = locationHub.subscribe(activeOrder.id, (data) => {
      setRiderLoc({ lat: data.lat, lng: data.lng });
      setRiderPath(prev => [...prev, [data.lat, data.lng]]);
    });
    return () => unsub();
  }, [activeOrder]);

  const handleSubmitReview = async () => {
    if (!activeOrder || !restaurant) return;
    
    // Save Review
    if ((db as any).saveRestaurantReview) {
      await (db as any).saveRestaurantReview(restaurant.id, {
        rating,
        comment,
        userEmail: customerEmail,
        userName: currentUser?.name || 'Anonymous',
        date: new Date().toISOString()
      });
    }

    // Update Order with Tip/Rating
    // Note: In a real app we would call an API. Here we assume db update support.
    showToast(`Rated ${rating} stars! Thank you.`);
    setShowReview(false);
    onNavigate('HISTORY');
  };

  // Default Map Center (Iligan City)
  const centerLat = 8.2280;
  const centerLng = 124.2452;

  if (!activeOrder) return <div className="p-10 text-center text-white">Loading order details...</div>;

  return (
    <div className="h-screen bg-gray-100 flex flex-col relative">
      {/* Map Layer */}
      <div className="flex-1 relative z-0">
        <MapContainer center={[centerLat, centerLng]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {/* Merchant Marker */}
          <Marker position={[centerLat + 0.01, centerLng]} icon={L.divIcon({ className: 'bg-transparent', html: '<div class="text-3xl">🏪</div>', iconSize: [40, 40] })} />
          
          {/* Customer Marker (Approx) */}
          <Marker position={[centerLat - 0.01, centerLng]} icon={L.divIcon({ className: 'bg-transparent', html: '<div class="text-3xl">🏠</div>', iconSize: [40, 40] })} />

          {/* Rider Path History */}
          {riderPath.length > 1 && (
            <Polyline 
              positions={riderPath} 
              pathOptions={{ color: '#6D28D9', weight: 5, opacity: 0.6, lineJoin: 'round' }} 
            />
          )}

          {/* Live Rider Marker */}
          {riderLoc && <RiderMarker lat={riderLoc.lat} lng={riderLoc.lng} />}
        </MapContainer>

        {/* Top Gradient Overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-[400]"></div>
        
        {/* Back Button */}
        <button onClick={onBack} className="absolute top-6 left-6 z-[400] bg-white/20 backdrop-blur-md p-3 rounded-full text-white font-bold border border-white/20 shadow-lg active:scale-95 transition-all">
          ← Back
        </button>
      </div>

      {/* Bottom Sheet Info */}
      <div className="bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-8 relative z-10 -mt-10">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
        
        <div className="flex justify-between items-start mb-6">
           <div>
             <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800">{activeOrder.status.replace(/_/g, ' ')}</h2>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Est. Arrival: 15-20 mins</p>
           </div>
           <div className="bg-[#6D28D9]/10 p-3 rounded-2xl">
             <div className="text-2xl animate-pulse">🛵</div>
           </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((step, i) => {
             const stages = ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
             const currentIdx = stages.indexOf(activeOrder.status);
             const stepIdx = stages.indexOf(step);
             const active = currentIdx >= stepIdx;
             return (
               <div key={step} className={`h-1.5 flex-1 rounded-full ${active ? 'bg-[#6D28D9]' : 'bg-gray-100'}`}></div>
             );
          })}
        </div>

        {/* Rider & Order Info */}
        <div className="bg-gray-50 p-6 rounded-[30px] flex items-center gap-4 mb-4">
           <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl overflow-hidden">
             👨‍🚀
           </div>
           <div className="flex-1">
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Your Rider</p>
             <p className="font-bold text-gray-800">Ayoo Fleet Partner</p>
           </div>
           <div className="flex gap-2">
              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500">📞</button>
              <button onClick={() => onNavigate('MESSAGES')} className="w-10 h-10 bg-[#6D28D9] rounded-full flex items-center justify-center shadow-sm text-white">💬</button>
           </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReview && (
        <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 animate-in slide-in-from-bottom-10">
             <div className="text-center mb-6">
               <h3 className="text-2xl font-black uppercase tracking-tight text-[#6D28D9] mb-1">Order Delivered!</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">How was {restaurant?.name}?</p>
             </div>

             {/* Star Rating */}
             <div className="flex justify-center gap-2 mb-8">
               {[1, 2, 3, 4, 5].map(star => (
                 <button 
                   key={star} 
                   onClick={() => setRating(star)}
                   className={`text-4xl transition-all hover:scale-110 ${star <= rating ? 'grayscale-0' : 'grayscale opacity-30'}`}
                 >
                   ⭐
                 </button>
               ))}
             </div>

             {/* Tip Selection */}
             <div className="mb-6">
               <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-3">Add a Tip for Rider</p>
               <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                 {[0, 20, 50, 100].map(amount => (
                   <button 
                     key={amount}
                     onClick={() => setTip(amount)}
                     className={`px-4 py-3 rounded-xl text-xs font-black transition-all ${tip === amount ? 'bg-[#6D28D9] text-white shadow-lg shadow-purple-500/30' : 'bg-gray-50 text-gray-500'}`}
                   >
                     {amount === 0 ? 'No Tip' : `₱${amount}`}
                   </button>
                 ))}
               </div>
             </div>

             {/* Comment */}
             <textarea 
               value={comment}
               onChange={e => setComment(e.target.value)}
               className="w-full bg-gray-50 border-0 rounded-2xl p-4 text-xs font-bold mb-6 focus:ring-2 focus:ring-[#6D28D9]"
               placeholder="Any feedback about the food?"
               rows={3}
             ></textarea>

             <Button onClick={handleSubmitReview} className="py-4 ayoo-gradient text-sm shadow-xl shadow-purple-500/20">
               Submit Feedback
             </Button>
             <button onClick={() => setShowReview(false)} className="w-full mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
               Skip Review
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeOrderTracking;