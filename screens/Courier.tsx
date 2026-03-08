import React, { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import { AppScreen } from '../types';
import { estimateCourierEta, estimateDistanceKm } from '../src/utils/serviceEstimates';
import { ayooCloud } from '../api';
import { db } from '../db';

interface CourierProps {
  onBack: () => void;
  onNavigate: (screen: AppScreen) => void;
}

type ParcelType = 'DOCUMENT' | 'SMALL' | 'MEDIUM' | 'LARGE';
type ServiceSpeed = 'STANDARD' | 'RUSH';
type TripStatus = 'IDLE' | 'MATCHED' | 'PICKUP' | 'IN_TRANSIT' | 'ARRIVING' | 'DELIVERED';
type DistanceSource = 'coords' | 'place' | 'fallback';

type MapStop = {
  label: string;
  x: number;
  y: number;
  order: number;
  kind: 'pickup' | 'drop';
};

const LOCATION_CHOICES = [
  'Tibanga, Iligan City',
  'Pala-o, Iligan City',
  'Del Carmen, Iligan City',
  'Quezon Ave, Iligan City',
  'Andres Bonifacio Ave, Iligan City',
  'Aguinaldo St, Iligan City',
  'Poblacion, Iligan City',
  'Baywalk, Iligan City',
  'Buru-un, Iligan City',
  'Maria Cristina, Iligan City',
  'MSU-IIT Campus, Iligan City',
  'Robinsons Place, Iligan City'
];

const MAP_ANCHORS: Array<{ x: number; y: number }> = [
  { x: 14, y: 79 },
  { x: 26, y: 66 },
  { x: 39, y: 58 },
  { x: 52, y: 50 },
  { x: 65, y: 42 },
  { x: 78, y: 32 },
  { x: 86, y: 21 },
  { x: 61, y: 24 },
  { x: 43, y: 30 },
  { x: 30, y: 40 }
];

const getAnchor = (index: number) => MAP_ANCHORS[Math.max(0, index) % MAP_ANCHORS.length];
const toPoints = (nodes: Array<{ x: number; y: number }>) => nodes.map((node) => `${node.x},${node.y}`).join(' ');

const sourcePriority: Record<DistanceSource, number> = {
  coords: 3,
  place: 2,
  fallback: 1
};

const Courier: React.FC<CourierProps> = ({ onBack, onNavigate }) => {
  const [pickupPreset, setPickupPreset] = useState(LOCATION_CHOICES[0]);
  const [dropoffPreset, setDropoffPreset] = useState(LOCATION_CHOICES[1]);
  const [pickup, setPickup] = useState(LOCATION_CHOICES[0]);
  const [dropoff, setDropoff] = useState(LOCATION_CHOICES[1]);
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [dropoffNote, setDropoffNote] = useState('');
  const [extraDropPins, setExtraDropPins] = useState<string[]>([]);
  const [nextDropPin, setNextDropPin] = useState(LOCATION_CHOICES[2]);
  const [parcel, setParcel] = useState<ParcelType>('SMALL');
  const [speed, setSpeed] = useState<ServiceSpeed>('STANDARD');
  const [manualKm, setManualKm] = useState(6);
  const [fragile, setFragile] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookStatus, setBookStatus] = useState('');
  const [tripStatus, setTripStatus] = useState<TripStatus>('IDLE');
  const [routeProgress, setRouteProgress] = useState(0);
  const [isSimulatingRoute, setIsSimulatingRoute] = useState(false);
  const [dropoffCode, setDropoffCode] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [courierId, setCourierId] = useState('');

  useEffect(() => {
    setPickup(pickupPreset);
  }, [pickupPreset]);

  useEffect(() => {
    setDropoff(dropoffPreset);
  }, [dropoffPreset]);

  const routeStops = useMemo(() => {
    const labels = [pickup.trim(), dropoff.trim(), ...extraDropPins.map((x) => x.trim()).filter(Boolean)].filter(Boolean);
    return labels.length >= 2 ? labels : [pickup.trim() || 'Pickup', dropoff.trim() || 'Drop-off'];
  }, [pickup, dropoff, extraDropPins]);

  const segmentEstimates = useMemo(() => {
    const estimates: ReturnType<typeof estimateDistanceKm>[] = [];
    for (let index = 0; index < routeStops.length - 1; index++) {
      estimates.push(estimateDistanceKm(routeStops[index], routeStops[index + 1], manualKm));
    }
    return estimates;
  }, [routeStops, manualKm]);

  const km = useMemo(
    () => Math.max(0.8, Number(segmentEstimates.reduce((sum, leg) => sum + leg.km, 0).toFixed(2))),
    [segmentEstimates]
  );

  const distanceSource = useMemo<DistanceSource>(() => {
    if (segmentEstimates.length === 0) return 'fallback';
    let best: DistanceSource = 'fallback';
    segmentEstimates.forEach((segment) => {
      if (sourcePriority[segment.source] > sourcePriority[best]) {
        best = segment.source;
      }
    });
    return best;
  }, [segmentEstimates]);

  const etaRange = useMemo(() => estimateCourierEta(km, speed, parcel), [km, speed, parcel]);
  const eta = `${etaRange.min}-${etaRange.max} mins`;

  const quote = useMemo(() => {
    const baseByParcel: Record<ParcelType, number> = {
      DOCUMENT: 49,
      SMALL: 69,
      MEDIUM: 89,
      LARGE: 129
    };
    const base = baseByParcel[parcel];
    const distanceFee = km * 12;
    const speedFee = speed === 'RUSH' ? 35 : 0;
    const fragileFee = fragile ? 20 : 0;
    const insuranceFee = insurance ? Math.max(15, Math.round((base + distanceFee) * 0.08)) : 0;
    const multipointFee = Math.max(0, extraDropPins.length) * 18;
    return {
      base,
      distanceFee,
      speedFee,
      fragileFee,
      insuranceFee,
      multipointFee,
      total: base + distanceFee + speedFee + fragileFee + insuranceFee + multipointFee
    };
  }, [parcel, speed, km, fragile, insurance, extraDropPins.length]);

  const mapStops = useMemo<MapStop[]>(
    () =>
      routeStops.map((label, index) => {
        const anchor = getAnchor(index);
        return {
          label,
          x: anchor.x,
          y: anchor.y,
          order: index,
          kind: index === 0 ? 'pickup' : 'drop'
        };
      }),
    [routeStops]
  );

  const segmentCount = Math.max(1, mapStops.length - 1);
  const segmentedProgress = (Math.max(0, Math.min(100, routeProgress)) / 100) * segmentCount;
  const activeSegmentIndex = Math.min(segmentCount - 1, Math.floor(segmentedProgress));
  const localSegmentProgress = Math.min(1, segmentedProgress - activeSegmentIndex);
  const activeStart = mapStops[activeSegmentIndex];
  const activeEnd = mapStops[Math.min(activeSegmentIndex + 1, mapStops.length - 1)];

  const routeMarker = useMemo(
    () => ({
      x: activeStart.x + (activeEnd.x - activeStart.x) * localSegmentProgress,
      y: activeStart.y + (activeEnd.y - activeStart.y) * localSegmentProgress
    }),
    [activeStart.x, activeStart.y, activeEnd.x, activeEnd.y, localSegmentProgress]
  );

  const fullRoutePoints = useMemo(() => toPoints(mapStops), [mapStops]);
  const completedRoutePoints = useMemo(() => {
    const visited = mapStops.slice(0, activeSegmentIndex + 1).map((stop) => ({ x: stop.x, y: stop.y }));
    const withMarker = [...visited, routeMarker];
    return toPoints(withMarker);
  }, [mapStops, activeSegmentIndex, routeMarker]);

  const timelineStep = useMemo(() => {
    if (routeProgress >= 100) return 4;
    if (routeProgress >= 80) return 3;
    if (routeProgress >= 35) return 2;
    if (routeProgress > 0) return 1;
    return 0;
  }, [routeProgress]);

  const activeLegText = useMemo(() => {
    if (tripStatus === 'IDLE') return 'Ready for route simulation';
    return `${activeStart.label} → ${activeEnd.label}`;
  }, [tripStatus, activeStart.label, activeEnd.label]);

  useEffect(() => {
    if (!isSimulatingRoute) return;
    const perTick = speed === 'RUSH' ? 7 : 5;
    const timer = setInterval(() => {
      setRouteProgress((prev) => Math.min(100, prev + perTick));
    }, 900);
    return () => clearInterval(timer);
  }, [isSimulatingRoute, speed]);

  useEffect(() => {
    if (routeProgress >= 100) {
      setTripStatus('DELIVERED');
      setBookStatus('Drop-off completed successfully');
      setIsSimulatingRoute(false);
      return;
    }
    if (routeProgress >= 80) {
      setTripStatus('ARRIVING');
      setBookStatus('Courier is near the last drop point');
      return;
    }
    if (routeProgress >= 35) {
      setTripStatus('IN_TRANSIT');
      setBookStatus('Courier is delivering to pinned drop points');
      return;
    }
    if (routeProgress > 12) {
      setTripStatus('PICKUP');
      setBookStatus('Courier arrived at pickup point');
      return;
    }
    if (routeProgress > 0) {
      setTripStatus('MATCHED');
      setBookStatus('Courier matched and moving to pickup');
    }
  }, [routeProgress]);

  const addDropPin = () => {
    const candidate = nextDropPin.trim();
    if (!candidate) return;
    setExtraDropPins((prev) => {
      if (prev.includes(candidate) || prev.length >= 5) return prev;
      return [...prev, candidate];
    });
  };

  const removeDropPin = (target: string) => {
    setExtraDropPins((prev) => prev.filter((label) => label !== target));
  };

  const bookCourier = async () => {
    if (!pickup.trim() || !dropoff.trim() || !sender.trim() || !receiver.trim() || booking) return;
    setBooking(true);
    setBookStatus('Checking nearest courier partners...');
    await new Promise((resolve) => setTimeout(resolve, 450));
    setBookStatus('Securing parcel handoff verification...');
    await new Promise((resolve) => setTimeout(resolve, 450));
    setBookStatus('Courier matched. Preparing real-time lane...');
    await new Promise((resolve) => setTimeout(resolve, 450));

    // Generate courier ID
    const newCourierId = `COUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setCourierId(newCourierId);

    setBooking(false);
    setDropoffCode(`DROP-${Math.floor(1000 + Math.random() * 9000)}-${routeStops.length - 1}`);
    setRouteProgress(6);
    setTripStatus('MATCHED');
    setIsSimulatingRoute(true);
  };

  const handleCancelCourier = async () => {
    if (!courierId) return;
    setIsCancelling(true);
    try {
      await ayooCloud.cancelService(courierId, cancelReason);
      await db.cancelService(courierId, cancelReason);
      setShowCancelModal(false);
      // Reset the courier booking
      setRouteProgress(0);
      setTripStatus('IDLE');
      setBookStatus('');
      setDropoffCode('');
      setIsSimulatingRoute(false);
      setCourierId('');
      setCancelReason('');
    } catch (err) {
      console.error('Failed to cancel courier:', err);
    }
    setIsCancelling(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 overflow-y-auto scrollbar-hide">
      <div className="bg-white p-6 border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-[#FF1493] text-2xl font-black">←</button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Courier / Express</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live route map with multi-drop pins</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-white rounded-[30px] border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500"></h3>
            <span
              className={`text-[9px] px-3 py-1.5 rounded-xl font-black uppercase ${tripStatus === 'DELIVERED'
                ? 'bg-green-50 text-green-600'
                : routeProgress > 0
                  ? 'bg-[#FF1493]/10 text-[#FF1493]'
                  : 'bg-gray-100 text-gray-500'
                }`}
            >
              {tripStatus === 'IDLE' ? 'Idle' : tripStatus.replaceAll('_', ' ')}
            </span>
          </div>
          <div className="relative h-64 rounded-2xl overflow-hidden border border-gray-100 bg-[#EAF4FF]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              <rect x="0" y="0" width="100" height="100" fill="#F7FBFF" />
              <path d="M0 84 C18 76, 28 68, 40 66 C52 64, 60 66, 68 73 C76 80, 88 86, 100 89 L100 100 L0 100 Z" fill="#D7ECFF" />
              <path d="M-4 58 C12 54, 24 48, 36 50 C48 52, 62 62, 72 65 C82 68, 92 66, 104 62" stroke="#D9DEE7" strokeWidth="2.8" fill="none" />
              <path d="M-6 34 C8 30, 18 26, 30 28 C42 30, 54 40, 68 42 C82 44, 90 40, 106 34" stroke="#D9DEE7" strokeWidth="2.4" fill="none" />
              <path d="M8 102 L22 0" stroke="#E2E8F0" strokeWidth="1.7" />
              <path d="M50 104 L64 0" stroke="#E2E8F0" strokeWidth="1.7" />
              <path d="M78 104 L94 0" stroke="#E2E8F0" strokeWidth="1.7" />
              <polyline points={fullRoutePoints} stroke="#FDA4AF" strokeWidth="3.4" strokeDasharray="6 4" fill="none" />
              <polyline points={completedRoutePoints} stroke="#FF1493" strokeWidth="3.7" fill="none" />
            </svg>

            {mapStops.map((stop) => (
              <div
                key={`${stop.order}-${stop.label}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 shadow flex items-center justify-center text-[11px] font-black ${stop.kind === 'pickup'
                    ? 'bg-[#16A34A] border-white text-white'
                    : 'bg-white border-pink-300 text-[#FF1493]'
                    }`}
                >
                  {stop.kind === 'pickup' ? 'P' : stop.order}
                </div>
              </div>
            ))}

            {routeProgress > 0 && (
              <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700" style={{ left: `${routeMarker.x}%`, top: `${routeMarker.y}%` }}>
                <div className="w-10 h-10 rounded-2xl bg-[#FF1493] text-white flex items-center justify-center shadow-lg animate-bounce">🛵</div>
              </div>
            )}

            <div className="absolute left-3 top-3 px-2.5 py-1.5 rounded-lg bg-white/90 border border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-500">
              Iligan Live Route
            </div>
            <div className="absolute right-3 bottom-3 px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-[9px] font-black uppercase tracking-widest">
              Stop {Math.min(mapStops.length - 1, activeSegmentIndex + 1)} of {Math.max(1, mapStops.length - 1)}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-[#FF1493] transition-all duration-500" style={{ width: `${routeProgress}%` }}></div>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
              <span>Distance basis: {distanceSource === 'coords' ? 'Coordinates' : distanceSource === 'place' ? 'Known places' : 'Fallback'}</span>
              <span>{km.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
              <span>{bookStatus || 'Ready for drop-off booking'}</span>
              <span>{routeProgress.toFixed(0)}%</span>
            </div>
            <p className="text-[10px] font-bold text-gray-500">Active leg: {activeLegText}</p>
            <div className="grid grid-cols-4 gap-2">
              {['Matched', 'Pickup', 'Transit', 'Delivered'].map((stage, index) => (
                <div
                  key={stage}
                  className={`rounded-xl px-2 py-2 text-center text-[8px] font-black uppercase tracking-widest ${timelineStep >= index + 1 ? 'bg-[#FF1493] text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                >
                  {stage}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="input-label-border">
              <label>Pickup Place</label>
              <select value={pickupPreset} onChange={(e) => setPickupPreset(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#FF1493] outline-none font-bold appearance-none">
                {LOCATION_CHOICES.map((place) => (
                  <option key={place} value={place}>{place}</option>
                ))}
              </select>
            </div>
            <div className="input-label-border">
              <label>Main Drop Place</label>
              <select value={dropoffPreset} onChange={(e) => setDropoffPreset(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#FF1493] outline-none font-bold appearance-none">
                {LOCATION_CHOICES.map((place) => (
                  <option key={place} value={place}>{place}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-label-border">
            <label>Pickup Address</label>
            <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Tibanga, Iligan City" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#FF1493] outline-none font-bold" />
          </div>
          <div className="input-label-border">
            <label>Dropoff Address</label>
            <input value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="e.g. Pala-o, Iligan City" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#FF1493] outline-none font-bold" />
          </div>

          <div className="bg-[#FFF6FB] border border-pink-100 rounded-2xl p-3 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF1493]">Additional Drop Pins</p>
            <div className="flex gap-2">
              <select value={nextDropPin} onChange={(e) => setNextDropPin(e.target.value)} className="flex-1 p-3 bg-white rounded-xl border border-gray-100 focus:border-[#FF1493] outline-none text-xs font-bold appearance-none">
                {LOCATION_CHOICES.map((place) => (
                  <option key={place} value={place}>{place}</option>
                ))}
              </select>
              <button onClick={addDropPin} className="px-4 rounded-xl bg-[#FF1493] text-white text-[10px] font-black uppercase tracking-widest">Add</button>
            </div>
            {extraDropPins.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {extraDropPins.map((pin) => (
                  <button
                    key={pin}
                    onClick={() => removeDropPin(pin)}
                    className="px-3 py-1.5 rounded-full bg-white border border-pink-200 text-[10px] font-black text-[#FF1493]"
                    title="Remove drop pin"
                  >
                    {pin} ✕
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] font-bold text-gray-500">Add up to 5 extra drop points for one trip.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Sender name" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#FF1493] outline-none font-bold" />
            <input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="Receiver name" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#FF1493] outline-none font-bold" />
          </div>
          <textarea value={dropoffNote} onChange={(e) => setDropoffNote(e.target.value)} placeholder="Drop-off note (landmark / gate / contact)" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#FF1493] outline-none font-bold min-h-[84px]"></textarea>
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Parcel Type</p>
          <div className="grid grid-cols-2 gap-2">
            {(['DOCUMENT', 'SMALL', 'MEDIUM', 'LARGE'] as ParcelType[]).map((kind) => (
              <button
                key={kind}
                onClick={() => setParcel(kind)}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${parcel === kind ? 'bg-[#FF1493] text-white' : 'bg-gray-100 text-gray-500'
                  }`}
              >
                {kind}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Estimated Distance: {km.toFixed(2)} km • {Math.max(1, routeStops.length - 1)} stops</p>
          {distanceSource === 'fallback' && (
            <>
              <p className="text-[10px] font-bold text-amber-600">Some places are custom. Adjust fallback distance:</p>
              <input type="range" min={1} max={25} value={manualKm} onChange={(e) => setManualKm(Number(e.target.value))} className="w-full accent-[#FF1493]" />
            </>
          )}
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-700">Service Speed</span>
            <div className="flex gap-2">
              {(['STANDARD', 'RUSH'] as ServiceSpeed[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setSpeed(option)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${speed === option ? 'bg-[#FF1493] text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xs font-black text-gray-700">Fragile Item Handling</span>
            <input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} className="w-4 h-4 accent-[#FF1493]" />
          </label>
          <label className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xs font-black text-gray-700">Insurance Protection</span>
            <input type="checkbox" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} className="w-4 h-4 accent-[#FF1493]" />
          </label>
        </div>

        <div className="bg-white rounded-[30px] border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">ETA</p>
            <p className="text-sm font-black text-[#FF1493]">{eta}</p>
          </div>
          {dropoffCode && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-[#FF1493]/10 text-[#FF1493] text-[10px] font-black uppercase tracking-widest text-center">
              Drop-off Code: {dropoffCode}
            </div>
          )}
          <div className="space-y-2 text-xs font-black text-gray-500">
            <div className="flex justify-between"><span>Base</span><span>₱{quote.base.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Distance</span><span>₱{quote.distanceFee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Multi-stop</span><span>₱{quote.multipointFee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Speed</span><span>₱{quote.speedFee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Fragile</span><span>₱{quote.fragileFee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Insurance</span><span>₱{quote.insuranceFee.toFixed(2)}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-base font-black uppercase">Total</span>
            <span className="text-2xl font-black text-[#FF1493]">₱{quote.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto p-4">
        <div className="space-y-2">
          <Button onClick={bookCourier} disabled={!pickup.trim() || !dropoff.trim() || !sender.trim() || !receiver.trim() || booking} className="py-4 text-sm font-black uppercase tracking-widest">
            {booking ? bookStatus : tripStatus === 'DELIVERED' ? 'Book New Drop-off' : 'Book Drop-off Delivery'}
          </Button>
          {routeProgress > 0 && tripStatus !== 'DELIVERED' && !isSimulatingRoute && (
            <button
              onClick={() => setIsSimulatingRoute(true)}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest"
            >
              Resume Live Map
            </button>
          )}
          {routeProgress > 0 && tripStatus !== 'DELIVERED' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-3 rounded-xl bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest"
            >
              Cancel Delivery
            </button>
          )}
          {tripStatus === 'DELIVERED' && (
            <button
              onClick={() => {
                setRouteProgress(0);
                setTripStatus('IDLE');
                setBookStatus('');
                setDropoffCode('');
                setIsSimulatingRoute(false);
              }}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest"
            >
              Reset Simulation
            </button>
          )}
        </div>
      </div>

      <BottomNav active="COURIER" onNavigate={onNavigate} mode="customer" />

      {/* CANCEL COURIER MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-8">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center text-4xl">
              ❌
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Cancel Delivery?</h3>
              <p className="text-sm font-bold text-gray-500 mt-2">Are you sure you want to cancel this courier delivery?</p>
            </div>
            <div className="space-y-3">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#FF1493] outline-none font-bold text-sm min-h-[80px]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleCancelCourier}
                disabled={isCancelling}
                className="w-full py-4 text-base font-black uppercase bg-red-500 text-white rounded-2xl"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Delivery'}
              </Button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest"
              >
                No, Keep Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courier;
