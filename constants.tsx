import { Restaurant, Review } from './types';

export const GLOBAL_REGISTRY_KEY = 'ayoo_registry_v15';

// ============================================
// AYOO DESIGN SYSTEM - Professional & Consistent
// ============================================

export const COLORS = {
  // Primary Brand Colors (Light Purple Ayoo theme)
  primary: '#C084FC',       // Light Purple - main brand color
  primaryDark: '#A855F7',   // Darker purple for hover states
  primaryLight: '#E9D5FF',  // Lighter purple for accents
  primaryBg: '#F3E8FF',     // Very light purple background
  primaryGradient: 'linear-gradient(135deg, #C084FC 0%, #A78BFA 50%, #8B5CF6 100%)',

  // Secondary Colors
  secondary: '#8B5CF6',     // Purple accent
  secondaryLight: '#C084FC',

  // Accent Colors
  accent: '#D8B4FE',        // Light lavender accent for badges/rewards
  accentLight: '#EDE9FE',

  // Status Colors
  success: '#10B981',       // Green - success states
  successLight: '#D1FAE5',
  warning: '#F59E0B',       // Amber - warnings
  warningLight: '#FEF3C7',
  error: '#EF4444',         // Red - errors
  errorLight: '#FEE2E2',
  info: '#3B82F6',          // Blue - info

  // Neutral Colors
  white: '#FFFFFF',
  black: '#111827',
  blackLight: '#1F2937',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
};

// ============================================
// STANDARDIZED BORDER RADIUS
// ============================================
export const RADIUS = {
  sm: '8px',      // Small elements like badges
  md: '12px',     // Buttons, inputs
  lg: '16px',     // Cards, modals
  xl: '20px',     // Large cards
  xxl: '24px',    // Extra large containers
  full: '9999px', // Pills, avatars
};

// ============================================
// CONSISTENT SHADOWS
// ============================================
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  card: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(192, 132, 252, 0.12)',
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(192, 132, 252, 0.15)',
  purple: '0 4px 14px rgba(192, 132, 252, 0.25)',
  button: '0 2px 8px rgba(192, 132, 252, 0.3)',
};

// ============================================
// TYPOGRAPHY
// ============================================
export const TYPOGRAPHY = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

// ============================================
// SPACING
// ============================================
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  '5xl': '48px',
};

// ============================================
// TRANSITIONS
// ============================================
export const TRANSITIONS = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
};

// ============================================
// Z-INDEX SCALE
// ============================================
export const Z_INDEX = {
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
};

export const IMAGES = {
  logoHorizontal: 'https://d64gsuwffb70l.cloudfront.net/68eb2e4f3c019d04aff05499_1770844265885_539cd4dd.jpg',
  logoVertical: 'https://d64gsuwffb70l.cloudfront.net/68eb2e4f3c019d04aff05499_1770844270632_70df58b5.png',
  logoPurple: 'logo.png',  // New local purple logo
  logoPurpleMascot: 'https://d64gsuwffb70l.cloudfront.net/68eb2e4f3c019d04aff05499_1770844273557_ae970a79.jpg',
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
  { id: 'r2', userName: 'Carlo Rivera', userAvatar: 'https://i.pravatar.cc/150?u=carlo', rating: 4, comment: 'Solid portions and fast rider handoff.', date: '5 days ago' },
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
  {
    id: 'r-jollibee',
    name: 'Jollibee Iligan',
    rating: 4.8,
    deliveryTime: '20-30 min',
    cuisine: 'Fast Food',
    isPartner: true,
    hasLiveCam: true,
    address: 'Aguinaldo St, Iligan City',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=900',
    reviews: MOCK_REVIEWS,
    items: [
      m('jb-1', 'Chickenjoy 1pc', 139, 'Best Sellers', 'https://images.unsplash.com/photo-1562967916-eb82221dfb36?auto=format&fit=crop&q=80&w=300', 'Classic crispy juicy chicken.', { isPopular: true }),
      m('jb-2', 'Chickenjoy 2pc', 239, 'Best Sellers', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&q=80&w=300', 'Double serving for bigger cravings.', { isPopular: true }),
      m('jb-3', 'Yumburger', 79, 'Burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300', 'Sweet style dressing in a soft bun.'),
      m('jb-4', 'Cheesy Yumburger', 99, 'Burgers', 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&q=80&w=300', 'Burger with melty cheese.'),
      m('jb-5', 'Jolly Spaghetti', 95, 'Pasta', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=300', 'Sweet Filipino style pasta.', { isPopular: true }),
      m('jb-6', 'Burger Steak', 129, 'Rice Meals', 'https://images.unsplash.com/photo-1639744210633-5f8ec4e59f71?auto=format&fit=crop&q=80&w=300', 'Savory mushroom gravy over rice.'),
      m('jb-7', 'Peach Mango Pie', 55, 'Desserts', 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&q=80&w=300', 'Hot crispy dessert pie.'),
      m('jb-8', 'Fries', 65, 'Side Dishes', 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=300', 'Golden crispy potato fries.'),
      m('jb-9', 'Mashed Potato', 59, 'Side Dishes', 'https://images.unsplash.com/photo-1608500218803-8ac8d74d5a2d?auto=format&fit=crop&q=80&w=300', 'Creamy potato with gravy.'),
      m('jb-10', 'Extra Gravy', 20, 'Add-ons', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=300', 'Signature rich gravy cup.'),
      m('jb-11', 'Pineapple Juice', 45, 'Drinks', 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=300', 'Chilled fruit drink.'),
      m('jb-12', 'Iced Tea', 45, 'Drinks', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=300', 'Refreshing lemon iced tea.'),
    ]
  },
  {
    id: 'r-tatays',
    name: "Tatay's Grill",
    rating: 4.9,
    deliveryTime: '30-45 min',
    cuisine: 'Filipino BBQ',
    isPartner: true,
    hasLiveCam: true,
    address: 'Pala-o, Iligan City',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=900',
    reviews: MOCK_REVIEWS,
    items: [
      m('tg-1', 'Pork BBQ Sticks', 129, 'Best Sellers', 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=300', 'Smoky sweet marinated pork skewers.', { isPopular: true }),
      m('tg-2', 'Chicken Inasal', 169, 'Best Sellers', 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=300', 'Char-grilled chicken with calamansi.', { isPopular: true }),
      m('tg-3', 'Liempo', 185, 'Grill Specials', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=300', 'Crisp grilled pork belly.'),
      m('tg-4', 'Bangus Belly', 179, 'Grill Specials', 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=300', 'Boneless milkfish belly grilled.'),
      m('tg-5', 'Garlic Rice', 35, 'Side Dishes', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=300', 'Toasted garlic rice.'),
      m('tg-6', 'Java Rice', 45, 'Side Dishes', 'https://images.unsplash.com/photo-1516685018646-549d52c1d5f5?auto=format&fit=crop&q=80&w=300', 'Savory spiced rice.'),
      m('tg-7', 'Atchara', 25, 'Side Dishes', 'https://images.unsplash.com/photo-1558640476-d09b11a4a6a9?auto=format&fit=crop&q=80&w=300', 'Pickled papaya side.'),
      m('tg-8', 'Extra Sawsawan', 15, 'Add-ons', 'https://images.unsplash.com/photo-1611505908502-5b67e53e3a76?auto=format&fit=crop&q=80&w=300', 'Soy-vinegar dipping sauce.'),
      m('tg-9', 'Sinigang Soup Cup', 69, 'Add-ons', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=300', 'Sour tamarind broth cup.'),
      m('tg-10', 'Halo-Halo', 95, 'Desserts', 'https://images.unsplash.com/photo-1634191640842-7287d558f31f?auto=format&fit=crop&q=80&w=300', 'Classic cold Filipino dessert.'),
      m('tg-11', 'Sago Gulaman', 39, 'Drinks', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=300', 'Sweet chilled refreshment.'),
      m('tg-12', 'Calamansi Juice', 35, 'Drinks', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=300', 'Fresh citrus drink.'),
    ]
  },
  {
    id: 'r-manila-slice',
    name: 'Manila Slice Pizza',
    rating: 4.7,
    deliveryTime: '25-40 min',
    cuisine: 'Pizza',
    isPartner: true,
    address: 'Tibanga Highway, Iligan City',
    image: 'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&q=80&w=900',
    reviews: MOCK_REVIEWS,
    items: [
      m('ms-1', 'Pepperoni Pan', 329, 'Best Sellers', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=300', 'Loaded pepperoni and mozzarella.', { isPopular: true }),
      m('ms-2', 'Hawaiian Classic', 319, 'Best Sellers', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=300', 'Ham and pineapple family favorite.'),
      m('ms-3', 'Meat Lovers', 369, 'Signature Pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300', 'Bacon, sausage, pepperoni, beef.', { isPopular: true }),
      m('ms-4', 'Truffle Mushroom', 359, 'Signature Pizza', 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=300', 'Creamy mushroom with truffle oil.'),
      m('ms-5', 'Baked Mac', 149, 'Pasta', 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=300', 'Cheesy baked macaroni.'),
      m('ms-6', 'Spicy Wings 6pcs', 179, 'Side Dishes', 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=300', 'Crispy wings with spicy glaze.', { isSpicy: true }),
      m('ms-7', 'Potato Wedges', 109, 'Side Dishes', 'https://images.unsplash.com/photo-1598679253544-2c97992403ea?auto=format&fit=crop&q=80&w=300', 'Seasoned crispy wedges.'),
      m('ms-8', 'Garlic Bread', 95, 'Side Dishes', 'https://images.unsplash.com/photo-1619531038896-a64c2ea7ad39?auto=format&fit=crop&q=80&w=300', 'Toasted garlic butter bread.'),
      m('ms-9', 'Extra Cheese Dip', 35, 'Add-ons', 'https://images.unsplash.com/photo-1625944525533-473f1f45efb2?auto=format&fit=crop&q=80&w=300', 'Rich creamy cheese sauce.'),
      m('ms-10', 'Chili Flakes Pack', 10, 'Add-ons', 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&q=80&w=300', 'Heat booster for pizza lovers.'),
      m('ms-11', 'Lemon Soda', 49, 'Drinks', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=300', 'Sparkling lemon cooler.'),
      m('ms-12', 'Chocolate Float', 69, 'Drinks', 'https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&q=80&w=300', 'Cold chocolate with cream top.'),
    ]
  },
  {
    id: 'r-kanto-ramen',
    name: 'Kanto Ramen House',
    rating: 4.8,
    deliveryTime: '25-35 min',
    cuisine: 'Japanese',
    isPartner: true,
    address: 'Quezon Ave, Iligan City',
    image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&q=80&w=900',
    reviews: MOCK_REVIEWS,
    items: [
      m('kr-1', 'Tonkotsu Ramen', 229, 'Best Sellers', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=300', 'Rich pork broth ramen.', { isPopular: true }),
      m('kr-2', 'Shoyu Ramen', 209, 'Ramen Bowls', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=300', 'Soy based umami broth.'),
      m('kr-3', 'Spicy Miso Ramen', 239, 'Ramen Bowls', 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?auto=format&fit=crop&q=80&w=300', 'Miso broth with chili kick.', { isSpicy: true }),
      m('kr-4', 'Gyoza 6pcs', 129, 'Side Dishes', 'https://images.unsplash.com/photo-1546039907-7fa05f864c02?auto=format&fit=crop&q=80&w=300', 'Pan-fried juicy dumplings.'),
      m('kr-5', 'Karaage', 149, 'Side Dishes', 'https://images.unsplash.com/photo-1562967916-eb82221dfb36?auto=format&fit=crop&q=80&w=300', 'Japanese fried chicken bites.'),
      m('kr-6', 'Tempura', 169, 'Side Dishes', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=300', 'Light crispy shrimp tempura.'),
      m('kr-7', 'Ajitama Egg', 35, 'Add-ons', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=300', 'Soy-marinated ramen egg.'),
      m('kr-8', 'Extra Chashu', 65, 'Add-ons', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=300', 'Tender braised pork slices.'),
      m('kr-9', 'Seaweed Pack', 20, 'Add-ons', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=300', 'Crisp nori sheets.'),
      m('kr-10', 'Matcha Pudding', 85, 'Desserts', 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?auto=format&fit=crop&q=80&w=300', 'Creamy matcha dessert cup.'),
      m('kr-11', 'Iced Matcha', 95, 'Drinks', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=300', 'Fresh cold whisked matcha.'),
      m('kr-12', 'Cold Brew Tea', 69, 'Drinks', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300', 'Smooth house blend tea.'),
    ]
  },
  {
    id: 'r-seoul-bites',
    name: 'Seoul Bites',
    rating: 4.7,
    deliveryTime: '30-45 min',
    cuisine: 'Korean',
    isPartner: true,
    address: 'Del Carmen, Iligan City',
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&q=80&w=900',
    reviews: MOCK_REVIEWS,
    items: [
      m('sb-1', 'Bibimbap', 199, 'Best Sellers', 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?auto=format&fit=crop&q=80&w=300', 'Mixed rice with veggies and beef.', { isPopular: true }),
      m('sb-2', 'Kimchi Fried Rice', 179, 'Rice Meals', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=300', 'Savory tangy wok-fried rice.', { isSpicy: true }),
      m('sb-3', 'Korean Fried Chicken', 239, 'Best Sellers', 'https://images.unsplash.com/photo-1562967916-eb82221dfb36?auto=format&fit=crop&q=80&w=300', 'Crunchy glazed chicken pieces.', { isPopular: true }),
      m('sb-4', 'Bulgogi Bowl', 219, 'Rice Meals', 'https://images.unsplash.com/photo-1604908554167-75d5f2c0ab9d?auto=format&fit=crop&q=80&w=300', 'Sweet savory beef strips over rice.'),
      m('sb-5', 'Tteokbokki', 159, 'Side Dishes', 'https://images.unsplash.com/photo-1512003867696-6d5ce6835040?auto=format&fit=crop&q=80&w=300', 'Rice cakes in spicy sauce.', { isSpicy: true }),
      m('sb-6', 'Japchae', 149, 'Side Dishes', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=300', 'Glass noodles with sesame flavor.'),
      m('sb-7', 'Kimchi Cup', 45, 'Add-ons', 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&q=80&w=300', 'Fermented spicy cabbage side.'),
      m('sb-8', 'Pickled Radish', 35, 'Add-ons', 'https://images.unsplash.com/photo-1583577612013-4fecf7bf8f13?auto=format&fit=crop&q=80&w=300', 'Sweet cool palate cleanser.'),
      m('sb-9', 'Steamed Egg', 75, 'Add-ons', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=300', 'Soft fluffy Korean steamed egg.'),
      m('sb-10', 'Bingsu', 135, 'Desserts', 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&q=80&w=300', 'Shaved ice with sweet toppings.'),
      m('sb-11', 'Korean Lemonade', 65, 'Drinks', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=300', 'Citrus sparkling ade.'),
      m('sb-12', 'Milkis', 59, 'Drinks', 'https://images.unsplash.com/photo-1567679319440-4a6f6f77fbd0?auto=format&fit=crop&q=80&w=300', 'Creamy soda beverage.'),
    ]
  },
  {
    id: 'r-brew-lab',
    name: 'Brew Lab Cafe',
    rating: 4.6,
    deliveryTime: '18-30 min',
    cuisine: 'Coffee',
    isPartner: true,
    address: 'Andres Bonifacio Ave, Iligan City',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=900',
    reviews: MOCK_REVIEWS,
    items: [
      m('bl-1', 'Spanish Latte', 139, 'Coffee', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=300', 'Creamy sweet espresso latte.', { isPopular: true }),
      m('bl-2', 'Americano', 99, 'Coffee', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300', 'Strong clean black coffee.'),
      m('bl-3', 'Sea Salt Latte', 149, 'Coffee', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=300', 'Smooth latte with salted cream.', { isNew: true }),
      m('bl-4', 'Caramel Macchiato', 149, 'Coffee', 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=300', 'Espresso with caramel drizzle.'),
      m('bl-5', 'Classic Milk Tea', 109, 'Milk Tea', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=300', 'Brown sugar milk tea classic.'),
      m('bl-6', 'Wintermelon Tea', 109, 'Milk Tea', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&q=80&w=300', 'Sweet refreshing wintermelon tea.'),
      m('bl-7', 'Blueberry Cheesecake', 145, 'Desserts', 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=300', 'Creamy slice with berry topping.'),
      m('bl-8', 'Chocolate Croissant', 95, 'Desserts', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=300', 'Buttery pastry with chocolate.'),
      m('bl-9', 'Hashbrown Bites', 79, 'Side Dishes', 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=300', 'Crispy potato bites.'),
      m('bl-10', 'Chicken Slider', 129, 'Side Dishes', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300', 'Mini sandwich for quick snacks.'),
      m('bl-11', 'Extra Pearl', 20, 'Add-ons', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&q=80&w=300', 'Tapioca pearls addon.'),
      m('bl-12', 'Extra Espresso Shot', 25, 'Add-ons', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=300', 'Additional caffeine boost.'),
    ]
  },
  {
    id: 'r-green-spoon',
    name: 'Green Spoon',
    rating: 4.7,
    deliveryTime: '20-35 min',
    cuisine: 'Healthy',
    isPartner: true,
    address: 'Poblacion, Iligan City',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=900',
    reviews: MOCK_REVIEWS,
    items: [
      m('gs-1', 'Chicken Caesar Bowl', 199, 'Best Sellers', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&q=80&w=300', 'Romaine, grilled chicken, parmesan.', { isPopular: true }),
      m('gs-2', 'Salmon Grain Bowl', 259, 'Bowls', 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&q=80&w=300', 'Seared salmon with quinoa mix.', { isPopular: true }),
      m('gs-3', 'Tofu Teriyaki Bowl', 189, 'Bowls', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300', 'Plant-based protein meal.'),
      m('gs-4', 'Keto Beef Bowl', 249, 'Bowls', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=300', 'Low-carb bowl with beef strips.'),
      m('gs-5', 'Roasted Veggies', 95, 'Side Dishes', 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&q=80&w=300', 'Oven roasted seasonal vegetables.'),
      m('gs-6', 'Mushroom Soup', 85, 'Side Dishes', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=300', 'Creamy mushroom soup cup.'),
      m('gs-7', 'Avocado Slice', 45, 'Add-ons', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=300', 'Fresh avocado portion.'),
      m('gs-8', 'Boiled Egg', 25, 'Add-ons', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=300', 'Protein booster.'),
      m('gs-9', 'Chia Pudding', 99, 'Desserts', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=300', 'Light sweet chia cup.'),
      m('gs-10', 'Fruit Cup', 75, 'Desserts', 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&q=80&w=300', 'Fresh seasonal fruits.'),
      m('gs-11', 'Cucumber Lemon', 55, 'Drinks', 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=300', 'Hydrating citrus drink.'),
      m('gs-12', 'Green Smoothie', 119, 'Drinks', 'https://images.unsplash.com/photo-1505253210343-d046bde03fe2?auto=format&fit=crop&q=80&w=300', 'Spinach, mango, and banana blend.'),
    ]
  },
  {
    id: 'r-sea-bucket',
    name: 'Sea Bucket',
    rating: 4.8,
    deliveryTime: '35-50 min',
    cuisine: 'Seafood',
    isPartner: true,
    hasLiveCam: true,
    address: 'Baywalk, Iligan City',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=900',
    reviews: MOCK_REVIEWS,
    items: [
      m('sbk-1', 'Garlic Butter Shrimp', 289, 'Best Sellers', 'https://images.unsplash.com/photo-1565680018434-b513d7e5fd47?auto=format&fit=crop&q=80&w=300', 'Juicy shrimp in butter garlic sauce.', { isPopular: true }),
      m('sbk-2', 'Crab Bucket', 399, 'Best Sellers', 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&q=80&w=300', 'Crab with house spice mix.', { isPopular: true }),
      m('sbk-3', 'Grilled Squid', 269, 'Seafood Mains', 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=300', 'Tender squid with soy glaze.'),
      m('sbk-4', 'Fish Fillet', 239, 'Seafood Mains', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&q=80&w=300', 'Crispy fish fillet set.'),
      m('sbk-5', 'Corn Cob', 45, 'Side Dishes', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=300', 'Buttered sweet corn.'),
      m('sbk-6', 'Cajun Fries', 89, 'Side Dishes', 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=300', 'Fries with cajun seasoning.', { isSpicy: true }),
      m('sbk-7', 'Extra Seafood Sauce', 55, 'Add-ons', 'https://images.unsplash.com/photo-1611505908502-5b67e53e3a76?auto=format&fit=crop&q=80&w=300', 'Signature butter garlic sauce.'),
      m('sbk-8', 'Steamed Rice', 25, 'Add-ons', 'https://images.unsplash.com/photo-1516685018646-549d52c1d5f5?auto=format&fit=crop&q=80&w=300', 'Plain steamed rice.'),
      m('sbk-9', 'Calamari Rings', 169, 'Side Dishes', 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&q=80&w=300', 'Crispy squid rings with dip.'),
      m('sbk-10', 'Mango Float', 99, 'Desserts', 'https://images.unsplash.com/photo-1634191640842-7287d558f31f?auto=format&fit=crop&q=80&w=300', 'Layered mango cream dessert.'),
      m('sbk-11', 'Iced Lemon Tea', 49, 'Drinks', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=300', 'Citrusy black tea.'),
      m('sbk-12', 'Cucumber Cooler', 55, 'Drinks', 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=300', 'Cooling cucumber refresher.'),
    ]
  },
];
