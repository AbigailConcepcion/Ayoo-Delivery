import React, { useState, useEffect } from 'react';
import { MapCoordinates, generateRoute, calculateDistance, estimateDeliveryTime, RiderProfile } from '../src/utils/notifications';

interface MapItineraryProps {
    restaurantLocation: MapCoordinates;
    deliveryLocation: MapCoordinates;
    riderLocation?: MapCoordinates;
    riderProfile?: RiderProfile;
    status: string;
    onRiderClick?: () => void;
}

const MapItinerary: React.FC<MapItineraryProps> = ({
    restaurantLocation,
    deliveryLocation,
    riderLocation,
    riderProfile,
    status,
    onRiderClick,
}) => {
    const [routePoints, setRoutePoints] = useState<MapCoordinates[]>([]);
    const [animatedRiderPos, setAnimatedRiderPos] = useState<number>(0);
    const [distance, setDistance] = useState<number>(0);
    const [eta, setEta] = useState<string>('--');

    useEffect(() => {
        // Generate realistic route
        const route = generateRoute(restaurantLocation, deliveryLocation, 8);
        setRoutePoints(route);

        // Calculate distance
        const dist = calculateDistance(restaurantLocation, deliveryLocation);
        setDistance(dist);

        // Estimate time
        const vehicleType = riderProfile?.vehicleType || 'motorcycle';
        setEta(estimateDeliveryTime(dist, vehicleType));
    }, [restaurantLocation, deliveryLocation, riderProfile]);

    // Animate rider position
    useEffect(() => {
        if (status === 'OUT_FOR_DELIVERY') {
            const interval = setInterval(() => {
                setAnimatedRiderPos(prev => {
                    if (prev >= routePoints.length - 1) {
                        return routePoints.length - 1;
                    }
                    return prev + 0.1;
                });
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [status, routePoints.length]);

    const getProgress = () => {
        switch (status) {
            case 'PENDING': return 0;
            case 'ACCEPTED': return 5;
            case 'PREPARING': return 10;
            case 'READY_FOR_PICKUP': return 20;
            case 'OUT_FOR_DELIVERY': return 20 + (animatedRiderPos / (routePoints.length - 1)) * 70;
            case 'DELIVERED': return 100;
            default: return 0;
        }
    };

    const progress = getProgress();

    // SVG path for route
    const svgWidth = 320;
    const svgHeight = 180;
    const padding = 30;

    const normalizeCoord = (coord: MapCoordinates, idx: number) => {
        const minLat = Math.min(restaurantLocation.lat, deliveryLocation.lat) - 0.005;
        const maxLat = Math.max(restaurantLocation.lat, deliveryLocation.lat) + 0.005;
        const minLng = Math.min(restaurantLocation.lng, deliveryLocation.lng) - 0.005;
        const maxLng = Math.max(restaurantLocation.lng, deliveryLocation.lng) + 0.005;

        const x = padding + ((coord.lng - minLng) / (maxLng - minLng)) * (svgWidth - padding * 2);
        const y = padding + ((maxLat - coord.lat) / (maxLat - minLat)) * (svgHeight - padding * 2);

        return { x, y };
    };

    const routePath = routePoints.length > 0
        ? routePoints.map((p, i) => {
            const { x, y } = normalizeCoord(p, i);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ')
        : '';

    // Get rider position on route
    const getRiderSvgPos = () => {
        if (routePoints.length === 0) return { x: svgWidth / 2, y: svgHeight / 2 };
        const idx = Math.min(Math.floor(animatedRiderPos), routePoints.length - 1);
        const nextIdx = Math.min(idx + 1, routePoints.length - 1);
        const t = animatedRiderPos - idx;

        const curr = normalizeCoord(routePoints[idx], idx);
        const next = normalizeCoord(routePoints[nextIdx], nextIdx);

        return {
            x: curr.x + (next.x - curr.x) * t,
            y: curr.y + (next.y - curr.y) * t,
        };
    };

    const riderPos = getRiderSvgPos();
    const restaurantPos = normalizeCoord(restaurantLocation, 0);
    const deliveryPos = normalizeCoord(deliveryLocation, routePoints.length - 1);

    return (
        <div className="relative w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-[40px] overflow-hidden shadow-inner">
            {/* Map Background Pattern */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `
            linear-gradient(#FF1493 0.5px, transparent 0.5px),
            linear-gradient(90deg, #FF1493 0.5px, transparent 0.5px)
          `,
                    backgroundSize: '20px 20px'
                }}
            ></div>

            {/* Grid Lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                {/* Grid pattern */}
                <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#FF1493" strokeWidth="0.3" opacity="0.2" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Route Line */}
                <path
                    d={routePath}
                    fill="none"
                    stroke="#FF1493"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                />

                {/* Route Progress (filled portion) */}
                {progress > 0 && (
                    <path
                        d={routePath}
                        fill="none"
                        stroke="#FF69B4"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={`${(progress / 100) * 1000} 1000`}
                    />
                )}

                {/* Restaurant Marker */}
                <g>
                    <circle cx={restaurantPos.x} cy={restaurantPos.y} r="8" fill="#FF1493" opacity="0.3" />
                    <circle cx={restaurantPos.x} cy={restaurantPos.y} r="5" fill="#FF1493" />
                    <text x={restaurantPos.x} y={restaurantPos.y - 12} textAnchor="middle" fontSize="8" fill="#FF1493" fontWeight="bold">STORE</text>
                </g>

                {/* Delivery Marker */}
                <g>
                    <circle cx={deliveryPos.x} cy={deliveryPos.y} r="8" fill="#00C853" opacity="0.3" />
                    <circle cx={deliveryPos.x} cy={deliveryPos.y} r="5" fill="#00C853" />
                    <text x={deliveryPos.x} y={deliveryPos.y - 12} textAnchor="middle" fontSize="8" fill="#00C853" fontWeight="bold">HOME</text>
                </g>

                {/* Rider Marker (when out for delivery) */}
                {status === 'OUT_FOR_DELIVERY' && (
                    <g className="animate-bounce" style={{ animationDuration: '2s' }}>
                        <circle cx={riderPos.x} cy={riderPos.y} r="12" fill="#FF69B4" opacity="0.4" />
                        <circle cx={riderPos.x} cy={riderPos.y} r="8" fill="#FF69B4" stroke="white" strokeWidth="2" />
                        <text x={riderPos.x} y={riderPos.y + 20} textAnchor="middle" fontSize="7" fill="#FF1493" fontWeight="bold">🛵 RIDER</text>
                    </g>
                )}
            </svg>

            {/* Status Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
                    <p className="text-[8px] font-black uppercase text-gray-500 tracking-wider">Distance</p>
                    <p className="text-sm font-black text-[#FF1493]">{distance.toFixed(1)} km</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
                    <p className="text-[8px] font-black uppercase text-gray-500 tracking-wider">ETA</p>
                    <p className="text-sm font-black text-[#FF1493]">{eta}</p>
                </div>
            </div>

            {/* Rider Info Card (when assigned) */}
            {riderProfile && status !== 'PENDING' && status !== 'CANCELLED' && (
                <div
                    className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xl rounded-3xl p-4 shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={onRiderClick}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#FF1493] to-[#FF69B4] rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg">
                            {riderProfile.avatar ? (
                                <img src={riderProfile.avatar} alt={riderProfile.name} className="w-full h-full rounded-2xl object-cover" />
                            ) : (
                                riderProfile.name[0]
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-black text-sm text-gray-900">{riderProfile.name}</p>
                                <div className="flex items-center gap-1">
                                    <span className="text-amber-400 text-xs">⭐</span>
                                    <span className="text-[10px] font-bold text-gray-600">{riderProfile.rating}</span>
                                </div>
                            </div>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">
                                {riderProfile.vehicleColor} {riderProfile.vehicleType} • {riderProfile.vehiclePlate}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                            📞
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#FF1493] to-[#FF69B4] rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Delivered State */}
            {status === 'DELIVERED' && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 shadow-2xl text-center">
                        <div className="text-5xl mb-2">🎉</div>
                        <p className="font-black text-xl text-green-600 uppercase">Delivered!</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-1">Order completed successfully</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapItinerary;

