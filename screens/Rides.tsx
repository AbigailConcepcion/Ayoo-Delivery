import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import { AppScreen } from '../types';
import { estimateDistanceKm, estimateRideEta, RideType as RideEstimateType } from '../src/utils/serviceEstimates';
import { ayooCloud } from '../api';
import { db } from '../db';
import { useToast } from '../components/ToastContext';
type MapCoordinates = { lat: number; lng: number };

const SAMPLE_LOCATIONS = {
  tibanga: { lat: 8.2315, lng: 124.2445 },
  pala_o: { lat: 8.2301, lng: 124.2586 }
} as const;

interface RidesProps {
  onBack: () => void;
  onNavigate: (screen: AppScreen) => void;
}

const MAP_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

type RideType = 'MOTO';

const rideMeta: Record<RideType, { base: number; perKm: number; eta: string; icon: string }> = {
  MOTO: { base: 45, perKm: 10, eta: '3-6 mins', icon: '🛵' }
};

const Rides: React.FC<RidesProps> = ({ onBack, onNavigate }) => {
  const { showToast } = useToast();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [rideType, setRideType] = useState<RideType>('MOTO');
  const [manualKm, setManualKm] = useState(5);
  const [passengers, setPassengers] = useState(1);
  const [scheduled, setScheduled] = useState(false);
  const [inBooking, setInBooking] = useState(false);
  const [bookingMsg, setBookingMsg] = useState('');
  const [booked, setBooked] = useState(false);
  const [rideId, setRideId] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [status, setStatus] = useState<string>('PENDING');

  const [riderLocation, setRiderLocation] = useState<MapCoordinates | null>(null);
  const [riderRotation, setRiderRotation] = useState(0);
  const [pickupCoords] = useState<MapCoordinates>(SAMPLE_LOCATIONS.tibanga);
  const [destCoords] = useState<MapCoordinates>(SAMPLE_LOCATIONS.pala_o);
  const [currentPath, setCurrentPath] = useState<MapCoordinates[]>([]);

  // Google Maps Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ rider?: any; pickup?: any; delivery?: any }>({});
  const routeCacheRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const distanceEstimate = useMemo(() => estimateDistanceKm(pickup, destination, manualKm), [pickup, destination, manualKm]);
  const distance = distanceEstimate.km;
  const etaRange = useMemo(
    () => estimateRideEta(distance, rideType as RideEstimateType),
    [distance, rideType]
  );

  const pricing = useMemo(() => {
    const meta = rideMeta[rideType];
    const demandFee = distance > 8 ? 20 : 0;
    const passengerFee = Math.max(0, passengers - 1) * 18;
    const scheduleFee = scheduled ? 10 : 0;
    const total = meta.base + distance * meta.perKm + demandFee + passengerFee + scheduleFee;
    return { ...meta, demandFee, passengerFee, scheduleFee, total };
  }, [rideType, distance, passengers, scheduled]);

  const syncRideStatus = useCallback(async () => {
    if (!rideId || !booked) return;
    try {
      // Fetch the latest state of this specific ride from the cloud
      const updatedRide = await ayooCloud.getServiceStatus(rideId);
      if (updatedRide && updatedRide.status !== status) {
        setStatus(updatedRide.status);
        
        // Provide real-time feedback via toasts
        if (updatedRide.status === 'ACCEPTED') showToast('Driver found! They are on their way.');
        if (updatedRide.status === 'ARRIVED') showToast('Driver has arrived at your location!');
        if (updatedRide.status === 'OUT_FOR_DELIVERY') showToast('Ride started. Stay safe!');
        if (updatedRide.status === 'DELIVERED') {
          showToast('You have arrived. Thank you for using Ayoo!');
        }
      }
    } catch (err) {
      console.error('Failed to sync ride status:', err);
    }
  }, [rideId, booked, status, showToast]);

  // Simulate rider movement along the road path
  useEffect(() => {
    if (!booked || status !== 'OUT_FOR_DELIVERY' || currentPath.length === 0) {
      return;
    }

    const google = (window as any).google;
    let startTime = performance.now();
    const segmentDuration = 2000; // 2 seconds per segment
    const totalDuration = (currentPath.length - 1) * segmentDuration;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      
      const pathIndexProgress = progress * (currentPath.length - 1);
      const index = Math.floor(pathIndexProgress);
      const segmentProgress = pathIndexProgress - index;

      if (index < currentPath.length - 1) {
        const start = currentPath[index];
        const end = currentPath[index + 1];
        const lat = start.lat + (end.lat - start.lat) * segmentProgress;
        const lng = start.lng + (end.lng - start.lng) * segmentProgress;
        const heading = google.maps.geometry.spherical.computeHeading(start, end);

        if (markersRef.current.rider) {
          markersRef.current.rider.setPosition({ lat, lng });
          const icon = markersRef.current.rider.getIcon();
          markersRef.current.rider.setIcon({ ...icon, rotation: heading });
        }
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [booked, status, currentPath]);

  // Initialize Google Maps Engine for Rides
  useEffect(() => {
    if (!booked || !MAP_API_KEY || !mapContainerRef.current) return;

    const setupMap = () => {
      const google = (window as any).google;
      if (!google || !mapContainerRef.current) return;
      const map = new google.maps.Map(mapContainerRef.current, {
        center: pickupCoords,
        zoom: 15,
        disableDefaultUI: true,
        styles: [
          { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#F3E8FF" }] },
          { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#FFFFFF" }] }
        ]
      });
      mapInstanceRef.current = map;

      // PREVENT DUPLICATE API CALLS
      const routeKey = `${pickupCoords.lat},${pickupCoords.lng}-${destCoords.lat},${destCoords.lng}`;
      if (routeCacheRef.current === routeKey) return;
      routeCacheRef.current = routeKey;

      // PROXIED DIRECTIONS CALL TO SECURE API KEY
      const fetchProxiedDirections = async () => {
        try {
          const response = await fetch(`/api/maps/directions?origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${destCoords.lat},${destCoords.lng}`);
          const data = await response.json();

          if (data.status === 'OK' && data.routes.length > 0) {
            const encodedPath = data.routes[0].overview_polyline.points;
            const decodedPath = google.maps.geometry.encoding.decodePath(encodedPath);
            
            const path = decodedPath.map((p: { lat: () => number; lng: () => number }) => ({
              lat: p.lat(),
              lng: p.lng()
            }));
            setCurrentPath(path);

            // Draw the route polyline manually and fit map bounds
            new google.maps.Polyline({
              path: decodedPath,
              map: map,
              strokeColor: '#C084FC',
              strokeWeight: 5,
              strokeOpacity: 0.8
            });

            const bounds = new google.maps.LatLngBounds();
            decodedPath.forEach((p: {lat(): number; lng(): number}) => bounds.extend(p));
            map.fitBounds(bounds);
          }
        } catch (err) {
          console.error("Directions Proxy Error:", err);
        }
      };
      fetchProxiedDirections();

      markersRef.current.pickup = new google.maps.Marker({
        position: pickupCoords,
        map,
        icon: { url: 'https://maps.google.com/mapfiles/kml/pal2/icon32.png', scaledSize: new google.maps.Size(32, 32) }
      });

      markersRef.current.delivery = new google.maps.Marker({
        position: destCoords,
        map,
        icon: { url: 'https://maps.google.com/mapfiles/kml/pal3/icon56.png', scaledSize: new google.maps.Size(32, 32) }
      });
    };

    if ((window as any).google?.maps) setupMap();
    else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAP_API_KEY}&libraries=geometry`;
      script.async = true;
      script.onload = setupMap;
      document.body.appendChild(script);
    }
  }, [booked, pickupCoords, destCoords]);

  // Update Ride Position
  useEffect(() => {
    if (mapInstanceRef.current && riderLocation) {
      const google = (window as any).google;
      if (!markersRef.current.rider) {
        markersRef.current.rider = new google.maps.Marker({
          position: riderLocation,
          map: mapInstanceRef.current,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#C084FC',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
            rotation: riderRotation
          }
        });
      } else {
        markersRef.current.rider.setOptions({
          position: riderLocation,
          icon: {
            ...markersRef.current.rider.getIcon(),
            rotation: riderRotation
          }
        });
      }
    }
  }, [riderLocation, riderRotation]);

  useEffect(() => {
    const unsub = ayooCloud.subscribe(syncRideStatus);
    return () => unsub();
  }, [syncRideStatus]);

  const bookRide = async () => {
    if (!pickup.trim() || !destination.trim() || inBooking) return;
    setInBooking(true);
    setBookingMsg('Locating nearby drivers...');

    try {
      // PRODUCTION: Replace mocked delays with a real API call to your backend
      const response = await ayooCloud.createRideRequest({
        pickup,
        destination,
        rideType,
        passengers,
        fare: pricing.total
      });
      
      setRideId(response.id);
      setInBooking(false);
      setBooked(true);
    } catch (error) {
      setBookingMsg('Failed to find a driver. Please try again.');
      setInBooking(false);
    }
  };

  const handleCancelRide = async () => {
    if (!rideId) return;
    setIsCancelling(true);
    try {
      await ayooCloud.cancelService(rideId, cancelReason);
      await db.cancelService(rideId, cancelReason);
      setShowCancelModal(false);
      setBooked(false);
      setRideId('');
      setCancelReason('');
    } catch (err) {
      console.error('Failed to cancel ride:', err);
    }
    setIsCancelling(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 overflow-y-auto scrollbar-hide">
      {/* GRAB-STYLE BOOKING CONFIRMATION */}
      {booked && (
        <div className="fixed inset-0 z-[320] bg-white flex flex-col">
          <div className="relative h-1/2">
            <div className="w-full h-full bg-gray-100">
              {MAP_API_KEY ? (
                <div ref={mapContainerRef} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center uppercase font-black text-gray-400 text-[10px]">Maps Key Required</div>
              )}
            </div>
            <button 
              onClick={() => setBooked(false)}
              className="absolute top-6 left-6 w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center text-xl font-black"
            >
              ←
            </button>
          </div>
          
          <div className="flex-1 bg-white rounded-t-[40px] -mt-10 relative z-10 p-8 space-y-6 shadow-2xl overflow-y-auto">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#C084FC] to-[#A855F7] rounded-full flex items-center justify-center text-5xl shadow-xl">
              {rideMeta[rideType].icon}
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Ride Confirmed!</h3>
              <p className="text-sm font-bold text-gray-500 mt-2">Status: {status.replace('_', ' ')}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs font-black uppercase text-gray-400 mb-1">Pickup PIN</p>
              <p className="text-3xl font-black text-[#C084FC]">A{Math.floor(100 + Math.random() * 899)}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => { setBooked(false); onNavigate('TRACKING'); }} className="w-full py-5 text-base font-black uppercase bg-gradient-to-r from-[#C084FC] to-[#A855F7] rounded-2xl">
                Track Ride
              </Button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest"
              >
                Cancel Ride
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER - GRAB STYLE */}
      <div className="bg-gradient-to-r from-[#C084FC] via-[#A855F7] to-[#C084FC] p-6 pb-24 rounded-b-[50px] shadow-2xl sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg">←</button>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Ayoo Ride</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">Moto Only</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-white rounded-[30px] border border-gray-100 p-5 space-y-4">
          <div className="input-label-border">
            <label>Pickup</label>
            <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Current location / pin" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#C084FC] outline-none font-bold" />
          </div>
          <div className="input-label-border">
            <label>Destination</label>
            <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Where to?" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#C084FC] outline-none font-bold" />
          </div>
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Choose Ride Type</p>
          <div className="grid grid-cols-1 gap-2">
            {(['MOTO'] as RideType[]).map((kind) => (
              <button
                key={kind}
                onClick={() => setRideType(kind)}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${rideType === kind ? 'bg-[#C084FC] text-white' : 'bg-gray-100 text-gray-500'
                  }`}
              >
                <span className="block text-lg mb-1">{rideMeta[kind].icon}</span>
                {kind}
              </button>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Estimated Distance: {distance.toFixed(2)} km</p>
            <p className="text-[10px] font-bold text-gray-500 mb-2">
              Distance basis: {distanceEstimate.source === 'coords' ? 'Coordinates' : distanceEstimate.source === 'place' ? 'Known Places' : 'Fallback'}
            </p>
            {distanceEstimate.source === 'fallback' && (
              <>
                <p className="text-[10px] font-bold text-amber-600 mb-2">Place not recognized yet. Adjust fallback distance:</p>
                <input type="range" min={1} max={25} value={manualKm} onChange={(e) => setManualKm(Number(e.target.value))} className="w-full accent-[#C084FC]" />
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Passengers</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPassengers((x) => Math.max(1, x - 1))} className="w-8 h-8 rounded-full bg-gray-100 font-black">-</button>
              <span className="w-5 text-center font-black text-sm">{passengers}</span>
              <button onClick={() => setPassengers((x) => Math.min(6, x + 1))} className="w-8 h-8 rounded-full bg-purple-100 text-[#C084FC] font-black">+</button>
            </div>
          </div>
          <label className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xs font-black text-gray-700">Schedule for later</span>
            <input type="checkbox" checked={scheduled} onChange={(e) => setScheduled(e.target.checked)} className="w-4 h-4 accent-[#C084FC]" />
          </label>
          {scheduled && (
            <input type="datetime-local" className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:border-[#C084FC]" />
          )}
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Driver ETA</p>
            <p className="text-sm font-black text-[#C084FC]">{etaRange.min}-{etaRange.max} mins</p>
          </div>
          <div className="space-y-2 text-xs font-black text-gray-500">
            <div className="flex justify-between"><span>Base Fare</span><span>₱{pricing.base.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Distance</span><span>₱{(distance * pricing.perKm).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Demand Fee</span><span>₱{pricing.demandFee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Passenger Add-on</span><span>₱{pricing.passengerFee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Schedule Fee</span><span>₱{pricing.scheduleFee.toFixed(2)}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-base font-black uppercase">Estimated Fare</span>
            <span className="text-2xl font-black text-[#C084FC]">₱{pricing.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto p-4">
        <Button onClick={bookRide} disabled={!pickup.trim() || !destination.trim() || inBooking} className="py-4 text-sm font-black uppercase tracking-widest">
          {inBooking ? bookingMsg : 'Book Ride'}
        </Button>
      </div>

      <BottomNav active="RIDES" onNavigate={onNavigate} mode="customer" />

      {/* CANCEL RIDE MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-8">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center text-4xl">
              ❌
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Cancel Ride?</h3>
              <p className="text-sm font-bold text-gray-500 mt-2">Are you sure you want to cancel this ride?</p>
            </div>
            <div className="space-y-3">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#C084FC] outline-none font-bold text-sm min-h-[80px]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleCancelRide}
                disabled={isCancelling}
                className="w-full py-4 text-base font-black uppercase bg-red-500 text-white rounded-2xl"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Ride'}
              </Button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest"
              >
                No, Keep Ride
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rides;
