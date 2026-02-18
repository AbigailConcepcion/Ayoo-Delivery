
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MOCK_RESTAURANTS } from '../constants';

interface AIChatProps {
  context?: 'login help' | 'signup help' | 'general';
  floatingClass?: string;
}

const AIChat: React.FC<AIChatProps> = ({ context = 'general', floatingClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting based on context
    const greeting = context === 'login help' 
      ? "Having trouble logging in? I'm here to help! 🔑" 
      : context === 'signup help'
      ? "Ready to join the Ayoo family? Let me help you set up! 📝"
      : "Hey! I'm Ayoo AI. What are you craving in Iligan today? 🍔✨";
    
    setMessages([{ role: 'model', text: greeting }]);
  }, [context]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const restaurantContext = MOCK_RESTAURANTS.map(r => `${r.name} (${r.cuisine})`).join(', ');
      
      const systemInstruction = context === 'login help' 
        ? "You are Ayoo Assistant. Help the user log in. If they forgot their password, tell them to use the 'Forgot?' link. Be supportive and concise."
        : context === 'signup help'
        ? "You are Ayoo Assistant. Help the user sign up. Mention they get 500 bonus points for joining. Be excited and helpful."
        : `You are Ayoo Delivery Assistant for Iligan City. Be high-energy and friendly. Available merchants: ${restaurantContext}. Recommend local favorites like Jollibee, Tatay's Grill, or Cheding's Peanuts. Keep responses under 40 words.`;

      // Convert history to API format
      const contents = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const aiText = response.text || "I'm having a quick digital snack... try asking again! 🍩";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: "Oops! My brain froze. Check your internet or try again in a bit! ❄️" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${floatingClass || 'fixed bottom-32 right-6'} w-16 h-16 ayoo-gradient rounded-full shadow-[0_15px_35px_rgba(255,0,204,0.4)] flex items-center justify-center text-3xl z-[100] active:scale-90 transition-all border-4 border-white`}
        aria-label="Open AI Chat"
      >
        {isOpen ? '✕' : '✨'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-x-6 bottom-52 bg-white rounded-[35px] shadow-[0_30px_90px_rgba(0,0,0,0.3)] z-[100] border border-pink-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500 max-h-[500px]">
          <div className="bg-[#FF00CC] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-inner">🤖</div>
               <div>
                  <h4 className="font-black text-sm uppercase tracking-widest leading-none">Ayoo AI</h4>
                  <p className="text-[10px] font-bold opacity-80 mt-1">
                    {context === 'general' ? 'Iligan Food Guide' : 'Account Assistant'}
                  </p>
               </div>
            </div>
            <div className="flex gap-2">
               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide bg-gray-50/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] p-4 rounded-[24px] text-sm font-bold shadow-sm ${
                  m.role === 'user' 
                  ? 'bg-[#FF00CC] text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-[24px] rounded-tl-none border border-gray-100 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-[#FF00CC] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#FF00CC] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#FF00CC] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex gap-3 items-center">
            <input 
              type="text" 
              placeholder="Ask anything..."
              className="flex-1 bg-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF00CC]/20 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-14 h-14 bg-[#FF00CC] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50 transition-all"
            >
              🚀
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
