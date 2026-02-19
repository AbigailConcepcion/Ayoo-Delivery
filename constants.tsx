
import { Restaurant, Review } from './types';

export const GLOBAL_REGISTRY_KEY = 'ayoo_registry_v15';

export const COLORS = {
  HOT_PINK: '#FF00CC',
  PURPLE: '#8A2BE2',
  CYAN: '#00C2FF',
  YELLOW: '#FFD700',
  WHITE: '#FFFFFF',
  BLACK: '#1A1A1A',
  GREY: '#F2F2F2',
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
  { id: 'r1', userName: 'Maria Santos', userAvatar: 'https://i.pravatar.cc/150?u=maria', rating: 5, comment: 'The food was absolutely amazing and arrived hot! Best in Iligan.', date: '2 days ago' },
  { id: 'r2', userName: 'John Doe', userAvatar: 'https://i.pravatar.cc/150?u=john', rating: 4, comment: 'Great portions, but the delivery took a bit longer than expected.', date: '1 week ago' },
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
      { id: 'j1', name: 'Chickenjoy 1pc w/ Spaghetti', price: 135, description: 'Crispy licious chicken served with the legendary sweet-style spaghetti.', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=200', category: 'Best Sellers', isPopular: true },
      { id: 'j2', name: 'Yumburger w/ Fries', price: 95, description: 'Classic beef burger with a side of crispy golden fries.', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=200', category: 'Burgers' },
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
      { id: 't1', name: 'Special Pork BBQ (3pcs)', price: 120, description: 'Marinated in Tatay’s secret sauce and grilled to perfection.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=200', category: 'Best Sellers', isPopular: true },
    ]
  },
  {
    id: '4',
    name: 'Pizza House Iligan',
    rating: 4.6,
    deliveryTime: '40-55 min',
    cuisine: 'Pizza & Pasta',
    isPartner: true,
    hasLiveCam: false,
    address: 'Quezon Ave, Iligan City',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: [
      { id: 'p1', name: 'Hawaiian Overload', price: 350, description: 'Loaded with pineapples, ham, and premium cheese.', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=200', category: 'Pizza', isPopular: true },
    ]
  }
];
