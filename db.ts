
import { UserAccount, Address, PaymentMethod, OrderRecord, Voucher, Restaurant, WalletTransaction, FoodItem } from './types';
import { MOCK_RESTAURANTS, GLOBAL_REGISTRY_KEY } from './constants';

class AyooDatabase {
  public static ENV = {
    USE_REAL_BACKEND: false,
    BASE_URL: 'https://api.ayoo.ph/v1',
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

  async connect() { 
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
    window.location.reload();
  }

  async login(email: string, pass: string, remember: boolean): Promise<UserAccount | null> {
    const registry = this.getRegistry();
    const cleanEmail = email.toLowerCase().trim();
    const user = registry.find((u: any) => u.email.toLowerCase() === cleanEmail && u.password === pass);
    
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
    const registry = this.getRegistry();
    const cleanEmail = user.email.toLowerCase().trim();
    
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
    const registry = this.getRegistry();
    const cleanEmail = email.toLowerCase().trim();
    return registry.find((u: any) => u.email.toLowerCase() === cleanEmail) || null;
  }

  async updateProfile(email: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    const registry = this.getRegistry();
    const cleanEmail = email.toLowerCase().trim();
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
    const saved = localStorage.getItem(this.STORAGE_KEYS.RESTAURANTS);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(this.STORAGE_KEYS.RESTAURANTS, JSON.stringify(MOCK_RESTAURANTS));
    return MOCK_RESTAURANTS;
  }

  async saveRestaurants(list: Restaurant[]) {
    localStorage.setItem(this.STORAGE_KEYS.RESTAURANTS, JSON.stringify(list));
  }

  // Fix: Added updateMerchantMenu method to update specific merchant's food items in the database
  async updateMerchantMenu(merchantId: string, items: FoodItem[]) {
    const restaurants = await this.getRestaurants();
    const updated = restaurants.map(r => r.id === merchantId ? { ...r, items } : r);
    await this.saveRestaurants(updated);
  }

  async getHistory(email: string): Promise<OrderRecord[]> {
    return JSON.parse(localStorage.getItem(`orders_${email.toLowerCase()}`) || '[]');
  }

  async getLedger(ownerId: string): Promise<WalletTransaction[]> {
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

  async getAddresses(email: string) { return JSON.parse(localStorage.getItem(`addresses_${email.toLowerCase()}`) || '[]'); }
  async saveAddresses(email: string, a: Address[]) { localStorage.setItem(`addresses_${email.toLowerCase()}`, JSON.stringify(a)); }
  async getPayments(email: string) { return JSON.parse(localStorage.getItem(`pay_${email.toLowerCase()}`) || '[]'); }
  async savePayments(email: string, p: PaymentMethod[]) { localStorage.setItem(`pay_${email.toLowerCase()}`, JSON.stringify(p)); }
  async updatePaymentBalance(email: string, mid: string, bal: number) {
    const pay = await this.getPayments(email);
    const up = pay.map(p => p.id === mid ? { ...p, balance: bal } : p);
    localStorage.setItem(`pay_${email.toLowerCase()}`, JSON.stringify(up));
  }
  async addLedgerEntry(owner: string, entry: WalletTransaction) {
    const ledger = JSON.parse(localStorage.getItem('ayoo_financial_ledger_v2') || '{}');
    const key = owner.toLowerCase();
    if (!ledger[key]) ledger[key] = [];
    ledger[key] = [entry, ...ledger[key]];
    localStorage.setItem('ayoo_financial_ledger_v2', JSON.stringify(ledger));
  }
  async saveOrder(email: string, order: OrderRecord) {
    const key = `orders_${email.toLowerCase()}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([order, ...history]));
  }
  async getSystemConfig() { return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SYSTEM_CONFIG) || '{"deliveryFee":45,"masterPin":"1234"}'); }
  async saveSystemConfig(c: any) { localStorage.setItem(this.STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(c)); }
  async getCart(email: string) { return JSON.parse(localStorage.getItem(`cart_${email.toLowerCase()}`) || '{"items":[],"voucher":null}'); }
  async saveCart(email: string, items: any[], voucher: any) { localStorage.setItem(`cart_${email.toLowerCase()}`, JSON.stringify({ items, voucher })); }
  async clearCart(email: string) { localStorage.removeItem(`cart_${email.toLowerCase()}`); }
}

export const db = new AyooDatabase();
