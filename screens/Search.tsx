import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, IMAGES, PHILIPPINE_CITIES } from '../constants';
import { db } from '../db';
import { AppScreen, Restaurant } from '../types';

type DiscoverFilter = 'ALL' | 'POPULAR' | 'RECOMMENDED' | 'FAVORITES' | 'WISHLIST';
type SortMode = 'RECOMMENDED' | 'FASTEST' | 'TOP_RATED' | 'A_TO_Z';

const collectionsKey = (email: string) => `ayoo_home_collections_${email.toLowerCase() || 'guest'}`;
const parseDeliveryUpperBound = (value: string) => {
  const nums = value.match(/\d+/g)?.map(Number) || [];
  if (nums.length === 0) return Number.MAX_SAFE_INTEGER;
  return Math.max(...nums);
};

const computeRecommendations = (restaurants: Restaurant[]) => {
  const sorted = [...restaurants].sort((a, b) => {
    const aScore = Number(a.isPartner) + Number(Boolean(a.hasLiveCam)) + (a.rating || 0);
    const bScore = Number(b.isPartner) + Number(Boolean(b.hasLiveCam)) + (b.rating || 0);
    return bScore - aScore;
  });

  return {
    topPick: sorted[0] || null,
    popular: sorted.filter((r) => r.rating >= 4.75 || r.hasLiveCam || r.isPartner).slice(0, 6),
    forYou: sorted.filter((r) => r.isPartner || r.rating >= 4.7).slice(0, 6),
    trendingSearches: ['Milk tea', 'Burger', 'Korean', 'Pizza', 'Chicken', 'Lugaw'].slice(0, 6)
  };
};

interface SearchProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenCart: () => void;
  onNavigate: (s: AppScreen) => void;
  cartCount: number;
  deliveryCity: string;
  onSetDeliveryCity: (city: string) => void;
  onBack: () => void;
}

const Search: React.FC<SearchProps> = ({
  restaurants,
  onSelectRestaurant,
  onOpenCart,
  onNavigate,
  cartCount,
  deliveryCity,
  onSetDeliveryCity,
  onBack
}) => {
  const FALLBACK_RESTAURANT_IMAGE =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=900';

  const [sessionEmail, setSessionEmail] = useState('guest');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<DiscoverFilter>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('RECOMMENDED');

  useEffect(() => {
    let cancelled = false;
    const loadCollections = async () => {
      const email = (await db.getSession())?.email?.toLowerCase() || 'guest';
      if (cancelled) return;
      setSessionEmail(email);
      try {
        const raw = localStorage.getItem(collectionsKey(email));
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.favorites)) setFavorites(parsed.favorites);
        if (Array.isArray(parsed?.wishlist)) setWishlist(parsed.wishlist);
      } catch {
        // ignore malformed
      }
    };
    loadCollections();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistCollections = (nextFavorites: string[], nextWishlist: string[]) => {
    localStorage.setItem(
      collectionsKey(sessionEmail),
      JSON.stringify({
        favorites: nextFavorites,
        wishlist: nextWishlist,
        updatedAt: new Date().toISOString()
      })
    );
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      persistCollections(next, wishlist);
      return next;
    });
  };

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      persistCollections(favorites, next);
      return next;
    });
  };

  const recommendations = useMemo(() => computeRecommendations(restaurants), [restaurants]);

  const filteredRestaurants = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const tokens = searchText.split(/\s+/).filter(Boolean);

    let list = restaurants.filter((restaurant) => {
      if (tokens.length === 0) return true;
      const searchableText = [
        restaurant.name,
        restaurant.cuisine,
        restaurant.deliveryTime,
        ...restaurant.items.flatMap((item) => [item.name, item.description, item.category])
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((token) => searchableText.includes(token));
    });

    if (selectedCategory) {
      const categoryText = selectedCategory.toLowerCase();
      list = list.filter(
        (restaurant) =>
          restaurant.cuisine.toLowerCase().includes(categoryText) ||
          restaurant.items.some((item) =>
            `${item.category} ${item.name} ${item.description}`.toLowerCase().includes(categoryText)
          )
      );
    }

    if (collectionFilter === 'POPULAR') {
      list = list.filter((r) => r.rating >= 4.75 || r.hasLiveCam || r.isPartner);
    }

    if (collectionFilter === 'RECOMMENDED') {
      list = list.filter((r) => r.isPartner || r.rating >= 4.7);
    }

    if (collectionFilter === 'FAVORITES') {
      list = list.filter((r) => favorites.includes(r.id));
    }

    if (collectionFilter === 'WISHLIST') {
      list = list.filter((r) => wishlist.includes(r.id));
    }

    const sorted = [...list].sort((a, b) => {
      if (sortMode === 'FASTEST') {
        return parseDeliveryUpperBound(a.deliveryTime) - parseDeliveryUpperBound(b.deliveryTime);
      }
      if (sortMode === 'TOP_RATED') {
        return Number(b.rating || 0) - Number(a.rating || 0);
      }
      if (sortMode === 'A_TO_Z') {
        return a.name.localeCompare(b.name);
      }

      const aRecommended = Number(a.isPartner) + Number(Boolean(a.hasLiveCam));
      const bRecommended = Number(b.isPartner) + Number(Boolean(b.hasLiveCam));
      if (bRecommended !== aRecommended) return bRecommended - aRecommended;
      return Number(b.rating || 0) - Number(a.rating || 0) || parseDeliveryUpperBound(a.deliveryTime) - parseDeliveryUpperBound(b.deliveryTime);
    });

    return sorted;
  }, [search, selectedCategory, restaurants, collectionFilter, sortMode, favorites, wishlist]);

  const hasQuery = search.trim().length > 0;

  return (
    <div className="flex flex-col h-screen bg-white pb-24 overflow-y-auto scroll-smooth scrollbar-hide">
      {showLocationPicker && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[50px] p-10 animate-in slide-in-from-bottom-10 shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-center">Delivery location</h3>

            <div className="space-y-3 max-h-[45vh] overflow-y-auto scrollbar-hide pb-6 border-t border-gray-100 pt-6">
          {PHILIPPINE_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    onSetDeliveryCity(city);
                    setShowLocationPicker(false);
                  }}
                  className={`w-full p-6 rounded-[30px] flex items-center justify-between border-2 transition-all ${
                    deliveryCity === city ? 'bg-purple-500/5 border-purple-500' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <span
                    className={`font-black uppercase tracking-widest text-xs ${
                      deliveryCity === city ? 'text-purple-500' : 'text-gray-900'
                    }`}
                  >
                    {city}
                  </span>
                  {deliveryCity === city && (
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-[10px]">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLocationPicker(false)}
              className="w-full py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Grab-like Search Header */}
      <div className="bg-purple-500 px-4 pt-4 pb-5 rounded-b-[34px] shadow-xl sticky top-0 z-40 transition-all duration-300">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center text-purple-500 shadow-xl active:scale-95"
              title="Back"
            >
              ←
            </button>

              <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={() => setShowLocationPicker(true)}>
              <div className="w-12 h-12 bg-white/20 border border-white/30 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
                <img src="/logo.png" alt="Ayoo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="text-white min-w-0">
                <p className="text-[9px] opacity-80 font-black uppercase tracking-[0.2em] mb-1">Delivering to</p>
                <p className="font-extrabold text-sm tracking-tight flex items-center gap-1 truncate">
                  {deliveryCity} <span className="text-[9px]">▼</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('PROFILE')}
              className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center text-purple-500 shadow-xl active:scale-95"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              onClick={onOpenCart}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center relative text-purple-500 shadow-xl active:scale-95"
              title="Cart"
            >
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#FF1493]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            autoFocus
            type="text"
            placeholder="Search merchants, dishes, or services..."
            className="w-full p-3 pl-10 pr-12 rounded-xl bg-white focus:outline-none font-bold text-gray-800 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2">🔎</span>

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-purple-600 bg-purple-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations + Filters like Grab */}
      {!hasQuery && (
        <div className="px-6 pt-6 space-y-5">
          {recommendations.topPick && (
              <div className="bg-purple-50/80 border-2 border-purple-200/50 rounded-[30px] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-black text-[11px] uppercase tracking-[0.16em] text-purple-600">Top pick for you</h3>
                  <span className="text-[8px] font-black uppercase tracking-widest text-purple-500/70">Recommended</span>
                </div>

              <button
                onClick={() => onSelectRestaurant(recommendations.topPick!)}
                className="w-full bg-white rounded-[26px] overflow-hidden border border-gray-100 shadow-sm text-left"
              >
                <div className="h-36 overflow-hidden relative">
                  <img
                    src={recommendations.topPick!.image}
                    alt={recommendations.topPick!.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[9px] font-black text-[#FF1493]">
                    🛵 {recommendations.topPick!.deliveryTime}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-lg text-gray-900 tracking-tight">{recommendations.topPick!.name}</h4>
                    <span className="text-yellow-400 font-black text-xs">⭐ {recommendations.topPick!.rating}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase">{recommendations.topPick!.cuisine}</span>
                  </div>
                </div>
              </button>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-[30px] p-4 shadow-sm">
            <h3 className="font-black text-[11px] uppercase tracking-[0.16em] text-gray-900 mb-3">Trending searches</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {recommendations.trendingSearches.map((q) => (
                <button
                  key={q}
                  onClick={() => setSearch(q)}
                  className="shrink-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-[#FFF2FA] text-[#FF1493]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[30px] p-4 shadow-sm">
            <h3 className="font-black text-[11px] uppercase tracking-[0.16em] text-gray-900 mb-3">Filters</h3>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {([
                { key: 'ALL', label: `All (${restaurants.length})` },
                { key: 'POPULAR', label: 'Popular' },
                { key: 'RECOMMENDED', label: 'Recommended' },
                { key: 'FAVORITES', label: `Favorites (${favorites.length})` },
                { key: 'WISHLIST', label: `Wishlist (${wishlist.length})` }
              ] as Array<{ key: DiscoverFilter; label: string }>).map((option) => (
                <button
                  key={option.key}
                  onClick={() => setCollectionFilter(option.key)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    collectionFilter === option.key ? 'bg-[#FF1493] text-white' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-2">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="w-full bg-gray-50 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-700 outline-none border border-gray-100"
                aria-label="Sort restaurants"
              >
                <option value="RECOMMENDED">Recommended</option>
                <option value="FASTEST">Fastest ETA</option>
                <option value="TOP_RATED">Top Rated</option>
                <option value="A_TO_Z">A to Z</option>
              </select>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.14em] transition-all ${
                    selectedCategory === cat.name ? 'bg-[#FF1493] text-white' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {(recommendations.forYou.length > 0 || recommendations.popular.length > 0) && (
            <div className="space-y-4">
              {recommendations.forYou.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-[30px] p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-[11px] uppercase tracking-[0.16em] text-gray-900">Recommended</h3>
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">For you</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {recommendations.forYou.slice(0, 4).map((res) => (
                      <button
                        key={res.id}
                        className="text-left bg-gray-50 rounded-[22px] overflow-hidden border border-gray-100"
                        onClick={() => onSelectRestaurant(res)}
                      >
                        <div className="h-24 overflow-hidden">
                          <img
                            src={res.image}
                            alt={res.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
                            }}
                          />
                        </div>
                        <div className="p-3">
                          <p className="font-black text-[11px] text-gray-900 leading-tight line-clamp-2">{res.name}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">{res.cuisine}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.popular.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-[30px] p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-[11px] uppercase tracking-[0.16em] text-gray-900">Popular near you</h3>
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Top rated</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {recommendations.popular.slice(0, 4).map((res) => (
                      <button
                        key={res.id}
                        className="text-left bg-gray-50 rounded-[22px] overflow-hidden border border-gray-100"
                        onClick={() => onSelectRestaurant(res)}
                      >
                        <div className="h-24 overflow-hidden">
                          <img
                            src={res.image}
                            alt={res.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
                            }}
                          />
                        </div>
                        <div className="p-3">
                          <p className="font-black text-[11px] text-gray-900 leading-tight line-clamp-2">{res.name}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">
                            ⭐ {res.rating.toFixed(1)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results list */}
      {hasQuery && (
        <div className="px-6 pt-6 pb-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-black text-lg text-gray-900 tracking-tighter uppercase">Results</h3>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
              {filteredRestaurants.length} match{filteredRestaurants.length === 1 ? '' : 'es'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.slice(0, 15).map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-[40px] overflow-hidden shadow-sm border-2 cursor-pointer transition-all hover:shadow-xl border-gray-100"
                  onClick={() => onSelectRestaurant(res)}
                >
                  <div className="h-56 overflow-hidden relative">
                    <img
                      src={res.image}
                      alt={res.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black text-purple-500">
                      🛵 {res.deliveryTime}
                    </div>

                    <div className="absolute top-4 right-4 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(res.id);
                            }}
                            className={`w-9 h-9 rounded-xl border text-sm flex items-center justify-center ${
                              favorites.includes(res.id)
                                ? 'bg-purple-500 text-white border-purple-500'
                                : 'bg-white/90 text-gray-500 border-white'
                            }`}
                            title="Favorite"
                          >
                            ♥
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(res.id);
                            }}
                            className={`w-9 h-9 rounded-xl border text-sm flex items-center justify-center ${
                              wishlist.includes(res.id)
                                ? 'bg-purple-500 text-white border-purple-500'
                                : 'bg-white/90 text-gray-500 border-white'
                            }`}
                            title="Wishlist"
                          >
                            ☆
                          </button>
                    </div>

                    <div className="absolute right-4 bottom-4 flex gap-2">
                      {(res.rating >= 4.75 || res.hasLiveCam) && (
                        <div className="bg-yellow-400 text-black px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                          Popular
                        </div>
                      )}
                      {res.isPartner && (
                        <div className="bg-purple-500 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                          Recommended
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-xl text-gray-900 tracking-tight">{res.name}</h4>
                      <span className="text-yellow-400 font-black text-xs">⭐ {res.rating}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase">{res.cuisine}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center opacity-30">
                <span className="text-6xl mb-4">🏜️</span>
                <p className="font-black uppercase tracking-widest text-sm">No matches found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
