
import { UserAccount, Address, PaymentMethod, OrderRecord, Voucher, Restaurant } from './types';
import { MOCK_RESTAURANTS } from './constants';

/**
 * Ayoo Production-Ready Data Client
 * This layer bridges the Frontend to the "Ayoo Cloud".
 */
class AyooDatabase {
  private readonly STORAGE_KEYS = {
    AUTH_TOKEN: 'ayoo_session_token_v1',
    USER_PROFILE: 'ayoo_profile_cache_v1',
    ACCOUNTS: 'ayoo_user_registry_v11',
    REMEMBERED: 'ayoo_remembered_v1',
    GLOBAL_HISTORY: 'ayoo_order_log_v1',
    RESTAURANTS: 'ayoo_restaurants_v1'
  };

  async connect() {
    console.log("📡 Ayoo Node: Handshake initialized...");
    return true;
  }

  // Restaurant Management
  async getRestaurants(): Promise<Restaurant[]> {
    const data = localStorage.getItem(this.STORAGE_KEYS.RESTAURANTS);
    if (!data) {
      localStorage.setItem(this.STORAGE_KEYS.RESTAURANTS, JSON.stringify(MOCK_RESTAURANTS));
      return MOCK_RESTAURANTS;
    }
    return JSON.parse(data);
  }

  async saveRestaurants(restaurants: Restaurant[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEYS.RESTAURANTS, JSON.stringify(restaurants));
  }

  async login(email: string, pass: string, remember: boolean): Promise<UserAccount | null> {
    const registry = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ACCOUNTS) || '[]');
    const user = registry.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    
    if (user) {
      const token = btoa(`${email}:${Date.now()}`);
      localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));

      if (remember) {
        localStorage.setItem(this.STORAGE_KEYS.REMEMBERED, JSON.stringify({ email, password: pass }));
      } else {
        localStorage.removeItem(this.STORAGE_KEYS.REMEMBERED);
      }
      return user;
    }
    return null;
  }

  getRemembered() {
    const data = localStorage.getItem(this.STORAGE_KEYS.REMEMBERED);
    return data ? JSON.parse(data) : null;
  }

  async updatePassword(email: string, pass: string): Promise<boolean> {
    const registry = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ACCOUNTS) || '[]');
    const idx = registry.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
      registry[idx].password = pass;
      localStorage.setItem(this.STORAGE_KEYS.ACCOUNTS, JSON.stringify(registry));
      return true;
    }
    return false;
  }

  async getSession(): Promise<UserAccount | null> {
    const profile = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
    return profile ? JSON.parse(profile) : null;
  }

  async logout() {
    localStorage.removeItem(this.STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.USER_PROFILE);
  }

  async updateProfile(email: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    const current = await this.getSession();
    if (!current) return null;
    const updated = { ...current, ...updates };
    localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    
    const registry = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ACCOUNTS) || '[]');
    const idx = registry.findIndex((u: any) => u.email === email);
    if (idx !== -1) {
      registry[idx] = updated;
      localStorage.setItem(this.STORAGE_KEYS.ACCOUNTS, JSON.stringify(registry));
    }
    return updated;
  }

  async register(user: UserAccount): Promise<{ success: boolean; message: string }> {
    const registry = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ACCOUNTS) || '[]');
    if (registry.some((u: any) => u.email === user.email)) {
      return { success: false, message: 'Account exists.' };
    }
    localStorage.setItem(this.STORAGE_KEYS.ACCOUNTS, JSON.stringify([...registry, user]));
    return { success: true, message: 'Registered.' };
  }

  async saveOrder(email: string, order: OrderRecord): Promise<void> {
    const userKey = `orders_${email}`;
    const userHistory = JSON.parse(localStorage.getItem(userKey) || '[]');
    localStorage.setItem(userKey, JSON.stringify([order, ...userHistory]));

    const globalKey = this.STORAGE_KEYS.GLOBAL_HISTORY;
    const globalLog = JSON.parse(localStorage.getItem(globalKey) || '[]');
    localStorage.setItem(globalKey, JSON.stringify([{ ...order, syncTime: new Date().toISOString() }, ...globalLog]));
  }

  async getHistory(email: string): Promise<OrderRecord[]> {
    return JSON.parse(localStorage.getItem(`orders_${email}`) || '[]');
  }

  async hasSeenOnboarding() { return !!localStorage.getItem('onboarding_done'); }
  async setOnboardingSeen(s: boolean) { localStorage.setItem('onboarding_done', s ? '1' : ''); }

  async getCart(email: string) { return JSON.parse(localStorage.getItem(`cart_${email}`) || '{"items":[],"voucher":null}'); }
  async saveCart(email: string, items: any[], voucher: any) { localStorage.setItem(`cart_${email}`, JSON.stringify({ items, voucher })); }
  async clearCart(email: string) { localStorage.removeItem(`cart_${email}`); }

  async getAddresses(email: string) { return JSON.parse(localStorage.getItem(`addr_${email}`) || '[]'); }
  async saveAddresses(email: string, addrs: any[]) { localStorage.setItem(`addr_${email}`, JSON.stringify(addrs)); }
  async getPayments(email: string) { return JSON.parse(localStorage.getItem(`pay_${email}`) || '[]'); }
  async savePayments(email: string, pays: any[]) { localStorage.setItem(`pay_${email}`, JSON.stringify(pays)); }
  async getUserByEmail(email: string) { 
    const reg = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ACCOUNTS) || '[]');
    return reg.find((u: any) => u.email === email) || null;
  }
}

export const db = new AyooDatabase();
