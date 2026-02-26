import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Restaurant, AppScreen } from '../types';

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

// Siguraduhin na palitan mo ito ng totoong API Key mo
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
        ? "Ayoo! May problema ba sa pag-login? Tulungan kita! 🔑" 
        : context === 'signup help'
        ? "Welcome sa Ayoo! Ready ka na ba mag-create ng account? 📝"
        : "Hey! I'm Ayoo AI. Gutom ka ba? Sabihin mo lang anong hanap mo! 🍔✨";
      
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
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const menuData = restaurants.map(r => 
        `${r.name} (${r.cuisine}): ${r.items.map(i => `${i.name} - ₱${i.price}`).join(', ')}`
      ).join('\n');

      const systemPrompt = `
        You are Ayoo Pro AI. Be friendly and use Taglish.
        Context: ${context}
        Available Menu:
        ${menuData}
        Guideline: Recommend items from the menu above. Keep it short. Use emojis.
      `;

      const chat = model.startChat({
        history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        })),
      });

      const fullPrompt = messages.length === 1 ? `${systemPrompt}\n\nUser: ${userText}` : userText;
      const result = await chat.sendMessage(fullPrompt);
      const response = await result.response;
      setMessages(prev => [...prev, { role: 'model', text: response.text() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Signal error. Try again! ⚡" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${floatingClass || 'fixed bottom-32 right-6'} w-16 h-16 ayoo-gradient rounded-full shadow-lg flex items-center justify-center text-3xl z-[100] active:scale-90 transition-all border-4 border-white`}
      >
        {isOpen ? '✕' : '✨'}
      </button>

      {isOpen && (
        <div className="fixed inset-x-6 bottom-52 bg-white rounded-[35px] shadow-2xl z-[100] border border-pink-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500 max-h-[500px]">
          <div className="bg-[#FF00CC] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-inner">🤖</div>
               <h4 className="font-black text-sm uppercase tracking-widest leading-none">Ayoo Pro AI</h4>
            </div>
            <button onClick={() => setIsOpen(false)} className="font-bold">✕</button>
          </div>

          <div ref={scrollRef} className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide bg-gray-50/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[24px] text-sm font-bold shadow-sm ${
                  m.role === 'user' ? 'bg-[#FF00CC] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-[10px] font-black text-[#FF00CC] animate-pulse">AI is thinking...</div>}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex gap-3 items-center">
            <input 
              type="text" 
              className="flex-1 bg-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} className="w-14 h-14 bg-[#FF00CC] text-white rounded-2xl flex items-center justify-center shadow-lg">🚀</button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;