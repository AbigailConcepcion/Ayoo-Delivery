import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../components/ToastContext';
import Button from '../components/Button';
import { Restaurant, OrderRecord, OrderStatus, UserAccount, OrderTrackingStatus } from '../types';
import { ayooCloud } from '../api';
import { db } from '../db';
import NotificationPanel from '../components/NotificationPanel';
import {
  notifyOrderAccepted,
  notifyOrderPreparing,
  notifyOrderReady,
  notifyOrderPickedUp,
  notifyOrderDelivered,
  notifyStatusUpdate,
  getRandomRider,
  RiderProfile,
  SAMPLE_LOCATIONS,
  MapCoordinates
} from '../src/utils/notifications';

interface OrderTrackingProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  orderItems?: { id: string; quantity: number }[];
  restaurant?: Restaurant | null;
  deliveryCity: string;
  customerEmail: string;
  currentUser?: UserAccount | null;
  onOpenMessages?: (conversationId?: string) => void;
  onReorder?: (items: { id: string; quantity: number }[]) => void;
}

const MAP_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Mock realistic orders for demonstration
const MOCK_ACTIVE_ORDERS: OrderRecord[] = [
  {
    id: 'AYO-78452',
    date: new Date().toLocaleDateString(),
    items: [
      { name: 'Chicken Joy Bucket', quantity: 2, price: 189, id: '1' },
      { name: 'Jolly Spaghetti', quantity: 1, price: 99, id: '2' },
      { name: 'Burger Steak', quantity: 1, price: 149, id: '3' }
    ],
    total: 626,
    status: 'OUT_FOR_DELIVERY',
    restaurantName: 'Jollibee - Iligan',
    customerEmail: 'user@ayoo.ph',
    customerName: 'John Doe',
    riderName: 'Marco Reyes',
    riderEmail: 'rider.marco@ayoo.ph',
    deliveryAddress: 'Tibanga, Iligan City',
    paymentMethod: 'GCASH',
    isPaid: true,
    transactionId: 'TXN-2024-78452',
    pointsEarned: 62
  },
  {
    id: 'AYO-89231',
    date: new Date().toLocaleDateString(),
    items: [
      { name: 'Chicken Inasal', quantity: 1, price: 165, id: '4' },
      { name: 'Pancit Canton', quantity: 2, price: 85, id: '5' }
    ],
    total: 335,
    status: 'PREPARING',
    restaurantName: 'Chicken Inasal - HD',
    customerEmail: 'user@ayoo.ph',
    customerName: 'John Doe',
    riderName: 'Jenny Lopez',
    riderEmail: 'rider.jenny@ayoo.ph',
    deliveryAddress: 'Tibanga, Iligan City',
    paymentMethod: 'CASH ON DELIVERY',
    isPaid: true,
    transactionId: 'TXN-2024-89231',
    pointsEarned: 33
  }
];

const OrderTracking: React.FC<OrderTrackingProps> = ({
  onBack,
  restaurant,
  deliveryCity,
  customerEmail,
  currentUser,
  onOpenMessages,
  onReorder
}) => {
  const { showToast, notifications, markAsRead, markAllAsRead } = useToast();
  const [liveOrder, setLiveOrder] = useState<OrderRecord | null>(null);
  const [activeOrders, setActiveOrders] = useState<OrderRecord[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderList, setShowOrderList] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'rider', text: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SUMMARY' | 'TIMELINE'>('LIVE');

  // Mock Rider Profile
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);

  // Map coordinates (using Philippine locations)
  const [restaurantLocation] = useState<MapCoordinates>(SAMPLE_LOCATIONS.tibanga);
  const [deliveryLocation] = useState<MapCoordinates>(SAMPLE_LOCATIONS.pala_o);

  // Google Maps Native Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ rider?: any; restaurant?: any; delivery?: any }>({});
  const routeCacheRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [riderProgress, setRiderProgress] = useState(0.6);

  // Load active orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        // Try to get from database first
        const dbOrders = await db.getAllLiveOrders();

        if (dbOrders && dbOrders.length > 0) {
          // Filter for current user
          const userOrders = dbOrders.filter(o =>
            o.customerEmail === customerEmail &&
            o.status !== 'DELIVERED' &&
            o.status !== 'CANCELLED'
          );
          setActiveOrders(userOrders);
        } else {
          // Use mock orders for demonstration
          setActiveOrders(MOCK_ACTIVE_ORDERS);
        }
      } catch (error) {
        // Fallback to mock orders
        setActiveOrders(MOCK_ACTIVE_ORDERS);
      }
    };

    loadOrders();
  }, [customerEmail]);

  // Simulate rider movement along the road path
  useEffect(() => {
    if (!liveOrder || liveOrder.status !== 'OUT_FOR_DELIVERY' || currentPath.length === 0 || !mapInstanceRef.current) {
      return;
    }

    const google = (window as any).google;
    let startTime = performance.now();
    const duration = 30000; // Simulated 30s trip

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const pathIndexProgress = progress * (currentPath.length - 1);
      const index = Math.floor(pathIndexProgress);
      const segmentProgress = pathIndexProgress - index;

      if (index < currentPath.length - 1) {
        const start = currentPath[index];
        const end = currentPath[index + 1];
        const lat = start.lat + (end.lat - start.lat) * segmentProgress;
        const lng = start.lng + (end.lng - start.lng) * segmentProgress;
        const heading = google.maps.geometry.spherical.computeHeading(start, end);

        // NATIVE UPDATE: No re-render triggered
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
  }, [liveOrder?.id, liveOrder?.status, currentPath]);

  // Initialize Google Maps Engine
  useEffect(() => {
    if (activeTab !== 'LIVE' || !MAP_API_KEY || !mapContainerRef.current) return;

    const setupMap = () => {
      const google = (window as any).google;
      if (!google || !mapContainerRef.current) return;

      const map = new google.maps.Map(mapContainerRef.current, {
        center: restaurantLocation,
        zoom: 15,
        disableDefaultUI: true,
        styles: [
          { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#F3E8FF" }] },
          { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#FFFFFF" }] },
          { "featureType": "poi", "stylers": [{ "visibility": "off" }] }
        ]
      });
      mapInstanceRef.current = map;

      // RATE LIMIT PROTECTION: Check if we already requested this route
      const routeKey = `${restaurantLocation.lat},${restaurantLocation.lng}-${deliveryLocation.lat},${deliveryLocation.lng}`;
      if (routeCacheRef.current === routeKey) return;
      routeCacheRef.current = routeKey;

      // PROXIED DIRECTIONS CALL TO SECURE API KEY
      const fetchProxiedDirections = async () => {
        try {
          const response = await fetch(`/api/maps/directions?origin=${restaurantLocation.lat},${restaurantLocation.lng}&destination=${deliveryLocation.lat},${deliveryLocation.lng}`);
          const data = await response.json();

          if (data.status === 'OK' && data.routes.length > 0) {
            const encodedPath = data.routes[0].overview_polyline.points;
            const decodedPath = google.maps.geometry.encoding.decodePath(encodedPath);
            
            const path = decodedPath.map((p: any) => ({
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
            decodedPath.forEach(p => bounds.extend(p));
            map.fitBounds(bounds);
          }
        } catch (err) {
          console.error("Directions Proxy Error:", err);
        }
      };
      fetchProxiedDirections();

      markersRef.current.restaurant = new google.maps.Marker({
        position: restaurantLocation,
        map,
        icon: { url: 'https://maps.google.com/mapfiles/kml/pal2/icon32.png', scaledSize: new google.maps.Size(32, 32) }
      });

      markersRef.current.delivery = new google.maps.Marker({
        position: deliveryLocation,
        map,
        icon: { url: 'https://maps.google.com/mapfiles/kml/pal3/icon56.png', scaledSize: new google.maps.Size(32, 32) }
      });
    };

    if ((window as any).google?.maps) {
      setupMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAP_API_KEY}&libraries=geometry`;
      script.async = true;
      script.onload = setupMap;
      document.body.appendChild(script);
    }
  }, [activeTab]);

  // Update Rider Position in real-time
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
        markersRef.current.rider.addListener('click', () => { if (riderProfile?.phone) showToast(`Calling ${riderProfile.name}...`); });
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
  }, [riderLocation, riderRotation, riderProfile, showToast]);

  const isOrderPaid = (order?: OrderRecord | null) => {
    if (!order) return false;
    return order.isPaid === true || Number(order.isPaid || 0) === 1;
  };

  const needsPayMongoSync = (order?: OrderRecord | null) => {
    if (!order) return false;
    const method = String(order.paymentMethod || '').toUpperCase();
    const isDigital = Boolean(method) && method !== 'COD' && method !== 'CASH';
    return isDigital && !isOrderPaid(order) && order.status !== 'CANCELLED';
  };

  // 1. QUANTUM ETA ENGINE: Dynamic time calculation based on status
  const calculateETA = (status?: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'Waiting for Store...';
      case 'ACCEPTED': return '15-20 mins';
      case 'PREPARING': return '10-15 mins';
      case 'READY_FOR_PICKUP': return '8-10 mins';
      case 'OUT_FOR_DELIVERY': return '3-5 mins';
      case 'DELIVERED': return 'Arrived!';
      case 'CANCELLED': return 'Order Cancelled';
      default: return 'Calculating...';
    }
  };

  // Get status color
  const getStatusColor = (status?: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'text-amber-500';
      case 'ACCEPTED': return 'text-blue-500';
      case 'PREPARING': return 'text-orange-500';
      case 'READY_FOR_PICKUP': return 'text-purple-500';
      case 'OUT_FOR_DELIVERY': return 'text-green-500';
      case 'DELIVERED': return 'text-green-600';
      case 'CANCELLED': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status?: OrderStatus) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'ACCEPTED': return '✅';
      case 'PREPARING': return '👨‍🍳';
      case 'READY_FOR_PICKUP': return '📦';
      case 'OUT_FOR_DELIVERY': return '🛵';
      case 'DELIVERED': return '🎉';
      case 'CANCELLED': return '❌';
      default: return '📋';
    }
  };

  // Select an order to track
  const selectOrder = (order: OrderRecord) => {
    setSelectedOrderId(order.id);
    setLiveOrder(order);
    setShowOrderList(false);

    // Assign rider if not assigned
    if (!order.riderName) {
      const rider = getRandomRider();
      setRiderProfile(rider);
    } else {
      // Use a random rider from the pool
      const rider = getRandomRider();
      rider.name = order.riderName || rider.name;
      setRiderProfile(rider);
    }

    // Simulate rider movement when out for delivery
    if (order.status === 'OUT_FOR_DELIVERY') {
      setRiderLocation({
        lat: restaurantLocation.lat + (deliveryLocation.lat - restaurantLocation.lat) * 0.6,
        lng: restaurantLocation.lng + (deliveryLocation.lng - restaurantLocation.lng) * 0.6
      });
    }
  };

  // Go back to order list
  const goBackToList = () => {
    setShowOrderList(true);
    setSelectedOrderId(null);
    setLiveOrder(null);
  };

  // 2. ROBUST REFRESH LOGIC: Prevents "Sync Disruption" in Customer UI
  const refresh = useCallback(async () => {
    if (!showOrderList && selectedOrderId) {
      try {
        const allOrders = await db.getAllLiveOrders();
        const myOrder = allOrders
          .filter(o => o.customerEmail === customerEmail && o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
          .sort((a, b) => Number(b.id) - Number(a.id))[0];

        if (myOrder) {
          if (!myOrder.riderEmail && !riderProfile) {
            const rider = getRandomRider();
            setRiderProfile(rider);
            myOrder.riderName = rider.name;
            myOrder.riderEmail = 'rider@ayoo.ph';
          }

          if (needsPayMongoSync(myOrder)) {
            const synced = await ayooCloud.syncPayMongoOrder(myOrder.id);
            setLiveOrder(synced || myOrder);
          } else {
            setLiveOrder(myOrder);
          }

          if (myOrder.status === 'OUT_FOR_DELIVERY') {
            setRiderLocation({
              lat: restaurantLocation.lat + (deliveryLocation.lat - restaurantLocation.lat) * 0.6,
              lng: restaurantLocation.lng + (deliveryLocation.lng - restaurantLocation.lng) * 0.6
            });
          }
        }
      } catch (err) {
        console.error("Tracking Sync Fault:", err);
      }
    }
  }, [customerEmail, riderProfile, restaurantLocation, deliveryLocation, showOrderList, selectedOrderId]);

  // Initialize rider profile
  useEffect(() => {
    if (liveOrder?.riderName && !riderProfile) {
      setRiderProfile(getRandomRider());
    }
  }, [liveOrder?.riderName]);

  useEffect(() => {
    refresh();
    const unsubscribe = ayooCloud.subscribe(refresh);
    const timer = setInterval(refresh, 5000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    if (liveOrder?.status === 'DELIVERED') {
      setShowFeedbackModal(true);
      notifyOrderDelivered(liveOrder.id, liveOrder.riderName || 'Rider');
    } else if (liveOrder?.status) {
      notifyStatusUpdate(liveOrder.id, liveOrder.status);
    }
  }, [liveOrder?.status]);

  // Auto-notify when status changes
  useEffect(() => {
    if (!liveOrder) return;

    switch (liveOrder.status) {
      case 'ACCEPTED':
        notifyOrderAccepted(liveOrder.id, liveOrder.restaurantName);
        break;
      case 'PREPARING':
        notifyOrderPreparing(liveOrder.id);
        break;
      case 'READY_FOR_PICKUP':
        notifyOrderReady(liveOrder.id, liveOrder.restaurantName);
        break;
      case 'OUT_FOR_DELIVERY':
        notifyOrderPickedUp(liveOrder.id, liveOrder.riderName || 'Rider');
        break;
    }
  }, [liveOrder?.status]);

  const getStatusIndex = (status?: OrderStatus) => {
    if (!status) return 0;
    const map: Record<string, number> = {
      'PENDING': 0,
      'ACCEPTED': 1,
      'PREPARING': 1,
      'READY_FOR_PICKUP': 2,
      'OUT_FOR_DELIVERY': 2,
      'DELIVERED': 3,
      'CANCELLED': 0
    };
    return map[status] ?? 0;
  };

  const statusIdx = liveOrder ? getStatusIndex(liveOrder.status) : 0;
  const progressMap = [10, 45, 80, 100];
  const currentProgress = progressMap[statusIdx];

  // Render order list view
  if (showOrderList) {
    return (
      <div className="bg-white min-h-screen flex flex-col pb-32 overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#C084FC] via-[#A78BFA] to-[#8B5CF6] p-8 pb-12 rounded-b-[60px] text-white shadow-2xl relative z-20">
          <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">←</button>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNotifications(true)}
                className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-lg relative"
              >
                🔔
                {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C084FC] rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-lg">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none drop-shadow-lg">
            📍 My Orders
          </h2>
          <p className="text-white/80 mt-2 font-medium">Track your active deliveries</p>
        </div>

        {/* Active Orders List */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
            Active Deliveries ({activeOrders.length})
          </h3>

          {activeOrders.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-400 font-bold">No active orders</p>
              <p className="text-gray-300 text-sm mt-2">Your orders will appear here</p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => selectOrder(order)}
                className="bg-white border-2 border-gray-100 rounded-[30px] p-6 shadow-sm hover:shadow-lg hover:border-[#C084FC]/30 transition-all cursor-pointer"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                    <p className="text-lg font-black text-gray-900">{order.id}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full ${getStatusColor(order.status)} bg-gray-50`}>
                    <span className="text-lg mr-1">{getStatusIcon(order.status)}</span>
                    <span className="text-xs font-black uppercase tracking-widest">
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Restaurant */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#C084FC] to-[#A855F7] rounded-2xl flex items-center justify-center text-white text-xl">
                    🍔
                  </div>
                  <div>
                    <p className="font-black text-gray-900">{order.restaurantName}</p>
                    <p className="text-xs text-gray-400">{order.items.length} items</p>
                  </div>
                </div>

                {/* Status & ETA */}
                <div className="flex justify-between items-center py-3 border-t border-b border-gray-100 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Status</p>
                    <p className={`font-black ${getStatusColor(order.status)}`}>
                      {order.status === 'OUT_FOR_DELIVERY' ? 'On the way' :
                        order.status === 'PREPARING' ? 'Preparing your food' :
                          order.status.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">ETA</p>
                    <p className="font-black text-[#C084FC]">{calculateETA(order.status)}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {order.isPaid ? (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        ✓ Paid
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                        COD
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {order.paymentMethod}
                    </span>
                  </div>
                  <p className="text-xl font-black text-gray-900">₱{order.total}</p>
                </div>

                {/* Rider (if assigned) */}
                {order.riderName && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                      {order.riderName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">Delivery Partner</p>
                      <p className="font-bold text-gray-900">{order.riderName}</p>
                    </div>
                    <button className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                      📞
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Notification Panel */}
        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />
        )}
      </div>
    );
  }

  // Render detailed tracking view
  return (
    <div className="bg-white min-h-screen flex flex-col pb-32 overflow-hidden font-sans">
      {/* 3. DYNAMIC HEADER WITH ETA - ENHANCED GRAB-LIKE */}
      <div className="bg-gradient-to-r from-[#C084FC] via-[#A78BFA] to-[#8B5CF6] p-8 pb-16 rounded-b-[60px] text-white shadow-2xl relative z-20">
        <div className="flex justify-between items-center mb-6">
          <button onClick={goBackToList} className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">←</button>
          <div className="flex gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-lg relative"
            >
              🔔
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C084FC] rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-lg">
                    {notifications.filter(n => !n.read).length}
                  </span>
              )}
            </button>

            {liveOrder && liveOrder.status && liveOrder.status !== 'DELIVERED' && liveOrder.status !== 'CANCELLED' && (
              <button onClick={async () => {
                if (liveOrder) {
                  await ayooCloud.updateOrderStatus(liveOrder.id, 'CANCELLED');
                  await db.updateOrderStatus(liveOrder.id, 'CANCELLED');
                  setLiveOrder({ ...liveOrder, status: 'CANCELLED' } as any);
                  showToast('Order cancelled');
                }
              }} className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-lg">❌</button>
            )}
            {liveOrder && liveOrder.status === 'DELIVERED' && onReorder && (
              <button
                onClick={() => {
                  const reorderItems = liveOrder.items
                    .map((i: any) => ({ id: i.id, quantity: i.quantity }))
                    .filter((i: any) => Boolean(i.id));
                  if (reorderItems.length > 0) onReorder(reorderItems);
                }}
                className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-lg"
              >
                ↻
              </button>
            )}
            <button onClick={async () => {
              if (currentUser && liveOrder) {
                const riderEmail = liveOrder.riderEmail || '';
                const riderName = liveOrder.riderName || 'Rider';

                if (riderEmail) {
                  const convo = await db.getOrCreateConversation(
                    currentUser.email,
                    currentUser.name,
                    (currentUser.role || 'CUSTOMER') as 'CUSTOMER' | 'MERCHANT' | 'RIDER',
                    riderEmail,
                    riderName,
                    'RIDER',
                    liveOrder.id,
                    liveOrder.status
                  );
                  if (onOpenMessages) {
                    onOpenMessages(convo.id);
                  }
                } else {
                  showToast('No rider assigned yet');
                }
              } else {
                showToast('Please log in to use messaging');
              }
            }} className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-lg">💬</button>
          </div>
        </div>

        <h2 className="text-4xl font-black uppercase tracking-tighter leading-none drop-shadow-lg">
          {statusIdx === 3 ? '🎉 Arrived!' : '📍 Live Tracking'}
        </h2>

        {/* Order ID Badge */}
        <div className="flex items-center gap-2 mt-2">
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
            {liveOrder?.id}
          </span>
          <span className="text-white/60">•</span>
          <span className="text-white/80 text-sm">{liveOrder?.restaurantName}</span>
        </div>

        {/* ETA CARD - GRAB STYLE */}
        <div className="bg-white/20 backdrop-blur-xl p-6 mt-6 rounded-[30px] border border-white/20 flex justify-between items-center shadow-xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Estimated Arrival</p>
            <h3 className="text-3xl font-black mt-1">{calculateETA(liveOrder?.status)}</h3>
          </div>
          <div className="text-right">
            <div className="flex gap-1 justify-end mb-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full ${i <= statusIdx + 1 ? 'bg-white' : 'bg-white/30'}`}></div>
              ))}
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Ayoo Express</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 space-y-10 overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-2xl">
          {(['LIVE', 'SUMMARY', 'TIMELINE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'bg-white text-[#C084FC] shadow' : 'text-gray-500'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 4. REALISTIC MAP VISUALS WITH ROUTE */}
        {activeTab === 'LIVE' && (
          <div className="w-full h-80 rounded-[40px] overflow-hidden shadow-inner bg-gray-100 border-2 border-gray-50 relative">
            {MAP_API_KEY ? (
              <div ref={mapContainerRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center"><p className="text-[10px] font-black uppercase text-gray-400">Google Maps API Key Required</p></div>
            )}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-[#C084FC] shadow-sm">Google Maps Native</div>
          </div>
        )}

        {!liveOrder ? (
          <div className="py-20 text-center opacity-40">
            <div className="w-12 h-1 bg-[#C084FC]/20 mx-auto mb-4 rounded-full animate-pulse"></div>
            <p className="font-black uppercase tracking-widest text-[9px]">Awaiting Dispatch Node...</p>
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            {activeTab === 'SUMMARY' && (
              <div className="bg-white border-2 border-gray-50 rounded-[45px] p-8 shadow-sm">
                <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-6">Payment and Delivery Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="font-bold text-gray-500">Order ID</span><span className="font-black">{liveOrder.id}</span></div>
                  <div className="flex justify-between text-sm"><span className="font-bold text-gray-500">Restaurant</span><span className="font-black">{liveOrder.restaurantName}</span></div>
                  <div className="flex justify-between text-sm"><span className="font-bold text-gray-500">Payment Method</span><span className="font-black">{liveOrder.paymentMethod || 'COD'}</span></div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-500">Payment Status</span>
                    <span className={`font-black ${isOrderPaid(liveOrder) ? 'text-green-600' : liveOrder.status === 'CANCELLED' ? 'text-red-500' : 'text-amber-500'}`}>
                      {isOrderPaid(liveOrder) ? '✓ PAID' : liveOrder.status === 'CANCELLED' ? 'FAILED' : 'PENDING'}
                    </span>
                  </div>
                  {liveOrder.transactionId && (
                    <div className="flex justify-between text-sm"><span className="font-bold text-gray-500">Transaction ID</span><span className="font-black text-xs">{liveOrder.transactionId}</span></div>
                  )}
                  <div className="flex justify-between text-sm"><span className="font-bold text-gray-500">Delivery Address</span><span className="font-black text-right max-w-[180px]">{liveOrder.deliveryAddress}</span></div>
                </div>
              </div>
            )}

            {activeTab === 'TIMELINE' && (
              <div className="bg-white border-2 border-gray-50 rounded-[45px] p-8 shadow-sm">
                <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-6">Status Timeline</h3>
                <div className="space-y-4">
                  {(['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] as OrderTrackingStatus[]).map((status, idx) => {
                    const done = getStatusIndex(liveOrder.status) >= getStatusIndex(status);
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${done ? 'bg-[#C084FC] text-white' : 'bg-gray-100 text-gray-400'}`}>{idx + 1}</div>
                        <p className={`text-xs font-black uppercase tracking-widest ${done ? 'text-gray-900' : 'text-gray-400'}`}>{status.replaceAll('_', ' ')}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ENHANCED RIDER INFO CARD */}
            <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-[40px] border-2 border-[#C084FC]/10 shadow-lg">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-gradient-to-br from-[#C084FC] to-[#A855F7] rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl overflow-hidden">
                  {riderProfile?.avatar ? (
                    <img src={riderProfile.avatar} alt={riderProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    liveOrder.riderName?.[0] || 'R'
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-xl text-gray-900 leading-none">
                    {riderProfile?.name || liveOrder.riderName || 'Looking for Rider'}
                  </h4>
                  {riderProfile && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-amber-400 text-sm">⭐</span>
                      <span className="text-sm font-bold text-gray-600">{riderProfile.rating}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-bold text-gray-500">{riderProfile.totalDeliveries} deliveries</span>
                    </div>
                  )}
                  <p className="text-[10px] font-bold text-[#C084FC] uppercase tracking-[0.2em] mt-2">
                    {riderProfile ? `${riderProfile.vehicleColor} ${riderProfile.vehicleType} • ${riderProfile.vehiclePlate}` : 'Active Logistics Partner'}
                  </p>
                </div>
                {riderProfile && (
                  <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                    📞
                  </div>
                )}
              </div>
            </div>

            {/* ORDER ITEMS */}
            {activeTab !== 'TIMELINE' && (
              <div className="bg-white border-2 border-gray-50 rounded-[45px] p-8 shadow-sm">
                <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-6">Manifest Summary</h3>
                {liveOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center mb-4 last:mb-0">
                    <span className="text-sm font-black text-gray-800">{it.quantity}x {it.name}</span>
                    <span className="text-xs font-bold text-gray-400">₱{it.price * it.quantity}</span>
                  </div>
                ))}
                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-black text-lg text-gray-900">Total</span>
                  <span className="text-2xl font-black text-[#C084FC]">₱{liveOrder.total}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. FEEDBACK MODAL (END OF FLOW) */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-2xl flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[60px] p-12 animate-in slide-in-from-bottom-20 duration-500 shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-10"></div>
            <div className="text-center mb-10">
              <span className="text-6xl inline-block mb-6">🎉</span>
              <h3 className="text-4xl font-black uppercase tracking-tighter text-gray-900 leading-none">Delivered!</h3>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-4">Help us improve the Ayoo Fleet</p>
            </div>
            <div className="flex justify-center gap-4 mb-10">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} className={`text-4xl transition-all ${rating >= star ? 'scale-125' : 'grayscale opacity-20'}`}>⭐</button>
              ))}
            </div>
            <Button
              onClick={async () => {
                setIsSubmitting(true);
                await ayooCloud.submitFeedback(liveOrder!.id, rating, comment, tip);
                setIsSubmitting(false);
                goBackToList();
              }}
              disabled={isSubmitting || rating === 0}
              className="py-6 text-xl font-black uppercase tracking-widest rounded-3xl"
            >
              {isSubmitting ? 'Finalizing...' : 'Close Tracker'}
            </Button>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
      )}
    </div>
  );
};

export default OrderTracking;
