import React, { useMemo, useState } from 'react';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import { AppScreen } from '../types';
import { estimateDistanceKm, estimateRideEta, RideType as RideEstimateType } from '../src/utils/serviceEstimates';

interface RidesProps {
  onBack: () => void;
  onNavigate: (screen: AppScreen) => void;
}

type RideType = 'MOTO' | 'CAR' | 'XL';

const rideMeta: Record<RideType, { base: number; perKm: number; eta: string; icon: string }> = {
  MOTO: { base: 45, perKm: 10, eta: '3-6 mins', icon: '🛵' },
  CAR: { base: 75, perKm: 14, eta: '4-8 mins', icon: '🚕' },
  XL: { base: 110, perKm: 18, eta: '6-10 mins', icon: '🚐' }
};

const Rides: React.FC<RidesProps> = ({ onBack, onNavigate }) => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [rideType, setRideType] = useState<RideType>('MOTO');
  const [manualKm, setManualKm] = useState(5);
  const [passengers, setPassengers] = useState(1);
  const [scheduled, setScheduled] = useState(false);
  const [inBooking, setInBooking] = useState(false);
  const [bookingMsg, setBookingMsg] = useState('');
  const [booked, setBooked] = useState(false);

  const distanceEstimate = useMemo(() => estimateDistanceKm(pickup, destination, manualKm), [pickup, destination, manualKm]);
  const distance = distanceEstimate.km;
  const etaRange = useMemo(
    () => estimateRideEta(distance, rideType as RideEstimateType),
    [distance, rideType]
  );

  const pricing = useMemo(() => {
    const meta = rideMeta[rideType];
    const demandFee = distance > 8 ? 20 : 0;
    const passengerFee = Math.max(0, passengers - (rideType === 'MOTO' ? 1 : 2)) * 18;
    const scheduleFee = scheduled ? 10 : 0;
    const total = meta.base + distance * meta.perKm + demandFee + passengerFee + scheduleFee;
    return { ...meta, demandFee, passengerFee, scheduleFee, total };
  }, [rideType, distance, passengers, scheduled]);

  const bookRide = async () => {
    if (!pickup.trim() || !destination.trim() || inBooking) return;
    setInBooking(true);
    setBookingMsg('Locating nearby drivers...');
    await new Promise(resolve => setTimeout(resolve, 420));
    setBookingMsg('Matching safest route...');
    await new Promise(resolve => setTimeout(resolve, 420));
    setBookingMsg('Driver confirmed. Preparing pickup pin...');
    await new Promise(resolve => setTimeout(resolve, 420));
    setInBooking(false);
    setBooked(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 overflow-y-auto scrollbar-hide">
      {/* GRAB-STYLE BOOKING CONFIRMATION */}
      {booked && (
        <div className="fixed inset-0 z-[320] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-8">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm text-center space-y-6 shadow-2xl">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-full flex items-center justify-center text-5xl shadow-xl">
              {rideMeta[rideType].icon}
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Ride Confirmed!</h3>
              <p className="text-sm font-bold text-gray-500 mt-2">Driver is on the way</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs font-black uppercase text-gray-400 mb-1">Pickup PIN</p>
              <p className="text-3xl font-black text-[#8B5CF6]">A{Math.floor(100 + Math.random() * 899)}</p>
            </div>
            <Button onClick={() => { setBooked(false); onNavigate('TRACKING'); }} className="w-full py-5 text-base font-black uppercase bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] rounded-2xl">
              Track Ride
            </Button>
          </div>
        </div>
      )}

      {/* HEADER - GRAB STYLE */}
      <div className="bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#8B5CF6] p-6 pb-24 rounded-b-[50px] shadow-2xl sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg">←</button>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Ayoo Ride</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">Moto • Car • XL</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-white rounded-[30px] border border-gray-100 p-5 space-y-4">
          <div className="input-label-border">
            <label>Pickup</label>
            <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Current location / pin" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#8B5CF6] outline-none font-bold" />
          </div>
          <div className="input-label-border">
            <label>Destination</label>
            <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Where to?" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#8B5CF6] outline-none font-bold" />
          </div>
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Choose Ride Type</p>
          <div className="grid grid-cols-3 gap-2">
            {(['MOTO', 'CAR', 'XL'] as RideType[]).map((kind) => (
              <button
                key={kind}
                onClick={() => setRideType(kind)}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${rideType === kind ? 'bg-[#8B5CF6] text-white' : 'bg-gray-100 text-gray-500'
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
                <input type="range" min={1} max={25} value={manualKm} onChange={(e) => setManualKm(Number(e.target.value))} className="w-full accent-[#8B5CF6]" />
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Passengers</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPassengers((x) => Math.max(1, x - 1))} className="w-8 h-8 rounded-full bg-gray-100 font-black">-</button>
              <span className="w-5 text-center font-black text-sm">{passengers}</span>
              <button onClick={() => setPassengers((x) => Math.min(6, x + 1))} className="w-8 h-8 rounded-full bg-purple-100 text-[#8B5CF6] font-black">+</button>
            </div>
          </div>
          <label className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xs font-black text-gray-700">Schedule for later</span>
            <input type="checkbox" checked={scheduled} onChange={(e) => setScheduled(e.target.checked)} className="w-4 h-4 accent-[#8B5CF6]" />
          </label>
          {scheduled && (
            <input type="datetime-local" className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:border-[#8B5CF6]" />
          )}
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Driver ETA</p>
            <p className="text-sm font-black text-[#8B5CF6]">{etaRange.min}-{etaRange.max} mins</p>
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
            <span className="text-2xl font-black text-[#8B5CF6]">₱{pricing.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto p-4">
        <Button onClick={bookRide} disabled={!pickup.trim() || !destination.trim() || inBooking} className="py-4 text-sm font-black uppercase tracking-widest">
          {inBooking ? bookingMsg : 'Book Ride'}
        </Button>
      </div>

      <BottomNav active="RIDES" onNavigate={onNavigate} mode="customer" />
    </div>
  );
};

export default Rides;
