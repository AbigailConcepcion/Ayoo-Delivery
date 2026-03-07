import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, AppScreen } from '../types';
import { COLORS } from '../constants'; // Import brand colors

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIChatProps {
  context?: 'login help' | 'signup help' | 'general';
  floatingClass?: string;
  restaurants?: Restaurant[];
  onAddToCart?: (itemId: string) => void;
  onSelectRestaurant?: (name: string) => boolean;
  onNavigate?: (screen: AppScreen) => void;
}

// Load API key from environment variable (set in .env.local)
// Get it from: https://aistudio.google.com/apikey
const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || "";

const STOPWORDS = new Set([
  'the', 'a', 'an', 'for', 'to', 'of', 'and', 'with', 'in', 'on', 'at', 'sa', 'ng', 'na', 'ko', 'po', 'please', 'yung', 'yong', 'ako'
]);

const normalizeText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();

const tokenize = (value: string) =>
  normalizeText(value).split(' ').filter(token => token && token.length > 1 && !STOPWORDS.has(token));

const overlapScore = (aTokens: string[], bTokens: string[]) => {
  if (aTokens.length === 0 || bTokens.length === 0) return 0;
  const set = new Set(bTokens);
  let score = 0;
  for (const token of aTokens) {
    if (set.has(token)) score += 1;
  }
  return score;
};

const containsPhrase = (text: string, phrase: string) => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
  return regex.test(text);
};

const extractMaxBudget = (text: string): number | null => {
  const underMatch = text.match(/(?:under|below|less than|up to|max)\s*(\d{2,5})/i);
  if (underMatch) return Number(underMatch[1]);
  const pesoMatch = text.match(/(?:₱|php|peso|pesos)\s*(\d{2,5})/i);
  if (pesoMatch) return Number(pesoMatch[1]);
  return null;
};

const parseDeliveryTimeUpperBound = (value: string) => {
  const nums = value.match(/\d+/g)?.map(Number) || [];
  if (nums.length === 0) return Number.MAX_SAFE_INTEGER;
  return Math.max(...nums);
};

const asMoney = (value: number) => `₱${value}`;

const isAddonLike = (name: string, category: string) => {
  const n = normalizeText(name);
  const c = normalizeText(category);
  return (
    c.includes('add ons')
    || c.includes('add on')
    || c.includes('addon')
    || c.includes('add-ons')
    || c.includes('extras')
    || n.startsWith('extra ')
    || n.includes(' dip')
    || n.includes('sauce')
    || n.includes('gravy')
    || n.includes('sawsawan')
    || n.includes('atchara')
    || n.includes('pickled')
    || n.includes('chili flakes')
    || n.includes('kimchi cup')
  );
};

const mealCategoryScore = (category: string) => {
  const c = normalizeText(category);
  if (
    c.includes('best seller')
    || c.includes('rice meal')
    || c.includes('grill special')
    || c.includes('signature')
    || c.includes('ramen')
    || c.includes('pizza')
    || c.includes('bowl')
    || c.includes('burger')
    || c.includes('pasta')
  ) return 3;
  if (c.includes('side dish')) return 1;
  if (c.includes('drink') || c.includes('dessert')) return 2;
  return 2;
};

const AIChat: React.FC<AIChatProps> = ({ 
  context = 'general', 
  floatingClass,
  restaurants = [],
  onAddToCart,
  onSelectRestaurant,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      const greeting = context === 'login help' 
        ? "Ayoo! I can help with login issues, password reset, and account steps. 🔑" 
        : context === 'signup help'
        ? "Welcome to Ayoo! I can guide you through account creation and role setup. 📝"
        : "Hi! I can recommend food, show menus/prices, add items to cart, and open app screens. 🍔";
      
      setMessages([{ role: 'model', text: greeting }]);
    }
  }, [context]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    const normalizedInput = normalizeText(userText);
    const inputTokens = tokenize(userText);
    setInput('');
    const updatedMessages: Message[] = [...messages, { role: 'user', text: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const lower = normalizedInput;
      const allItems = restaurants.flatMap((restaurant) =>
        restaurant.items.map((item) => ({
          ...item,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          cuisine: restaurant.cuisine,
          rating: restaurant.rating
        }))
      );

      const findBestRestaurant = () => {
        let best: Restaurant | null = null;
        let bestScore = 0;
        for (const restaurant of restaurants) {
          const rTokens = tokenize(`${restaurant.name} ${restaurant.cuisine}`);
          let score = overlapScore(inputTokens, rTokens);
          if (lower.includes(normalizeText(restaurant.name))) score += 3;
          if (score > bestScore) {
            best = restaurant;
            bestScore = score;
          }
        }
        return bestScore >= 1 ? best : null;
      };

      const findBestItem = () => {
        let best: (typeof allItems)[number] | null = null;
        let bestScore = 0;
        for (const item of allItems) {
          const iTokens = tokenize(`${item.name} ${item.category} ${item.description} ${item.restaurantName}`);
          let score = overlapScore(inputTokens, iTokens);
          if (lower.includes(normalizeText(item.name))) score += 4;
          if (lower.includes(normalizeText(item.restaurantName))) score += 2;
          if (score > bestScore) {
            best = item;
            bestScore = score;
          }
        }
        return bestScore >= 2 ? best : null;
      };

      const sendLocalReply = (text: string) => {
        setMessages(prev => [...prev, { role: 'model', text }]);
      };

      const scoreItemsByQuery = () => {
        const scored = allItems.map((item) => {
          const tokens = tokenize(`${item.name} ${item.category} ${item.description} ${item.restaurantName} ${item.cuisine}`);
          let score = overlapScore(inputTokens, tokens);
          if (containsPhrase(lower, normalizeText(item.name))) score += 4;
          if (containsPhrase(lower, normalizeText(item.restaurantName))) score += 2;
          if (/(popular|best seller|bestseller)/.test(lower) && item.isPopular) score += 2;
          if (/(new|bago|latest)/.test(lower) && item.isNew) score += 2;
          if (/(spicy|maanghang|hot|chili)/.test(lower) && item.isSpicy) score += 2;
          return { ...item, score };
        });
        return scored.sort((a, b) => b.score - a.score || a.price - b.price);
      };

      const getNonAddonPool = (items: typeof allItems) => {
        const base = items.filter((item) => !isAddonLike(item.name, item.category));
        return base.length > 0 ? base : items;
      };

      const findBudgetPicks = (maxBudget: number) =>
        getNonAddonPool(allItems)
          .filter((item) => item.price <= maxBudget)
          .sort((a, b) =>
            mealCategoryScore(b.category) - mealCategoryScore(a.category)
            || a.price - b.price
            || Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular))
            || Number(b.rating || 0) - Number(a.rating || 0)
          )
          .slice(0, 4);

      const getSafePicks = (limit = 3) => {
        const pool = getNonAddonPool(allItems);
        return [...pool]
          .sort((a, b) =>
            Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular))
            || mealCategoryScore(b.category) - mealCategoryScore(a.category)
            || Number(b.rating || 0) - Number(a.rating || 0)
            || a.price - b.price
          )
          .slice(0, limit);
      };

      // deterministic app intents first para accurate actions/responses
      const navRules: Array<{ keys: string[]; screen: AppScreen; reply: string }> = [
        { keys: ['home'], screen: 'HOME', reply: 'Opening Home now.' },
        { keys: ['cart', 'checkout'], screen: 'CART', reply: 'Opening cart and checkout.' },
        { keys: ['voucher', 'promo'], screen: 'VOUCHERS', reply: 'Opening vouchers.' },
        { keys: ['history', 'orders history'], screen: 'HISTORY', reply: 'Showing your order history.' },
        { keys: ['profile', 'settings'], screen: 'PROFILE', reply: 'Opening your profile settings.' },
        { keys: ['track', 'tracking', 'my orders'], screen: 'TRACKING', reply: 'Opening order tracking.' },
      ];

      const hitNav = navRules.find((r) => r.keys.some((k) => containsPhrase(lower, k)));
      if (hitNav && onNavigate) {
        onNavigate(hitNav.screen);
        sendLocalReply(hitNav.reply);
        setLoading(false);
        return;
      }

      if (context !== 'general') {
        if (/(forgot|reset).*(password)|password.*(forgot|reset)/.test(lower)) {
          sendLocalReply("Tap 'Forgot Password?' then enter your email, verify it, and set a new password.");
          setLoading(false);
          return;
        }
        if (/(sign up|signup|register|create account)/.test(lower)) {
          sendLocalReply("Tap 'Create Account', choose your role, fill in details, then tap Sign Up.");
          setLoading(false);
          return;
        }
        if (/(cant|cannot|can t|invalid|wrong).*(login|sign in)|login.*(cant|cannot|can t|invalid|wrong)/.test(lower)) {
          sendLocalReply("Double-check email/password first. If still failing, use 'Forgot Password?' to reset credentials.");
          setLoading(false);
          return;
        }
        sendLocalReply("I can help with login, signup, and password reset. Tell me what step you are stuck on.");
        setLoading(false);
        return;
      }

      if (/(help|what can you do|commands|options)/.test(lower)) {
        sendLocalReply("I can: 1) recommend food, 2) show menu prices, 3) add item to cart, 4) open Home/Cart/Vouchers/History/Profile/Tracking.");
        setLoading(false);
        return;
      }

      if (/(fastest|quick|pinakamabilis|delivery time|eta)/.test(lower) && restaurants.length > 0) {
        const fastest = [...restaurants].sort((a, b) => parseDeliveryTimeUpperBound(a.deliveryTime) - parseDeliveryTimeUpperBound(b.deliveryTime))[0];
        sendLocalReply(`Fastest nearby is ${fastest.name} (${fastest.deliveryTime}).`);
        setLoading(false);
        return;
      }

      if (/(best restaurant|top restaurant|highest rated|top rated|pinakamaganda|pinakamasarap)/.test(lower) && restaurants.length > 0) {
        const bestRestaurant = [...restaurants].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))[0];
        sendLocalReply(`Top-rated ngayon: ${bestRestaurant.name} (⭐ ${bestRestaurant.rating}).`);
        setLoading(false);
        return;
      }

      if (/(menu|list|items|available|ano meron)/.test(lower)) {
        const restaurant = findBestRestaurant();
        if (restaurant) {
          const topItems = restaurant.items.slice(0, 6).map(i => `${i.name} (₱${i.price})`).join(', ');
          sendLocalReply(`${restaurant.name} menu highlights: ${topItems}.`);
          if (onSelectRestaurant) onSelectRestaurant(restaurant.name);
          setLoading(false);
          return;
        }
        if (restaurants.length > 0) {
          const topRestaurants = restaurants.slice(0, 5).map((r, idx) => `${idx + 1}) ${r.name}`).join(' | ');
          sendLocalReply(`Which restaurant menu do you want? ${topRestaurants}`);
          setLoading(false);
          return;
        }
      }

      if (/(price|how much|magkano|hm|cost)/.test(lower)) {
        const priceItem = findBestItem();
        if (priceItem) {
          sendLocalReply(`${priceItem.name} from ${priceItem.restaurantName} is ${asMoney(priceItem.price)}.`);
          setLoading(false);
          return;
        }
      }

      const budget = extractMaxBudget(lower);
      if (budget && budget >= 20) {
        const budgetPicks = findBudgetPicks(budget);
        if (budgetPicks.length > 0) {
          sendLocalReply(`Under ${asMoney(budget)} picks: ${budgetPicks.map((i) => `${i.restaurantName} - ${i.name} (${asMoney(i.price)})`).join(', ')}.`);
          setLoading(false);
          return;
        }
        sendLocalReply(`Walang exact match under ${asMoney(budget)} right now. Try budget around ${asMoney(Math.max(80, budget + 40))}.`);
        setLoading(false);
        return;
      }

      if (/(recommend|suggest|craving|gutom|best|ano masarap|anong masarap)/.test(lower)) {
        const wantsSpicy = /(spicy|maanghang|hot|chili)/.test(lower);
        const wantsDessert = /(dessert|sweet|matamis|cake|ice cream|halo)/.test(lower);
        const wantsDrink = /(drink|coffee|tea|milk tea|inumin|beverage)/.test(lower);
        const wantsHealthy = /(healthy|diet|fit|salad|low carb)/.test(lower);
        const wantsBudget = /(cheap|budget|tipid|mura|under)/.test(lower);

        let pool = getNonAddonPool(allItems);
        const applyPref = (predicate: (item: typeof allItems[number]) => boolean) => {
          const filtered = pool.filter(predicate);
          if (filtered.length > 0) pool = filtered;
        };

        if (wantsSpicy) applyPref((i) => i.isSpicy || /spicy|chili|hot/.test(normalizeText(i.name)));
        if (wantsDessert) applyPref((i) => /dessert/.test(normalizeText(i.category)));
        if (wantsDrink) applyPref((i) => /drink|coffee|tea|milk tea/.test(normalizeText(i.category)));
        if (wantsHealthy) applyPref((i) => /healthy|salad|bowl/.test(normalizeText(i.cuisine + ' ' + i.category + ' ' + i.name)));

        const budgetPool = wantsBudget
          ? (() => {
            const mains = pool.filter((item) => mealCategoryScore(item.category) >= 3);
            return mains.length > 0 ? mains : pool;
          })()
          : pool;

        const sorted = wantsBudget
          ? [...budgetPool].sort((a, b) =>
            a.price - b.price
            || Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular))
            || Number(b.rating || 0) - Number(a.rating || 0)
          )
          : [...budgetPool].sort((a, b) =>
            Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular))
            || mealCategoryScore(b.category) - mealCategoryScore(a.category)
            || Number(b.rating || 0) - Number(a.rating || 0)
            || a.price - b.price
          );

        const picks = sorted.slice(0, 3);
        if (picks.length > 0) {
          const reply = picks.map((pick, idx) => `${idx + 1}) ${pick.restaurantName} - ${pick.name} (${asMoney(pick.price)})`).join(' | ');
          sendLocalReply(`Top picks for you: ${reply}`);
          setLoading(false);
          return;
        }
      }

      if (/(add|cart|order this|bili|bilhin|dagdag)/.test(lower) && onAddToCart) {
        const bestItem = findBestItem();
        if (bestItem) {
          onAddToCart(bestItem.id);
          sendLocalReply(`Added ${bestItem.name} from ${bestItem.restaurantName} to cart.`);
          setLoading(false);
          return;
        }
        sendLocalReply("Tell me the exact item name first, then I can add it to cart.");
        setLoading(false);
        return;
      }

      const restaurantMatch = findBestRestaurant();
      if (restaurantMatch && onSelectRestaurant && /(open|show|punta|visit|view)/.test(lower)) {
        onSelectRestaurant(restaurantMatch.name);
        sendLocalReply(`Opened ${restaurantMatch.name}.`);
        setLoading(false);
        return;
      }

      const hasCatalog = restaurants.length > 0 && allItems.length > 0;
      if (hasCatalog && context === 'general') {
        const smartPicks = scoreItemsByQuery().filter((item) => item.score > 0).slice(0, 3);
        if (smartPicks.length > 0) {
          sendLocalReply(`Closest matches: ${smartPicks.map((i) => `${i.restaurantName} - ${i.name} (${asMoney(i.price)})`).join(', ')}.`);
        } else {
          const fallback = getSafePicks(3);
          sendLocalReply(`Try these: ${fallback.map((i) => `${i.restaurantName} - ${i.name} (${asMoney(i.price)})`).join(', ')}.`);
        }
        setLoading(false);
        return;
      }

      if (!API_KEY || API_KEY.trim() === "") {
        const budgetItems = getSafePicks(3);
        if (budgetItems.length > 0) {
          sendLocalReply(`Try these sulit picks: ${budgetItems.map(i => `${i.restaurantName} - ${i.name} (${asMoney(i.price)})`).join(', ')}.`);
        } else {
          sendLocalReply("I can help with menu, recommendations, cart add, and navigation. Try: 'recommend spicy food' or 'open cart'.");
        }
        setLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are the Ayoo Concierge for the Ayoo Delivery App in Iligan City.
        Current Context: ${context}
        Available Restaurants/Menu:
        ${restaurants.map(r => `${r.name} (${r.cuisine}) -> ${r.items.slice(0, 12).map(i => `${i.name} ₱${i.price}`).join(', ')}`).join('\n')}
        
        Rules:
        1. Give concrete answers with exact restaurant + exact item names.
        2. Keep response clear and short (max 3 sentences).
        3. Use practical Taglish.
        4. If user asks for budget, include prices.
        5. Never invent restaurants/items outside provided list.`
      });

      // Prepare history without the current system instruction (already in systemInstruction param)
      const chat = model.startChat({
        history: messages.slice(1).map(m => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
      });

      const result = await chat.sendMessage(userText);
      const response = await result.response;
      const text = (response.text() || '').trim();
      
      if (!text) {
        const backupItem = findBestItem();
        if (backupItem) {
          sendLocalReply(`Try ${backupItem.name} from ${backupItem.restaurantName} (₱${backupItem.price}).`);
        } else {
          sendLocalReply("Tell me your vibe and budget, and I'll recommend exact food options.");
        }
      } else {
        setMessages(prev => [...prev, { role: 'model', text }]);
      }
    } catch (err: any) {
      console.error("AI Error:", err);
      
      const allItems = restaurants.flatMap((restaurant) =>
        restaurant.items.map((item) => ({ ...item, restaurantName: restaurant.name }))
      );
      const safePool = allItems.filter((item) => !isAddonLike(item.name, item.category));
      const picks = [...(safePool.length > 0 ? safePool : allItems)]
        .sort((a, b) =>
          Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular))
          || mealCategoryScore(b.category) - mealCategoryScore(a.category)
          || Number(b.rating || 0) - Number(a.rating || 0)
          || a.price - b.price
        )
        .slice(0, 3);
      
      if (picks.length > 0) {
        setMessages(prev => [...prev, {
          role: 'model',
          text: `Here are good picks right now: ${picks.map(i => `${i.restaurantName} - ${i.name} (${asMoney(i.price)})`).join(', ')}.`
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'model',
          text: "You can ask me to open Home, Cart, Profile, History, or Tracking."
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${floatingClass || 'fixed bottom-24 right-6'} w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl z-[100] active:scale-90 transition-all border-2 border-white`}
        style={{ backgroundColor: COLORS.primary }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="fixed inset-x-6 bottom-40 bg-white rounded-[30px] shadow-2xl z-[100] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 max-h-[450px]">
          {/* Header */}
          <div className="p-5 text-white flex items-center justify-between" style={{ backgroundColor: COLORS.primary }}>
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">✨</div>
               <div>
                  <h4 className="font-black text-xs uppercase tracking-widest leading-none">Ayoo Concierge</h4>
                  <p className="text-[8px] opacity-80 uppercase mt-1 font-bold">Online & Ready</p>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100">✕</button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 p-5 space-y-4 overflow-y-auto scrollbar-hide bg-gray-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-4 rounded-[20px] text-xs font-bold shadow-sm ${
                    m.role === 'user' 
                      ? 'text-white rounded-tr-none' 
                      : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                  }`}
                  style={m.role === 'user' ? { backgroundColor: COLORS.primary } : {}}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-1 items-center ml-1">
                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-50 flex gap-2 items-center">
            <input 
              type="text" 
              placeholder="Ask me anything..."
              className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-gray-50 transition-colors"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={sendMessage} 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all"
              style={{ backgroundColor: COLORS.primary }}
            >
              <span className="text-white text-sm">🚀</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
