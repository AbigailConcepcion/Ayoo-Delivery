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

// ⚠️ PAALALA: Ilagay dito ang iyong totoong API Key mula sa Google AI Studio
const API_KEY = "YOUR_GOOGLE_AI_API_KEY"; 

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
        ? "Ayoo! Having trouble logging in? I'm here to help! 🔑" 
        : context === 'signup help'
        ? "Welcome to Ayoo! Ready to create your account? 📝"
        : "Hi! I'm your Ayoo Assistant. What are you craving today? 🍔✨";
      
      setMessages([{ role: 'model', text: greeting }]);
    }
  }, [context]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading || API_KEY === "YOUR_GOOGLE_AI_API_KEY") return;

    const userText = input;
    setInput('');
    const updatedMessages: Message[] = [...messages, { role: 'user', text: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are the Ayoo Concierge, a helpful assistant for the Ayoo Delivery App in Iligan City. 
        Current Context: ${context}
        Available Menu:
        ${restaurants.map(r => `${r.name}: ${r.items.map(i => i.name).join(', ')}`).join('\n')}
        
        Rules:
        1. Be professional yet friendly (Taglish is okay).
        2. Help users find food or navigate the app.
        3. Keep responses concise and under 3 sentences.
        4. Use emojis for a modern feel.`
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
      const text = response.text();
      
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (err) {
      console.error("AI Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: "Service temporarily unavailable. Please try again later. ⚡" }]);
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