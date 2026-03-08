
import React, { useState, useMemo } from 'react';
import { CATEGORIES, PHILIPPINE_CITIES } from '../constants';
import type { Restaurant, UserBadge, AppScreen, Voucher, UserAccount, OrderRecord } from '../types';

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
  currentUser?: UserAccount | null;
  recentOrders?: OrderRecord[];
}

// Service types for the Super App
type ServiceType = 'food' | 'groceries' | 'courier' | 'rides' | 'pabili' | 'bills' | 'dineout' | 'pharmacy';

interface Service {
  id: ServiceType;
  name: string;
  icon: string;
  color: string;
  screen: AppScreen;
  description: string;
}

// Community member type
interface CommunityMember {
  id: string;
  name: string;
  role: 'rider' | 'merchant' | 'customer';
  avatar: string;
  stats: string;
  badge: string;
}

// Community post with comments and reactions
interface CommunityPost {
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

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
}

interface Reaction {
  type: 'like' | 'love' | 'fire' | 'haha' | 'wow' | 'sad' | 'angry';
  count: number;
  users: string[];
}

// Sample community data
const TOP_RIDERS: CommunityMember[] = [
  { id: '1', name: 'Mark D.', role: 'rider', avatar: '🛵', stats: '1,234 deliveries', badge: '⭐ Top Rider' },
  { id: '2', name: 'John P.', role: 'rider', avatar: '🛵', stats: '987 deliveries', badge: '⚡ Fast' },
  { id: '3', name: 'Karen S.', role: 'rider', avatar: '🛵', stats: '856 deliveries', badge: '😊 Friendly' },
];

const FEATURED_MERCHANTS: CommunityMember[] = [
  { id: '1', name: 'Mang Tomas Eatery', role: 'merchant', avatar: '🏪', stats: '4.9 ★', badge: '⭐ Featured' },
  { id: '2', name: 'Tea Shop PH', role: 'merchant', avatar: '🧋', stats: '4.8 ★', badge: '🆕 New' },
  { id: '3', name: 'Pizza Haven', role: 'merchant', avatar: '🍕', stats: '4.7 ★', badge: '🔥 Hot' },
];

// Realistic community posts with initial data
const INITIAL_POSTS: CommunityPost[] = [
  {
    id: '1',
    author: 'Ayoo Team',
    avatar: '🚀',
    content: '🎉 Welcome to Ayoo! Now serving Iligan City with fast delivery! Download now and get ₱50 off your first order.',
    time: '2h ago',
    likes: 128,
    comments: [
      {
        id: 'c1', author: 'Maria S.', avatar: '👩', content: 'Finally in Iligan! 🎉', time: '1h ago', replies: [
          { id: 'r1', author: 'Ayoo Team', avatar: '🚀', content: 'Yes Maria! We\'re here!', time: '45m ago' }
        ]
      },
      { id: 'c2', author: 'John D.', avatar: '👨', content: 'How do I claim the ₱50 off?', time: '30m ago', replies: [] }
    ],
    reactions: [
      { type: 'like', count: 89, users: [] },
      { type: 'love', count: 45, users: [] },
      { type: 'fire', count: 12, users: [] }
    ]
  },
  {
    id: '2',
    author: 'Mang Tomas Eatery',
    avatar: '🏪',
    content: '🍜 New menu items available! Try our special silog meals now. Comes with unlimited rice! 🤤',
    time: '5h ago',
    likes: 45,
    comments: [
      { id: 'c3', author: 'Foodie King', avatar: '👨‍🍳', content: 'The silog meals are amazing!', time: '3h ago', replies: [] }
    ],
    reactions: [
      { type: 'love', count: 23, users: [] },
      { type: 'fire', count: 8, users: [] },
      { type: 'haha', count: 5, users: [] }
    ]
  },
  {
    id: '3',
    author: 'Ayoo Team',
    avatar: '🚀',
    content: '🛵 Become a rider and earn up to ₱500/day! Flexible hours, fast payments. Apply now through the app.',
    time: '1d ago',
    likes: 89,
    comments: [],
    reactions: [
      { type: 'like', count: 34, users: [] },
      { type: 'love', count: 28, users: [] },
      { type: 'wow', count: 15, users: [] }
    ]
  },
];

// Reaction emoji map
const REACTION_EMOJIS: Record<string, string> = {
  like: '👍',
  love: '❤️',
  fire: '🔥',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠'
};

// Services configuration
const SERVICES: Service[] = [
  { id: 'food', name: 'Food', icon: '🍔', color: '#FF1493', screen: 'SEARCH', description: 'All Restaurants & Milk Tea' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#9C27B0', screen: 'GROCERIES', description: 'Daily Essentials' },
  { id: 'courier', name: 'Courier', icon: '📦', color: '#2196F3', screen: 'COURIER', description: 'Send Packages' },
  { id: 'rides', name: 'Rides', icon: '🚗', color: '#4CAF50', screen: 'RIDES', description: 'Motor & Car' },
  { id: 'pabili', name: 'Pabili', icon: '🛍️', color: '#FF9800', screen: 'PABILI', description: 'Errands' },
  { id: 'bills', name: 'Bills & Load', icon: '💳', color: '#00BCD4', screen: 'PAYMENTS', description: 'Pay Bills & Load' },
  { id: 'dineout', name: 'Dine Out', icon: '🍽️', color: '#E91E63', screen: 'DINE_OUT', description: 'Restaurant Reservations' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊', color: '#F44336', screen: 'PHARMACY', description: 'Medicines & Health' },
];

const SEARCH_CATEGORIES = [
  { name: 'Cravings', icon: '🤤', query: '' },
  { name: 'Places', icon: '📍', query: '' },
  { name: 'Groceries', icon: '🛒', query: 'groceries' },
  { name: 'Medicines', icon: '💊', query: 'medicines' },
  { name: 'Flowers', icon: '💐', query: 'flowers' },
  { name: 'Pet Supplies', icon: '🐕', query: 'pet' },
];

const MOODS = [
  { name: 'Lazy', icon: '😴' },
  { name: 'Stressed', icon: '😫' },
  { name: 'Celebratory', icon: '🥳' },
  { name: 'Fit', icon: '🥗' },
  { name: 'Spicy', icon: '🌶️' }
];

const Home: React.FC<HomeProps> = ({
  restaurants,
  onSelectRestaurant,
  onOpenCart,
  onNavigate,
  cartCount = 0,
  points = 0,
  streak = 0,
  badges = [],
  deliveryCity,
  onSetDeliveryCity,
  currentUser,
  recentOrders = []
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'IDLE' | 'FETCHING' | 'ERROR'>('IDLE');
  const [activeTab, setActiveTab] = useState<'discover' | 'community'>('discover');

  // Community state
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePost, setSharePost] = useState<CommunityPost | null>(null);

  // Get user name for commenting
  const userName = currentUser?.name || 'You';
  const userAvatar = currentUser?.avatar || '👤';

  // Handle reaction on post
  const handleReaction = (postId: string, reactionType: string) => {
    setCommunityPosts(posts => posts.map(post => {
      if (post.id !== postId) return post;
      const existingReaction = post.reactions.find(r => r.type === reactionType);
      if (existingReaction) {
        if (post.userReaction === reactionType) {
          return {
            ...post,
            userReaction: undefined,
            reactions: post.reactions.map(r =>
              r.type === reactionType ? { ...r, count: Math.max(0, r.count - 1) } : r
            )
          };
        } else {
          const updatedReactions = post.reactions.map(r => {
            if (r.type === post.userReaction) {
              return { ...r, count: Math.max(0, r.count - 1) };
            }
            if (r.type === reactionType) {
              return { ...r, count: r.count + 1 };
            }
            return r;
          });
          return { ...post, userReaction: reactionType, reactions: updatedReactions };
        }
      }
      return post;
    }));
    setShowReactionPicker(null);
  };

  // Handle comment on post
  const handleComment = (postId: string) => {
    const text = commentText[postId];
    if (!text?.trim()) return;

    setCommunityPosts(posts => posts.map(post => {
      if (post.id !== postId) return post;
      const newComment: Comment = {
        id: `c${Date.now()}`,
        author: userName,
        avatar: userAvatar,
        content: text.trim(),
        time: 'Just now',
        replies: []
      };
      return { ...post, comments: [newComment, ...post.comments] };
    }));
    setCommentText({ ...commentText, [postId]: '' });
  };

  // Handle reply to comment
  const handleReply = (postId: string, commentId: string) => {
    const text = replyText[commentId];
    if (!text?.trim()) return;

    setCommunityPosts(posts => posts.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        comments: post.comments.map(c => {
          if (c.id !== commentId) return c;
          const newReply: Reply = {
            id: `r${Date.now()}`,
            author: userName,
            avatar: userAvatar,
            content: text.trim(),
            time: 'Just now'
          };
          return { ...c, replies: [...c.replies, newReply] };
        })
      };
    }));
    setReplyText({ ...replyText, [commentId]: '' });
  };

  // Handle share post
  const handleShare = (post: CommunityPost, platform: string) => {
    const shareText = `${post.author}: ${post.content}`;
    const shareUrl = encodeURIComponent(shareText);

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?quote=${shareUrl}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${shareUrl}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${shareUrl}`, '_blank');
        break;
      case 'messages':
        if (onNavigate) onNavigate('MESSAGES');
        break;
    }
    setShowShareModal(false);
  };

  // Calculate total reactions for a post
  const getTotalReactions = (post: CommunityPost) => {
    return post.reactions.reduce((sum, r) => sum + r.count, 0);
  };

  // Get user role
  const userRole = currentUser?.role || 'CUSTOMER';

  // Filter restaurants
  const filteredRestaurants = useMemo(() => {
    let list = restaurants.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase())
    );
    if (selectedCategory) {
      list = list.filter(r => r.cuisine.toLowerCase().includes(selectedCategory.toLowerCase()));
    }
    if (recommendedId) {
      const rec = list.find(r => r.id === recommendedId);
      const others = list.filter(r => r.id !== recommendedId);
      return rec ? [rec, ...others] : list;
    }
    return list;
  }, [search, recommendedId, selectedCategory, restaurants]);

  // Featured merchants (highest rated)
  const featuredRestaurants = useMemo(() => {
    return [...restaurants].sort((a, b) => b.rating - a.rating).slice(0, 5);
  }, [restaurants]);

  // New merchants
  const newRestaurants = useMemo(() => {
    return restaurants.filter(r => r.isPartner).slice(0, 5);
  }, [restaurants]);

  // Trending items
  const trendingItems = useMemo(() => {
    return restaurants.flatMap(r => r.items.filter(i => i.isPopular)).slice(0, 8);
  }, [restaurants]);

  const handleGetCurrentLocation = () => {
    setGeoStatus('FETCHING');
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          onSetDeliveryCity('Iligan City');
          setGeoStatus('IDLE');
          setShowLocationPicker(false);
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
    setAiSuggestion(null);

    const moodRecommendations: Record<string, { dish: string; reason: string }> = {
      'Lazy': { dish: 'Chickenjoy', reason: 'Comfort food hits different when you are chilling!' },
      'Stressed': { dish: 'Milk Tea', reason: 'Sweet treats help ease the stress away!' },
      'Celebratory': { dish: 'Pizza', reason: 'Nothing says celebration like pizza night!' },
      'Fit': { dish: 'Salad Bowl', reason: 'Healthy fuel for your achievements!' },
      'Spicy': { dish: 'Kimchi Fried Rice', reason: 'Turn up the heat!' }
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const recommendation = moodRecommendations[mood];
      if (recommendation) {
        setAiSuggestion(`${recommendation.dish} - ${recommendation.reason}`);
        const match = restaurants.find(r =>
          r.items.some(i => i.name.toLowerCase().includes(recommendation.dish.toLowerCase()))
        );
        if (match) setRecommendedId(match.id);
      } else {
        setAiSuggestion("Try something fresh today!");
      }
    } catch (err) {
      setAiSuggestion("The AI is hungry! Try browsing our top partners.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleServiceClick = (service: Service) => {
    if (service.screen === 'HOME') return;
    if (onNavigate) onNavigate(service.screen);
  };

  const handleSelectRestaurant = (res: Restaurant) => {
    if (onSelectRestaurant) onSelectRestaurant(res);
  };

  // Render individual post with comments and reactions
  const renderPost = (post: CommunityPost) => {
    const isExpanded = expandedPost === post.id;
    const totalReactions = getTotalReactions(post);
    const displayReactions = post.reactions.filter(r => r.count > 0).slice(0, 3);

    return (
      <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{post.avatar}</span>
            <div>
              <p className="font-black text-xs text-gray-900">{post.author}</p>
              <p className="text-[8px] text-gray-400">{post.time}</p>
            </div>
          </div>
          <button
            onClick={() => { setSharePost(post); setShowShareModal(true); }}
            className="text-gray-400 hover:text-[#FF1493] text-lg"
          >
            📤
          </button>
        </div>

        {/* Post Content */}
        <p className="text-sm text-gray-700 mb-3">{post.content}</p>

        {/* Reactions Display */}
        {totalReactions > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {displayReactions.map((r, idx) => (
              <span key={idx} className="text-sm">{REACTION_EMOJIS[r.type]}</span>
            ))}
            <span className="text-[10px] text-gray-500 ml-1">{totalReactions}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
          {/* Reaction Button */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(showReactionPicker === post.id ? null : post.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${post.userReaction ? 'text-[#FF1493] bg-pink-50' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {post.userReaction ? REACTION_EMOJIS[post.userReaction] : '👍'}
              <span>{post.userReaction || 'Like'}</span>
            </button>

            {/* Reaction Picker */}
            {showReactionPicker === post.id && (
              <div className="absolute bottom-full left-0 mb-1 bg-white rounded-full shadow-lg border border-gray-100 p-1 flex gap-1 animate-in fade-in">
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                  <button
                    key={type}
                    onClick={() => handleReaction(post.id, type)}
                    className="w-8 h-8 hover:bg-gray-100 rounded-full flex items-center justify-center text-lg transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment Button */}
          <button
            onClick={() => setExpandedPost(isExpanded ? null : post.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 hover:bg-gray-100"
          >
            💬 <span>Comment {post.comments.length > 0 && `(${post.comments.length})`}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => { setSharePost(post); setShowShareModal(true); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 hover:bg-gray-100"
          >
            📤 Share
          </button>
        </div>

        {/* Comments Section */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {/* Add Comment */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={commentText[post.id] || ''}
                onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                placeholder="Write a comment..."
                className="flex-1 bg-gray-50 rounded-full px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-[#FF1493]/30"
              />
              <button
                onClick={() => handleComment(post.id)}
                className="w-8 h-8 bg-[#FF1493] rounded-full flex items-center justify-center text-white text-sm"
              >
                ➤
              </button>
            </div>

            {/* Comments List */}
            {post.comments.map(comment => (
              <div key={comment.id} className="mb-3 pl-2 border-l-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{comment.avatar}</span>
                  <div className="flex-1">
                    <p className="text-xs">
                      <span className="font-black text-gray-900">{comment.author}</span>
                      <span className="text-gray-600"> {comment.content}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => {
                          const isReplying = replyText[comment.id];
                          if (isReplying) {
                            handleReply(post.id, comment.id);
                          } else {
                            setReplyText({ ...replyText, [comment.id]: '@' });
                          }
                        }}
                        className="text-[10px] text-gray-400 font-bold"
                      >
                        Reply
                      </button>
                      <span className="text-[10px] text-gray-400">{comment.time}</span>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {comment.replies.map(reply => (
                  <div key={reply.id} className="ml-6 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{reply.avatar}</span>
                      <p className="text-xs">
                        <span className="font-black text-gray-900">{reply.author}</span>
                        <span className="text-gray-600"> {reply.content}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 ml-6">{reply.time}</span>
                  </div>
                ))}

                {/* Reply Input */}
                {replyText[comment.id] !== undefined && (
                  <div className="ml-6 mt-2 flex gap-2">
                    <input
                      type="text"
                      value={replyText[comment.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleReply(post.id, comment.id)}
                      placeholder="Write a reply..."
                      className="flex-1 bg-gray-50 rounded-full px-3 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-[#FF1493]/30"
                    />
                    <button
                      onClick={() => handleReply(post.id, comment.id)}
                      className="text-[#FF1493] text-xs font-black"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Discoveries Tab
  const renderDiscoveries = () => (
    <>
      {/* Search Bar */}
      <div className="relative mb-4 cursor-pointer" onClick={() => onNavigate?.('SEARCH')}>
        <div className="w-full p-5 pl-14 rounded-[25px] bg-white focus:outline-none font-bold text-gray-800 shadow-lg text-base flex items-center">
          <span className="text-gray-400">🔍 Search for food, shops...</span>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {SERVICES.map((service) => (
          <button key={service.id} onClick={() => handleServiceClick(service)} className="flex flex-col items-center gap-1 py-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md bg-white border border-gray-100">
              {service.icon}
            </div>
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-wider">{service.name}</span>
          </button>
        ))}
      </div>

      {/* Featured Merchants */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-gray-900 text-base">⭐ Featured Merchants</h3>
          <button className="text-[#FF1493] text-xs font-bold">See All</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {featuredRestaurants.map((res) => (
            <button key={res.id} onClick={() => handleSelectRestaurant(res)} className="flex-shrink-0 w-40 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="h-24 overflow-hidden relative">
                <img src={res.image} alt={res.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[8px] font-black px-2 py-1 rounded-full">⭐ {res.rating}</div>
              </div>
              <div className="p-3">
                <p className="font-black text-sm text-gray-900 truncate">{res.name}</p>
                <p className="text-[10px] text-gray-500">{res.cuisine}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trending Items */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-gray-900 text-base">🔥 Trending Now</h3>
          <button className="text-[#FF1493] text-xs font-bold">See All</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {trendingItems.map((item, idx) => (
            <div key={idx} className="flex-shrink-0 w-32 bg-white rounded-2xl shadow-md border border-gray-100 p-3">
              <div className="text-2xl mb-2">🍜</div>
              <p className="font-bold text-xs text-gray-900 truncate">{item.name}</p>
              <p className="text-[#FF1493] font-black text-sm">₱{item.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* New Merchants */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-gray-900 text-base">🆕 New on Ayoo</h3>
          <button className="text-[#FF1493] text-xs font-bold">See All</button>
        </div>
        <div className="space-y-2">
          {newRestaurants.slice(0, 3).map((res) => (
            <button key={res.id} onClick={() => handleSelectRestaurant(res)} className="w-full bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl overflow-hidden">
                <img src={res.image} alt={res.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-gray-900">{res.name}</p>
                <p className="text-[10px] text-gray-500">{res.cuisine} • {res.deliveryTime}</p>
              </div>
              <span className="bg-green-100 text-green-600 text-[8px] font-black px-2 py-1 rounded-full">NEW</span>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="font-black text-gray-900 text-base mb-3">🗂️ Browse by Category</h3>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.slice(0, 8).map((cat) => (
            <button key={cat.name} onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)} className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${selectedCategory === cat.name ? 'bg-[#FF1493] text-white' : 'bg-white border border-gray-100'}`}>
              <span className="text-xl">{cat.icon}</span>
              <span className="text-[8px] font-black uppercase">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Picks */}
      <div className="mb-6">
        <h3 className="font-black text-gray-900 text-base mb-3">🤖 AI Picks For You</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
          {MOODS.map(mood => (
            <button key={mood.name} onClick={() => askAiForMood(mood.name)} className={`flex-shrink-0 px-4 py-2 rounded-full flex items-center gap-2 transition-all ${selectedMood === mood.name ? 'bg-[#FF1493] text-white' : 'bg-white border border-gray-100'}`}>
              <span className="text-sm">{mood.icon}</span>
              <span className="text-[10px] font-black uppercase">{mood.name}</span>
            </button>
          ))}
        </div>
        {(aiLoading || aiSuggestion) && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-2xl border border-pink-100">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-[#FF1493]">🤖 Ayoo AI</p>
              {aiLoading && <div className="w-3 h-3 border-2 border-[#FF1493] border-t-transparent rounded-full animate-spin"></div>}
            </div>
            {aiSuggestion && <p className="text-gray-700 font-bold text-sm mt-1">"{aiSuggestion}"</p>}
          </div>
        )}
      </div>

      {/* Nearby Restaurants */}
      <div className="mb-24">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-gray-900 text-base">🏪 Nearby Merchants</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.slice(0, 8).map(res => (
              <div key={res.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100" onClick={() => handleSelectRestaurant(res)}>
                <div className="h-24 overflow-hidden relative">
                  <img src={res.image} alt={res.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-lg text-[8px] font-black">🛵 {res.deliveryTime}</div>
                </div>
                <div className="p-2">
                  <h4 className="font-black text-xs text-gray-900 truncate">{res.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[8px] text-gray-500">{res.cuisine}</span>
                    <span className="text-yellow-500 font-black text-[8px]">⭐ {res.rating}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-8 text-center opacity-50">
              <span className="text-4xl mb-2 block">🏜️</span>
              <p className="font-black uppercase text-xs">No restaurants found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Render Community Tab
  const renderCommunity = () => (
    <>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#FF1493] to-[#FF69B4] rounded-2xl p-4 mb-6 text-white">
        <h3 className="font-black text-lg">👋 Welcome to Ayoo Community!</h3>
        <p className="text-white/80 text-xs mt-1">Connect with riders, merchants, and customers</p>
      </div>

      {/* User's Role Card */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-r from-[#FF1493] to-[#FF69B4] rounded-full flex items-center justify-center text-2xl">
            {userRole === 'MERCHANT' ? '🏪' : userRole === 'RIDER' ? '🛵' : '👤'}
          </div>
          <div className="flex-1">
            <p className="font-black text-gray-900">{currentUser?.name || 'Guest User'}</p>
            <p className="text-[#FF1493] text-xs font-bold uppercase">{userRole}</p>
          </div>
          <button onClick={() => onNavigate?.('MESSAGES')} className="bg-[#FF1493] text-white text-xs font-black px-4 py-2 rounded-full">
            💬 Chat
          </button>
        </div>
      </div>

      {/* Top Riders Leaderboard */}
      <div className="mb-6">
        <h3 className="font-black text-gray-900 text-base mb-3">🏆 Top Riders This Month</h3>
        <div className="space-y-2">
          {TOP_RIDERS.map((rider, idx) => (
            <div key={rider.id} className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-gray-300 text-black' : 'bg-orange-200 text-black'}`}>
                {idx + 1}
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">{rider.avatar}</div>
              <div className="flex-1">
                <p className="font-black text-sm text-gray-900">{rider.name}</p>
                <p className="text-[10px] text-gray-500">{rider.stats}</p>
              </div>
              <span className="text-[#FF1493] text-[10px] font-bold">{rider.badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Merchants Spotlight */}
      <div className="mb-6">
        <h3 className="font-black text-gray-900 text-base mb-3">⭐ Merchant Spotlight</h3>
        <div className="space-y-2">
          {FEATURED_MERCHANTS.map((merchant) => (
            <button key={merchant.id} className="w-full bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">{merchant.avatar}</div>
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-gray-900">{merchant.name}</p>
                <p className="text-[10px] text-gray-500">{merchant.stats}</p>
              </div>
              <span className="bg-pink-100 text-[#FF1493] text-[8px] font-black px-2 py-1 rounded-full">{merchant.badge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Community Posts with full interactivity */}
      <div className="mb-6">
        <h3 className="font-black text-gray-900 text-base mb-3">📢 Community Posts</h3>
        {communityPosts.map(post => renderPost(post))}
      </div>

      {/* Recent Activity Feed */}
      <div className="mb-24">
        <h3 className="font-black text-gray-900 text-base mb-3">📊 Recent Activity</h3>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {recentOrders.length > 0 ? (
            recentOrders.slice(0, 5).map((order, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-lg">🛵</span>
                <div className="flex-1">
                  <p className="font-bold text-xs text-gray-900">{order.restaurantName}</p>
                  <p className="text-[8px] text-gray-500">{order.status} • ₱{order.total}</p>
                </div>
                <span className="text-[8px] text-gray-400">{order.date}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-4 opacity-50">
              <p className="text-2xl mb-2">📦</p>
              <p className="text-xs font-black">No recent orders</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-24 overflow-y-auto scroll-smooth scrollbar-hide">
      {/* Share Modal */}
      {showShareModal && sharePost && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setShowShareModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-[50px] p-8 animate-in slide-in-from-bottom-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-center">📤 Share Post</h3>
            <div className="space-y-3">
              <button onClick={() => handleShare(sharePost, 'facebook')} className="w-full p-4 bg-blue-600 text-white rounded-2xl flex items-center gap-3">
                <span className="text-2xl">📘</span>
                <span className="font-black">Share on Facebook</span>
              </button>
              <button onClick={() => handleShare(sharePost, 'twitter')} className="w-full p-4 bg-black text-white rounded-2xl flex items-center gap-3">
                <span className="text-2xl">🐦</span>
                <span className="font-black">Share on Twitter</span>
              </button>
              <button onClick={() => handleShare(sharePost, 'whatsapp')} className="w-full p-4 bg-green-500 text-white rounded-2xl flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <span className="font-black">Share on WhatsApp</span>
              </button>
              <button onClick={() => handleShare(sharePost, 'messages')} className="w-full p-4 bg-[#FF1493] text-white rounded-2xl flex items-center gap-3">
                <span className="text-2xl">✉️</span>
                <span className="font-black">Send via Messages</span>
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full mt-4 text-gray-400 text-xs font-black uppercase">Cancel</button>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[50px] p-8 animate-in slide-in-from-bottom-10 shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-center">📍 Select Location</h3>
            <button onClick={handleGetCurrentLocation} disabled={geoStatus === 'FETCHING'} className="w-full mb-4 p-4 bg-gradient-to-r from-[#FF1493] to-[#FF69B4] rounded-2xl flex items-center justify-center gap-2 text-white font-black uppercase text-sm shadow-lg">
              {geoStatus === 'FETCHING' ? '📡 Locating...' : '📍 Use Current Location'}
            </button>
            <div className="space-y-2 max-h-[30vh] overflow-y-auto pb-4">
              {PHILIPPINE_CITIES.map(city => (
                <button key={city} onClick={() => { onSetDeliveryCity(city); setShowLocationPicker(false); }} className={`w-full p-3 rounded-2xl flex items-center justify-between border-2 transition-all ${deliveryCity === city ? 'bg-pink-50 border-[#FF1493]' : 'bg-gray-50 border-gray-100'}`}>
                  <span className={`font-bold text-sm ${deliveryCity === city ? 'text-[#FF1493]' : 'text-gray-900'}`}>{city}</span>
                  {deliveryCity === city && <span className="text-[#FF1493]">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-[#FF1493] via-[#FF69B4] to-[#FF1493] p-5 pb-32 shadow-2xl rounded-b-[40px]">
        <div className="flex justify-between items-start mb-4">
          <div className="cursor-pointer flex items-center gap-2 flex-1" onClick={() => setShowLocationPicker(true)}>
            <div className="bg-white/30 backdrop-blur-md p-2 rounded-xl">
              <span className="text-xl">📍</span>
            </div>
            <div>
              <p className="text-[8px] font-bold text-white/80 uppercase tracking-widest">Delivering to</p>
              <p className="font-black text-white text-lg flex items-center gap-1">{deliveryCity} <span className="text-xs opacity-80">▼</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/30 backdrop-blur-md px-3 py-2 rounded-xl flex items-center gap-1">
              <span className="text-lg">🪙</span>
              <span className="text-white font-black text-sm">{points}</span>
            </div>
            <button onClick={() => onOpenCart?.()} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center relative shadow-lg">
              <span className="text-xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 flex">
          <button onClick={() => setActiveTab('discover')} className={`flex-1 py-2 px-4 rounded-full text-sm font-black uppercase tracking-wider transition-all ${activeTab === 'discover' ? 'bg-white text-[#FF1493] shadow-md' : 'text-white'}`}>
            🔍 Discover
          </button>
          <button onClick={() => setActiveTab('community')} className={`flex-1 py-2 px-4 rounded-full text-sm font-black uppercase tracking-wider transition-all ${activeTab === 'community' ? 'bg-white text-[#FF1493] shadow-md' : 'text-white'}`}>
            👥 Community
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 -mt-20 relative z-10">
        {activeTab === 'discover' ? renderDiscoveries() : renderCommunity()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-6 py-3 flex justify-around items-center max-w-md mx-auto rounded-t-[40px] shadow-[0_-10px_40px_rgba(255,20,147,0.15)] z-50">
        <button onClick={() => { }} className="flex flex-col items-center text-[#FF1493] p-2">
          <span className="text-3xl mb-1">🏠</span>
          <span className="text-[10px] font-black uppercase tracking-wider">Home</span>
        </button>
        <button onClick={() => onNavigate?.('MESSAGES')} className="flex flex-col items-center text-gray-400 p-2">
          <span className="text-3xl mb-1">💬</span>
          <span className="text-[10px] font-black uppercase tracking-wider">Messages</span>
        </button>
        <button onClick={() => onNavigate?.('VOUCHERS')} className="flex flex-col items-center text-gray-400 p-2">
          <span className="text-3xl mb-1">🎟️</span>
          <span className="text-[10px] font-black uppercase tracking-wider">Voucher</span>
        </button>
        <button onClick={() => onNavigate?.('HISTORY')} className="flex flex-col items-center text-gray-400 p-2">
          <span className="text-3xl mb-1">📑</span>
          <span className="text-[10px] font-black uppercase tracking-wider">Orders</span>
        </button>
        <button onClick={() => onNavigate?.('PROFILE')} className="flex flex-col items-center text-gray-400 p-2">
          <span className="text-3xl mb-1">👤</span>
          <span className="text-[10px] font-black uppercase tracking-wider">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default Home;

