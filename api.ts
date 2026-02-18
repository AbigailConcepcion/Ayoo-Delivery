
import { OrderRecord, OrderStatus, PaymentMethod, WalletTransaction } from './types';
import { db } from './db';

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
 * Ayoo Cloud Business Logic API
 */
class AyooCloudAPI {
  private readonly STORAGE_KEY = 'ayoo_global_orders_v1';
  private subscribers: (() => void)[] = [];
  
  private readonly PRODUCTION_GATEWAY = false;

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
  ): Promise<{ success: boolean; transactionId: string; error?: string; reference: string }> {
    const ref = `AYO-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        if (method.balance !== undefined && method.balance < amount) {
          resolve({ success: false, transactionId: '', error: `Insufficient Funds`, reference: ref });
          return;
        }

        if (method.balance !== undefined) {
          const txnId = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          await db.updatePaymentBalance(email, method.id, method.balance - amount);
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
    const orders = this.getOrders();
    this.saveOrders([order, ...orders]);
    return { success: true, orderId: order.id };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, extra: Partial<OrderRecord> = {}): Promise<void> {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (status === 'DELIVERED' && order && order.status !== 'DELIVERED') {
      const config = await db.getSystemConfig();
      const currentDeliveryFee = config.deliveryFee || 45;
      const merchantCut = order.total * 0.85; 
      const riderCut = currentDeliveryFee + (order.tipAmount || 0);
      const allUsers = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
      
      const mIdx = allUsers.findIndex((u: any) => u.name === order.restaurantName);
      if (mIdx !== -1) {
        allUsers[mIdx].earnings = (allUsers[mIdx].earnings || 0) + merchantCut;
      }
      
      const riderEmail = extra.riderEmail || order.riderEmail;
      const rIdx = allUsers.findIndex((u: any) => u.email === riderEmail);
      if (rIdx !== -1) {
        allUsers[rIdx].earnings = (allUsers[rIdx].earnings || 0) + riderCut;
      }
      localStorage.setItem('ayoo_user_registry_v11', JSON.stringify(allUsers));
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

  getMarketOrders(city: string): OrderRecord[] {
    return this.getOrders().filter(o => o.status === 'READY_FOR_PICKUP' && !o.riderEmail);
  }

  getMyRiderTasks(riderEmail: string): OrderRecord[] {
    return this.getOrders().filter(o => o.riderEmail === riderEmail);
  }

  getAllLiveOrders(): OrderRecord[] {
    return this.getOrders().filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  }

  async getLiveOrder(email: string): Promise<OrderRecord | null> {
    const orders = this.getOrders();
    return orders.find(o => o.customerEmail === email && o.status !== 'DELIVERED' && o.status !== 'CANCELLED') || null;
  }

  subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => { this.subscribers = this.subscribers.filter(cb => cb !== callback); };
  }
}

export const ayooCloud = new AyooCloudAPI();
