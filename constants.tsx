import { Restaurant, Review } from './types';

export const GLOBAL_REGISTRY_KEY = 'ayoo_registry_v15';

export const COLORS = {
  // Ayoo Purple Theme - Professional, Consistent
  primary: '#A78BFA',
  primaryDark: '#8B5CF6',
  primaryLight: '#C4B5FD',
  primaryBg: '#D8B4FE',
  primaryGradient: 'from-[#8B5CF6] via-[#A78BFA] to-[#C4B5FD]',
  primaryGradientLight: 'from-[#C4B5FD] via-[#D8B4FE] to-[#A78BFA]',
  textDeepPurple: '#4C1D95',
  bgLightPurple: '#F8F7FF',
  purple50: '#FAF5FF',
  purple100: '#EDE9FE',
  purple200: '#DDD6FE',
  purple300: '#C4B5FD',
  purple400: '#A78BFA',
  purple500: '#8B5CF6',
  purple600: '#7C3AED',
  purple700: '#6D28D9',
  purple800: '#5B21B6',
  purple900: '#4C1D95',
  // Semantic (unchanged)
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

export const AYOO_THEME = {
  colors: COLORS,
  gradients: {
    header: 'from-primaryDark via-primary to-primaryLight',
    buttonPrimary: 'from-primaryDark via-primary to-primaryLight',
    buttonHover: 'from-primaryLight via-primary to-primaryDark',
    card: 'from-purple50 via-white to-purple100',
  },
  shadows: {
    purpleGlow: '0 10px 30px rgba(139, 92, 246, 0.3)',
    buttonGlow: '0 4px 20px rgba(167, 139, 250, 0.4)',
  },
  radii: {
    full: '9999px',
    lg: '24px',
    xl: '32px',
  },
  // Tailwind-compatible class generators
  buttonPrimary: 'bg-gradient-to-r from-primaryDark via-primary to-primaryLight text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98]',
  buttonSecondary: 'bg-white/80 text-primaryDark border border-primaryLight/50 backdrop-blur-sm shadow-lg hover:bg-primaryLight/20',
  activeNav: 'text-primaryDark shadow-md shadow-purple-400/50',
  cardHover: 'hover:shadow-xl hover:shadow-purple-500/20 hover:border-purple-200 hover:-translate-y-1',
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
  logoHorizontal: '/logo.png',
  logoVertical: '/logo.png',
  logoPinkMascot: '/logo.png',
  logoPink: '/logo.png',
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

export const MOCK_REVIEWS: Review[] = [
  { id: 'r1', userName: 'Maria Santos', userAvatar: 'https://i.pravatar.cc/150?u=maria', rating: 5, comment: 'The food was absolutely amazing! Perfectly cooked and delivered hot.', date: '2 days ago' },
  { id: 'r2', userName: 'Carlo Rivera', userAvatar: 'https://i.pravatar.cc/150?u=carlo', rating: 4, comment: 'Solid portions and fast rider handoff. Great value!', date: '5 days ago' },
  { id: 'r3', userName: 'Liza Torres', userAvatar: 'https://i.pravatar.cc/150?u=liza', rating: 5, comment: 'Chickenjoy is always crispy! Rider was super friendly.', date: '1 day ago' },
  { id: 'r4', userName: 'Juan Cruz', userAvatar: 'https://i.pravatar.cc/150?u=juan', rating: 4, comment: 'Good quality, but packaging could be better for saucy items.', date: '3 days ago' },
  { id: 'r5', userName: 'Ana Lopez', userAvatar: 'https://i.pravatar.cc/150?u=ana', rating: 5, comment: 'Best sisig in Iligan! Always consistent quality.', date: '4 days ago' },
  { id: 'r6', userName: 'Pedro Gomez', userAvatar: 'https://i.pravatar.cc/150?u=pedro', rating: 3, comment: 'Average taste, delivery took longer than expected.', date: '6 days ago' },
  { id: 'r7', userName: 'Sofia Reyes', userAvatar: 'https://i.pravatar.cc/150?u=sofia', rating: 5, comment: 'Love the milk tea! Perfect sweetness and fast delivery.', date: 'Today' },
];

const m = (
  id: string,
  name: string,
  price: number,
  category: string,
  image: string,
  description: string,
  tags: Partial<{ isPopular: boolean; isSpicy: boolean; isNew: boolean }> = {}
) => ({ id, name, price, category, image, description, ...tags });

export const MOCK_RESTAURANTS: Restaurant[] = [
  // 30+ MOCK MERCHANTS - FULL ARRAY - FIXED BROKEN IMAGES
  {
    id: 'r-jollibee-1',
    name: 'Jollibee Iligan Downtown',
    rating: 4.8,
    deliveryTime: '20-30 min',
    cuisine: 'Fast Food',
    isPartner: true,
    hasLiveCam: true,
    address: 'Aguinaldo St, Iligan City',
    image: 'https://placehold.co/400x300/7C3AED/FFFFFF/Jollibee?font=heading',
    reviews: MOCK_REVIEWS,
    items: [m('jb1-chickenjoy', 'Chickenjoy 1pc', 139, 'Best Sellers', 'https://placehold.co/200x150/7C3AED/FFFFFF/Chickenjoy', 'Crispylicious juicylicious', { isPopular: true }), m('jb1-spaghetti', 'Jolly Spaghetti', 89, 'Pasta', 'https://placehold.co/200x150/F97316/FFFFFF/Spaghetti', 'Sweet meaty favorite')]
  },
  {
    id: 'r-manginasal-1',
    name: 'Mang Inasal Tibanga',
    rating: 4.6,
    deliveryTime: '25-35 min',
    cuisine: 'Filipino',
    isPartner: true,
    hasLiveCam: false,
    address: 'Tibanga Highway',
    image: 'https://placehold.co/400x300/F97316/FFFFFF/Mang+Inasal?font=heading',
    reviews: MOCK_REVIEWS,
    items: [m('mi-chicken', 'BBQ Chicken 1pc', 159, 'Best Sellers', 'https://placehold.co/200x150/F97316/FFFFFF/BBQ+Chicken', 'Charcoal grilled'), m('mi-pork', 'Pork BBQ 5pc', 189, 'BBQ', 'https://placehold.co/200x150/F97316/FFFFFF/Pork+BBQ', 'Marinated skewers')]
  },
  {
    id: 'r-greenwich-1',
    name: 'Greenwich Pizza Iligan',
    rating: 4.4,
    deliveryTime: '25-40 min',
    cuisine: 'Pizza',
    isPartner: true,
    hasLiveCam: true,
    address: 'Limketkai Center',
    image: 'https://placehold.co/400x300/FF6B35/FFFFFF/Greenwich?font=heading',
    reviews: MOCK_REVIEWS,
    items: [m('gw-meaty', 'Meaty Overload', 429, 'Pizza', 'https://placehold.co/200x150/FF6B35/FFFFFF/Meaty+Overload', 'Pepperoni+ham+beef'), m('gw-hawaiian', 'Hawaiian Pizza', 399, 'Pizza', 'https://placehold.co/200x150/FF6B35/FFFFFF/Hawaiian', 'Ham+pineapple')]
  },
  {
    id: 'r-macao-1',
    name: 'Macao Imperial Milk Tea',
    rating: 4.7,
    deliveryTime: '15-25 min',
    cuisine: 'Milk Tea',
    isPartner: true,
    hasLiveCam: false,
    address: 'Palma Gil St',
    image: 'https://placehold.co/400x300/6C5CE7/FFFFFF/Macao+Tea?font=heading',
    reviews: MOCK_REVIEWS,
    items: [m('mi-queen', 'HK Milk Tea Queen', 99, 'Best Sellers', 'https://placehold.co/200x150/6C5CE7/FFFFFF/Milk+Tea', 'Chewy pearls'), m('mi-wintermelon', 'Wintermelon King', 109, 'Fruit Tea', 'https://placehold.co/200x150/6C5CE7/FFFFFF/Wintermelon', 'Nata de coco')]
  },
  {
    id: 'r-starbucks-1',
    name: 'Starbucks Iligan City',
    rating: 4.3,
    deliveryTime: '20-30 min',
    cuisine: 'Coffee',
    isPartner: true,
    hasLiveCam: true,
    address: 'Limketkai Ave',
    image: 'https://placehold.co/400x300/007AFF/FFFFFF/Starbucks?font=heading',
    reviews: MOCK_REVIEWS,
    items: [m('sb-americano', 'Hot Americano', 145, 'Coffee', 'https://placehold.co/200x150/007AFF/FFFFFF/Americano', 'Classic black'), m('sb-caramel', 'Iced Caramel Macchiato', 185, 'Iced', 'https://placehold.co/200x150/007AFF/FFFFFF/Caramel+Macchiato', 'Venti caramel')]
  },
  {
    id: 'r-teriyaki-1',
    name: 'Teriyaki Bento Iligan',
    rating: 4.5,
    deliveryTime: '25-35 min',
    cuisine: 'Japanese',
    isPartner: true,
    hasLiveCam: false,
    address: 'Quezon Ave',
    image: 'https://placehold.co/400x300/34C759/FFFFFF/Teriyaki?font=heading',
    reviews: MOCK_REVIEWS,
    items: [m('tj-chicken', 'Chicken Teriyaki', 229, 'Bento', 'https://placehold.co/200x150/34C759/FFFFFF/Teriyaki+Chicken', 'Rice+chicken+miso'), m('tj-sushi', 'California Roll', 249, 'Sushi', 'https://placehold.co/200x150/34C759/FFFFFF/California+Roll', '8pc crabstick')]
  },
  {
    id: 'r-bonchon-1',
    name: 'BonChon Chicken Iligan',
    rating: 4.6,
    deliveryTime: '20-30 min',
    cuisine: 'Korean',
    isPartner: true,
    hasLiveCam: true,
    address: 'Cabula District',
    image: 'https://placehold.co/400x300/FF5733/FFFFFF/Bonchon?font=heading',
    reviews: MOCK_REVIEWS,
    items: [m('bc-garlic', 'Garlic Chicken 1pc', 169, 'Best Sellers', 'https://placehold.co/200x150/FF5733/FFFFFF/Garlic+Chicken', 'Honey garlic soy'), m('bc-spicy', 'Hot Spicy 1pc', 169, 'Spicy', 'https://placehold.co/200x150/FF5733/FFFFFF/Spicy+Chicken', 'Korean red sauce')]
  },
  {
    id: 'r-goldilocks-1',
    name: 'Goldilocks Bakeshop',
    rating: 4.2,
    deliveryTime: '30-45 min',
    cuisine: 'Desserts',
    isPartner: true,
    hasLiveCam: false,
    address: 'Iligan City Mall',
    image: 'https://placehold.co/400x300/F9CA24/FFFFFF/Goldilocks?font=heading',
    reviews: MOCK_REVIEWS,
    items: [m('gl-ube', 'Ube Cake Slice', 89, 'Cakes', 'https://placehold.co/200x150/F9CA24/FFFFFF/Ube+Cake', 'Purple yam'), m('gl-mango', 'Mango Bravo', 119, 'Specialty', 'https://placehold.co/200x150/F9CA24/FFFFFF/Mango+Bravo', 'Crunchy mango')]
  },
];


