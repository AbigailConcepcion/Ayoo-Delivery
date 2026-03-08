import { OrderRecord, OrderStatus, PaymentMethod, WalletTransaction } from './types';
import { db } from './db';
import { GLOBAL_REGISTRY_KEY } from './constants';

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
 * Ayoo Messaging Hub
 * Real-time messaging between customers, merchants, and riders using BroadcastChannel
 */
class AyooMessagingHub {
  private channel = new BroadcastChannel('ayoo_messaging_v1');
  private subscribers: (() => void)[] = [];

  constructor() {
    this.channel.onmessage = (event) => {
      if (event.data.type === 'NEW_MESSAGE') {
        this.notifySubscribers();
      }
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(cb => cb());
  }

  subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  broadcastNewMessage() {
    this.channel.postMessage({ type: 'NEW_MESSAGE' });
  }
}

export const messagingHub = new AyooMessagingHub();

/**
 * Ayoo Cloud Business Logic API
 */
class AyooCloudAPI {
  private readonly STORAGE_KEY = 'ayoo_global_orders_v1';
  private subscribers: (() => void)[] = [];

  private readonly PRODUCTION_GATEWAY = false;
  private readonly USE_BACKEND = true; // toggle off if running purely client-side

  private async request(path: string, options: RequestInit = {}) {
    const url = `${AyooCloudAPI.prototype['PRODUCTION_GATEWAY'] ? AyooCloudAPI.prototype['PRODUCTION_GATEWAY'] : ''}${path}`; // dummy
    // we don't have simple access to ENV here, so replicate logic using import.meta
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
    const finalUrl = `${base}${path}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('ayoo_jwt_v2');
    if (token) headers.Authorization = `Bearer ${token}`;
    options.headers = { ...headers, ...(options.headers as object || {}) };
    const res = await fetch(finalUrl, options);
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json();
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

  private notifySubscribers() {
    this.subscribers.forEach(cb => cb());
  }

  async processPayment(
    email: string,
    method: PaymentMethod,
    amount: number,
    orderId: string
  ): Promise<{ success: boolean; transactionId: string; error?: string; reference: string; checkoutUrl?: string; pending?: boolean }> {
    const ref = `AYO-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

    if (this.USE_BACKEND) {
      try {
        if (['GCASH', 'MAYA', 'VISA', 'MASTERCARD'].includes(method.type)) {
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

        const result: any = await this.request('/payments/process', {
          method: 'POST',
          body: JSON.stringify({ email, methodId: method.id, amount, orderId })
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
            referenceId: ref, status: 'SETTLED'
          });
          resolve({ success: true, transactionId: txnId, reference: ref });
        } else {
          resolve({ success: false, transactionId: '', error: 'Node Error', reference: ref });
        }
      }, 3000);
    });
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
        console.error('placeOrder failed', err);
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
      } catch (err) {
        console.error('updateOrderStatus failed', err);
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

  async cancelService(orderId: string, reason?: string): Promise<void> {
    if (this.USE_BACKEND) {
      try {
        await this.request(`/orders/${orderId}/cancel`, {
          method: 'PUT',
          body: JSON.stringify({ reason })
        });
      } catch (err) {
        console.error('cancelService failed', err);
      }
    }
    await this.updateOrderStatus(orderId, 'CANCELLED', { comment: reason });
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
      } catch (err) {
        console.error('getMarketOrders failed', err);
      }
    }
    return this.getOrders().filter(o => o.status === 'READY_FOR_PICKUP' && !o.riderEmail);
  }

  async getMyRiderTasks(riderEmail: string): Promise<OrderRecord[]> {
    if (this.USE_BACKEND) {
      try {
        const result: any = await this.request(`/orders/rider/${encodeURIComponent(riderEmail)}`);
        return result.orders || [];
      } catch (err) {
        console.error('getMyRiderTasks failed', err);
      }
    }
    return this.getOrders().filter(o => o.riderEmail === riderEmail);
  }

  async getAllLiveOrders(): Promise<OrderRecord[]> {
    if (this.USE_BACKEND) {
      try {
        const result: any = await this.request('/orders/live');
        return result.orders || [];
      } catch (err) {
        console.error('getAllLiveOrders failed', err);
      }
    }
    return this.getOrders().filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  }

  async getLiveOrder(email: string): Promise<OrderRecord | null> {
    if (this.USE_BACKEND) {
      try {
        const result: any = await this.request(`/orders/live/${encodeURIComponent(email)}`);
        return result.order || null;
      } catch (err) {
        console.error('getLiveOrder failed', err);
      }
    }
    const orders = this.getOrders();
    return orders.find(o => o.customerEmail === email && o.status !== 'DELIVERED' && o.status !== 'CANCELLED') || null;
  }

  async syncPayMongoOrder(orderId: string): Promise<OrderRecord | null> {
    if (!this.USE_BACKEND) return null;
    try {
      const result: any = await this.request(`/payments/paymongo/orders/${encodeURIComponent(orderId)}/status`);
      return result.order || null;
    } catch (err) {
      console.error('syncPayMongoOrder failed', err);
      return null;
    }
  }

  subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => { this.subscribers = this.subscribers.filter(cb => cb !== callback); };
  }
}

export const ayooCloud = new AyooCloudAPI();
