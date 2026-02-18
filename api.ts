
import { OrderRecord, OrderStatus, PaymentMethod, WalletTransaction } from './types';
import { db } from './db';

/**
 * Ayoo Cloud Business Logic API
 * This layer handles stateful transactions and payment processing.
 */
class AyooCloudAPI {
  private readonly STORAGE_KEY = 'ayoo_global_orders_v1';
  private subscribers: (() => void)[] = [];
  
  // REAL-WORLD BACKEND FLAGS
  private readonly PRODUCTION_GATEWAY = false;

  constructor() {
    // In production, we'd use WebSocket here
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

  /**
   * TRANSACTIONAL PAYMENT HANDSHAKE
   * For real payments, this would communicate with:
   * 1. Your Backend (Node/Python)
   * 2. Backend -> Stripe / PayMongo
   * 3. Provider -> Webhook Success
   */
  async processPayment(
    email: string, 
    method: PaymentMethod, 
    amount: number, 
    orderId: string
  ): Promise<{ success: boolean; transactionId: string; error?: string; reference: string }> {
    const ref = `AYO-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    
    // IF CONNECTING TO REAL STRIPE/PAYMONGO GATEWAY:
    if (this.PRODUCTION_GATEWAY) {
      // 1. Send checkout intent to your Node.js backend
      // const response = await fetch('/api/payments/create-session', { ... })
      // const { checkoutUrl } = await response.json();
      // window.location.href = checkoutUrl;
      return { success: false, transactionId: '', reference: ref, error: 'Production Gateway Disabled' };
    }

    return new Promise((resolve) => {
      // Simulate real-world bank network latency
      setTimeout(async () => {
        if (method.type === 'CASH') {
          resolve({ success: true, transactionId: 'COD-SETTLED', reference: ref });
          return;
        }

        // Real-world balance check (mimics Database constraint)
        if (method.balance !== undefined && method.balance < amount) {
          resolve({ 
            success: false, 
            transactionId: '', 
            error: `Insufficient Funds: ${method.type} account limit reached.`,
            reference: ref 
          });
          return;
        }

        // Deduction logic
        if (method.balance !== undefined) {
          const txnId = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          
          // Actual update to the persistence layer (Simulated Cloud DB)
          await db.updatePaymentBalance(email, method.id, method.balance - amount);
          
          // Official Payout Ledgering (Double-entry bookkeeping style)
          await db.addLedgerEntry(email, {
            id: txnId,
            amount: amount,
            type: 'DEBIT',
            description: `Checkout: ${orderId}`,
            timestamp: new Date().toISOString(),
            orderId: orderId,
            methodType: method.type,
            referenceId: ref,
            status: 'SETTLED'
          });

          resolve({ success: true, transactionId: txnId, reference: ref });
        } else {
          resolve({ success: false, transactionId: '', error: 'Ayoo Cloud Node Connection Failed', reference: ref });
        }
      }, 4000); 
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
    
    // BUSINESS LOGIC: Automatic payout splitting on Delivery
    if (status === 'DELIVERED' && order && order.status !== 'DELIVERED') {
      const merchantCut = order.total * 0.85; // 15% Platform Fee
      const riderCut = 45 + (order.tipAmount || 0);
      
      const allUsers = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
      
      // MERCHANT SETTLEMENT
      const mIdx = allUsers.findIndex((u: any) => u.name === order.restaurantName);
      if (mIdx !== -1) {
        allUsers[mIdx].earnings = (allUsers[mIdx].earnings || 0) + merchantCut;
        await db.addLedgerEntry(allUsers[mIdx].email, {
          id: `STL-${orderId}`,
          amount: merchantCut,
          type: 'CREDIT',
          description: `Settlement: Order ${orderId}`,
          timestamp: new Date().toISOString(),
          orderId: orderId,
          referenceId: `REF-${orderId}`,
          status: 'SETTLED'
        });
      }
      
      // RIDER SETTLEMENT
      const riderEmail = extra.riderEmail || order.riderEmail;
      const rIdx = allUsers.findIndex((u: any) => u.email === riderEmail);
      if (rIdx !== -1) {
        allUsers[rIdx].earnings = (allUsers[rIdx].earnings || 0) + riderCut;
        await db.addLedgerEntry(allUsers[rIdx].email, {
          id: `PAY-${orderId}`,
          amount: riderCut,
          type: 'CREDIT',
          description: `Rider Payout: ${orderId}`,
          timestamp: new Date().toISOString(),
          orderId: orderId,
          referenceId: `REF-${orderId}`,
          status: 'SETTLED'
        });
      }
      
      localStorage.setItem('ayoo_user_registry_v11', JSON.stringify(allUsers));
    }

    const updated = orders.map(o => o.id === orderId ? { ...o, ...extra, status } : o);
    this.saveOrders(updated);
  }

  async updateOrderAddress(orderId: string, address: string): Promise<void> {
    const orders = this.getOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, deliveryAddress: address } : o);
    this.saveOrders(updated);
  }

  async submitFeedback(orderId: string, rating: number, comment: string, tip: number): Promise<void> {
    await this.updateOrderStatus(orderId, 'DELIVERED', { rating, comment, tipAmount: tip });
  }

  async forceAssignOrder(orderId: string, riderEmail: string, riderName: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'ACCEPTED', { riderEmail, riderName });
  }

  async cancelOrder(orderId: string): Promise<void> {
    const orders = this.getOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' as OrderStatus } : o);
    this.saveOrders(updated);
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
