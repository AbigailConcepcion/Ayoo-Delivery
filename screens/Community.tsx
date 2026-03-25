import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppScreen, UserAccount } from '../types';
import { useToast } from '../components/ToastContext';

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  loved: boolean;
  userLikes: boolean;
  comments: Comment[];
}

interface CommentReply extends Omit<Comment, 'replies'> {
  replies: never[];
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  replies: Comment[];
  liked: boolean;
}

interface CommunityProps {
  onBack: () => void;
  onNavigate: (s: AppScreen) => void;
  currentUser: UserAccount | null;
}

const STORAGE_KEY = 'ayoo_community_posts_v1';
const MAX_POSTS = 100;
const USER_AVATARS = {
  'Juan E.': '👨‍💼',
  'Maria C.': '👩‍🎨',
  'Pedro R.': '🧔',
  'Liza S.': '👩‍💻',
  'Tony M.': '🕶️',
  'Ana L.': '👩',
  'Rico P.': '😎',
  'Sofia G.': '👱‍♀️',
};

const Community: React.FC<CommunityProps> = ({ onBack, onNavigate, currentUser }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ postId: string; commentId?: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const newPostRef = useRef<HTMLTextAreaElement>(null);

  const userName = currentUser?.name || 'Anonymous';
  const userAvatar = USER_AVATARS[userName as keyof typeof USER_AVATARS] || '👤';

  // Load/save posts to localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Post[];
        setPosts(parsed.slice(-MAX_POSTS));
      } catch {
        console.warn('Invalid posts data');
      }
    } else {
      // Seed initial mock posts
      seedMockPosts();
    }
    setLoading(false);
  }, []);

  const seedMockPosts = useCallback(() => {
    const users = Object.keys(USER_AVATARS);
    const mockPosts: Post[] = Array.from({ length: 20 }, (_, i) => ({
      id: `mock_${Date.now() - i * 3600000}`,
      author: users[i % users.length],
      avatar: USER_AVATARS[users[i % users.length] as keyof typeof USER_AVATARS] || '👤',
      content: [
        `Chickenjoy arrived in record time! Rider was amazing 🚀✨`,
        `Jollibee spaghetti hits different tonight 🔥🍝`,
        `Green Meadows salad was super fresh! Healthy win 🥗`,
        `Rider navigated heavy rain perfectly! Legend ☔⚡`,
        `Sisig spicy level 10/10! Eating good tonight 🌶️👅`,
        `Groceries + lunch delivered together. Ayoo magic 🛒🍔`,
        `Merchant added free chili - customer service 100! ❤️`,
        `First time halo-halo from Ayoo - OBSESSED ❄️🍧`,
        `Family dinner arrived complete! Kids happy 👨‍👩‍👧‍👦`,
        `1AM urgent medicine delivery saved the night! 🌙💊`
      ][i % 10],
      timestamp: new Date(Date.now() - i * 3600000).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      likes: 12 + i * 3,
      loved: false,
      userLikes: false,
      comments: Array.from({ length: Math.floor(Math.random() * 3) }, (_, j) => ({
        id: `c${i}_${j}`,
        author: users[(i + j + 1) % users.length],
        avatar: USER_AVATARS[users[(i + j + 1) % users.length] as keyof typeof USER_AVATARS] || '👤',
        content: [
          'Same here! Their gravy is unreal 👌',
          'Rider was so nice! Added extra sauce ❤️',
          'This place never disappoints!',
          '5⭐ delivery speed!',
          'Perfect for rainy nights ☔'
        ][j],
        timestamp: '2m ago',
        replies: Math.random() > 0.7 ? [{
          id: `r${i}_${j}`,
          author: users[(i + j + 2) % users.length],
          avatar: USER_AVATARS[users[(i + j + 2) % users.length] as keyof typeof USER_AVATARS] || '👤',
          content: 'Totally agree! 🙌',
          timestamp: '1m ago',
          liked: false,
          replies: [],
        }] : [],
        liked: false,
      }))
    }));
    setPosts(mockPosts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPosts));
  }, []);

  const savePosts = useCallback((updatedPosts: Post[]) => {
    const toSave = updatedPosts.slice(-MAX_POSTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setPosts(toSave);
  }, []);

  const createNewPost = () => {
    if (!newPostText.trim() || !currentUser) return;

    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: userName,
      avatar: userAvatar,
      content: newPostText.trim(),
      timestamp: new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      likes: 0,
      loved: false,
      userLikes: false,
      comments: []
    };

    const updated = [newPost, ...posts];
    savePosts(updated);
    setNewPostText('');
    newPostRef.current?.focus();
    showToast('Post created! 🚀');
  };

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const newLikes = post.userLikes ? post.likes - 1 : post.likes + 1;
        return { ...post, likes: newLikes, userLikes: !post.userLikes };
      }
      return post;
    }));
  };

  const toggleLove = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, loved: !post.loved };
      }
      return post;
    }));
  };

  const addComment = (postId: string) => {
    if (!replyText.trim()) return;

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      author: userName,
      avatar: userAvatar,
      content: replyText.trim(),
      timestamp: 'Just now',
      replies: [],
      liked: false,
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId && replyingTo && !replyingTo.commentId) {
        return {
          ...post,
          comments: [...post.comments, comment]
        };
      }
      return post;
    }));

    setReplyText('');
    setReplyingTo(null);
    showToast('Comment added!');
  };

  const addReply = (postId: string, commentId: string) => {
    if (!replyText.trim()) return;

    const reply: Comment = {
      id: `reply_${Date.now()}`,
      author: userName,
      avatar: userAvatar,
      content: replyText.trim(),
      timestamp: 'Just now',
      replies: [],
      liked: false,
    };

    setPosts(prev => prev.map(post => ({
      ...post,
      comments: post.comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      )
    })));

    setReplyText('');
    setReplyingTo(null);
    showToast('Reply added!');
  };

  const toggleCommentLike = (postId: string, commentId: string) => {
    setPosts(prev => prev.map(post => ({
      ...post,
      comments: post.comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, liked: !comment.liked }
          : comment
      )
    })));
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white px-6 items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-lg font-bold text-gray-600">Loading Ayoo Community...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white px-6">
      {/* Header */}
      <div className="pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-gray-50 transition-all">
            <span className="text-2xl">←</span>
          </button>
          <h1 className="text-3xl font-black text-gray-900">Community</h1>
          <div className="w-12" />
        </div>
      </div>

      {/* New Post Form */}
      {currentUser && (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
              {userAvatar}
            </div>
            <div className="flex-1">
              <textarea
                ref={newPostRef}
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What's happening in your Ayoo world?"
                rows={3}
                className="w-full resize-none rounded-2xl bg-gray-50 px-4 py-3 text-sm font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-lg">
              <button className="p-2 rounded-xl hover:bg-purple-50 transition-all">📎</button>
              <button className="p-2 rounded-xl hover:bg-pink-50 transition-all">❤️</button>
              <button className="p-2 rounded-xl hover:bg-blue-50 transition-all">📸</button>
            </div>
            <button
              onClick={createNewPost}
              disabled={!newPostText.trim()}
              className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4 flex-1 pb-24">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-all p-5">
            {/* Post Header */}
            <div className="flex gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                {post.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm">{post.author}</p>
                  <span className="text-xs text-gray-500">{post.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <p className="text-sm font-medium text-gray-800 mb-5 leading-relaxed">{post.content}</p>

            {/* Reactions */}
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1 p-2 rounded-xl font-medium transition-all ${
                  post.userLikes ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <span>👍</span>
                <span>{post.likes}</span>
              </button>
              <button 
                onClick={() => toggleLove(post.id)}
                className={`flex items-center gap-1 p-2 rounded-xl font-medium transition-all ${
                  post.loved ? 'bg-pink-50 text-pink-600' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <span>❤️</span>
              </button>
              <span className="text-xs text-gray-500">· Reply</span>
            </div>

            {/* Comments */}
            <div className="space-y-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="pl-14 relative">
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <div className="flex gap-2 mb-1">
                      <span className="text-xs font-bold">{comment.author}</span>
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-800">{comment.content}</p>
                    <div className="flex items-center gap-3 mt-2 pt-1 border-t border-gray-200">
                      <button 
                        onClick={() => toggleCommentLike(post.id, comment.id)}
                        className={`text-xs font-medium transition-all ${
                          comment.liked ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        👍 Like
                      </button>
                      <button 
                        onClick={() => setReplyingTo({ postId: post.id, commentId: comment.id })}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="ml-4 mt-2 pl-8 relative border-l border-purple-200">
                      <div className="bg-purple-50 p-2 rounded-xl">
                        <div className="flex gap-1 text-xs">
                          <span className="font-bold">{reply.author}</span>
                          <span className="text-gray-500">{reply.timestamp}</span>
                        </div>
                        <p className="text-xs text-gray-800 mt-1">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Add Comment Form */}
              <div className="pl-14">
                <div className="flex gap-3 items-end">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {userAvatar}
                  </div>
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={replyingTo?.commentId ? 'Write a reply...' : 'Write a comment...'}
                    className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      if (replyingTo) {
                        if (replyingTo.commentId) {
                          addReply(replyingTo.postId, replyingTo.commentId);
                        } else {
                          addComment(replyingTo.postId);
                        }
                      }
                    }}
                    disabled={!replyText.trim()}
                    className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm">Be the first to share your Ayoo experience!</p>
            {currentUser && (
              <div className="bg-white p-6 rounded-3xl shadow-lg w-full max-w-md">
                <textarea
                  ref={newPostRef}
                  placeholder="Share your first Ayoo story..."
                  className="w-full p-4 rounded-2xl bg-gray-50 resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
                <button className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all">
                  Post Story
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Nav Space */}
      <div className="h-24" />
    </div>
  );
};

export default Community;

