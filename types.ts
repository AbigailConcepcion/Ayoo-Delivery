
export type AppScreen = 'ONBOARDING' | 'AUTH' | 'HOME' | 'RESTAURANT' | 'CART' | 'TRACKING' | 'VOUCHERS' | 'HISTORY' | 'PROFILE' | 'ADDRESSES' | 'PAYMENTS' | 'MERCHANT_DASHBOARD' | 'RIDER_DASHBOARD' | 'ADMIN_PANEL';

export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'RIDER';

export interface UserAccount {
  email: string;
  name: string;
  avatar?: string;
  password?: string;
  points: number;
  xp: number; 
  level: number;
  streak: number;
  badges: UserBadge[];
  preferredCity?: string;
  role?: UserRole;
  merchantId?: string;
  earnings?: number;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  timestamp: string;
  orderId?: string;
  methodType?: PaymentType;
  referenceId: string;
  status: 'SETTLED' | 'PENDING' | 'FAILED';
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  isPopular?: boolean;
  isSpicy?: boolean;
  isNew?: boolean;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  deliveryTime: string;
  image: string;
  cuisine: string;
  items: FoodItem[];
  isPartner?: boolean;
  address?: string;
  hasLiveCam?: boolean;
  reviews?: Review[];
}

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface OrderRecord {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  restaurantName: string;
  customerEmail: string;
  customerName: string;
  riderName?: string;
  riderEmail?: string;
  deliveryAddress: string;
  tipAmount?: number;
  pointsEarned?: number;
  paymentMethod?: string;
  paymentId?: string;
  isPaid?: boolean;
  transactionId?: string;
  rating?: number;
  comment?: string;
  receiptUrl?: string;
}

export interface UserBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Voucher {
  id: string;
  code: string;
  discount: number;
  description: string;
  type: 'percent' | 'fixed';
}

export interface Address {
  id: string;
  label: string;
  details: string;
  city: string;
}

export type PaymentType = 'VISA' | 'MASTERCARD' | 'GCASH' | 'MAYA' | 'CASH';

export interface PaymentMethod {
  id: string;
  type: PaymentType;
  last4?: string;
  expiry?: string;
  phoneNumber?: string;
  balance?: number;
}
