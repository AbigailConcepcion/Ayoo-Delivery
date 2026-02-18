
import { UserAccount, Address, PaymentMethod, OrderRecord, Voucher, Restaurant, WalletTransaction, FoodItem } from './types';
import { MOCK_RESTAURANTS } from './constants';

class AyooDatabase {
  public static ENV = {
    USE_REAL_BACKEND: false,
    BASE_URL: 'https://api.ayoo.ph/v1',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3
  };

  private readonly STORAGE_KEYS = {
    AUTH_TOKEN: 'ayoo_jwt_v1',
    USER_PROFILE: 'ayoo_profile_v1',
    SYSTEM_CONFIG: 'ayoo_config_v1',
    RESTAURANTS: 'ayoo_merchants_registry_v1'
  };

  async connect() { 
    return new Promise((resolve) => setTimeout(() => resolve(true), 1200));
  }

  async login(email: string, pass: string, remember: boolean): Promise<UserAccount | null> {
    const registry = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
    const user = registry.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (user) {
      localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
      return user;
    }
    return null;
  }

  async register(user: UserAccount): Promise<{ success: boolean; message: string }> {
    const registry = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
    if (registry.find((u: any) => u.email.toLowerCase() === user.email.toLowerCase())) {
      return { success: false, message: 'Identity conflict.' };
    }
    registry.push({ ...user, manualsSeen: [] });
    localStorage.setItem('ayoo_user_registry_v11', JSON.stringify(registry));
    return { success: true, message: 'Provisioned.' };
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

  async updateMerchantMenu(resId: string, items: FoodItem[]) {
    const list = await this.getRestaurants();
    const updated = list.map(r => r.id === resId ? { ...r, items } : r);
    await this.saveRestaurants(updated);
  }

  async getHistory(email: string): Promise<OrderRecord[]> {
    return JSON.parse(localStorage.getItem(`orders_${email}`) || '[]');
  }

  async getLedger(ownerId: string): Promise<WalletTransaction[]> {
    const ledger = JSON.parse(localStorage.getItem('ayoo_financial_ledger_v1') || '{}');
    return ledger[ownerId] || [];
  }

  async getSession(): Promise<UserAccount | null> {
    const profile = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
    return profile ? JSON.parse(profile) : null;
  }

  async logout() {
    localStorage.removeItem(this.STORAGE_KEYS.USER_PROFILE);
  }

  async updateProfile(email: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    const registry = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
    const idx = registry.findIndex((u: any) => u.email === email);
    if (idx === -1) return null;
    const updated = { ...registry[idx], ...updates };
    registry[idx] = updated;
    localStorage.setItem('ayoo_user_registry_v11', JSON.stringify(registry));
    localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    return updated;
  }

  // Fixed error in screens/Auth.tsx: Added missing updatePassword method
  async updatePassword(email: string, newPass: string): Promise<boolean> {
    const registry = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
    const idx = registry.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;
    registry[idx].password = newPass;
    localStorage.setItem('ayoo_user_registry_v11', JSON.stringify(registry));
    return true;
  }

  // Voucher Logic
  async claimVoucher(email: string, voucher: Voucher) {
    const vouchers = JSON.parse(localStorage.getItem(`vouchers_${email}`) || '[]');
    if (!vouchers.find((v: any) => v.id === voucher.id)) {
      vouchers.push(voucher);
      localStorage.setItem(`vouchers_${email}`, JSON.stringify(vouchers));
    }
  }

  async getClaimedVouchers(email: string): Promise<Voucher[]> {
    return JSON.parse(localStorage.getItem(`vouchers_${email}`) || '[]');
  }

  async getAddresses(email: string) { return JSON.parse(localStorage.getItem(`addresses_${email}`) || '[]'); }
  async saveAddresses(email: string, a: Address[]) { localStorage.setItem(`addresses_${email}`, JSON.stringify(a)); }
  async getPayments(email: string) { return JSON.parse(localStorage.getItem(`pay_${email}`) || '[]'); }
  async savePayments(email: string, p: PaymentMethod[]) { localStorage.setItem(`pay_${email}`, JSON.stringify(p)); }
  async updatePaymentBalance(email: string, mid: string, bal: number) {
    const pay = await this.getPayments(email);
    const up = pay.map(p => p.id === mid ? { ...p, balance: bal } : p);
    localStorage.setItem(`pay_${email}`, JSON.stringify(up));
  }
  async addLedgerEntry(owner: string, entry: WalletTransaction) {
    const ledger = JSON.parse(localStorage.getItem('ayoo_financial_ledger_v1') || '{}');
    if (!ledger[owner]) ledger[owner] = [];
    ledger[owner] = [entry, ...ledger[owner]];
    localStorage.setItem('ayoo_financial_ledger_v1', JSON.stringify(ledger));
  }
  async saveOrder(email: string, order: OrderRecord) {
    const history = JSON.parse(localStorage.getItem(`orders_${email}`) || '[]');
    localStorage.setItem(`orders_${email}`, JSON.stringify([order, ...history]));
  }
  async getUserByEmail(email: string) { 
    const reg = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
    return reg.find((u: any) => u.email === email) || null;
  }
  async getSystemConfig() { return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SYSTEM_CONFIG) || '{"deliveryFee":45}'); }
  async saveSystemConfig(c: any) { localStorage.setItem(this.STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(c)); }
  async getRemembered() { return JSON.parse(localStorage.getItem('ayoo_remembered_v1') || 'null'); }
  async setOnboardingSeen(s: boolean) { localStorage.setItem('onboarding_done', s ? '1' : ''); }
  async hasSeenOnboarding() { return !!localStorage.getItem('onboarding_done'); }
  async getCart(email: string) { return JSON.parse(localStorage.getItem(`cart_${email}`) || '{"items":[],"voucher":null}'); }
  async saveCart(email: string, items: any[], voucher: any) { localStorage.setItem(`cart_${email}`, JSON.stringify({ items, voucher })); }
  async clearCart(email: string) { localStorage.removeItem(`cart_${email}`); }
}

export const db = new AyooDatabase();
