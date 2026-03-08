
import { UserAccount, Address, PaymentMethod, OrderRecord, Voucher, Restaurant, WalletTransaction, FoodItem, Conversation, Message } from './types';
import { MOCK_RESTAURANTS, GLOBAL_REGISTRY_KEY } from './constants';

// allow access to Vite env vars without TS errors
declare global {
  interface ImportMeta {
    env: any;
  }
}

class AyooDatabase {
  public static ENV = {
    // controlled by Vite build variables (e.g. VITE_USE_REAL_BACKEND=true)
    USE_REAL_BACKEND: import.meta.env.VITE_USE_REAL_BACKEND === 'true',
    BASE_URL: import.meta.env.VITE_API_BASE || 'http://localhost:4000',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3
  };

  private readonly STORAGE_KEYS = {
    AUTH_TOKEN: 'ayoo_jwt_v2',
    USER_PROFILE: 'ayoo_profile_v2', // The ACTIVE session
    SYSTEM_CONFIG: 'ayoo_config_v2',
    RESTAURANTS: 'ayoo_merchants_registry_v2',
    REGISTRY: GLOBAL_REGISTRY_KEY, // The "DATABASE" of all users
    REMEMBERED: 'ayoo_remembered_v2', // The "VAULT" for auto-fill
    ONBOARDING: 'ayoo_onboarding_seen_v2'
  };

  // utility used when talking to the real backend
  private async request(path: string, options: RequestInit = {}) {
    const url = `${AyooDatabase.ENV.BASE_URL}${path}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
    if (token) headers.Authorization = `Bearer ${token}`;
    options.headers = { ...headers, ...(options.headers as object || {}) };

    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async connect() {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      // ensure server is reachable
      await this.request('/config');
      return true;
    }
    console.log("Ayoo Cloud: Establishing Node Connection...");
    return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  }

  // Fix: Added hasSeenOnboarding method to check if the user has completed the onboarding process
  async hasSeenOnboarding(): Promise<boolean> {
    return localStorage.getItem(this.STORAGE_KEYS.ONBOARDING) === 'true';
  }

  // Fix: Added setOnboardingSeen method to record that the user has completed the onboarding process
  async setOnboardingSeen(seen: boolean) {
    localStorage.setItem(this.STORAGE_KEYS.ONBOARDING, seen.toString());
  }

  private getRegistry(): UserAccount[] {
    const raw = localStorage.getItem(this.STORAGE_KEYS.REGISTRY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveRegistry(registry: UserAccount[]) {
    localStorage.setItem(this.STORAGE_KEYS.REGISTRY, JSON.stringify(registry));
  }

  async flushRegistry() {
    localStorage.removeItem(this.STORAGE_KEYS.REGISTRY);
    localStorage.removeItem(this.STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(this.STORAGE_KEYS.REMEMBERED);
    localStorage.removeItem(this.STORAGE_KEYS.AUTH_TOKEN);
    window.location.reload();
  }

  async login(email: string, pass: string, remember: boolean): Promise<UserAccount | null> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = pass.trim();

    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: cleanEmail, password: cleanPass })
        });
        if (result.user && result.token) {
          localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, result.token);
          localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(result.user));
          if (remember) {
            localStorage.setItem(this.STORAGE_KEYS.REMEMBERED, JSON.stringify({ email: cleanEmail, password: cleanPass }));
          } else {
            localStorage.removeItem(this.STORAGE_KEYS.REMEMBERED);
          }
          return result.user;
        }
      } catch (err) {
        console.error('login failed', err);
        return null;
      }
      return null;
    }

    const registry = this.getRegistry();
    const user = registry.find((u: any) => u.email.toLowerCase() === cleanEmail && u.password === cleanPass);

    if (user) {
      // Set the active session
      localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));

      // Persist credentials if "Remember Me" is checked
      if (remember) {
        localStorage.setItem(this.STORAGE_KEYS.REMEMBERED, JSON.stringify({ email: cleanEmail, password: pass }));
      } else {
        localStorage.removeItem(this.STORAGE_KEYS.REMEMBERED);
      }
      return user;
    }
    return null;
  }

  async register(user: UserAccount): Promise<{ success: boolean; message: string }> {
    const cleanEmail = user.email.toLowerCase().trim();

    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: cleanEmail,
            name: user.name,
            password: user.password,
            preferredCity: user.preferredCity,
            role: user.role,
            merchantId: user.merchantId
          })
        });
        if (result.success && result.token) {
          localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, result.token);
          return { success: true, message: 'Registered successfully' };
        }
        return { success: false, message: result.error || 'registration failed' };
      } catch (err: any) {
        console.error('register failed', err);
        return { success: false, message: err.message || 'registration failed' };
      }
    }

    const registry = this.getRegistry();
    if (registry.some((u: any) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Identity conflict: Email already exists in cloud vault.' };
    }

    const newUser = {
      ...user,
      email: cleanEmail,
      manualsSeen: user.manualsSeen || [],
      earnings: 0,
      points: 500 // Welcome gift
    };

    registry.push(newUser);
    this.saveRegistry(registry);

    return { success: true, message: 'Registry synchronized successfully.' };
  }

  async getRemembered() {
    const raw = localStorage.getItem(this.STORAGE_KEYS.REMEMBERED);
    return raw ? JSON.parse(raw) : null;
  }

  async getSession(): Promise<UserAccount | null> {
    const profile = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
    return profile ? JSON.parse(profile) : null;
  }

  async logout() {
    localStorage.removeItem(this.STORAGE_KEYS.USER_PROFILE);
  }

  async getUserByEmail(email: string): Promise<UserAccount | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request(`/users/${cleanEmail}`);
        return result.user || null;
      } catch (err) {
        console.error('getUserByEmail failed', err);
        return null;
      }
    }
    const registry = this.getRegistry();
    return registry.find((u: any) => u.email.toLowerCase() === cleanEmail) || null;
  }

  async updateProfile(email: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request(`/users/${cleanEmail}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        if (result.user) {
          // update session if necessary
          const session = await this.getSession();
          if (session && session.email.toLowerCase() === cleanEmail) {
            localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(result.user));
          }
          return result.user;
        }
      } catch (err) {
        console.error('updateProfile failed', err);
        return null;
      }
      return null;
    }

    const registry = this.getRegistry();
    const idx = registry.findIndex((u: any) => u.email.toLowerCase() === cleanEmail);

    if (idx === -1) return null;
    const updated = { ...registry[idx], ...updates };
    registry[idx] = updated;

    this.saveRegistry(registry);

    // If the updated user is the current session, update it too
    const session = await this.getSession();
    if (session && session.email.toLowerCase() === cleanEmail) {
      localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    }

    return updated;
  }

  async getRestaurants(): Promise<Restaurant[]> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request('/restaurants');
        return result.restaurants || [];
      } catch (err) {
        console.error('getRestaurants failed', err);
        return [];
      }
    }
    const saved = localStorage.getItem(this.STORAGE_KEYS.RESTAURANTS);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(this.STORAGE_KEYS.RESTAURANTS, JSON.stringify(MOCK_RESTAURANTS));
    return MOCK_RESTAURANTS;
  }
  async saveRestaurants(list: Restaurant[]) {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        await Promise.all(list.map(r => this.request('/restaurants', {
          method: 'POST',
          body: JSON.stringify(r)
        })));
      } catch (err) {
        console.error('saveRestaurants failed', err);
      }
    }
    localStorage.setItem(this.STORAGE_KEYS.RESTAURANTS, JSON.stringify(list));
  }

  // Fix: Added updateMerchantMenu method to update specific merchant's food items in the database
  async updateMerchantMenu(merchantId: string, items: FoodItem[]) {
    const restaurants = await this.getRestaurants();
    const updated = restaurants.map(r => r.id === merchantId ? { ...r, items } : r);
    await this.saveRestaurants(updated);
  }

  async getHistory(email: string): Promise<OrderRecord[]> {
    const clean = email.toLowerCase();
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request(`/orders/customer/${clean}`);
        return result.orders || [];
      } catch (err) {
        console.error('getHistory failed', err);
        return [];
      }
    }
    return JSON.parse(localStorage.getItem(`orders_${clean}`) || '[]');
  }

  async getMerchantOrders(restaurantName: string): Promise<OrderRecord[]> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request(`/orders/merchant/${encodeURIComponent(restaurantName)}`);
        return result.orders || [];
      } catch (err) {
        console.error('getMerchantOrders failed', err);
        return [];
      }
    }
    // fallback to in-memory stream hub orders
    const all = this.getRegistryOrders();
    return all.filter(o => o.restaurantName === restaurantName);
  }

  async getMarketOrders(city: string): Promise<OrderRecord[]> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request(`/orders/market?city=${encodeURIComponent(city)}`);
        return result.orders || [];
      } catch (err) {
        console.error('getMarketOrders failed', err);
        return [];
      }
    }
    const all = this.getRegistryOrders();
    return all.filter(o => o.status === 'READY_FOR_PICKUP' && !o.riderEmail);
  }

  async getMyRiderTasks(riderEmail: string): Promise<OrderRecord[]> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request(`/orders/rider/${encodeURIComponent(riderEmail)}`);
        return result.orders || [];
      } catch (err) {
        console.error('getMyRiderTasks failed', err);
        return [];
      }
    }
    const all = this.getRegistryOrders();
    return all.filter(o => o.riderEmail === riderEmail);
  }

  // helper used by cloud logic - gather orders from all users in localStorage
  private getRegistryOrders(): OrderRecord[] {
    const orders: OrderRecord[] = [];
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('orders_')) {
        try {
          const arr = JSON.parse(localStorage.getItem(key) || '[]');
          orders.push(...arr);
        } catch {
          // ignore malformed entries
        }
      }
    });
    return orders;
  }

  async getLedger(ownerId: string): Promise<WalletTransaction[]> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request(`/ledger/${ownerId.toLowerCase()}`);
        return result.ledger || [];
      } catch (err) {
        console.error('getLedger failed', err);
        return [];
      }
    }
    const ledger = JSON.parse(localStorage.getItem('ayoo_financial_ledger_v2') || '{}');
    return ledger[ownerId.toLowerCase()] || [];
  }

  async updatePassword(email: string, newPass: string): Promise<boolean> {
    const registry = this.getRegistry();
    const idx = registry.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;
    registry[idx].password = newPass;
    this.saveRegistry(registry);
    return true;
  }

  async claimVoucher(email: string, voucher: Voucher) {
    const key = `vouchers_${email.toLowerCase()}`;
    const vouchers = JSON.parse(localStorage.getItem(key) || '[]');
    if (!vouchers.find((v: any) => v.id === voucher.id)) {
      vouchers.push(voucher);
      localStorage.setItem(key, JSON.stringify(vouchers));
    }
  }

  async getClaimedVouchers(email: string): Promise<Voucher[]> {
    return JSON.parse(localStorage.getItem(`vouchers_${email.toLowerCase()}`) || '[]');
  }

  async getAddresses(email: string) {
    const clean = email.toLowerCase();
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request(`/addresses/${clean}`);
        return result.addresses || [];
      } catch (err) {
        console.error('getAddresses failed', err);
        return [];
      }
    }
    return JSON.parse(localStorage.getItem(`addresses_${clean}`) || '[]');
  }
  async saveAddresses(email: string, a: Address[]) {
    const clean = email.toLowerCase();
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        // replace all addresses
        await Promise.all(a.map(addr => this.request(`/addresses/${clean}`, {
          method: 'POST',
          body: JSON.stringify(addr)
        })));
      } catch (err) {
        console.error('saveAddresses failed', err);
      }
    }
    localStorage.setItem(`addresses_${clean}`, JSON.stringify(a));
  }
  async getPayments(email: string) {
    const clean = email.toLowerCase();
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request(`/payments/methods/${clean}`);
        return result.payments || [];
      } catch (err) {
        console.error('getPayments failed', err);
        return [];
      }
    }
    return JSON.parse(localStorage.getItem(`pay_${clean}`) || '[]');
  }
  async savePayments(email: string, p: PaymentMethod[]) {
    const clean = email.toLowerCase();
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        await Promise.all(p.map(pm => this.request(`/payments/methods/${clean}`, {
          method: 'POST',
          body: JSON.stringify(pm)
        })));
      } catch (err) {
        console.error('savePayments failed', err);
      }
    }
    localStorage.setItem(`pay_${clean}`, JSON.stringify(p));
  }
  async updatePaymentBalance(email: string, mid: string, bal: number) {
    const clean = email.toLowerCase();
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        await this.request(`/payments/methods/${clean}/${mid}/balance`, {
          method: 'PUT',
          body: JSON.stringify({ balance: bal })
        });
      } catch (err) {
        console.error('updatePaymentBalance failed', err);
      }
    }
    const pay = await this.getPayments(email);
    const up = pay.map((p: any) => p.id === mid ? { ...p, balance: bal } : p);
    localStorage.setItem(`pay_${clean}`, JSON.stringify(up));
  }

  async topUpPayment(email: string, mid: string, amount: number): Promise<number> {
    const clean = email.toLowerCase();
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request(`/payments/methods/${clean}/topup`, {
          method: 'POST',
          body: JSON.stringify({ methodId: mid, amount })
        });
        return result.balance || 0;
      } catch (err) {
        console.error('topUpPayment failed', err);
        throw err;
      }
    }
    const pay = await this.getPayments(email);
    const updated = pay.map((p: any) => p.id === mid ? { ...p, balance: (p.balance || 0) + amount } : p);
    await this.savePayments(email, updated);
    return (updated.find((p: any) => p.id === mid)?.balance || 0);
  }

  async getRegistryUsers(): Promise<UserAccount[]> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request('/users');
        return result.users || [];
      } catch (err) {
        console.error('getRegistryUsers failed', err);
        return [];
      }
    }
    const raw = localStorage.getItem(this.STORAGE_KEYS.REGISTRY);
    return raw ? JSON.parse(raw) : [];
  }

  async getAllLiveOrders(): Promise<OrderRecord[]> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request('/orders/live');
        return result.orders || [];
      } catch (err) {
        console.error('getAllLiveOrders failed', err);
        return [];
      }
    }
    const all = this.getRegistryOrders();
    return all.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  }
  async addLedgerEntry(owner: string, entry: WalletTransaction) {
    const key = owner.toLowerCase();
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        await this.request(`/ledger/${key}`, {
          method: 'POST',
          body: JSON.stringify(entry)
        });
        return;
      } catch (err) {
        console.error('addLedgerEntry failed', err);
      }
    }
    const ledger = JSON.parse(localStorage.getItem('ayoo_financial_ledger_v2') || '{}');
    if (!ledger[key]) ledger[key] = [];
    ledger[key] = [entry, ...ledger[key]];
    localStorage.setItem('ayoo_financial_ledger_v2', JSON.stringify(ledger));
  }
  async saveOrder(email: string, order: OrderRecord) {
    const clean = email.toLowerCase();
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        await this.request(`/orders`, {
          method: 'POST',
          body: JSON.stringify(order)
        });
      } catch (err) {
        console.error('saveOrder failed', err);
      }
    }
    const key = `orders_${clean}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([order, ...history]));
  }

  async saveOrders(orders: OrderRecord[]) {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      // backend maintains the canonical record; local state can be ignored
      return;
    }
    // distribute orders back into individual user buckets
    const grouped: Record<string, OrderRecord[]> = {};
    orders.forEach(o => {
      const user = (o as any).customerEmail || (o as any).email;
      if (!user) return;
      const key = `orders_${user.toLowerCase()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(o);
    });
    Object.entries(grouped).forEach(([key, arr]) => {
      localStorage.setItem(key, JSON.stringify(arr));
    });
  }

  async updateOrderStatus(orderId: string, status: string, extra: any = {}) {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        await this.request(`/orders/${orderId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status, ...extra })
        });
      } catch (err) {
        console.error('updateOrderStatus failed', err);
      }
    }
    // also update local cache if needed
    const orders = this.getRegistryOrders();
    const updated = orders.map((o: any) => o.id === orderId ? { ...o, status, ...extra } : o);
    this.saveOrders(updated);
  }

  async cancelService(orderId: string, reason?: string) {
    await this.updateOrderStatus(orderId, 'CANCELLED', { comment: reason });
  }

  async getSystemConfig() {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        const result: any = await this.request('/config');
        return result;
      } catch (err) {
        console.error('getSystemConfig failed', err);
      }
    }
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SYSTEM_CONFIG) || '{"deliveryFee":45,"masterPin":"1234"}');
  }
  async saveSystemConfig(c: any) {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        await this.request('/config', {
          method: 'PUT',
          body: JSON.stringify(c)
        });
      } catch (err) {
        console.error('saveSystemConfig failed', err);
      }
    }
    localStorage.setItem(this.STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(c));
  }
  async getCart(email: string) { return JSON.parse(localStorage.getItem(`cart_${email.toLowerCase()}`) || '{"items":[],"voucher":null}'); }
  async saveCart(email: string, items: any[], voucher: any) { localStorage.setItem(`cart_${email.toLowerCase()}`, JSON.stringify({ items, voucher })); }
  async clearCart(email: string) { localStorage.removeItem(`cart_${email.toLowerCase()}`); }

  // helper for Stripe
  async stripeCharge(token: string, amount: number, orderId: string) {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      return this.request('/payments/stripe', {
        method: 'POST',
        body: JSON.stringify({ token, amount, orderId })
      });
    }
    return { success: true, charge: { id: 'LOCAL-' + Math.random().toString(36).substr(2, 9) } };
  }

  // ==================== MESSAGING METHODS ====================

  private readonly MESSAGING_KEYS = {
    CONVERSATIONS: 'ayoo_conversations_v1',
    MESSAGES: 'ayoo_messages_v1',
  };

  private getAllConversations(): Conversation[] {
    const raw = localStorage.getItem(this.MESSAGING_KEYS.CONVERSATIONS);
    return raw ? JSON.parse(raw) : [];
  }

  private saveAllConversations(conversations: Conversation[]) {
    localStorage.setItem(this.MESSAGING_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }

  private getAllMessages(): Message[] {
    const raw = localStorage.getItem(this.MESSAGING_KEYS.MESSAGES);
    return raw ? JSON.parse(raw) : [];
  }

  private saveAllMessages(messages: Message[]) {
    localStorage.setItem(this.MESSAGING_KEYS.MESSAGES, JSON.stringify(messages));
  }

  async getConversations(email: string): Promise<Conversation[]> {
    const cleanEmail = email.toLowerCase();
    const allConversations = this.getAllConversations();

    // Filter conversations where the user is a participant
    const userConversations = allConversations.filter(convo =>
      convo.participants.some(p => p.email.toLowerCase() === cleanEmail)
    );

    // Sort by last message time (newest first)
    return userConversations.sort((a, b) =>
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const allMessages = this.getAllMessages();
    return allMessages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async sendMessage(
    conversationId: string,
    senderEmail: string,
    senderName: string,
    text: string
  ): Promise<Message> {
    const newMessage: Message = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderEmail,
      senderName,
      text,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Save the message
    const allMessages = this.getAllMessages();
    allMessages.push(newMessage);
    this.saveAllMessages(allMessages);

    // Update conversation's last message
    const allConversations = this.getAllConversations();
    const convoIndex = allConversations.findIndex(c => c.id === conversationId);

    if (convoIndex !== -1) {
      const convo = allConversations[convoIndex];
      convo.lastMessage = text;
      convo.lastMessageTime = newMessage.timestamp;

      // Update unread count for other participants
      convo.unreadCount = convo.participants
        .filter(p => p.email.toLowerCase() !== senderEmail.toLowerCase())
        .reduce((sum, p) => sum + 1, 0);

      allConversations[convoIndex] = convo;
      this.saveAllConversations(allConversations);
    }

    // Notify other tabs/browsers via BroadcastChannel
    new BroadcastChannel('ayoo_messaging_v1').postMessage({
      type: 'NEW_MESSAGE',
      message: newMessage
    });

    return newMessage;
  }

  async createConversation(
    participants: { email: string; name: string; role: 'CUSTOMER' | 'MERCHANT' | 'RIDER'; avatar?: string }[],
    orderId?: string,
    orderStatus?: string
  ): Promise<Conversation> {
    const allConversations = this.getAllConversations();

    // Check if conversation already exists between these participants
    const existingConvo = allConversations.find(convo => {
      const participantEmails = convo.participants.map(p => p.email.toLowerCase()).sort();
      const newParticipantEmails = participants.map(p => p.email.toLowerCase()).sort();
      return JSON.stringify(participantEmails) === JSON.stringify(newParticipantEmails);
    });

    if (existingConvo) {
      return existingConvo;
    }

    const newConversation: Conversation = {
      id: `CONVO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participants,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      orderId,
      orderStatus,
    };

    allConversations.push(newConversation);
    this.saveAllConversations(allConversations);

    return newConversation;
  }

  async markConversationAsRead(conversationId: string, email: string): Promise<void> {
    const allMessages = this.getAllMessages();
    const updatedMessages = allMessages.map(m =>
      m.conversationId === conversationId && m.senderEmail.toLowerCase() !== email.toLowerCase()
        ? { ...m, read: true }
        : m
    );
    this.saveAllMessages(updatedMessages);

    // Update unread count in conversation
    const allConversations = this.getAllConversations();
    const convoIndex = allConversations.findIndex(c => c.id === conversationId);

    if (convoIndex !== -1) {
      const convo = allConversations[convoIndex];
      convo.unreadCount = 0;
      allConversations[convoIndex] = convo;
      this.saveAllConversations(allConversations);
    }
  }

  async getOrCreateConversation(
    user1Email: string,
    user1Name: string,
    user1Role: 'CUSTOMER' | 'MERCHANT' | 'RIDER',
    user2Email: string,
    user2Name: string,
    user2Role: 'CUSTOMER' | 'MERCHANT' | 'RIDER',
    orderId?: string,
    orderStatus?: string
  ): Promise<Conversation> {
    const allConversations = this.getAllConversations();

    // Look for existing conversation
    const existingConvo = allConversations.find(convo => {
      const emails = convo.participants.map(p => p.email.toLowerCase());
      return emails.includes(user1Email.toLowerCase()) && emails.includes(user2Email.toLowerCase());
    });

    if (existingConvo) {
      return existingConvo;
    }

    // Create new conversation
    return this.createConversation(
      [
        { email: user1Email, name: user1Name, role: user1Role },
        { email: user2Email, name: user2Name, role: user2Role },
      ],
      orderId,
      orderStatus
    );
  }
}

export const db = new AyooDatabase();
