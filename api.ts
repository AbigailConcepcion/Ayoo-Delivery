
import { OrderRecord, OrderStatus } from './types';

/**
 * AyooCloudAPI - Production-Ready Proxy
 * 
 * MODE SWITCH:
 * Set isProduction = true to start using real fetch() calls to your backend.
 * Set isProduction = false to keep using the local simulation (for development).
 */
const isProduction = false; 
const API_BASE_URL = 'https://api.ayoo.delivery/v1';

class AyooCloudAPI {
  private readonly STORAGE_KEY = 'ayoo_global_orders_v1';
  private subscribers: (() => void)[] = [];
  private channel = new BroadcastChannel('ayoo_production_sync');

  constructor() {
    this.channel.onmessage = (event) => {
      console.log('☁️ Ayoo Cloud Sync:', event.data);
      this.notifySubscribers();
    };
  }

  private async request<T>(endpoint: string, options: any = {}): Promise<T> {
    if (isProduction) {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ayoo_session_token')}`
        }
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    }

    // Local Simulation Logic
    await new Promise(r => setTimeout(r, 800)); // Simulate internet delay
    return {} as T;
  }

  private getOrders(): OrderRecord[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  private saveOrders(orders: OrderRecord[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    this.notifySubscribers();
    this.channel.postMessage({ type: 'SYNC', timestamp: Date.now() });
  }

  private notifySubscribers() {
    this.subscribers.forEach(cb => cb());
  }

  async placeOrder(order: OrderRecord): Promise<{ success: boolean; orderId: string }> {
    if (isProduction) return this.request('/orders', { method: 'POST', body: JSON.stringify(order) });
    
    const orders = this.getOrders();
    this.saveOrders([order, ...orders]);
    return { success: true, orderId: order.id };
  }

  getMerchantOrders(restaurantName: string): OrderRecord[] {
    return this.getOrders().filter(o => o.restaurantName === restaurantName);
  }

  getAvailableRiderOrders(): OrderRecord[] {
    return this.getOrders().filter(o => 
      o.status === 'READY_FOR_PICKUP' || 
      (o.status === 'OUT_FOR_DELIVERY' && o.riderName?.includes('(You)'))
    );
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, extra: Partial<OrderRecord> = {}): Promise<void> {
    if (isProduction) return this.request(`/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify({ status, ...extra }) });
    
    const orders = this.getOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, status, ...extra } : o);
    this.saveOrders(updated);
  }

  async getLiveOrder(email: string): Promise<OrderRecord | null> {
    return this.getOrders().find(o => o.customerEmail === email && o.status !== 'DELIVERED') || null;
  }

  subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => { this.subscribers = this.subscribers.filter(cb => cb !== callback); };
  }
}

export const ayooCloud = new AyooCloudAPI();
