import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, UserAccount, ParticipantRole } from '../types';
import { db } from '../db';
import { messagingHub } from '../api';
import { COLORS } from '../constants';
import BottomNav from '../components/BottomNav';

interface MessagesProps {
    currentUser: UserAccount;
    onBack: () => void;
    onNavigate?: (screen: string) => void;
}

const Messages: React.FC<MessagesProps> = ({ currentUser, onBack, onNavigate }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<{ email: string; name: string; role: ParticipantRole }[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUserRole = currentUser.role || 'CUSTOMER';

    // Load conversations on mount
    useEffect(() => {
        loadConversations();

        // Subscribe to real-time message updates
        const unsubscribe = messagingHub.subscribe(() => {
            loadConversations();
            if (selectedConversation) {
                loadMessages(selectedConversation.id);
            }
        });

        return () => unsubscribe();
    }, [currentUser.email]);

    // Load messages when conversation is selected
    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
            // Mark as read
            db.markConversationAsRead(selectedConversation.id, currentUser.email);
        }
    }, [selectedConversation, currentUser.email]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        try {
            const convos = await db.getConversations(currentUser.email);
            setConversations(convos);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        }
    };

    const loadMessages = async (conversationId: string) => {
        try {
            const msgs = await db.getMessages(conversationId);
            setMessages(msgs);
        } catch (err) {
            console.error('Failed to load messages:', err);
        }
    };

    const loadAvailableUsers = async () => {
        try {
            const users = await db.getRegistryUsers();
            const filtered = users
                .filter(u => u.email.toLowerCase() !== currentUser.email.toLowerCase())
                .map(u => ({
                    email: u.email,
                    name: u.name,
                    role: (u.role || 'CUSTOMER') as ParticipantRole,
                }));
            setAvailableUsers(filtered);
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        setIsLoading(true);
        try {
            await db.sendMessage(
                selectedConversation.id,
                currentUser.email,
                currentUser.name,
                newMessage.trim()
            );
            setNewMessage('');
            loadMessages(selectedConversation.id);
            loadConversations();
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartNewChat = async (otherUser: { email: string; name: string; role: ParticipantRole }) => {
        setIsLoading(true);
        try {
            const convo = await db.getOrCreateConversation(
                currentUser.email,
                currentUser.name,
                currentUserRole as 'CUSTOMER' | 'MERCHANT' | 'RIDER',
                otherUser.email,
                otherUser.name,
                otherUser.role
            );
            setSelectedConversation(convo);
            setShowNewChat(false);
            loadConversations();
        } catch (err) {
            console.error('Failed to create conversation:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getOtherParticipant = (convo: Conversation) => {
        return convo.participants.find(p => p.email.toLowerCase() !== currentUser.email.toLowerCase());
    };

    const getRoleIcon = (role: ParticipantRole) => {
        switch (role) {
            case 'MERCHANT': return '🏪';
            case 'RIDER': return '🛵';
            default: return '👤';
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    // If a conversation is selected, show the chat view
    if (selectedConversation) {
        const otherUser = getOtherParticipant(selectedConversation);

        return (
            <div className="flex flex-col h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#FF1493] via-[#FF69B4] to-[#FF1493] p-4 pb-6 rounded-b-[40px] shadow-lg">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedConversation(null)}
                            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black"
                        >
                            ←
                        </button>
                        <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center text-2xl">
                            {otherUser ? getRoleIcon(otherUser.role) : '💬'}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-white font-black text-lg">{otherUser?.name || 'Chat'}</h2>
                            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">
                                {otherUser?.role || 'User'}
                                {selectedConversation.orderId && ` • Order #${selectedConversation.orderId.slice(-6)}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <p className="text-4xl mb-4">💬</p>
                            <p className="font-black text-xs uppercase tracking-widest">No messages yet</p>
                            <p className="text-gray-400 text-xs mt-2">Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderEmail.toLowerCase() === currentUser.email.toLowerCase();
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[75%] p-3 rounded-[20px] ${isMe
                                            ? 'bg-gradient-to-r from-[#FF1493] to-[#FF69B4] text-white rounded-tr-none'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                            } shadow-sm`}
                                    >
                                        <p className="text-sm font-medium">{msg.text}</p>
                                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                            {formatTime(msg.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#FF00CC]/30"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || isLoading}
                            className="w-12 h-12 bg-gradient-to-r from-[#FF1493] to-[#FF69B4] rounded-full flex items-center justify-center text-white font-black shadow-lg disabled:opacity-50"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show new chat modal
    if (showNewChat) {
        return (
            <div className="flex flex-col h-screen bg-gray-50">
                <div className="bg-gradient-to-r from-[#FF1493] via-[#FF69B4] to-[#FF1493] p-4 pb-6 rounded-b-[40px] shadow-lg">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowNewChat(false)}
                            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black"
                        >
                            ←
                        </button>
                        <h2 className="text-white font-black text-lg">New Message</h2>
                    </div>
                </div>

                <div className="p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select a contact</p>
                    {availableUsers.length === 0 ? (
                        <div className="text-center py-8 opacity-50">
                            <p className="text-4xl mb-4">👥</p>
                            <p className="font-black text-xs uppercase tracking-widest">No users found</p>
                            <p className="text-gray-400 text-xs mt-2">Register more users to start chatting</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availableUsers.map((user) => (
                                <button
                                    key={user.email}
                                    onClick={() => handleStartNewChat(user)}
                                    className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm active:scale-95 transition-transform"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                                        {getRoleIcon(user.role)}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-black text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">{user.role}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Main conversations list
    return (
        <div className="flex flex-col h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF1493] via-[#FF69B4] to-[#FF1493] p-4 pb-6 rounded-b-[40px] shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black"
                        >
                            ←
                        </button>
                        <h2 className="text-white font-black text-xl">Messages</h2>
                        {totalUnread > 0 && (
                            <span className="bg-white text-[#FF00CC] text-xs font-black px-2 py-1 rounded-full">
                                {totalUnread}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => { loadAvailableUsers(); setShowNewChat(true); }}
                        className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl"
                    >
                        ✏️
                    </button>
                </div>
                <p className="text-white/70 text-xs mt-2 px-1 font-medium">
                    Chat with your {currentUserRole === 'CUSTOMER' ? 'merchants and riders' : currentUserRole === 'MERCHANT' ? 'customers and riders' : 'customers and merchants'}
                </p>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-4">
                {conversations.length === 0 ? (
                    <div className="text-center py-12 opacity-50">
                        <p className="text-6xl mb-4">💬</p>
                        <p className="font-black text-sm uppercase tracking-widest">No conversations yet</p>
                        <p className="text-gray-400 text-xs mt-2">
                            Start an order to chat with your {currentUserRole === 'CUSTOMER' ? 'merchant or rider' : 'customer'}
                        </p>
                        <button
                            onClick={() => { loadAvailableUsers(); setShowNewChat(true); }}
                            className="mt-6 px-6 py-3 bg-gradient-to-r from-[#FF1493] to-[#FF69B4] text-white font-black text-sm rounded-full shadow-lg"
                        >
                            Start New Chat
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {conversations.map((convo) => {
                            const otherUser = getOtherParticipant(convo);
                            return (
                                <button
                                    key={convo.id}
                                    onClick={() => setSelectedConversation(convo)}
                                    className="w-full p-4 bg-white rounded-[25px] border border-gray-100 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform"
                                >
                                    <div className="relative">
                                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                                            {otherUser ? getRoleIcon(otherUser.role) : '💬'}
                                        </div>
                                        {convo.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF00CC] text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                                {convo.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-black text-gray-900 truncate">{otherUser?.name || 'Unknown'}</p>
                                            <p className="text-[10px] text-gray-400 font-bold">
                                                {convo.lastMessageTime ? formatTime(convo.lastMessageTime) : ''}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                            {otherUser?.role || 'User'}
                                        </p>
                                        <p className="text-sm text-gray-400 truncate mt-1">
                                            {convo.lastMessage || 'No messages yet'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;

