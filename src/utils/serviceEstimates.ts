type EstimateConfidence = 'high' | 'medium' | 'low';
type DistanceSource = 'coords' | 'place' | 'fallback';

export interface DistanceEstimate {
  km: number;
  confidence: EstimateConfidence;
  source: DistanceSource;
  fromLabel?: string;
  toLabel?: string;
}

export type CourierSpeed = 'STANDARD' | 'RUSH';
export type CourierParcel = 'DOCUMENT' | 'SMALL' | 'MEDIUM' | 'LARGE';
export type RideType = 'MOTO' | 'CAR' | 'XL';

type Point = { lat: number; lng: number };

const KNOWN_PLACES: Array<{ label: string; aliases: string[]; point: Point }> = [
  { label: 'Iligan City', aliases: ['iligan city', 'iligan', 'city proper'], point: { lat: 8.228, lng: 124.2452 } },
  { label: 'Tibanga', aliases: ['tibanga', 'tibanga highway'], point: { lat: 8.2315, lng: 124.2445 } },
  { label: 'Pala-o', aliases: ['pala-o', 'palao'], point: { lat: 8.2301, lng: 124.2586 } },
  { label: 'Del Carmen', aliases: ['del carmen'], point: { lat: 8.2176, lng: 124.2374 } },
  { label: 'Quezon Ave', aliases: ['quezon ave', 'quezon avenue'], point: { lat: 8.2369, lng: 124.2468 } },
  { label: 'Andres Bonifacio Ave', aliases: ['andres bonifacio', 'bonifacio ave'], point: { lat: 8.2382, lng: 124.2498 } },
  { label: 'Aguinaldo St', aliases: ['aguinaldo', 'aguinaldo st'], point: { lat: 8.2319, lng: 124.2425 } },
  { label: 'Poblacion', aliases: ['poblacion'], point: { lat: 8.2309, lng: 124.242 } },
  { label: 'Baywalk', aliases: ['baywalk', 'coastal road'], point: { lat: 8.2158, lng: 124.2442 } },
  { label: 'Buru-un', aliases: ['buru-un', 'buruun'], point: { lat: 8.1884, lng: 124.2202 } },
  { label: 'Maria Cristina', aliases: ['maria cristina'], point: { lat: 8.1795, lng: 124.2086 } }
];

const toRad = (value: number) => (value * Math.PI) / 180;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();

const haversineKm = (a: Point, b: Point) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const parseLatLng = (value: string): Point | null => {
  const raw = value.trim();
  const match = raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};

const resolvePlace = (raw: string): { label: string; point: Point } | null => {
  const value = normalize(raw);
  if (!value) return null;

  let best: { label: string; point: Point } | null = null;
  let bestScore = 0;

  for (const place of KNOWN_PLACES) {
    for (const alias of place.aliases) {
      const nAlias = normalize(alias);
      let score = 0;
      if (value === nAlias) score += 4;
      if (value.includes(nAlias) || nAlias.includes(value)) score += 2;
      const aliasTokens = nAlias.split(' ');
      const valueTokens = new Set(value.split(' '));
      const overlap = aliasTokens.reduce((acc, token) => acc + (valueTokens.has(token) ? 1 : 0), 0);
      score += overlap;
      if (score > bestScore) {
        best = { label: place.label, point: place.point };
        bestScore = score;
      }
    }
  }

  return bestScore >= 2 ? best : null;
};

export const estimateDistanceKm = (
  fromText: string,
  toText: string,
  fallbackKm = 6
): DistanceEstimate => {
  const fromCoords = parseLatLng(fromText);
  const toCoords = parseLatLng(toText);
  if (fromCoords && toCoords) {
    return {
      km: Math.max(0.8, Number(haversineKm(fromCoords, toCoords).toFixed(2))),
      confidence: 'high',
      source: 'coords',
      fromLabel: 'Coordinates',
      toLabel: 'Coordinates'
    };
  }

  const fromPlace = resolvePlace(fromText);
  const toPlace = resolvePlace(toText);
  if (fromPlace && toPlace) {
    return {
      km: Math.max(0.8, Number(haversineKm(fromPlace.point, toPlace.point).toFixed(2))),
      confidence: 'medium',
      source: 'place',
      fromLabel: fromPlace.label,
      toLabel: toPlace.label
    };
  }

  const blendedFallback = Math.max(1.5, Number(fallbackKm.toFixed(2)));
  return {
    km: blendedFallback,
    confidence: 'low',
    source: 'fallback'
  };
};

const getTrafficMultiplier = () => {
  const hour = new Date().getHours();
  const peak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
  const lateNight = hour >= 22 || hour <= 4;
  if (peak) return 1.2;
  if (lateNight) return 0.9;
  return 1;
};

export const estimateCourierEta = (km: number, speed: CourierSpeed, parcel: CourierParcel) => {
  const dispatchMinutes = speed === 'RUSH' ? 6 : 10;
  const handling: Record<CourierParcel, number> = {
    DOCUMENT: 2,
    SMALL: 4,
    MEDIUM: 6,
    LARGE: 9
  };
  const avgSpeedKmh = speed === 'RUSH' ? 28 : 21;
  const travel = (km / avgSpeedKmh) * 60 * getTrafficMultiplier();
  const base = dispatchMinutes + handling[parcel] + travel;
  const min = Math.max(8, Math.round(base * 0.82));
  const max = Math.max(min + 3, Math.round(base * 1.2));
  return { min, max };
};

export const estimateRideEta = (km: number, type: RideType) => {
  const dispatch: Record<RideType, number> = { MOTO: 4, CAR: 6, XL: 8 };
  const speedKmh: Record<RideType, number> = { MOTO: 30, CAR: 24, XL: 20 };
  const travel = (km / speedKmh[type]) * 60 * getTrafficMultiplier();
  const base = dispatch[type] + travel;
  const min = Math.max(4, Math.round(base * 0.8));
  const max = Math.max(min + 2, Math.round(base * 1.2));
  return { min, max };
};
