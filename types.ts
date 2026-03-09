
export type AppScreen = 'ONBOARDING' | 'AUTH' | 'SERVICES' | 'HOME' | 'SEARCH' | 'MESSAGES' | 'GROCERIES' | 'COURIER' | 'RIDES' | 'DINE_OUT' | 'PHARMACY' | 'RESTAURANT' | 'CART' | 'TRACKING' | 'VOUCHERS' | 'HISTORY' | 'PROFILE' | 'ADDRESSES' | 'PAYMENTS' | 'PABILI' | 'MERCHANT_DASHBOARD' | 'RIDER_DASHBOARD' | 'ADMIN_PANEL' | 'MANUAL';

export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  MERCHANT: 'MERCHANT',
  RIDER: 'RIDER',
  ADMIN: 'ADMIN',
} as const;

export const UserRole = USER_ROLES;

export type UserRole = typeof UserRole[keyof typeof UserRole];

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
  manualsSeen?: string[];
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
  items: { name: string; quantity: number; price: number; id?: string }[];
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
  isPaid?: boolean | number;
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
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  deliveryFee?: number;
}

export type PaymentType = 'VISA' | 'MASTERCARD' | 'GCASH' | 'MAYA' | 'CASH' | 'COD';

export interface PaymentMethod {
  id: string;
  type: PaymentType;
  last4?: string;
  expiry?: string;
  phoneNumber?: string;
  balance?: number | null;
  token?: string;
}

// ==================== MESSAGING TYPES ====================

export type ParticipantRole = 'CUSTOMER' | 'MERCHANT' | 'RIDER';

export interface ConversationParticipant {
  email: string;
  name: string;
  role: ParticipantRole;
  avatar?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderEmail: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  orderId?: string;
  orderStatus?: string;
}

// Community Platform Types
export type CommunityRole = 'customer' | 'merchant' | 'rider';

export interface CommunityMember {
  id: string;
  name: string;
  role: CommunityRole;
  avatar?: string;
  stats: string;
  badge: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  comments: Comment[];
  reactions: Reaction[];
  userReaction?: string;
}

// ==================== LEADERBOARD TYPES ====================

export type LeaderboardType = 'customers' | 'merchants' | 'riders';
export type LeaderboardPeriod = 'week' | 'month' | 'all';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  email?: string;
  // Customer metrics
  ordersCount?: number;
  totalSpent?: number;
  // Merchant metrics
  restaurantName?: string;
  completedOrders?: number;
  averageRating?: number;
  earnings?: number;
  // Rider metrics
  deliveriesCount?: number;
  riderRating?: number;
}

