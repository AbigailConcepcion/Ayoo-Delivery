import React, { useState, useEffect, useRef, useCallback, forwardRef, CSSProperties } from 'react';
import BottomNav from '../components/BottomNav';
import { Conversation, Message, UserAccount, ParticipantRole, AppScreen } from '../types';
import { db } from '../db';
import { COLORS } from '../constants';

interface MessagesProps {
  currentUser: UserAccount;
  onBack: () => void;
  onNavigate: (screen: AppScreen) => void;
}

const Messages: React.FC<MessagesProps> = ({ currentUser, onBack, onNavigate }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ email: string; name: string; role: ParticipantRole }[]>([]);
  const scrollViewRef = useRef<HTMLDivElement>(null);

  const currentUserRole = currentUser.role || 'CUSTOMER';

  // Helper to merge styles
  const mergeStyles = (...styles: CSSProperties[]): CSSProperties => {
    const merged = {} as CSSProperties;
    styles.forEach(style => Object.assign(merged, style));
    return merged;
  };

  // Real-time messaging
  useEffect(() => {
    const channel = new BroadcastChannel('ayoo_messaging_v1');
    const handleMessage = () => {
      loadConversations();
      if (selectedConversation) {
        db.getMessages(selectedConversation.id).then(setMessages);
      }
    };
    channel.onmessage = handleMessage;
    return () => channel.close();
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTop = scrollViewRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadConversations = async () => {
    try {
      const convos = await db.getConversations(currentUser.email);
      setConversations(convos);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const users = await db.getRegistryUsers();
      const filtered = users.filter((u: any) => u.email.toLowerCase() !== currentUser.email.toLowerCase()).map((u: any) => ({
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

    const text = newMessage.trim();
    setIsLoading(true);
    setNewMessage('');
    try {
      await db.sendMessage(selectedConversation.id, currentUser.email, currentUser.name, text);
      new BroadcastChannel('ayoo_messaging_v1').postMessage({ type: 'NEW_MESSAGE' });
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewChat = async (otherUser: { email: string; name: string; role: ParticipantRole }) => {
    try {
      const convo = await db.getOrCreateConversation(
        currentUser.email, currentUser.name, currentUserRole as any,
        otherUser.email, otherUser.name, otherUser.role
      );
      setSelectedConversation(convo);
      setShowNewChat(false);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const getOtherParticipant = (convo: Conversation) => {
    return convo.participants.find((p: any) => p.email.toLowerCase() !== currentUser.email.toLowerCase());
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
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalUnread = conversations.reduce((sum: number, c: Conversation) => sum + (c.unreadCount || 0), 0);

  // Polyfills - fixed typing
  const View: React.FC<any> = (props) => <div {...props} />;
  const TextComponent: React.FC<any> = (props) => <span {...props} />;
  const TextInputComp = forwardRef<HTMLTextAreaElement, any>((props, ref) => (
    <textarea ref={ref} {...props} style={{ resize: 'none', border: 'none', outline: 'none', ...props.style }} />
  ));
  const ScrollViewComp = forwardRef<HTMLDivElement, any>((props, ref) => (
    <div ref={ref} style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any, flex: 1, ...props.style }} {...props} />
  ));
  const TouchableOpacityComp: React.FC<any> = (props) => (
    <button type="button" onClick={props.onPress} style={props.style} {...props}>
      {props.children}
    </button>
  );
  const SafeAreaViewComp: React.FC<any> = (props) => (
    <div style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', ...props.style }} {...props} />
  );

  if (selectedConversation) {
    const otherUser = getOtherParticipant(selectedConversation);
    return (
      <SafeAreaViewComp style={{ flex: 1, backgroundColor: COLORS.primaryBg, paddingBottom: 100 }}>
        <View style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '20px 16px',
          background: COLORS.primaryGradient,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <TouchableOpacityComp onPress={() => setSelectedConversation(null)} style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <TextComponent style={{ color: 'white', fontSize: 20, fontWeight: 900 as any }}>←</TextComponent>
          </TouchableOpacityComp>
          <View style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <TextComponent>{otherUser ? getRoleIcon(otherUser.role) : '💬'}</TextComponent>
            </View>
            <div>
              <TextComponent style={{ color: 'white', fontSize: 18, fontWeight: 900 as any }}>{otherUser?.name || 'Chat'}</TextComponent>
              <TextComponent style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700 as any }}>{otherUser?.role || 'User'}</TextComponent>
            </div>
          </View>
        </View>

        <ScrollViewComp ref={scrollViewRef} style={{ flex: 1, padding: 16, paddingBottom: 100 }}>
          {messages.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <TextComponent style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} >💬</TextComponent>
              <TextComponent style={{ fontSize: 12, fontWeight: 900 as any, marginBottom: 8, opacity: 0.5 }}>No messages yet</TextComponent>
              <TextComponent style={{ fontSize: 12, textAlign: 'center' as any, marginBottom: 24, opacity: 0.5 }}>Start the conversation!</TextComponent>
            </View>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderEmail.toLowerCase() === currentUser.email.toLowerCase();
              return (
                <View key={msg.id} style={{ display: 'flex', flexDirection: 'row' as any, justifyContent: isMe ? 'flex-end' : 'flex-start', marginVertical: 4 }}>
                  <View style={{
                    maxWidth: '75%',
                    padding: 12,
                    borderRadius: 20,
                    backgroundColor: isMe ? COLORS.primary : 'white',
                    borderTopRightRadius: isMe ? 4 : 20,
                    borderTopLeftRadius: isMe ? 20 : 4,
                    border: `1px solid ${COLORS.gray100}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}>
                    <TextComponent style={{ fontSize: 14, fontWeight: 500 as any, lineHeight: 20, color: isMe ? 'white' : 'black' }}>{msg.text}</TextComponent>
                    <TextComponent style={{ marginTop: 4, fontSize: 10, fontWeight: 500 as any, opacity: 0.7, color: isMe ? 'rgba(255,255,255,0.7)' : 'black' }}>
                      {formatTime(msg.timestamp)}
                    </TextComponent>
                  </View>
                </View>
              );
            })
          )}
        </ScrollViewComp>

        <div style={{
          display: 'flex',
          flexDirection: 'row' as any,
          alignItems: 'flex-end',
          padding: 16,
          backgroundColor: 'white',
          borderTop: `1px solid ${COLORS.gray100}`,
          position: 'fixed' as any,
          bottom: 100,
          left: 0,
          right: 0,
        }}>
          <textarea
            style={{
              flex: 1,
              backgroundColor: COLORS.gray100,
              borderRadius: 25,
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 500 as any,
              marginRight: 8,
              resize: 'none' as any,
              border: 'none',
              outline: 'none',
              lineHeight: 1.4,
            }}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            maxLength={1000}
          />
          <TouchableOpacityComp
            onPress={handleSendMessage}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: (!newMessage.trim() || isLoading) ? 'rgba(192,132,252,0.5)' : COLORS.primary,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <TextComponent style={{ color: 'white', fontSize: 18, fontWeight: 900 as any }}>➤</TextComponent>
          </TouchableOpacityComp>
        </div>

        <BottomNav active="MESSAGES" onNavigate={onNavigate} user={currentUser} />
      </SafeAreaViewComp>
    );
  }

  if (showNewChat) {
    return (
      <SafeAreaViewComp style={{ flex: 1, backgroundColor: COLORS.primaryBg, paddingBottom: 100 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row' as any,
          alignItems: 'center',
          padding: '20px 16px',
          backgroundColor: COLORS.primary,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <TouchableOpacityComp onPress={() => setShowNewChat(false)} style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <TextComponent style={{ color: 'white', fontSize: 20, fontWeight: 900 as any }}>←</TextComponent>
          </TouchableOpacityComp>
          <TextComponent style={{ color: 'white', fontSize: 18, fontWeight: 900 as any, marginLeft: 12, flex: 1 }}>New Message</TextComponent>
        </div>
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          <TextComponent style={{ fontSize: 12, fontWeight: 700 as any, color: COLORS.gray500, textTransform: 'uppercase' as any, marginBottom: 16 }}>Select a contact</TextComponent>
          {availableUsers.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <TextComponent style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} >👥</TextComponent>
              <TextComponent style={{ fontSize: 12, fontWeight: 900 as any, marginBottom: 8, opacity: 0.5 }}>No users found</TextComponent>
              <TextComponent style={{ fontSize: 12, textAlign: 'center' as any, marginBottom: 24, opacity: 0.5 }}>Register more users</TextComponent>
            </View>
          ) : (
            availableUsers.map((user) => (
              <TouchableOpacityComp key={user.email} onPress={() => handleStartNewChat(user)} style={{
                display: 'flex',
                flexDirection: 'row' as any,
                backgroundColor: 'white',
                borderRadius: 16,
                border: `1px solid ${COLORS.gray100}`,
                padding: 16,
                marginBottom: 8,
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.gray100, display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <TextComponent>{getRoleIcon(user.role)}</TextComponent>
                </div>
                <div style={{ flex: 1 }}>
                  <TextComponent style={{ fontSize: 16, fontWeight: 900 as any }}>{user.name}</TextComponent>
                  <TextComponent style={{ fontSize: 11, fontWeight: 700 as any, textTransform: 'uppercase' as any, opacity: 0.7 }}>{user.role}</TextComponent>
                </div>
              </TouchableOpacityComp>
            ))
          )}
        </div>
        <BottomNav active="MESSAGES" onNavigate={onNavigate} user={currentUser} />
      </SafeAreaViewComp>
    );
  }

  return (
    <SafeAreaViewComp style={{ flex: 1, backgroundColor: COLORS.primaryBg, paddingBottom: 100 }}>
      <div style={{
        display: 'flex',
        flexDirection: 'row' as any,
        alignItems: 'center',
        padding: '20px 16px',
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <TouchableOpacityComp onPress={onBack} style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TextComponent style={{ color: 'white', fontSize: 20, fontWeight: 900 as any }}>←</TextComponent>
        </TouchableOpacityComp>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <TextComponent style={{ color: 'white', fontSize: 20, fontWeight: 900 as any, flex: 1 }}>Messages</TextComponent>
          {totalUnread > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: 10, padding: '2px 6px' }}>
              <TextComponent style={{ color: COLORS.primary, fontSize: 12, fontWeight: 900 as any }}>{totalUnread}</TextComponent>
            </div>
          )}
        </div>
        <TouchableOpacityComp onPress={() => {
          loadAvailableUsers();
          setShowNewChat(true);
        }} style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TextComponent style={{ color: 'white', fontSize: 20 }}>✏️</TextComponent>
        </TouchableOpacityComp>
      </div>
      <TextComponent style={{ padding: 16, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 500 as any }}>Your messaging hub</TextComponent>
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <TextComponent style={{ fontSize: 72, marginBottom: 24, opacity: 0.5 }} >💬</TextComponent>
            <TextComponent style={{ fontSize: 12, fontWeight: 900 as any, marginBottom: 8, opacity: 0.5 }}>No conversations</TextComponent>
            <TextComponent style={{ fontSize: 12, textAlign: 'center' as any, marginBottom: 24, opacity: 0.5 }}>Start an order or chat</TextComponent>
            <TouchableOpacityComp onPress={() => {
              loadAvailableUsers();
              setShowNewChat(true);
            }} style={{
              backgroundColor: COLORS.primary,
              borderRadius: 25,
              padding: '12px 24px',
            }}>
              <TextComponent style={{ color: 'white', fontSize: 14, fontWeight: 900 as any }}>New Chat</TextComponent>
            </TouchableOpacityComp>
          </View>
        ) : (
          conversations.map((convo) => {
            const otherUser = getOtherParticipant(convo);
            return (
              <TouchableOpacityComp key={convo.id} onPress={() => setSelectedConversation(convo)} style={{
                display: 'flex',
                flexDirection: 'row' as any,
                backgroundColor: 'white',
                borderRadius: 25,
                border: `1px solid ${COLORS.gray100}`,
                padding: 16,
                marginBottom: 12,
              }}>
                <div style={{ position: 'relative' as any }}>
                  <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.gray100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <TextComponent>{otherUser ? getRoleIcon(otherUser.role) : '💬'}</TextComponent>
                  </div>
                  {convo.unreadCount > 0 && (
                    <div style={{
                      position: 'absolute' as any,
                      top: -4,
                      right: -4,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: COLORS.primary,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <TextComponent style={{ color: 'white', fontSize: 10, fontWeight: 900 as any }}>{convo.unreadCount}</TextComponent>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, marginLeft: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <TextComponent style={{ fontSize: 16, fontWeight: 900 as any }}>{otherUser?.name || 'Unknown'}</TextComponent>
                    <TextComponent style={{ fontSize: 10, opacity: 0.7 }}>{convo.lastMessageTime ? formatTime(convo.lastMessageTime) : ''}</TextComponent>
                  </div>
                  <TextComponent style={{ fontSize: 11, fontWeight: 700 as any, textTransform: 'uppercase' as any, marginBottom: 4 }}>{otherUser?.role || 'User'}</TextComponent>
                  <TextComponent style={{ fontSize: 14, opacity: 0.7 }}>{convo.lastMessage || 'Say hello!'}</TextComponent>
                </div>
              </TouchableOpacityComp>
            );
          })
        )}
      </div>
      <BottomNav active="MESSAGES" onNavigate={onNavigate} user={currentUser} />
    </SafeAreaViewComp>
  );
};

export default Messages;

