import { OrderStatus, UserRole } from '../../types';

// ==================== NOTIFICATION SYSTEM ====================
// Real-time notifications using BroadcastChannel for cross-tab sync

export interface AyooNotification {
    id: string;
    type: 'ORDER_PLACED' | 'ORDER_ACCEPTED' | 'ORDER_PREPARING' | 'ORDER_READY' | 'ORDER_PICKED_UP' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED' | 'NEW_ORDER' | 'STATUS_UPDATE' | 'ALERT';
    title: string;
    message: string;
    timestamp: string;
    orderId?: string;
    recipientEmail?: string;
    recipientRole?: UserRole;
    data?: any;
    read: boolean;
    sound: boolean;
}

class NotificationManager {
    private channel: BroadcastChannel;
    private subscribers: ((notification: AyooNotification) => void)[] = [];
    private notifications: AyooNotification[] = [];

    constructor() {
        this.channel = new BroadcastChannel('ayoo_notifications_v1');
        this.channel.onmessage = (event) => {
            if (event.data.type === 'NOTIFICATION') {
                const notification = event.data.notification as AyooNotification;
                this.notifications.unshift(notification);
                this.notifySubscribers(notification);
            }
        };
    }

    private notifySubscribers(notification: AyooNotification) {
        this.subscribers.forEach(cb => cb(notification));
    }

    subscribe(callback: (notification: AyooNotification) => void) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    send(notification: Omit<AyooNotification, 'id' | 'timestamp' | 'read'>) {
        const newNotification: AyooNotification = {
            ...notification,
            id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            read: false,
        };

        this.notifications.unshift(newNotification);
        this.channel.postMessage({ type: 'NOTIFICATION', notification: newNotification });
        this.notifySubscribers(newNotification);

        // Play notification sound if enabled
        if (newNotification.sound) {
            this.playNotificationSound();
        }

        return newNotification;
    }

    private playNotificationSound() {
        try {
            // Create a simple beep sound using Web Audio API
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;

            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                audioContext.close();
            }, 150);
        } catch (e) {
            // Audio not supported, ignore
        }
    }

    getAll(): AyooNotification[] {
        return this.notifications;
    }

    getUnread(): AyooNotification[] {
        return this.notifications.filter(n => !n.read);
    }

    markAsRead(id: string) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
    }

    clear() {
        this.notifications = [];
    }
}

export const notificationManager = new NotificationManager();

// ==================== ORDER NOTIFICATION HELPERS ====================

export const notifyOrderPlaced = (orderId: string, customerEmail: string, restaurantName: string) => {
    // Notify merchant
    notificationManager.send({
        type: 'ORDER_PLACED',
        title: '🎉 New Order Received!',
        message: `Order #${orderId} from ${customerEmail} for ₱...`,
        orderId,
        recipientRole: 'MERCHANT',
        sound: true,
    });

    // Notify admin
    notificationManager.send({
        type: 'ORDER_PLACED',
        title: '📦 New Order',
        message: `${restaurantName}: Order #${orderId}`,
        orderId,
        recipientRole: 'ADMIN',
        sound: false,
    });
};

export const notifyOrderAccepted = (orderId: string, merchantName: string, riderEmail?: string) => {
    notificationManager.send({
        type: 'ORDER_ACCEPTED',
        title: '✅ Order Accepted',
        message: `${merchantName} accepted your order!`,
        orderId,
        recipientRole: 'CUSTOMER',
        sound: true,
    });

    if (riderEmail) {
        notificationManager.send({
            type: 'ORDER_ACCEPTED',
            title: '🚴 New Delivery Task',
            message: `You have been assigned to deliver Order #${orderId}`,
            orderId,
            recipientRole: 'RIDER',
            sound: true,
        });
    }
};

export const notifyOrderPreparing = (orderId: string) => {
    notificationManager.send({
        type: 'ORDER_PREPARING',
        title: '👨‍🍳 Preparing Your Order',
        message: 'The merchant is preparing your food',
        orderId,
        recipientRole: 'CUSTOMER',
        sound: false,
    });
};

export const notifyOrderReady = (orderId: string, restaurantName: string) => {
    // Notify customer
    notificationManager.send({
        type: 'ORDER_READY',
        title: '🍔 Ready for Pickup!',
        message: `${restaurantName} - Your order is ready!`,
        orderId,
        recipientRole: 'CUSTOMER',
        sound: true,
    });

    // Notify riders in market
    notificationManager.send({
        type: 'ORDER_READY',
        title: '📍 New Delivery Opportunity',
        message: `Order #${orderId} is ready for pickup at ${restaurantName}`,
        orderId,
        recipientRole: 'RIDER',
        sound: true,
    });
};

export const notifyOrderPickedUp = (orderId: string, riderName: string) => {
    notificationManager.send({
        type: 'ORDER_PICKED_UP',
        title: '🚴 On the Way!',
        message: `${riderName} picked up your order and is on the way`,
        orderId,
        recipientRole: 'CUSTOMER',
        sound: true,
    });
};

export const notifyOrderDelivered = (orderId: string, riderName: string) => {
    notificationManager.send({
        type: 'ORDER_DELIVERED',
        title: '🎉 Order Delivered!',
        message: `Your order has been delivered by ${riderName}. Enjoy!`,
        orderId,
        recipientRole: 'CUSTOMER',
        sound: true,
    });

    notificationManager.send({
        type: 'ORDER_DELIVERED',
        title: '✅ Delivery Complete',
        message: `Order #${orderId} delivered successfully`,
        orderId,
        recipientRole: 'MERCHANT',
        sound: false,
    });
};

export const notifyOrderCancelled = (orderId: string, reason?: string) => {
    notificationManager.send({
        type: 'ORDER_CANCELLED',
        title: '❌ Order Cancelled',
        message: reason || 'Your order has been cancelled',
        orderId,
        recipientRole: 'CUSTOMER',
        sound: true,
    });
};

export const notifyStatusUpdate = (orderId: string, status: OrderStatus, extra?: any) => {
    const statusMessages: Record<OrderStatus, { title: string; message: string }> = {
        'PENDING': { title: '⏳ Order Pending', message: 'Waiting for merchant acceptance' },
        'ACCEPTED': { title: '✅ Order Accepted', message: 'Merchant has accepted your order' },
        'PREPARING': { title: '👨‍🍳 Preparing', message: 'Your food is being prepared' },
        'READY_FOR_PICKUP': { title: '📍 Ready for Pickup', message: 'Order is ready, waiting for rider' },
        'OUT_FOR_DELIVERY': { title: '🚴 On the Way', message: 'Your order is out for delivery' },
        'DELIVERED': { title: '🎉 Delivered!', message: 'Your order has arrived' },
        'CANCELLED': { title: '❌ Cancelled', message: 'Order has been cancelled' },
    };

    const { title, message } = statusMessages[status] || { title: 'Status Update', message: `Order status: ${status}` };

    notificationManager.send({
        type: 'STATUS_UPDATE',
        title,
        message,
        orderId,
        recipientRole: 'CUSTOMER',
        sound: status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED',
        data: extra,
    });
};

// ==================== MOCK RIDER PROFILES ====================

export interface RiderProfile {
    id: string;
    name: string;
    avatar: string;
    phone: string;
    rating: number;
    totalDeliveries: number;
    vehicleType: 'motorcycle' | 'bicycle' | 'car' | 'scooter';
    vehiclePlate: string;
    vehicleColor: string;
    isAvailable: boolean;
    currentLocation?: { lat: number; lng: number };
    joinedDate: string;
}

export const MOCK_RIDERS: RiderProfile[] = [
    {
        id: 'rider-001',
        name: 'Marco Reyes',
        avatar: 'https://i.pravatar.cc/150?u=marco',
        phone: '+63 912 345 6789',
        rating: 4.9,
        totalDeliveries: 1542,
        vehicleType: 'motorcycle',
        vehiclePlate: 'ABC-1234',
        vehicleColor: 'Black',
        isAvailable: true,
        joinedDate: '2023-01-15',
    },
    {
        id: 'rider-002',
        name: 'Jessica Garcia',
        avatar: 'https://i.pravatar.cc/150?u=jessica',
        phone: '+63 917 234 5678',
        rating: 4.8,
        totalDeliveries: 987,
        vehicleType: 'motorcycle',
        vehiclePlate: 'DEF-5678',
        vehicleColor: 'Red',
        isAvailable: true,
        joinedDate: '2023-03-22',
    },
    {
        id: 'rider-003',
        name: 'Aldrin Morales',
        avatar: 'https://i.pravatar.cc/150?u=aldrin',
        phone: '+63 918 456 7890',
        rating: 4.7,
        totalDeliveries: 756,
        vehicleType: 'scooter',
        vehiclePlate: 'GHI-9012',
        vehicleColor: 'White',
        isAvailable: true,
        joinedDate: '2023-05-10',
    },
    {
        id: 'rider-004',
        name: 'Mia Santos',
        avatar: 'https://i.pravatar.cc/150?u=mia',
        phone: '+63 919 567 8901',
        rating: 4.95,
        totalDeliveries: 2103,
        vehicleType: 'motorcycle',
        vehiclePlate: 'JKL-3456',
        vehicleColor: 'Blue',
        isAvailable: true,
        joinedDate: '2022-11-01',
    },
    {
        id: 'rider-005',
        name: 'Kenji Tanaka',
        avatar: 'https://i.pravatar.cc/150?u=kenji',
        phone: '+63 920 678 9012',
        rating: 4.85,
        totalDeliveries: 1234,
        vehicleType: 'car',
        vehiclePlate: 'MNO-7890',
        vehicleColor: 'Silver',
        isAvailable: false,
        joinedDate: '2023-02-14',
    },
];

export const getRandomRider = (): RiderProfile => {
    const availableRiders = MOCK_RIDERS.filter(r => r.isAvailable);
    return availableRiders[Math.floor(Math.random() * availableRiders.length)] || MOCK_RIDERS[0];
};

export const getRiderById = (id: string): RiderProfile | undefined => {
    return MOCK_RIDERS.find(r => r.id === id);
};

// ==================== MAP COORDINATES (Philippines - Iligan City area) ====================

export interface MapCoordinates {
    lat: number;
    lng: number;
}

export const SAMPLE_LOCATIONS: Record<string, MapCoordinates> = {
    // Iligan City landmarks
    'tibanga': { lat: 8.2278, lng: 124.2430 },
    'pala_o': { lat: 8.2350, lng: 124.2450 },
    'aguinaldo': { lat: 8.2300, lng: 124.2410 },
    'bayview': { lat: 8.2280, lng: 124.2380 },
    'central': { lat: 8.2310, lng: 124.2420 },
    'st-marys': { lat: 8.2360, lng: 124.2480 },
    'buru-un': { lat: 8.2200, lng: 124.2350 },
    'kiltepan': { lat: 8.2150, lng: 124.2300 },
};

export const generateRoute = (
    start: MapCoordinates,
    end: MapCoordinates,
    waypoints: number = 5
): MapCoordinates[] => {
    const route: MapCoordinates[] = [start];

    for (let i = 1; i < waypoints; i++) {
        const t = i / waypoints;
        route.push({
            lat: start.lat + (end.lat - start.lat) * t + (Math.random() - 0.5) * 0.002,
            lng: start.lng + (end.lng - start.lng) * t + (Math.random() - 0.5) * 0.002,
        });
    }

    route.push(end);
    return route;
};

export const calculateDistance = (start: MapCoordinates, end: MapCoordinates): number => {
    // Haversine formula simplified - returns distance in km
    const R = 6371; // Earth's radius in km
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLng = (end.lng - start.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const estimateDeliveryTime = (distanceKm: number, vehicleType: RiderProfile['vehicleType']): string => {
    const speeds: Record<RiderProfile['vehicleType'], number> = {
        motorcycle: 30,
        scooter: 25,
        bicycle: 15,
        car: 35,
    };

    const speed = speeds[vehicleType];
    const timeMinutes = Math.round((distanceKm / speed) * 60);

    if (timeMinutes < 5) return '3-5 mins';
    if (timeMinutes < 10) return '7-10 mins';
    if (timeMinutes < 15) return '12-15 mins';
    if (timeMinutes < 20) return '18-20 mins';
    if (timeMinutes < 30) return '25-30 mins';
    return `${timeMinutes}-${timeMinutes + 10} mins`;
};

