import { Restaurant, Review } from './types'; // Siguraduhing may types.ts ka

export const GLOBAL_REGISTRY_KEY = 'ayoo_registry_v15';

export const COLORS = {
  primary: '#FF1493',
  primaryDark: '#E0007B',
  primaryLight: '#FF69B4',
  primaryBg: '#FFF0F5',
  secondary: '#7B2FF7',
  accent: '#FFD700',
  success: '#00C853',
  warning: '#FF9800',
  error: '#F44336',
  white: '#FFFFFF',
  black: '#1A1A2E',
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const IMAGES = {
  logoHorizontal: 'https://d64gsuwffb70l.cloudfront.net/68eb2e4f3c019d04aff05499_1770844265885_539cd4dd.jpg',
  logoVertical: 'https://d64gsuwffb70l.cloudfront.net/68eb2e4f3c019d04aff05499_1770844270632_70df58b5.png',
  logoPinkMascot: 'https://d64gsuwffb70l.cloudfront.net/68eb2e4f3c019d04aff05499_1770844273557_ae970a79.jpg',
  logoPink: 'https://d64gsuwffb70l.cloudfront.net/68eb2e4f3c019d04aff05499_1770844276236_36e2add8.jpg',
  riders: 'https://d64gsuwffb70l.cloudfront.net/68eb2e4f3c019d04aff05499_1770844278367_59b7ebed.jpeg',
};

export const PHILIPPINE_CITIES = [
  'Iligan City',
  'Cagayan de Oro',
  'Metro Manila',
  'Cebu City',
  'Davao City',
  'Zamboanga',
  'Bacoor'
];

export const CATEGORIES = [
  { name: 'Fast Food', icon: '🍔' },
  { name: 'Filipino', icon: '🍲' },
  { name: 'Pizza', icon: '🍕' },
  { name: 'Milk Tea', icon: '🧋' },
  { name: 'Coffee', icon: '☕' },
  { name: 'Desserts', icon: '🍰' },
  { name: 'Japanese', icon: '🍱' },
  { name: 'Korean', icon: '🍗' },
  { name: 'Seafood', icon: '🦞' },
  { name: 'Healthy', icon: '🥗' },
  { name: 'Steak', icon: '🥩' },
];

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', userName: 'Maria Santos', userAvatar: 'https://i.pravatar.cc/150?u=maria', rating: 5, comment: 'The food was absolutely amazing!', date: '2 days ago' },
];

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Jollibee Iligan',
    rating: 4.8,
    deliveryTime: '20-30 min',
    cuisine: 'Fast Food',
    isPartner: true,
    hasLiveCam: true,
    address: 'Aguinaldo St, Iligan City',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: [
      { id: 'j1', name: 'Chickenjoy', price: 135, description: 'Crispy licious chicken.', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=200', category: 'Best Sellers', isPopular: true },
    ]
  },
  {
    id: '2',
    name: "Tatay's Grill",
    rating: 4.9,
    deliveryTime: '35-50 min',
    cuisine: 'Filipino BBQ',
    isPartner: true,
    hasLiveCam: true,
    address: 'Pala-o, Iligan City',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: [
      { id: 't1', name: 'Pork BBQ', price: 120, description: 'Grilled to perfection.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=200', category: 'Best Sellers', isPopular: true },
    ]
  }
];