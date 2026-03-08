import React, { useState, useEffect, useCallback } from 'react';
import { AppScreen, OrderRecord, OrderStatus } from '../types';
import BottomNav from '../components/BottomNav';
import Button from '../components/Button';
import { ayooCloud } from '../api';
import { db } from '../db';
import MapItinerary from '../components/MapItinerary';
import NotificationPanel from '../components/NotificationPanel';
import {
   getRandomRider,
   RiderProfile,
   SAMPLE_LOCATIONS,
   MapCoordinates,
   notifyOrderAccepted,
   notifyOrderPreparing,
   notifyOrderReady,
   notifyOrderPickedUp,
   notifyOrderDelivered,
   notifyStatusUpdate
} from '../src/utils/notifications';
import { useToast } from '../components/ToastContext';

interface HistoryProps {
   onBack: () => void;
   orders: OrderRecord[];
   onNavigate: (s: AppScreen) => void;
}

// Mock active orders for live tracking demonstration
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

const History: React.FC<HistoryProps> = ({ onBack, orders, onNavigate }) => {
   const { showToast, notifications, markAsRead, markAllAsRead } = useToast();
   const [showReviewModal, setShowReviewModal] = useState(false);
   const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
   const [rating, setRating] = useState(0);
   const [comment, setComment] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Live tracking state
   const [activeTab, setActiveTab] = useState<'LIVE' | 'HISTORY'>('LIVE');
   const [activeOrders, setActiveOrders] = useState<OrderRecord[]>([]);
   const [selectedActiveOrder, setSelectedActiveOrder] = useState<OrderRecord | null>(null);
   const [showNotifications, setShowNotifications] = useState(false);
   const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
   const [showFeedbackModal, setShowFeedbackModal] = useState(false);

   // Map coordinates
   const [restaurantLocation] = useState<MapCoordinates>(SAMPLE_LOCATIONS.tibanga);
   const [deliveryLocation] = useState<MapCoordinates>(SAMPLE_LOCATIONS.pala_o);
   const [riderLocation, setRiderLocation] = useState<MapCoordinates | undefined>();

   // Load active orders
   useEffect(() => {
      const loadActiveOrders = async () => {
         try {
            const dbOrders = await db.getAllLiveOrders();
            if (dbOrders && dbOrders.length > 0) {
               const userOrders = dbOrders.filter(o =>
                  o.status !== 'DELIVERED' &&
                  o.status !== 'CANCELLED'
               );
               setActiveOrders(userOrders);
            } else {
               // Use mock orders for demonstration
               setActiveOrders(MOCK_ACTIVE_ORDERS);
            }
         } catch (error) {
            setActiveOrders(MOCK_ACTIVE_ORDERS);
         }
      };
      loadActiveOrders();
   }, []);

   // Calculate ETA based on status
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

   // Select active order for tracking
   const selectActiveOrder = (order: OrderRecord) => {
      setSelectedActiveOrder(order);

      if (!order.riderName) {
         const rider = getRandomRider();
         setRiderProfile(rider);
      } else {
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

   // Get status index for progress
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

   const statusIdx = selectedActiveOrder ? getStatusIndex(selectedActiveOrder.status) : 0;
   const progressMap = [10, 45, 80, 100];
   const currentProgress = progressMap[statusIdx];

   // Back to active orders list
   const goBackToList = () => {
      setSelectedActiveOrder(null);
   };

   // Handle review modal
   const openReviewModal = (order: OrderRecord) => {
      setSelectedOrder(order);
      setRating(order.rating || 0);
      setComment(order.comment || '');
      setShowReviewModal(true);
   };

   const handleSubmitReview = async () => {
      if (!selectedOrder) return;
      setIsSubmitting(true);
      try {
         await ayooCloud.submitFeedback(selectedOrder.id, rating, comment, selectedOrder.tipAmount || 0);
         await db.updateOrderStatus(selectedOrder.id, 'DELIVERED', { rating, comment });
         setShowReviewModal(false);
         setSelectedOrder(null);
         setRating(0);
         setComment('');
      } catch (err) {
         console.error('Failed to submit review:', err);
      }
      setIsSubmitting(false);
   };

   // Completed orders (history)
   const completedOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');
   const hasActiveOrders = activeOrders.length > 0;

   return (
      <div className="flex flex-col h-screen bg-gray-50 pb-24 overflow-y-auto scrollbar-hide">
         {/* Header */}
         <div className="bg-gradient-to-r from-[#FF1493] via-[#FF69B4] to-[#FF1493] p-6 pb-10 rounded-b-[50px] shadow-xl text-white relative">
            <div className="flex justify-between items-center mb-4">
               <button onClick={onBack} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">←</button>
               <button
                  onClick={() => setShowNotifications(true)}
                  className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-lg relative"
               >
                  🔔
                  {notifications.filter(n => !n.read).length > 0 && (
                     <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-black flex items-center justify-center">
                        {notifications.filter(n => !n.read).length}
                     </span>
                  )}
               </button>
            </div>

            <h2 className="text-3xl font-black uppercase tracking-tighter">Your Orders</h2>
            <p className="text-white/80 text-xs font-medium mt-1">
               {hasActiveOrders ? `${activeOrders.length} active delivery • ${completedOrders.length} completed` : `${completedOrders.length} orders completed`}
            </p>

            {/* Tab Switcher */}
            <div className="flex gap-2 mt-6">
               <button
                  onClick={() => { setActiveTab('LIVE'); setSelectedActiveOrder(null); }}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'LIVE'
                        ? 'bg-white text-[#FF1493] shadow-lg'
                        : 'bg-white/20 text-white/70'
                     }`}
               >
                  📍 Live Track
                  {hasActiveOrders && (
                     <span className="ml-1 w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse"></span>
                  )}
               </button>
               <button
                  onClick={() => { setActiveTab('HISTORY'); setSelectedActiveOrder(null); }}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY'
                        ? 'bg-white text-[#FF1493] shadow-lg'
                        : 'bg-white/20 text-white/70'
                     }`}
               >
                  📑 History
               </button>
            </div>
         </div>

         {/* LIVE TRACKING TAB */}
         {activeTab === 'LIVE' && (
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
               {!selectedActiveOrder ? (
                  // Active Orders List
                  <>
                     <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                        Active Deliveries ({activeOrders.length})
                     </h3>

                     {activeOrders.length === 0 ? (
                        <div className="py-16 text-center">
                           <div className="text-6xl mb-4">📦</div>
                           <p className="text-gray-400 font-bold">No active orders</p>
                           <p className="text-gray-300 text-xs mt-2">Your active deliveries will appear here</p>
                        </div>
                     ) : (
                        activeOrders.map((order) => (
                           <div
                              key={order.id}
                              onClick={() => selectActiveOrder(order)}
                              className="bg-white border-2 border-gray-100 rounded-[30px] p-5 shadow-sm hover:shadow-lg hover:border-[#FF1493]/30 transition-all cursor-pointer"
                           >
                              <div className="flex justify-between items-start mb-3">
                                 <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                                    <p className="text-lg font-black text-gray-900">{order.id}</p>
                                 </div>
                                 <div className={`px-3 py-1.5 rounded-full ${getStatusColor(order.status)} bg-gray-50`}>
                                    <span className="text-sm mr-1">{getStatusIcon(order.status)}</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                       {order.status.replace('_', ' ')}
                                    </span>
                                 </div>
                              </div>

                              <div className="flex items-center gap-3 mb-3">
                                 <div className="w-10 h-10 bg-gradient-to-br from-[#FF1493] to-[#FF69B4] rounded-2xl flex items-center justify-center text-white text-lg">
                                    🍔
                                 </div>
                                 <div>
                                    <p className="font-black text-gray-900 text-sm">{order.restaurantName}</p>
                                    <p className="text-xs text-gray-400">{order.items.length} items</p>
                                 </div>
                              </div>

                              <div className="flex justify-between items-center py-2 border-t border-b border-gray-100 mb-3">
                                 <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Status</p>
                                    <p className={`font-black text-sm ${getStatusColor(order.status)}`}>
                                       {order.status === 'OUT_FOR_DELIVERY' ? 'On the way' :
                                          order.status === 'PREPARING' ? 'Preparing your food' :
                                             order.status.replace('_', ' ')}
                                    </p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">ETA</p>
                                    <p className="font-black text-[#FF1493]">{calculateETA(order.status)}</p>
                                 </div>
                              </div>

                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-2">
                                    {order.isPaid ? (
                                       <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                          ✓ Paid
                                       </span>
                                    ) : (
                                       <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                          COD
                                       </span>
                                    )}
                                 </div>
                                 <p className="text-lg font-black text-gray-900">₱{order.total}</p>
                              </div>

                              {order.riderName && (
                                 <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-black">
                                       {order.riderName[0]}
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-[10px] text-gray-400">Delivery Partner</p>
                                       <p className="font-bold text-gray-900 text-sm">{order.riderName}</p>
                                    </div>
                                    <button className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                                       📞
                                    </button>
                                 </div>
                              )}
                           </div>
                        ))
                     )}
                  </>
               ) : (
                  // Detailed Tracking View
                  <div className="space-y-4">
                     {/* Back Button & Header */}
                     <div className="flex items-center gap-3 mb-2">
                        <button
                           onClick={goBackToList}
                           className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm"
                        >
                           ←
                        </button>
                        <div>
                           <h3 className="font-black text-lg text-gray-900">{selectedActiveOrder.id}</h3>
                           <p className="text-xs text-gray-400">{selectedActiveOrder.restaurantName}</p>
                        </div>
                     </div>

                     {/* ETA Card */}
                     <div className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center">
                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Estimated Arrival</p>
                              <h3 className="text-2xl font-black text-[#FF1493] mt-1">{calculateETA(selectedActiveOrder.status)}</h3>
                           </div>
                           <div className="text-right">
                              <div className="flex gap-1 justify-end mb-2">
                                 {[1, 2, 3].map(i => (
                                    <div
                                       key={i}
                                       className={`w-2 h-2 rounded-full ${i <= statusIdx + 1 ? 'bg-[#FF1493]' : 'bg-gray-200'}`}
                                    ></div>
                                 ))}
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-full">Ayoo Express</span>
                           </div>
                        </div>
                     </div>

                     {/* Map */}
                     <MapItinerary
                        restaurantLocation={restaurantLocation}
                        deliveryLocation={deliveryLocation}
                        riderLocation={riderLocation}
                        riderProfile={riderProfile || undefined}
                        status={selectedActiveOrder.status || 'PENDING'}
                        onRiderClick={() => {
                           if (riderProfile?.phone) {
                              showToast(`Calling ${riderProfile.name}...`);
                           }
                        }}
                     />

                     {/* Rider Info */}
                     <div className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-gradient-to-br from-[#FF1493] to-[#FF69B4] rounded-2xl flex items-center justify-center text-white text-xl font-black overflow-hidden">
                              {riderProfile?.avatar ? (
                                 <img src={riderProfile.avatar} alt={riderProfile.name} className="w-full h-full object-cover" />
                              ) : (
                                 selectedActiveOrder.riderName?.[0] || 'R'
                              )}
                           </div>
                           <div className="flex-1">
                              <h4 className="font-black text-gray-900">
                                 {riderProfile?.name || selectedActiveOrder.riderName || 'Looking for Rider'}
                              </h4>
                              {riderProfile && (
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-amber-400 text-xs">⭐</span>
                                    <span className="text-xs font-bold text-gray-600">{riderProfile.rating}</span>
                                    <span className="text-[10px] text-gray-400">•</span>
                                    <span className="text-[10px] text-gray-500">{riderProfile.totalDeliveries} deliveries</span>
                                 </div>
                              )}
                              <p className="text-[10px] font-bold text-[#FF1493] uppercase tracking-[0.2em] mt-1">
                                 {riderProfile ? `${riderProfile.vehicleColor} ${riderProfile.vehicleType}` : 'Active Logistics Partner'}
                              </p>
                           </div>
                           {riderProfile && (
                              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
                                 📞
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Status Timeline */}
                     <div className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100">
                        <h4 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-4">Status Timeline</h4>
                        <div className="space-y-3">
                           {(['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] as OrderStatus[]).map((status, idx) => {
                              const done = getStatusIndex(selectedActiveOrder.status) >= getStatusIndex(status);
                              return (
                                 <div key={status} className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${done ? 'bg-[#FF1493] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                       {idx + 1}
                                    </div>
                                    <p className={`text-xs font-black uppercase tracking-widest ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                                       {status.replaceAll('_', ' ')}
                                    </p>
                                 </div>
                              );
                           })}
                        </div>
                     </div>

                     {/* Order Summary */}
                     <div className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100">
                        <h4 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-4">Order Summary</h4>
                        {selectedActiveOrder.items.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center mb-2">
                              <span className="text-xs font-black text-gray-800">{item.quantity}x {item.name}</span>
                              <span className="text-[10px] font-bold text-gray-400">₱{item.price * item.quantity}</span>
                           </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                           <span className="font-black text-gray-900">Total</span>
                           <span className="text-xl font-black text-[#FF1493]">₱{selectedActiveOrder.total}</span>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         )}

         {/* HISTORY TAB */}
         {activeTab === 'HISTORY' && (
            <div className="flex-1 px-4 pt-4 space-y-4 overflow-y-auto pb-20">
               {completedOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                     <div className="w-20 h-20 bg-pink-50 rounded-[40px] flex items-center justify-center text-4xl mb-4 grayscale opacity-40">🍽️</div>
                     <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-2">No completed orders yet</p>
                     <button
                        onClick={() => onNavigate('HOME')}
                        className="bg-[#FF1493] text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg"
                     >
                        Start Your Journey
                     </button>
                  </div>
               ) : (
                  completedOrders.map(order => (
                     <div key={order.id} className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 group hover:border-[#FF1493]/30 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <p className="text-[8px] font-black text-[#FF1493] uppercase tracking-widest mb-1">{order.id}</p>
                              <h3 className="font-black text-lg text-gray-900 leading-none">{order.restaurantName}</h3>
                              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{order.date}</p>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest ${order.status === 'DELIVERED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                 {order.status}
                              </span>
                              {order.rating && (
                                 <div className="mt-2 flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                       <span key={i} className={`text-[8px] ${i < (order.rating || 0) ? 'grayscale-0' : 'grayscale opacity-30'}`}>⭐</span>
                                    ))}
                                 </div>
                              )}
                              {order.status === 'DELIVERED' && !order.rating && (
                                 <button
                                    onClick={() => openReviewModal(order)}
                                    className="mt-2 px-3 py-1 rounded-xl bg-[#FF1493] text-white text-[8px] font-black uppercase tracking-widest"
                                 >
                                    Write Review
                                 </button>
                              )}
                           </div>
                        </div>

                        <div className="bg-gray-50/50 p-4 rounded-[25px] space-y-2 mb-4">
                           {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-[10px] font-bold text-gray-600">
                                 <span className="font-black">{item.quantity}x <span className="opacity-70">{item.name}</span></span>
                                 <span className="text-gray-400">₱{item.price * item.quantity}</span>
                              </div>
                           ))}
                        </div>

                        <div className="pt-3 flex justify-between items-center border-t border-gray-50">
                           <div className="flex items-center gap-3">
                              {order.tipAmount ? (
                                 <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-gray-400 uppercase">Tip Given</span>
                                    <span className="text-[10px] font-black text-green-500">₱{order.tipAmount} 🛵</span>
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase">Secure Payment</span>
                                 </div>
                              )}
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Paid</p>
                              <span className="font-black text-[#FF1493] text-xl tracking-tighter">₱{order.total + (order.tipAmount || 0)}</span>
                           </div>
                        </div>
                     </div>
                  ))
               )}
            </div>
         )}

         <BottomNav active="HISTORY" onNavigate={onNavigate} mode="customer" />

         {/* REVIEW MODAL */}
         {showReviewModal && selectedOrder && (
            <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-8">
               <div className="bg-white rounded-[40px] p-8 w-full max-w-sm text-center space-y-5 shadow-2xl">
                  <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center text-3xl">
                     ⭐
                  </div>
                  <div>
                     <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Rate Order</h3>
                     <p className="text-xs font-bold text-gray-500 mt-2">How was your experience?</p>
                  </div>
                  <div className="flex justify-center gap-2">
                     {[1, 2, 3, 4, 5].map(star => (
                        <button
                           key={star}
                           onClick={() => setRating(star)}
                           className={`text-3xl transition-all ${rating >= star ? 'scale-125' : 'grayscale opacity-30'}`}
                        >
                           ⭐
                        </button>
                     ))}
                  </div>
                  <textarea
                     value={comment}
                     onChange={(e) => setComment(e.target.value)}
                     placeholder="Write your review (optional)"
                     className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-100 focus:border-[#FF1493] outline-none font-bold text-xs min-h-[60px]"
                  />
                  <div className="flex flex-col gap-2">
                     <Button
                        onClick={handleSubmitReview}
                        disabled={isSubmitting || rating === 0}
                        className="w-full py-3 text-sm font-black uppercase bg-[#FF1493] text-white rounded-2xl"
                     >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                     </Button>
                     <button
                        onClick={() => {
                           setShowReviewModal(false);
                           setSelectedOrder(null);
                           setRating(0);
                           setComment('');
                        }}
                        className="w-full py-2 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest"
                     >
                        Cancel
                     </button>
                  </div>
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

export default History;

