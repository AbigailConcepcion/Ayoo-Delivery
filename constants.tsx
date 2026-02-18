
import { Restaurant, Review } from './types';

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
  { id: 'r3', userName: 'Sarah Lee', userAvatar: 'https://i.pravatar.cc/150?u=sarah', rating: 5, comment: 'Ayoo always delivers! This place is my new favorite.', date: '3 days ago' },
];

const generateItems = (prefix: string, cuisine: string) => [
  { id: `${prefix}1`, name: `Signature ${cuisine} Plate`, price: 250, description: 'The chef\'s special selection of premium ingredients.', image: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200`, category: 'Best Sellers', isPopular: true },
  { id: `${prefix}2`, name: `Classic ${cuisine} Bowl`, price: 180, description: 'A hearty serving of traditional flavors.', image: `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200`, category: 'Main Course' },
  { id: `${prefix}3`, name: `Spicy ${cuisine} Wings`, price: 210, description: 'Coated in our secret spicy glaze.', image: `https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=200`, category: 'Appetizers', isSpicy: true },
  { id: `${prefix}4`, name: `${cuisine} Delight`, price: 120, description: 'A light and refreshing snack.', image: `https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&q=80&w=200`, category: 'Snacks' },
];

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Jollibee Iligan',
    rating: 4.8,
    deliveryTime: '20-30 min',
    cuisine: 'Fast Food',
    isPartner: true,
    address: 'Aguinaldo St, Iligan City',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: [
      { id: 'j1', name: 'Chickenjoy 1pc w/ Spaghetti', price: 135, description: 'Crispy licious chicken served with the legendary sweet-style spaghetti.', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=200', category: 'Best Sellers', isPopular: true },
      { id: 'j2', name: 'Yumburger w/ Fries', price: 95, description: 'Classic beef burger with a side of crispy golden fries.', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=200', category: 'Burgers' },
      { id: 'j3', name: 'Chocolate Sundae', price: 45, description: 'Creamy vanilla soft serve topped with rich chocolate syrup.', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=200', category: 'Desserts' },
    ]
  },
  {
    id: '2',
    name: "Tatay's Grill",
    rating: 4.9,
    deliveryTime: '35-50 min',
    cuisine: 'Filipino BBQ',
    isPartner: true,
    address: 'Pala-o, Iligan City',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
    reviews: [
      { id: 'tr1', userName: 'Benjie O.', userAvatar: 'https://i.pravatar.cc/150?u=benjie', rating: 5, comment: 'The best BBQ in the city! Secret sauce is actually secret magic.', date: 'Today' }
    ],
    items: [
      { id: 't1', name: 'Special Pork BBQ (3pcs)', price: 120, description: 'Marinated in Tatay’s secret sauce and grilled to perfection.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=200', category: 'Best Sellers', isPopular: true },
      { id: 't2', name: 'Chicken Inasal', price: 165, description: 'Iligan-style grilled chicken with annatto oil and lime.', image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&q=80&w=200', category: 'Main Course' },
      { id: 't4', name: 'Extra Java Rice', price: 25, description: 'Yellow-colored savory rice.', image: 'https://images.unsplash.com/photo-1512058560366-cd2427ff6675?auto=format&fit=crop&q=80&w=200', category: 'Sides' },
    ]
  },
  {
    id: '3',
    name: 'Streetwise Coffee',
    rating: 4.7,
    deliveryTime: '15-25 min',
    cuisine: 'Cafe & Pastries',
    isPartner: false,
    address: 'Tibanga Highway, Iligan City',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: [
      { id: 's1', name: 'Spanish Latte (Iced)', price: 145, description: 'Strong espresso with condensed milk for a sweet kick.', image: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&q=80&w=200', category: 'Coffee', isPopular: true },
      { id: 's2', name: 'Caramel Macchiato', price: 155, description: 'Layered espresso with vanilla syrup and caramel drizzle.', image: 'https://images.unsplash.com/photo-1485808191679-5f6333c1d181?auto=format&fit=crop&q=80&w=200', category: 'Coffee' },
    ]
  },
  {
    id: '4',
    name: 'Pizza House Iligan',
    rating: 4.6,
    deliveryTime: '40-55 min',
    cuisine: 'Pizza & Pasta',
    isPartner: true,
    address: 'Quezon Ave, Iligan City',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: [
      { id: 'p1', name: 'Hawaiian Overload', price: 350, description: 'Loaded with pineapples, ham, and premium cheese.', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=200', category: 'Pizza', isPopular: true },
      { id: 'p3', name: 'Spicy Buffalo Wings', price: 220, description: '6 pieces of wings tossed in extra hot buffalo sauce.', image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=200', category: 'Appetizers', isSpicy: true },
    ]
  },
  {
    id: '5',
    name: 'Sunburst Fried Chicken',
    rating: 4.9,
    deliveryTime: '25-40 min',
    cuisine: 'Filipino',
    isPartner: true,
    address: 'Tibanga, Iligan City',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: generateItems('sun', 'Chicken'),
  },
  {
    id: '6',
    name: 'Tokyo Tokyo',
    rating: 4.5,
    deliveryTime: '30-45 min',
    cuisine: 'Japanese',
    isPartner: true,
    address: 'Gaisano Mall, Iligan',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: generateItems('tok', 'Bento'),
  },
  {
    id: '7',
    name: "Cheding's Peanuts",
    rating: 5.0,
    deliveryTime: '15-20 min',
    cuisine: 'Local Delicacy',
    isPartner: true,
    address: 'Saray, Iligan City',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: [
      { id: 'ch1', name: 'Classic Salted Peanuts (500g)', price: 180, description: 'Iligan\'s world-famous crunchy peanuts.', image: 'https://images.unsplash.com/photo-1569460275615-7dc3efc173d9?auto=format&fit=crop&q=80&w=200', category: 'Pasalubong', isPopular: true },
      { id: 'ch2', name: 'Sugar Coated Peanuts', price: 195, description: 'Sweet and crunchy treats.', image: 'https://images.unsplash.com/photo-1569460275615-7dc3efc173d9?auto=format&fit=crop&q=80&w=200', category: 'Pasalubong' },
    ],
  },
  {
    id: '8',
    name: "Aruma Coffee",
    rating: 4.8,
    deliveryTime: '20-30 min',
    cuisine: 'Coffee',
    isPartner: true,
    address: 'Quezon Ave, Iligan',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: generateItems('aru', 'Espresso'),
  },
  {
    id: '9',
    name: "Kevlo's Steakhouse",
    rating: 4.7,
    deliveryTime: '45-60 min',
    cuisine: 'Steak',
    isPartner: true,
    address: 'Pala-o, Iligan',
    image: 'https://images.unsplash.com/photo-1546964124-0cce462f38e1?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: generateItems('kev', 'Steak'),
  },
  {
    id: '10',
    name: "Greenery Salads",
    rating: 4.4,
    deliveryTime: '25-35 min',
    cuisine: 'Healthy',
    isPartner: false,
    address: 'Tibanga, Iligan',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600',
    reviews: MOCK_REVIEWS,
    items: generateItems('gre', 'Salad'),
  }
];
