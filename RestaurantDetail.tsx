
import React, { useState, useMemo, useEffect } from 'react';
import { Restaurant, FoodItem, Review } from '../types';
import Button from '../components/Button';

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
  onAddToCart: (itemId: string) => void;
  onOpenCart: () => void;
  cartCount: number;
}

const RestaurantDetail: React.FC<RestaurantDetailProps> = ({ restaurant, onBack, onAddToCart, onOpenCart, cartCount }) => {
  const [activeTab, setActiveTab] = useState<'Menu' | 'Reviews'>('Menu');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showLiveCam, setShowLiveCam] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [localReviews, setLocalReviews] = useState<Review[]>(restaurant.reviews || []);

  const handleAdd = (item: FoodItem) => {
    onAddToCart(item.id);
    setToastMessage(`Added ${item.name} to cart`);
    setShowToast(true);
  };

  const handleReviewSubmit = () => {
    if (!newComment.trim()) return;
    
    const newReview: Review = {
      id: Date.now().toString(),
      userName: 'You',
      userAvatar: 'https://i.pravatar.cc/150?u=current_user',
      rating: newRating,
      comment: newComment,
      date: 'Just now'
    };
    
    setLocalReviews([newReview, ...localReviews]);
    setNewComment('');
    setNewRating(5);
    setShowReviewModal(false);
    setToastMessage('Review posted successfully! ✨');
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const categorizedItems = useMemo(() => {
    const groups: Record<string, FoodItem[]> = {};
    restaurant.items.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [restaurant.items]);

  const categories = ['All', ...Object.keys(categorizedItems)];
  const displayEntries = Object.entries(activeCategory === 'All' ? categorizedItems : { [activeCategory]: categorizedItems[activeCategory] || [] }) as [string, FoodItem[]][];

  return (
    <div className="bg-white min-h-screen pb-32 overflow-y-auto scrollbar-hide">
      
      {/* Live Cam Modal */}
      {showLiveCam && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
           <div className="w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-[50px] relative overflow-hidden shadow-2xl border-4 border-white/10">
              <img 
                src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3p5Z3Zndm43ZzZndm43ZzZndm43ZzZndm43ZzZndm43ZzZndm43ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6Zt8qDiXLQp2Yf9m/giphy.gif" 
                className="w-full h-full object-cover opacity-80" 
                alt="Live Kitchen"
              />
              <div className="absolute top-10 left-8 right-8 flex justify-between items-center">
                 <div className="bg-red-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Live Prep
                 </div>
                 <button onClick={() => setShowLiveCam(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-xl">✕</button>
              </div>
              <div className="absolute bottom-10 left-8 right-8">
                 <p className="text-white/60 text-[9px] font-black uppercase mb-1">Watching</p>
                 <h4 className="text-white font-black text-xl uppercase tracking-tighter">Ayoo Kitchen Stream</h4>
                 <div className="flex gap-2 mt-4 overflow-hidden h-6">
                    <div className="bg-white/10 px-3 py-1 rounded-lg text-[8px] font-black text-white/40 uppercase">#HygieneFirst</div>
                    <div className="bg-white/10 px-3 py-1 rounded-lg text-[8px] font-black text-white/40 uppercase">#FreshAlways</div>
                 </div>
              </div>
           </div>
           <p className="mt-8 text-white/40 font-black uppercase text-[10px] tracking-[0.3em]">Ayoo Live Verification Active</p>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[85%] z-[100] animate-in fade-in slide-in-from-top-4">
          <div className="bg-white rounded-3xl p-4 shadow-xl border-2 border-[#FF00CC]/10 flex items-center gap-4">
            <div className="w-10 h-10 ayoo-gradient rounded-xl flex items-center justify-center text-white">✓</div>
            <p className="text-gray-900 font-bold text-sm truncate">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[50px] p-10 animate-in zoom-in-95">
              <h3 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tighter text-center">Write a Review</h3>
              <div className="flex justify-center gap-4 mb-8">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setNewRating(star)} className={`text-4xl transition-all ${star <= newRating ? 'scale-110' : 'grayscale opacity-30'}`}>⭐</button>
                ))}
              </div>
              <textarea placeholder="How was the vibe?..." className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-[30px] font-bold text-sm focus:outline-none focus:border-[#FF00CC] mb-8 min-h-[120px]" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
              <Button onClick={handleReviewSubmit} className="pill-shadow py-5 font-black uppercase">Post Review</Button>
              <button onClick={() => setShowReviewModal(false)} className="w-full mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Cancel</button>
           </div>
        </div>
      )}

      {/* Visual Header */}
      <div className="relative h-80">
        <img src={restaurant.image} className="w-full h-full object-cover" alt={restaurant.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Top Controls */}
        <div className="absolute top-8 left-6 right-6 flex justify-between items-center z-20">
          <button onClick={onBack} className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all">←</button>
          <div className="flex gap-3">
             {restaurant.hasLiveCam && (
               <button 
                 onClick={() => setShowLiveCam(true)}
                 className="h-14 bg-green-500 px-6 rounded-2xl flex items-center justify-center text-white font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-90 transition-all gap-2"
               >
                 <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                 Live Cam
               </button>
             )}
             <button onClick={onOpenCart} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#FF00CC] shadow-xl active:scale-90 transition-all relative">
                🛒
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>}
             </button>
          </div>
        </div>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-12 left-8 right-8 text-white z-10">
            <div className="flex items-center gap-3 mb-3">
                {restaurant.isPartner && <span className="bg-[#FF00CC] text-white px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg border border-white/20">Ayoo Partner</span>}
                <span className="bg-yellow-400 text-black px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg">⭐ {restaurant.rating}</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">{restaurant.name}</h2>
            <div className="flex items-center gap-3 text-white/80 font-bold text-xs uppercase tracking-widest">
                <span>{restaurant.cuisine}</span>
                <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                <span>{restaurant.address}</span>
            </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="bg-white sticky top-0 z-40 px-8 py-2 border-b border-gray-100 flex gap-10 justify-center">
         {['Menu', 'Reviews'].map((tab) => (
           <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-4 text-sm font-black uppercase tracking-widest relative transition-all ${activeTab === tab ? 'text-[#FF00CC]' : 'text-gray-300'}`}>
             {tab}
             {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 ayoo-gradient rounded-full"></div>}
           </button>
         ))}
      </div>

      <div className="bg-white relative px-8 pt-8">
        {activeTab === 'Menu' ? (
          <>
            <div className="sticky top-14 bg-white z-30 -mx-8 px-8 py-4 mb-8 overflow-x-auto scrollbar-hide flex gap-3">
               {categories.map(cat => (
                 <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-[#FF00CC] text-white shadow-lg shadow-pink-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                   {cat}
                 </button>
               ))}
            </div>

            <div className="space-y-12 pb-10">
              {displayEntries.map(([category, items]) => (
                <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex justify-between items-end mb-8">
                      <h3 className="font-black text-2xl text-gray-900 tracking-tighter uppercase leading-none">{category}</h3>
                      <div className="w-1/2 h-[3px] bg-pink-50 rounded-full mb-1"></div>
                   </div>
                   <div className="space-y-8">
                      {items.map(item => (
                        <div key={item.id} className="group flex gap-6 items-start">
                          <div className="relative flex-shrink-0">
                            <div className="w-32 h-32 rounded-[32px] overflow-hidden shadow-xl border-4 border-white group-hover:scale-105 transition-transform duration-500">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col min-h-[128px]">
                            <div className="flex-1">
                              <h4 className="font-black text-xl text-gray-900 leading-tight tracking-tight mb-1">{item.name}</h4>
                              <p className="text-[11px] text-gray-400 font-bold line-clamp-2 leading-relaxed tracking-tight">{item.description}</p>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                              <span className="font-black text-2xl text-[#FF00CC]">₱{item.price}</span>
                              <button onClick={() => handleAdd(item)} className="bg-[#FF00CC] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-pink-100">Add +</button>
                            </div>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="pb-10 space-y-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-2xl text-gray-900 uppercase tracking-tighter">Community Buzz</h3>
              <button onClick={() => setShowReviewModal(true)} className="bg-pink-50 text-[#FF00CC] px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-pink-100">Write Review ✨</button>
            </div>
            {localReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <span className="text-6xl mb-6">📝</span>
                <p className="font-black uppercase tracking-widest text-sm">No reviews yet. Be the first!</p>
              </div>
            ) : (
              localReviews.map(review => (
                <div key={review.id} className="bg-gray-50/50 p-8 rounded-[40px] border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <img src={review.userAvatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt={review.userName} />
                      <div>
                        <h4 className="font-black text-sm text-gray-900 uppercase tracking-tight leading-none mb-1">{review.userName}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{review.date}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 font-bold text-sm leading-relaxed italic">"{review.comment}"</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {cartCount > 0 && activeTab === 'Menu' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[85%] z-50">
          <Button onClick={onOpenCart} className="pill-shadow py-6 text-xl font-black uppercase tracking-widest flex items-center justify-between px-10">
            <span>Checkout Now</span>
            <span className="bg-white text-[#FF00CC] w-10 h-10 rounded-full flex items-center justify-center text-sm font-black">{cartCount}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;
