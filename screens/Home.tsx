/// <reference path="../src/react-shims.d.ts" />
import React from 'react';

import { CATEGORIES, PHILIPPINE_CITIES } from '../constants';
import { Restaurant, UserBadge, AppScreen, OrderRecord } from '../types';

interface HomeProps {
  restaurants: Restaurant[];
  onSelectRestaurant?: (restaurant: Restaurant) => void;
  onOpenCart?: () => void;
  onNavigate?: (s: AppScreen) => void;
  cartCount?: number;
  points?: number;
  streak?: number;
  badges?: UserBadge[];
  deliveryCity: string;
  onSetDeliveryCity: (city: string) => void;
  currentUser?: any;
  recentOrders?: OrderRecord[];
}

const quickServices: ReadonlyArray<{ icon: string; name: string; caption: string; screen: AppScreen }> = [
  { icon: '🍔', name: 'Food', caption: 'Fast delivery', screen: 'SEARCH' },
  { icon: '🛒', name: 'Mart', caption: 'Daily essentials', screen: 'GROCERIES' },
  { icon: '📦', name: 'Padala', caption: 'Same-day drop', screen: 'COURIER' },
  { icon: '🚗', name: 'Rides', caption: 'Book a trip', screen: 'RIDES' },
];

const moodOptions = [
  { name: 'Lazy', icon: '😴' },
  { name: 'Hungry', icon: '😋' },
  { name: 'Celebratory', icon: '🥳' },
  { name: 'Healthy', icon: '🥗' },
  { name: 'Adventurous', icon: '🌶️' },
] as const;

const Home: React.FC<HomeProps> = ({
  restaurants = [],
  onSelectRestaurant,
  onOpenCart,
  onNavigate,
  cartCount = 0,
  points = 0,
  streak = 0,
  badges = [],
  deliveryCity = 'Iligan City',
  onSetDeliveryCity,
  currentUser,
  recentOrders = [],
}) => {
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiSuggestion, setAiSuggestion] = React.useState<string | null>(null);
  const [recommendedId, setRecommendedId] = React.useState<string | null>(null);
  const [selectedMood, setSelectedMood] = React.useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = React.useState(false);
  const [geoStatus, setGeoStatus] = React.useState<'IDLE' | 'FETCHING' | 'ERROR'>('IDLE');
  const [activeTab, setActiveTab] = React.useState<'discover' | 'community'>('discover');

  const userRole = currentUser?.role || 'CUSTOMER';
  const firstName = currentUser?.name?.split(' ')[0] || 'Ayoo';

  const filteredRestaurants = React.useMemo(() => {
    let list = restaurants.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase())
    );

    if (selectedCategory) {
      list = list.filter((r) => r.cuisine.toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    if (recommendedId) {
      const rec = list.find((r) => r.id === recommendedId);
      const others = list.filter((r) => r.id !== recommendedId);
      return rec ? [rec, ...others] : list;
    }

return list; // Show all merchants
  }, [search, recommendedId, selectedCategory, restaurants]);

const PLACEHOLDER_RESTAURANT = 'https://placehold.co/400x300/6D28D9/FFFFFF/png?text=Restaurant&font=roboto';

const featuredRestaurants = React.useMemo(() => {
    return [...restaurants].sort((a, b) => b.rating - a.rating).slice(0, 8);
  }, [restaurants]);

  const trendingItems = React.useMemo(() => {
    return restaurants.flatMap((r) => r.items?.filter((i) => i.isPopular || false) || []).slice(0, 6);
  }, [restaurants]);

  const handleGetCurrentLocation = () => {
    setGeoStatus('FETCHING');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          onSetDeliveryCity('Iligan City');
          setShowLocationPicker(false);
          setGeoStatus('IDLE');
        },
        () => setGeoStatus('ERROR')
      );
    } else {
      setGeoStatus('ERROR');
    }
  };

  const askAiForMood = async (mood: string) => {
    setSelectedMood(mood);
    setAiLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const suggestions = {
      Lazy: 'Chickenjoy from Mang Inasal for an easy comfort-food night.',
      Hungry: 'Go for a loaded burger combo and fries from your nearest fast-food favorite.',
      Celebratory: 'Pizza and milk tea combo for a mini celebration at home.',
      Healthy: 'Fresh grilled chicken salad and fruit tea for a lighter pick.',
      Adventurous: 'Spicy hotpot or Korean wings if you want something bold tonight.',
    };

    const suggestion = suggestions[mood as keyof typeof suggestions];
    setAiSuggestion(suggestion);

    if (suggestion) {
      const match = restaurants.find((r) => suggestion.toLowerCase().includes(r.name.toLowerCase()));
      if (match) {
        setRecommendedId(match.id);
      }
    }

    setAiLoading(false);
  };

  const handleServiceClick = (screen: AppScreen) => {
    onNavigate?.(screen);
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    onSelectRestaurant?.(restaurant);
  };

  return (
    <div className="min-h-screen bg-transparent text-[#2D1456] scrollbar-hide">
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_60px_rgba(88,28,135,0.18)]">
            <div className="mx-auto mb-6 h-2 w-16 rounded-full bg-purple-100"></div>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-400">Ayoo delivery zone</p>
                <h2 className="mt-2 text-2xl font-black text-[#31135E]">Choose your location</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationPicker(false)}
                className="rounded-2xl bg-purple-50 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-purple-600"
              >
                Close
              </button>
            </div>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={geoStatus === 'FETCHING'}
              className="mb-4 w-full rounded-[24px] bg-gradient-to-r from-purple-700 via-purple-500 to-purple-300 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_18px_35px_rgba(124,58,237,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {geoStatus === 'FETCHING' ? 'Finding you...' : 'Use my current location'}
            </button>

            {geoStatus === 'ERROR' && (
              <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                We could not access your location. Pick a city below instead.
              </p>
            )}

            <div className="max-h-64 space-y-3 overflow-y-auto scrollbar-hide">
              {PHILIPPINE_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    onSetDeliveryCity(city);
                    setShowLocationPicker(false);
                    setGeoStatus('IDLE');
                  }}
                  className={[
                    'flex w-full items-center justify-between rounded-[22px] border px-4 py-4 text-left text-sm font-black transition-all',
                    deliveryCity === city
                      ? 'border-purple-500 bg-gradient-to-r from-purple-700 via-purple-500 to-purple-300 text-white shadow-[0_16px_32px_rgba(124,58,237,0.18)]'
                      : 'border-purple-100 bg-white text-[#41206F] hover:border-purple-200 hover:bg-purple-50',
                  ].join(' ')}
                >
                  <span>{city}</span>
                  <span className="text-xs uppercase tracking-[0.18em]">Deliver</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="relative overflow-hidden rounded-b-[36px] border-b border-white/50 bg-gradient-to-br from-[#7C3AED] via-[#9F7AEA] to-[#D6BCFA] px-6 pb-8 pt-6 text-white shadow-[0_20px_55px_rgba(109,40,217,0.22)]">
        <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute right-0 top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/70">Ayoo now</p>
            <h1 className="mt-2 text-[28px] font-black leading-none">Hi, {firstName}</h1>
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              className="mt-3 flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-left text-sm font-bold backdrop-blur-md"
            >
              <span className="text-base">📍</span>
              <span>{deliveryCity}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-[24px] border border-white/20 bg-white/14 px-4 py-3 text-right backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">Points</p>
              <p className="mt-1 text-lg font-black">{points}</p>
            </div>
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex h-14 w-14 items-center justify-center rounded-[24px] bg-white text-[#6D28D9] shadow-[0_16px_30px_rgba(47,16,84,0.16)]"
            >
              <span className="text-2xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#4C1D95] text-[10px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Moved to Profile */}

        <div className="relative mt-5">
          <input
            type="text"
            placeholder="Search food, coffee, groceries, or merchants"
            className="w-full rounded-[28px] border border-white/35 bg-white px-14 py-4 text-sm font-bold text-[#432067] outline-none ring-0 placeholder:text-purple-300 shadow-[0_16px_30px_rgba(47,16,84,0.1)]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl">🔍</span>
          <button
            type="button"
            onClick={() => onNavigate?.('SEARCH')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-purple-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#7C3AED]"
          >
            Explore
          </button>
        </div>
      </header>

      <main className="px-5 pt-6">
        <section className="rounded-[30px] border border-white/70 bg-white/80 p-3 shadow-[0_18px_45px_rgba(109,40,217,0.08)] backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-3">
            {quickServices.map((service) => (
              <button
                key={service.name}
                type="button"
                onClick={() => handleServiceClick(service.screen)}
                className="rounded-[24px] bg-[#F8F4FF] p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_30px_rgba(124,58,237,0.12)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-purple-700 via-purple-500 to-purple-300 text-2xl text-white shadow-[0_12px_22px_rgba(124,58,237,0.18)]">
                  {service.icon}
                </div>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#40205F]">{service.name}</p>
                <p className="mt-1 text-[10px] font-bold text-purple-400">{service.caption}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2 rounded-full bg-white/70 p-1 backdrop-blur-sm shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className={[
                'flex-1 rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all',
                activeTab === 'discover' ? 'bg-[#7C3AED] text-white shadow-md' : 'text-purple-500',
              ].join(' ')}
            >
              Discover
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('community')}
              className={[
                'flex-1 rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all',
                activeTab === 'community' ? 'bg-[#7C3AED] text-white shadow-md' : 'text-purple-500',
              ].join(' ')}
            >
              Community
            </button>
          </div>
        </section>

        {activeTab === 'discover' ? (
          <>
            <section className="mt-6 rounded-[32px] border border-purple-100 bg-white/80 p-5 shadow-[0_18px_45px_rgba(109,40,217,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-purple-400">Browse by taste</p>
                  <h2 className="mt-2 text-2xl font-black text-[#2E1358]">What are you in the mood for?</h2>
                </div>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="rounded-full bg-purple-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-purple-500"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.slice(0, 8).map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setSelectedCategory(category.name === selectedCategory ? null : category.name)}
                    className={[
                      'flex shrink-0 items-center gap-2 rounded-full border px-4 py-3 text-sm font-black transition-all',
                      selectedCategory === category.name
                        ? 'border-purple-500 bg-[#7C3AED] text-white shadow-[0_14px_26px_rgba(124,58,237,0.16)]'
                        : 'border-purple-100 bg-[#FAF7FF] text-[#5C3198] hover:bg-white',
                    ].join(' ')}
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-[32px] border border-purple-100 bg-gradient-to-r from-white via-[#FCFAFF] to-[#F4EDFF] p-5 shadow-[0_18px_45px_rgba(109,40,217,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-purple-400">Ayoo AI picks</p>
                  <h2 className="mt-2 text-2xl font-black text-[#2E1358]">Match your vibe</h2>
                </div>
                <span className="rounded-full bg-purple-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-purple-600">
                  {aiLoading ? 'Thinking' : 'Ready'}
                </span>
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.name}
                    type="button"
                    onClick={() => askAiForMood(mood.name)}
                    className={[
                      'flex shrink-0 items-center gap-3 rounded-[24px] border px-5 py-4 text-left transition-all',
                      selectedMood === mood.name
                        ? 'border-purple-500 bg-[#7C3AED] text-white shadow-[0_16px_30px_rgba(124,58,237,0.18)]'
                        : 'border-purple-100 bg-white text-[#48207A] hover:border-purple-200 hover:bg-purple-50',
                    ].join(' ')}
                  >
                    <span className="text-2xl">{mood.icon}</span>
                    <span className="text-xs font-black uppercase tracking-[0.18em]">{mood.name}</span>
                  </button>
                ))}
              </div>

              {(aiSuggestion || aiLoading) && (
                <div className="mt-5 rounded-[28px] bg-[#F7F1FF] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-purple-400">Suggestion</p>
                  <p className="mt-2 text-base font-bold text-[#432067]">
                    {aiLoading ? 'Ayoo AI is preparing something that fits your mood...' : aiSuggestion}
                  </p>
                </div>
              )}
            </section>

            <section className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-purple-400">Featured merchants</p>
                  <h2 className="mt-2 text-2xl font-black text-[#2E1358]">Top picks near you</h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate?.('SEARCH')}
                  className="text-xs font-black uppercase tracking-[0.18em] text-purple-500"
                >
                  View all
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {featuredRestaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    type="button"
                    onClick={() => handleSelectRestaurant(restaurant)}
                    className="overflow-hidden rounded-[30px] border border-white/80 bg-white text-left shadow-[0_16px_38px_rgba(109,40,217,0.08)] transition-all hover:-translate-y-1"
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img src={restaurant.image || PLACEHOLDER_RESTAURANT} alt={restaurant.name} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#5A2E93]">
                        {restaurant.deliveryTime}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="truncate text-lg font-black text-white">{restaurant.name}</p>
                        <p className="truncate text-sm font-bold text-white/80">{restaurant.cuisine}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-4">
                      <span className="text-sm font-black text-[#4C1D95]">⭐ {restaurant.rating}</span>
                      <span className="rounded-full bg-purple-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-purple-500">
                        Order
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-[32px] border border-purple-100 bg-white/80 p-5 shadow-[0_18px_45px_rgba(109,40,217,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-purple-400">Trending now</p>
                  <h2 className="mt-2 text-2xl font-black text-[#2E1358]">Popular bites on Ayoo</h2>
                </div>
                <span className="rounded-full bg-[#F7F1FF] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-purple-500">
                  {trendingItems.length} items
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {trendingItems.map((item) => (
                  <div key={item.id} className="rounded-[24px] bg-[#FAF7FF] p-4">
                    <p className="text-sm font-black text-[#432067]">{item.name}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-400">{item.category}</p>
                    <p className="mt-3 text-sm font-black text-purple-600">PHP {item.price}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 pb-[180px]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-purple-400">All merchants</p>
                  <h2 className="mt-2 text-2xl font-black text-[#2E1358]">Browse nearby stores</h2>
                </div>
                <span className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-purple-500 shadow-sm">
                  {filteredRestaurants.length} results
                </span>
              </div>

              <div className="space-y-4">
                {filteredRestaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    type="button"
                    onClick={() => handleSelectRestaurant(restaurant)}
                    className="flex w-full items-center gap-4 rounded-[30px] border border-white/80 bg-white p-4 text-left shadow-[0_16px_38px_rgba(109,40,217,0.08)] transition-all hover:-translate-y-0.5"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[22px] bg-purple-50">
                      <img src={restaurant.image || PLACEHOLDER_RESTAURANT} alt={restaurant.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="truncate text-lg font-black text-[#2E1358]">{restaurant.name}</p>
                          <p className="mt-1 text-sm font-bold text-purple-400">{restaurant.cuisine}</p>
                        </div>
                        <span className="shrink-0 text-sm font-black text-[#4C1D95]">⭐ {restaurant.rating}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[#F7F1FF] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-purple-500">
                          {restaurant.deliveryTime}
                        </span>
                        <span className="rounded-full bg-gradient-to-r from-purple-700 via-purple-500 to-purple-300 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                          View menu
                        </span>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredRestaurants.length === 0 && (
                  <div className="rounded-[32px] border border-dashed border-purple-200 bg-white/70 px-6 py-16 text-center">
                    <div className="text-6xl">🔍</div>
                    <h3 className="mt-4 text-2xl font-black text-[#432067]">No merchants found</h3>
                    <p className="mt-2 text-sm font-bold text-purple-400">Try a different search or switch your delivery area.</p>
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(true)}
                      className="mt-6 rounded-[22px] bg-gradient-to-r from-purple-700 via-purple-500 to-purple-300 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white"
                    >
                      Change location
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="mt-6 pb-[180px] space-y-6">
            <div className="rounded-[32px] border border-purple-100 bg-white p-6 shadow-[0_18px_45px_rgba(109,40,217,0.08)]">
              <h2 className="text-2xl font-black text-gray-900 mb-2">Community Feed</h2>
              <p className="text-sm font-bold text-purple-600 mb-6">Latest posts from Ayoo riders & eaters</p>
              
              {/* 12+ Interactive Mock Posts - No View More Button */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Array.from({ length: 12 }).map((_, i) => {
                  const users = ['Juan E.', 'Maria C.', 'Pedro R.', 'Liza S.', 'Tony M.', 'Ana L.', 'Rico P.', 'Sofia G.'];
                  const user = users[i % users.length];
                  const contents = [
                    'Chickenjoy arrived steaming hot! Rider was super polite 🚀',
                    'Jollibee spaghetti perfect spice! 5⭐🌟',
                    'Green Meadows salad fresh AF! 🥗🥬',
                    'Rider flew through traffic! 8km in 12min ⚡',
                    'Sisig spicy level 10/10 🌶️🔥',
                    'Groceries + food in one app! Ayoo MVP 🛒🍔',
                    'Rainy day ramen delivered warm ☔🍜',
                    'Merchant added extra chili! Perfect ❤️',
                    'Halo-halo first time - obsessed! ❄️🍧',
                    'Rider nailed traffic! 5⭐👏',
                    'Family meal for 5 perfect 👨‍👩‍👧‍👦',
                    '1AM cravings saved! 🌙🍕'
                  ];
                  const likes = (i + 5) * 3;
                  const loves = (i + 1) * 2;
                  const timeAgo = ['2m', '5m', '10m', '15m', '30m', '1h', '2h', '1h'][i % 8];
                  return (
                    <div key={i} className="bg-[#FAF7FF] p-5 rounded-2xl hover:shadow-md transition-all group">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                          {user.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-sm">{user}</p>
                            <span className="text-xs text-gray-500">{timeAgo} ago</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 mb-3 line-clamp-2">{contents[i % contents.length]}</p>
                          <div className="flex items-center gap-4 mb-2">
                            <button className="flex items-center gap-1 p-2 rounded-xl hover:bg-white group-hover:bg-purple-50 transition-all">
                              <span className="text-lg">👍</span>
                              <span className="text-xs font-bold text-gray-600">{likes}</span>
                            </button>
                            <button className="flex items-center gap-1 p-2 rounded-xl hover:bg-white group-hover:bg-pink-50 transition-all">
                              <span className="text-lg">❤️</span>
                              <span className="text-xs font-bold text-gray-600">{loves}</span>
                            </button>
                            <button className="text-xs font-medium text-gray-500 hover:text-gray-700">Reply</button>
                          </div>
                          {Math.random() > 0.6 && (
                            <div className="pl-16 mt-1 pt-1 border-l border-purple-200">
                              <p className="text-xs text-gray-600">{user} replied</p>
                              <p className="text-xs text-gray-800 mt-1">Love this! 🙌</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Home;
