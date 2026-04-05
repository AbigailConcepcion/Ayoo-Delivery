import { OrderRecord, OrderStatus, PaymentMethod, WalletTransaction, LeaderboardEntry, LeaderboardPeriod, CommunityPost, Message } from './types';
import { db } from './db';
import { GLOBAL_REGISTRY_KEY } from './constants';
import { io } from 'socket.io-client';

/**
 * Ayoo StreamHub
 * Simulates real-time video broadcasting between Merchant and Customer.
 */
class AyooStreamHub {
  private channel = new BroadcastChannel('ayoo_live_stream_v1');
  private frameSubscribers: ((frame: string) => void)[] = [];

  constructor() {
    this.channel.onmessage = (event) => {
      if (event.data.type === 'FRAME' && event.data.merchantId) {
        this.frameSubscribers.forEach(cb => cb(event.data.frame));
      }
    };
  }

  broadcastFrame(merchantId: string, frame: string) {
    this.channel.postMessage({ type: 'FRAME', merchantId, frame });
  }

  onFrame(callback: (frame: string) => void) {
    this.frameSubscribers.push(callback);
    return () => { this.frameSubscribers = this.frameSubscribers.filter(cb => cb !== callback); };
  }
}

export const streamHub = new AyooStreamHub();

/**
 * Ayoo Location Hub
 * Real-time GPS tracking for orders using WebSockets (with BroadcastChannel fallback)
 */
class AyooLocationHub {
  private channel = new BroadcastChannel('ayoo_location_v1');
  private socket: any = null;
  private subscribers: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.channel.onmessage = (event) => {
      const { orderId, data } = event.data;
      if (orderId && this.subscribers.has(orderId)) {
        this.subscribers.get(orderId)?.forEach(cb => cb(data));
      }
    };

    if (import.meta.env.VITE_USE_REAL_BACKEND === 'true') {
      this.connectSocket();
    }
  }

  private connectSocket() {
    try {
      const wsUrl = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
      const token = localStorage.getItem('ayoo_jwt_v2');
      this.socket = io(wsUrl, { auth: { token } });

      this.socket.on('LOCATION_UPDATE', (msg: any) => {
        if (msg.orderId && this.subscribers.has(msg.orderId)) {
          this.subscribers.get(msg.orderId)?.forEach(cb => cb(msg.data));
        }
      });
    } catch (err) { // In production, integrate with an error reporting service
      console.warn('AyooLocationHub: WS Connection failed', err);
    }
  }

  broadcastLocation(orderId: string, data: { lat: number; lng: number; heading?: number }) {
    const payload = { orderId, data: { ...data, timestamp: Date.now() } };
    this.channel.postMessage(payload);
    if (this.socket?.connected) {
      this.socket.emit('LOCATION_UPDATE', payload);
    }
  }

  subscribe(orderId: string, callback: (data: { lat: number; lng: number; heading?: number; timestamp: number }) => void) {
    if (!this.subscribers.has(orderId)) this.subscribers.set(orderId, []);
    this.subscribers.get(orderId)?.push(callback);
    if (this.socket?.connected) this.socket.emit('SUBSCRIBE_TRACKING', orderId);
    return () => { this.subscribers.set(orderId, (this.subscribers.get(orderId) || []).filter(cb => cb !== callback)); };
  }
}

export const locationHub = new AyooLocationHub();

/**
 * Ayoo Messaging Hub
 * Real-time messaging between customers, merchants, and riders using BroadcastChannel
 */
class AyooMessagingHub {
  private channel = new BroadcastChannel('ayoo_messaging_v1');
  private subscribers: ((msg?: Message) => void)[] = [];
  private socket: any = null;

  constructor() {
    this.channel.onmessage = (event) => {
      if (event.data.type === 'NEW_MESSAGE') {
        this.notifySubscribers(event.data.message);
      }
    };

    if (import.meta.env.VITE_USE_REAL_BACKEND === 'true') {
      this.connectSocket();
    }
  }

  private connectSocket() {
    const wsUrl = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
    const token = localStorage.getItem('ayoo_jwt_v2');
    
    this.socket = io(wsUrl, { auth: { token } });

    this.socket.on('RECEIVE_MESSAGE', (payload: Message) => {
      this.notifySubscribers(payload);
      this.channel.postMessage({ type: 'NEW_MESSAGE', message: payload });
    });

    this.socket.on('MESSAGES_READ', (payload: { orderId: string, readerEmail: string }) => {
      this.notifySubscribers();
      this.channel.postMessage({ type: 'MESSAGES_READ', payload });
    });
  }

  private notifySubscribers(msg?: Message) {
    this.subscribers.forEach(cb => cb(msg));
  }

  subscribe(callback: (msg?: Message) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  joinChat(orderId: string) {
    if (this.socket) this.socket.emit('JOIN_CHAT', orderId);
  }

  markAsRead(orderId: string) {
    if (this.socket?.connected) {
      this.socket.emit('MARK_AS_READ', { orderId });
    }
  }

  sendMessage(orderId: string, text: string) {
    if (this.socket) {
      this.socket.emit('SEND_MESSAGE', { orderId, text });
    }
  }

  broadcastNewMessage(msg: Message) {
    this.channel.postMessage({ type: 'NEW_MESSAGE', message: msg });
  }
}

export const messagingHub = new AyooMessagingHub();

/**
 * Ayoo Community Hub
 * Real-time updates for community posts, reactions, and comments using WebSockets
 */
class AyooCommunityHub {
  private socket: any = null;
  private subscribers: ((data: any) => void)[] = [];
  private channel = new BroadcastChannel('ayoo_community_v1');

  constructor() {
    this.channel.onmessage = (event) => {
      this.notifySubscribers(event.data);
    };

    if (import.meta.env.VITE_USE_REAL_BACKEND === 'true') {
      this.connectSocket();
    }
  }

  private connectSocket() {
    try {
      const wsUrl = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
      const token = localStorage.getItem('ayoo_jwt_v2');
      this.socket = io(wsUrl, { auth: { token } });

      this.socket.on('COMMUNITY_UPDATE', (data: any) => {
        this.notifySubscribers(data);
        this.channel.postMessage(data);
      });
    } catch (err) {
      console.warn('AyooCommunityHub: WS Connection failed', err);
    }
  }

  private notifySubscribers(data: any) {
    this.subscribers.forEach(cb => cb(data));
  }

  subscribe(callback: (data: any) => void) {
    this.subscribers.push(callback);
    return () => { this.subscribers = this.subscribers.filter(cb => cb !== callback); };
  }
}

export const communityHub = new AyooCommunityHub();

/**
 * Ayoo Order Hub
 * Real-time order status updates using WebSockets
 */
class AyooOrderHub {
  private socket: any = null;
  private subscribers: Map<string, ((order: OrderRecord) => void)[]> = new Map();
  private channel = new BroadcastChannel('ayoo_order_updates_v1');

  constructor() {
    this.channel.onmessage = (event) => {
      if (event.data.type === 'ORDER_UPDATED' && event.data.order) {
        this.notifySubscribers(event.data.order, false);
      }
    };

    if (import.meta.env.VITE_USE_REAL_BACKEND === 'true') {
      this.connectSocket();
    }
  }

  private connectSocket() {
    try {
      const wsUrl = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
      const token = localStorage.getItem('ayoo_jwt_v2');
      this.socket = io(wsUrl, { auth: { token } });

      this.socket.on('ORDER_UPDATED', (order: OrderRecord) => {
        this.notifySubscribers(order);
      });
    } catch (err) {
      console.warn('AyooOrderHub: WS Connection failed', err);
    }
  }

  private notifySubscribers(order: OrderRecord, broadcast = true) {
    if (order.id && this.subscribers.has(order.id)) {
      this.subscribers.get(order.id)?.forEach(cb => cb(order));
    }

    // Propagate sync to global app services (e.g. Order History, active order summaries)
    ayooCloud.triggerSync();

    if (broadcast) {
      this.channel.postMessage({ type: 'ORDER_UPDATED', order });
    }
  }

  subscribe(orderId: string, callback: (order: OrderRecord) => void) {
    if (!this.subscribers.has(orderId)) this.subscribers.set(orderId, []);
    this.subscribers.get(orderId)?.push(callback);
    if (this.socket?.connected) {
      this.socket.emit('SUBSCRIBE_TRACKING', orderId);
    }
    return () => { this.subscribers.set(orderId, (this.subscribers.get(orderId) || []).filter(cb => cb !== callback)); };
  }

  /**
   * Manually triggers a synchronization of the order state from the server.
   * This prompts the backend to verify the status with payment providers (Stripe/PayMongo)
   * and broadcast the update back through the socket.
   */
  async refreshOrder(orderId: string) {
    // This triggers the backend sync logic which checks remote provider status
    return ayooCloud.syncPayMongoOrder(orderId);
  }
}

export const orderHub = new AyooOrderHub();

/**
 * Ayoo Notification Hub
 * Handles foreground push notifications and in-app alerts.
 */
class AyooNotificationHub {
  private subscribers: ((notification: { title?: string; body?: string; data?: any }) => void)[] = [];
  private tapSubscribers: ((data: any) => void)[] = [];

  notify(notification: { title?: string; body?: string; data?: any }) {
    this.subscribers.forEach(cb => cb(notification));
  }

  tap(data: any) {
    this.tapSubscribers.forEach(cb => cb(data));
  }

  subscribe(callback: (notification: { title?: string; body?: string; data?: any }) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  onTap(callback: (data: any) => void) {
    this.tapSubscribers.push(callback);
    return () => {
      this.tapSubscribers = this.tapSubscribers.filter(cb => cb !== callback);
    };
  }
}

export const notificationHub = new AyooNotificationHub();

/**
 * Ayoo Cloud Business Logic API
 */
class AyooCloudAPI {
  private readonly STORAGE_KEY = 'ayoo_global_orders_v1';
  private subscribers: (() => void)[] = [];

  private readonly PRODUCTION_GATEWAY = false;
  private readonly USE_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === 'true';

  private async request(path: string, options: RequestInit = {}) {
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
    const finalUrl = `${base}${path}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('ayoo_jwt_v2');
    if (token) headers.Authorization = `Bearer ${token}`;
    
    options.headers = { ...headers, ...(options.headers as object || {}) };
    
    const res = await fetch(finalUrl, options);
    
    if (!res.ok) {
      const text = await res.text();
      let errorMessage = text;
      try {
        const json = JSON.parse(text);
        errorMessage = json.error || json.message || text;
      } catch (e) { /* Fallback to raw text */ }
      
      // In production, send this to an error tracking service like Sentry
      console.error(`[AyooCloudAPI] Request to ${path} failed:`, errorMessage);
      throw new Error(errorMessage || `Request failed with status ${res.status}`);
    }
    return await res.json();
  }

  constructor() {
    const channel = new BroadcastChannel('ayoo_production_sync');
    channel.onmessage = () => this.notifySubscribers();
  }

  private getOrders(): OrderRecord[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveOrders(orders: OrderRecord[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    this.notifySubscribers();
    new BroadcastChannel('ayoo_production_sync').postMessage({ type: 'SYNC' });
  }

  triggerSync() {
    this.notifySubscribers();
    new BroadcastChannel('ayoo_production_sync').postMessage({ type: 'SYNC' });
  }

  private notifySubscribers() {
    this.subscribers.forEach(cb => cb());
  }

  async registerPushToken(email: string, token: string): Promise<void> {
    await this.request(`/users/${encodeURIComponent(email.toLowerCase())}/fcm-token`, {
      method: 'PUT',
      body: JSON.stringify({ token })
    });
  }

  async processPayment(
    email: string,
    method: PaymentMethod,
    amount: number,
    orderId: string,
    idempotencyKey: string = crypto.randomUUID() // Generate a unique key for each payment attempt
  ): Promise<{ success: boolean; transactionId: string; error?: string; reference: string; checkoutUrl?: string; pending?: boolean; clientSecret?: string }> {
    const ref = `AYO-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    
    if (this.USE_BACKEND) {
      try {
        // GCash and Maya still go through PayMongo logic
        if (['GCASH', 'MAYA'].includes(method.type)) {
          const result: any = await this.request('/payments/paymongo/checkout-session', {
            method: 'POST',
            body: JSON.stringify({ email, orderId, amount, preferredType: method.type })
          });
          return {
            success: Boolean(result.success),
            transactionId: result.checkoutId || '',
            reference: result.reference || ref,
            checkoutUrl: result.checkoutUrl,
            pending: true,
            error: result.success ? undefined : (result.error || 'PayMongo checkout failed')
          };
        }

        // VISA/MASTERCARD and other methods fall through to the general process route
        // The backend /payments/process route now handles Stripe PaymentIntents for cards
        const result: any = await this.request('/payments/process', {
          method: 'POST',
          body: JSON.stringify({ email, methodId: method.id, amount, orderId, idempotencyKey })
        });
        return result;
      } catch (err: any) {
        console.error('processPayment failed', err);
        return { success: false, transactionId: '', error: err.message || 'Network', reference: ref };
      }
    }

    return new Promise((resolve) => {
      setTimeout(async () => {
        if (method.balance !== null && method.balance !== undefined && method.balance < amount) {
          resolve({ success: false, transactionId: '', error: `Insufficient Funds`, reference: ref });
          return;
        }

        if (method.balance !== undefined) {
          const txnId = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          if (method.balance !== null) {
            await db.updatePaymentBalance(email, method.id, method.balance - amount);
          }
          await db.addLedgerEntry(email, {
            id: txnId, amount, type: 'DEBIT', description: `Checkout: ${orderId}`,
            timestamp: new Date().toISOString(), orderId, methodType: method.type,
            referenceId: ref, idempotencyKey, status: 'SETTLED'
          });
          resolve({ success: true, transactionId: txnId, reference: ref });
        } else {
          resolve({ success: false, transactionId: '', error: 'Node Error', reference: ref });
        }
      }, 3000);
    });
  }

  /**
   * Calculates the remaining balance for an order.
   * Useful for partial payments or split billing.
   */
  getRemainingBalance(order: OrderRecord): number {
    const settled = order.amountPaid || (order.isPaid ? order.total : 0);
    return Math.max(0, order.total - settled);
  }

  /**
   * Retries a payment for an existing order.
   * This can be triggered manually or reactively via OrderHub detection.
   */
  async retryPayment(
    email: string,
    method: PaymentMethod,
    amount: number,
    orderId: string,
    idempotencyKey?: string
  ) {
    console.log(`[AyooCloud] Retrying payment for ${orderId} via ${method.type}`);
    return this.processPayment(email, method, amount, orderId, idempotencyKey);
  }

  async placeOrder(order: OrderRecord): Promise<{ success: boolean; orderId: string }> {
    if (this.USE_BACKEND) {
      try {
        await this.request('/orders', {
          method: 'POST',
          body: JSON.stringify(order)
        });
        // still mirror locally for instant UI
        const orders = this.getOrders();
        this.saveOrders([order, ...orders]);
        return { success: true, orderId: order.id };
      } catch (err) {
        console.error('AyooCloudAPI: placeOrder failed', err); // In production, integrate with an error reporting service
        return { success: false, orderId: '' };
      }
    }
    const orders = this.getOrders();
    this.saveOrders([order, ...orders]);
    return { success: true, orderId: order.id };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, extra: Partial<OrderRecord> = {}): Promise<void> {
    if (this.USE_BACKEND) {
      try {
        await this.request(`/orders/${orderId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status, ...extra })
        });
      } catch (err) { // In production, integrate with an error reporting service
        console.error('AyooCloudAPI: updateOrderStatus failed', err);
      }
    }

    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);

    if (status === 'DELIVERED' && order && order.status !== 'DELIVERED') {
      const config = await db.getSystemConfig();
      const currentDeliveryFee = config.deliveryFee || 45;
      const merchantCut = order.total * 0.85;
      const riderCut = currentDeliveryFee + (order.tipAmount || 0);

      const allUsers = JSON.parse(localStorage.getItem(GLOBAL_REGISTRY_KEY) || '[]');

      const mIdx = allUsers.findIndex((u: any) => u.name === order.restaurantName);
      if (mIdx !== -1) {
        allUsers[mIdx].earnings = (allUsers[mIdx].earnings || 0) + merchantCut;
      }

      const riderEmail = extra.riderEmail || order.riderEmail;
      const rIdx = allUsers.findIndex((u: any) => u.email === riderEmail);
      if (rIdx !== -1) {
        allUsers[rIdx].earnings = (allUsers[rIdx].earnings || 0) + riderCut;
      }
      localStorage.setItem(GLOBAL_REGISTRY_KEY, JSON.stringify(allUsers));
    }

    const updated = orders.map(o => o.id === orderId ? { ...o, ...extra, status } : o);
    this.saveOrders(updated);
  }

  async submitFeedback(orderId: string, rating: number, comment: string, tip: number): Promise<void> {
    await this.updateOrderStatus(orderId, 'DELIVERED', { rating, comment, tipAmount: tip });
  }

  async forceAssignOrder(orderId: string, riderEmail: string, riderName: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'ACCEPTED', { riderEmail, riderName });
  }

  getMerchantOrders(restaurantName: string): OrderRecord[] {
    return this.getOrders().filter(o => o.restaurantName === restaurantName);
  }

  async getMarketOrders(city: string): Promise<OrderRecord[]> {
    if (this.USE_BACKEND) {
      try {
        const result: any = await this.request(`/orders/market?city=${encodeURIComponent(city)}`);
        return result.orders || [];
      } catch (err) { // In production, integrate with an error reporting service
        console.error('AyooCloudAPI: getMarketOrders failed', err);
      }
    }
    return this.getOrders().filter(o => o.status === 'READY_FOR_PICKUP' && !o.riderEmail);
  }

  async getMyRiderTasks(riderEmail: string): Promise<OrderRecord[]> {
    if (this.USE_BACKEND) {
      try {
        const result: any = await this.request(`/orders/rider/${encodeURIComponent(riderEmail)}`);
        return result.orders || [];
      } catch (err) { // In production, integrate with an error reporting service
        console.error('AyooCloudAPI: getMyRiderTasks failed', err);
      }
    }
    return this.getOrders().filter(o => o.riderEmail === riderEmail);
  }

  async getAllLiveOrders(): Promise<OrderRecord[]> {
    if (this.USE_BACKEND) {
      try {
        const result: any = await this.request('/orders/live');
        return result.orders || [];
      } catch (err) { // In production, integrate with an error reporting service
        console.error('AyooCloudAPI: getAllLiveOrders failed', err);
      }
    }
    return this.getOrders().filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  }

  async getLiveOrder(email: string): Promise<OrderRecord | null> {
    if (this.USE_BACKEND) {
      try {
        const result: any = await this.request(`/orders/live/${encodeURIComponent(email)}`);
        return result.order || null;
      } catch (err) { // In production, integrate with an error reporting service
        console.error('AyooCloudAPI: getLiveOrder failed', err);
      }
    }
    const orders = this.getOrders();
    return orders.find(o => o.customerEmail === email && o.status !== 'DELIVERED' && o.status !== 'CANCELLED') || null;
  }

  async verifyAdminPin(email: string, pin: string): Promise<boolean> {
    if (this.USE_BACKEND) {
      try {
        const res = await this.request('/admin/verify-pin', {
          method: 'POST',
          body: JSON.stringify({ email, pin })
        });
        return Boolean(res.success);
      } catch (err) { // In production, integrate with an error reporting service
        console.error('AyooCloudAPI: verifyAdminPin failed', err);
        return false;
      }
    }
    const config = await db.getSystemConfig();
    return pin === (config.masterPin || '1234');
  }

  async getServiceStatus(id: string): Promise<any> {
    if (this.USE_BACKEND) {
      try {
        return await this.request(`/services/status/${id}`);
      } catch (err) {
        console.error('AyooCloudAPI: getServiceStatus failed', err); // In production, integrate with an error reporting service
        return null;
      }
    }
    return null;
  }

  async createRideRequest(data: any): Promise<any> {
    if (this.USE_BACKEND) {
      return await this.request('/rides/request', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
    return { id: `RIDE-${Date.now()}`, status: 'PENDING' };
  }

  async cancelService(id: string, reason: string): Promise<void> {
    if (this.USE_BACKEND) {
      try {
        await this.request(`/services/cancel/${id}`, {
          method: 'POST',
          body: JSON.stringify({ reason })
        });
      } catch (err) { // In production, integrate with an error reporting service
        console.error('AyooCloudAPI: cancelService failed', err);
      }
    }
  }

  async getCustomerLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
    if (this.USE_BACKEND) {
      const result = await this.request(`/leaderboards/customers?period=${period}`);
      return result.entries || [];
    }
    return await db.getCustomerLeaderboard(period);
  }

  async getMerchantLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
    if (this.USE_BACKEND) {
      const result = await this.request(`/leaderboards/merchants?period=${period}`);
      return result.entries || [];
    }
    return await db.getMerchantLeaderboard(period);
  }

  async getRiderLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
    if (this.USE_BACKEND) {
      const result = await this.request(`/leaderboards/riders?period=${period}`);
      return result.entries || [];
    }
    return await db.getRiderLeaderboard(period);
  }

  async getCommunityPosts(): Promise<CommunityPost[]> {
    if (this.USE_BACKEND) {
      const result = await this.request('/community/posts');
      return result.posts || [];
    }
    return [];
  }

  async reactToPost(postId: string, reactionType: string): Promise<void> {
    if (this.USE_BACKEND) {
      await this.request(`/community/posts/${postId}/react`, {
        method: 'POST',
        body: JSON.stringify({ type: reactionType })
      });
    }
  }

  async addComment(postId: string, content: string): Promise<any> {
    return await this.request(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  async addReply(postId: string, commentId: string, content: string): Promise<any> {
    return await this.request(`/community/posts/${postId}/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  async syncPayMongoOrder(orderId: string): Promise<OrderRecord | null> {
    if (!this.USE_BACKEND) return null;
    try {
      const result: any = await this.request(`/payments/paymongo/orders/${encodeURIComponent(orderId)}/status`);
      return result.order || null;
    } catch (err) {
      console.error('AyooCloudAPI: syncPayMongoOrder failed', err); // In production, integrate with an error reporting service
      return null;
    }
  }

  subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => { this.subscribers = this.subscribers.filter(cb => cb !== callback); };
  }
}

export const ayooCloud = new AyooCloudAPI();
