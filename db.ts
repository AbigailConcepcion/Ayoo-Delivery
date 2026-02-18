
import { UserAccount, Address, PaymentMethod, OrderRecord, Voucher, Restaurant, WalletTransaction } from './types';
import { MOCK_RESTAURANTS } from './constants';

/**
 * Ayoo Cloud Connector (Production Version)
 */
class AyooDatabase {
  // --- PRODUCTION CONFIGURATION ---
  public static ENV = {
    USE_REAL_BACKEND: false, // <-- TOGGLE THIS TO TRUE TO CONNECT TO YOUR SERVER
    BASE_URL: 'https://api.ayoo.ph/v1',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3
  };

  private readonly STORAGE_KEYS = {
    AUTH_TOKEN: 'ayoo_jwt_v1',
    USER_PROFILE: 'ayoo_profile_v1',
    SYSTEM_CONFIG: 'ayoo_config_v1'
  };

  /**
   * Production-Grade Fetch Interceptor
   */
  private async request(endpoint: string, options: RequestInit = {}) {
    if (!AyooDatabase.ENV.USE_REAL_BACKEND) return null;

    const token = localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Client-Version': '1.0.0-production',
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AyooDatabase.ENV.TIMEOUT);

    try {
      const response = await fetch(`${AyooDatabase.ENV.BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.status === 401) {
        this.logout();
        window.location.reload();
        throw new Error('Session Expired');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') throw new Error('Request Timed Out');
      throw error;
    }
  }

  async connect() { 
    // Handshake with server to verify connectivity
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      try {
        await this.request('/health');
        return true;
      } catch (e) {
        console.error("Cloud Node Offline");
        return false;
      }
    }
    return new Promise((resolve) => setTimeout(() => resolve(true), 1200));
  }

  // --- AUTH SERVICES ---

  async login(email: string, pass: string, remember: boolean): Promise<UserAccount | null> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      const result = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass })
      });
      if (result?.token) {
        localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, result.token);
        localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(result.user));
        return result.user;
      }
      return null;
    }

    // Local Persistence Simulator
    const registry = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
    const user = registry.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (user) {
      localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, `SIMULATED_JWT_${btoa(email)}`);
      localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
      return user;
    }
    return null;
  }

  async register(user: UserAccount): Promise<{ success: boolean; message: string }> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      return await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(user)
      });
    }

    const registry = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
    if (registry.find((u: any) => u.email.toLowerCase() === user.email.toLowerCase())) {
      return { success: false, message: 'Identity conflict in local nodes.' };
    }
    registry.push(user);
    localStorage.setItem('ayoo_user_registry_v11', JSON.stringify(registry));
    return { success: true, message: 'Provisioned locally.' };
  }

  // --- DATA SYNC ---

  async getRestaurants(): Promise<Restaurant[]> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) return await this.request('/merchants');
    return MOCK_RESTAURANTS;
  }

  async getHistory(email: string): Promise<OrderRecord[]> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) return await this.request(`/orders?customer=${email}`);
    return JSON.parse(localStorage.getItem(`orders_${email}`) || '[]');
  }

  async getLedger(ownerId: string): Promise<WalletTransaction[]> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) return await this.request(`/wallet/ledger?ownerId=${ownerId}`);
    const ledger = JSON.parse(localStorage.getItem('ayoo_financial_ledger_v1') || '{}');
    return ledger[ownerId] || [];
  }

  // --- PERSISTENCE ---

  async getSession(): Promise<UserAccount | null> {
    const profile = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
    return profile ? JSON.parse(profile) : null;
  }

  async logout() {
    localStorage.removeItem(this.STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.USER_PROFILE);
  }

  async updateProfile(email: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    if (AyooDatabase.ENV.USE_REAL_BACKEND) {
      return await this.request(`/profile/${email}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    }
    const registry = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
    const idx = registry.findIndex((u: any) => u.email === email);
    if (idx === -1) return null;
    const updated = { ...registry[idx], ...updates };
    registry[idx] = updated;
    localStorage.setItem('ayoo_user_registry_v11', JSON.stringify(registry));
    localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    return updated;
  }

  // SIMULATOR HELPERS (STILL USE LOCALSTORAGE FOR CLIENT PREFS)
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
  async updatePassword(email: string, pass: string) {
    const reg = JSON.parse(localStorage.getItem('ayoo_user_registry_v11') || '[]');
    const idx = reg.findIndex((u: any) => u.email === email);
    if (idx === -1) return false;
    reg[idx].password = pass;
    localStorage.setItem('ayoo_user_registry_v11', JSON.stringify(reg));
    return true;
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
