export interface SeedRestaurant {
  id: string;
  name: string;
  rating: number;
  deliveryTime: string;
  image: string;
  cuisine: string;
  isPartner?: number;
  address?: string;
  hasLiveCam?: number;
  items: any[];
  reviews: any[];
}

const reviewSeed = [
  { id: 'seed-r1', userName: 'Ayoo User', userAvatar: 'https://i.pravatar.cc/150?u=seed1', rating: 5, comment: 'Fresh and fast delivery.', date: 'recently' },
  { id: 'seed-r2', userName: 'Iligan Foodie', userAvatar: 'https://i.pravatar.cc/150?u=seed2', rating: 4, comment: 'Great value and many choices.', date: 'recently' },
];

const i = (id: string, name: string, price: number, category: string, image: string, description: string) => ({
  id,
  name,
  price,
  category,
  image,
  description
});

export const DEFAULT_RESTAURANTS: SeedRestaurant[] = [
  {
    id: 'r-jollibee',
    name: 'Jollibee Iligan',
    rating: 4.8,
    deliveryTime: '20-30 min',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=900',
    cuisine: 'Fast Food',
    isPartner: 1,
    address: 'Aguinaldo St, Iligan City',
    hasLiveCam: 1,
    items: [
      i('jb-1', 'Chickenjoy 1pc', 139, 'Best Sellers', 'https://images.unsplash.com/photo-1562967916-eb82221dfb36?auto=format&fit=crop&q=80&w=300', 'Classic crispy juicy chicken.'),
      i('jb-2', 'Yumburger', 79, 'Burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300', 'Sweet style dressing in a soft bun.'),
      i('jb-3', 'Jolly Spaghetti', 95, 'Pasta', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=300', 'Sweet Filipino style pasta.'),
      i('jb-4', 'Burger Steak', 129, 'Rice Meals', 'https://images.unsplash.com/photo-1639744210633-5f8ec4e59f71?auto=format&fit=crop&q=80&w=300', 'Savory mushroom gravy over rice.'),
      i('jb-5', 'Fries', 65, 'Side Dishes', 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=300', 'Golden crispy potato fries.'),
      i('jb-6', 'Mashed Potato', 59, 'Side Dishes', 'https://images.unsplash.com/photo-1608500218803-8ac8d74d5a2d?auto=format&fit=crop&q=80&w=300', 'Creamy potato with gravy.'),
      i('jb-7', 'Extra Gravy', 20, 'Add-ons', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=300', 'Signature rich gravy cup.'),
      i('jb-8', 'Pineapple Juice', 45, 'Drinks', 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=300', 'Chilled fruit drink.'),
      i('jb-9', 'Iced Tea', 45, 'Drinks', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=300', 'Refreshing lemon iced tea.')
    ],
    reviews: reviewSeed
  },
  {
    id: 'r-tatays',
    name: "Tatay's Grill",
    rating: 4.9,
    deliveryTime: '30-45 min',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=900',
    cuisine: 'Filipino BBQ',
    isPartner: 1,
    address: 'Pala-o, Iligan City',
    hasLiveCam: 1,
    items: [
      i('tg-1', 'Pork BBQ Sticks', 129, 'Best Sellers', 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=300', 'Smoky sweet marinated pork skewers.'),
      i('tg-2', 'Chicken Inasal', 169, 'Best Sellers', 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=300', 'Char-grilled chicken with calamansi.'),
      i('tg-3', 'Liempo', 185, 'Grill Specials', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=300', 'Crisp grilled pork belly.'),
      i('tg-4', 'Bangus Belly', 179, 'Grill Specials', 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=300', 'Boneless milkfish belly grilled.'),
      i('tg-5', 'Garlic Rice', 35, 'Side Dishes', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=300', 'Toasted garlic rice.'),
      i('tg-6', 'Atchara', 25, 'Side Dishes', 'https://images.unsplash.com/photo-1558640476-d09b11a4a6a9?auto=format&fit=crop&q=80&w=300', 'Pickled papaya side.'),
      i('tg-7', 'Extra Sawsawan', 15, 'Add-ons', 'https://images.unsplash.com/photo-1611505908502-5b67e53e3a76?auto=format&fit=crop&q=80&w=300', 'Soy-vinegar dipping sauce.'),
      i('tg-8', 'Halo-Halo', 95, 'Desserts', 'https://images.unsplash.com/photo-1634191640842-7287d558f31f?auto=format&fit=crop&q=80&w=300', 'Classic cold Filipino dessert.'),
      i('tg-9', 'Calamansi Juice', 35, 'Drinks', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=300', 'Fresh citrus drink.')
    ],
    reviews: reviewSeed
  },
  {
    id: 'r-manila-slice',
    name: 'Manila Slice Pizza',
    rating: 4.7,
    deliveryTime: '25-40 min',
    image: 'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&q=80&w=900',
    cuisine: 'Pizza',
    isPartner: 1,
    address: 'Tibanga Highway, Iligan City',
    items: [
      i('ms-1', 'Pepperoni Pan', 329, 'Best Sellers', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=300', 'Loaded pepperoni and mozzarella.'),
      i('ms-2', 'Hawaiian Classic', 319, 'Best Sellers', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=300', 'Ham and pineapple family favorite.'),
      i('ms-3', 'Meat Lovers', 369, 'Signature Pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300', 'Bacon, sausage, pepperoni, beef.'),
      i('ms-4', 'Baked Mac', 149, 'Pasta', 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=300', 'Cheesy baked macaroni.'),
      i('ms-5', 'Spicy Wings 6pcs', 179, 'Side Dishes', 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=300', 'Crispy wings with spicy glaze.'),
      i('ms-6', 'Potato Wedges', 109, 'Side Dishes', 'https://images.unsplash.com/photo-1598679253544-2c97992403ea?auto=format&fit=crop&q=80&w=300', 'Seasoned crispy wedges.'),
      i('ms-7', 'Garlic Bread', 95, 'Side Dishes', 'https://images.unsplash.com/photo-1619531038896-a64c2ea7ad39?auto=format&fit=crop&q=80&w=300', 'Toasted garlic butter bread.'),
      i('ms-8', 'Extra Cheese Dip', 35, 'Add-ons', 'https://images.unsplash.com/photo-1625944525533-473f1f45efb2?auto=format&fit=crop&q=80&w=300', 'Rich creamy cheese sauce.'),
      i('ms-9', 'Lemon Soda', 49, 'Drinks', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=300', 'Sparkling lemon cooler.')
    ],
    reviews: reviewSeed
  },
  {
    id: 'r-kanto-ramen',
    name: 'Kanto Ramen House',
    rating: 4.8,
    deliveryTime: '25-35 min',
    image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&q=80&w=900',
    cuisine: 'Japanese',
    isPartner: 1,
    address: 'Quezon Ave, Iligan City',
    items: [
      i('kr-1', 'Tonkotsu Ramen', 229, 'Best Sellers', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=300', 'Rich pork broth ramen.'),
      i('kr-2', 'Shoyu Ramen', 209, 'Ramen Bowls', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=300', 'Soy based umami broth.'),
      i('kr-3', 'Spicy Miso Ramen', 239, 'Ramen Bowls', 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?auto=format&fit=crop&q=80&w=300', 'Miso broth with chili kick.'),
      i('kr-4', 'Gyoza 6pcs', 129, 'Side Dishes', 'https://images.unsplash.com/photo-1546039907-7fa05f864c02?auto=format&fit=crop&q=80&w=300', 'Pan-fried juicy dumplings.'),
      i('kr-5', 'Karaage', 149, 'Side Dishes', 'https://images.unsplash.com/photo-1562967916-eb82221dfb36?auto=format&fit=crop&q=80&w=300', 'Japanese fried chicken bites.'),
      i('kr-6', 'Ajitama Egg', 35, 'Add-ons', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=300', 'Soy-marinated ramen egg.'),
      i('kr-7', 'Extra Chashu', 65, 'Add-ons', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=300', 'Tender braised pork slices.'),
      i('kr-8', 'Matcha Pudding', 85, 'Desserts', 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?auto=format&fit=crop&q=80&w=300', 'Creamy matcha dessert cup.'),
      i('kr-9', 'Iced Matcha', 95, 'Drinks', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=300', 'Fresh cold whisked matcha.')
    ],
    reviews: reviewSeed
  },
  {
    id: 'r-seoul-bites',
    name: 'Seoul Bites',
    rating: 4.7,
    deliveryTime: '30-45 min',
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&q=80&w=900',
    cuisine: 'Korean',
    isPartner: 1,
    address: 'Del Carmen, Iligan City',
    items: [
      i('sb-1', 'Bibimbap', 199, 'Best Sellers', 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?auto=format&fit=crop&q=80&w=300', 'Mixed rice with veggies and beef.'),
      i('sb-2', 'Kimchi Fried Rice', 179, 'Rice Meals', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=300', 'Savory tangy wok-fried rice.'),
      i('sb-3', 'Korean Fried Chicken', 239, 'Best Sellers', 'https://images.unsplash.com/photo-1562967916-eb82221dfb36?auto=format&fit=crop&q=80&w=300', 'Crunchy glazed chicken pieces.'),
      i('sb-4', 'Bulgogi Bowl', 219, 'Rice Meals', 'https://images.unsplash.com/photo-1604908554167-75d5f2c0ab9d?auto=format&fit=crop&q=80&w=300', 'Sweet savory beef strips over rice.'),
      i('sb-5', 'Tteokbokki', 159, 'Side Dishes', 'https://images.unsplash.com/photo-1512003867696-6d5ce6835040?auto=format&fit=crop&q=80&w=300', 'Rice cakes in spicy sauce.'),
      i('sb-6', 'Kimchi Cup', 45, 'Add-ons', 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&q=80&w=300', 'Fermented spicy cabbage side.'),
      i('sb-7', 'Pickled Radish', 35, 'Add-ons', 'https://images.unsplash.com/photo-1583577612013-4fecf7bf8f13?auto=format&fit=crop&q=80&w=300', 'Sweet cool palate cleanser.'),
      i('sb-8', 'Bingsu', 135, 'Desserts', 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&q=80&w=300', 'Shaved ice with sweet toppings.'),
      i('sb-9', 'Korean Lemonade', 65, 'Drinks', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=300', 'Citrus sparkling ade.')
    ],
    reviews: reviewSeed
  },
  {
    id: 'r-sea-bucket',
    name: 'Sea Bucket',
    rating: 4.8,
    deliveryTime: '35-50 min',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=900',
    cuisine: 'Seafood',
    isPartner: 1,
    address: 'Baywalk, Iligan City',
    hasLiveCam: 1,
    items: [
      i('sbk-1', 'Garlic Butter Shrimp', 289, 'Best Sellers', 'https://images.unsplash.com/photo-1565680018434-b513d7e5fd47?auto=format&fit=crop&q=80&w=300', 'Juicy shrimp in butter garlic sauce.'),
      i('sbk-2', 'Crab Bucket', 399, 'Best Sellers', 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&q=80&w=300', 'Crab with house spice mix.'),
      i('sbk-3', 'Grilled Squid', 269, 'Seafood Mains', 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=300', 'Tender squid with soy glaze.'),
      i('sbk-4', 'Fish Fillet', 239, 'Seafood Mains', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&q=80&w=300', 'Crispy fish fillet set.'),
      i('sbk-5', 'Corn Cob', 45, 'Side Dishes', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=300', 'Buttered sweet corn.'),
      i('sbk-6', 'Cajun Fries', 89, 'Side Dishes', 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=300', 'Fries with cajun seasoning.'),
      i('sbk-7', 'Extra Seafood Sauce', 55, 'Add-ons', 'https://images.unsplash.com/photo-1611505908502-5b67e53e3a76?auto=format&fit=crop&q=80&w=300', 'Signature butter garlic sauce.'),
      i('sbk-8', 'Mango Float', 99, 'Desserts', 'https://images.unsplash.com/photo-1634191640842-7287d558f31f?auto=format&fit=crop&q=80&w=300', 'Layered mango cream dessert.'),
      i('sbk-9', 'Iced Lemon Tea', 49, 'Drinks', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=300', 'Citrusy black tea.')
    ],
    reviews: reviewSeed
  }
];
