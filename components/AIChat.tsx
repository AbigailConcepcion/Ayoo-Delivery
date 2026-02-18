
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Restaurant, AppScreen } from '../types';

interface AIChatProps {
  context?: 'login help' | 'signup help' | 'general';
  floatingClass?: string;
  restaurants?: Restaurant[];
  onAddToCart?: (itemId: string) => void;
  onSelectRestaurant?: (name: string) => boolean;
  onNavigate?: (screen: AppScreen) => void;
}

const AIChat: React.FC<AIChatProps> = ({ 
  context = 'general', 
  floatingClass,
  restaurants = [],
  onAddToCart,
  onSelectRestaurant,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicFeedback, setMagicFeedback] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const greeting = context === 'login help' 
      ? "Having trouble logging in? I'm here to help! 🔑" 
      : context === 'signup help'
      ? "Ready to join the Ayoo family? Let me help you set up! 📝"
      : "Hey! I'm Ayoo AI. I can find food, add it to your cart, or take you to checkout. What's the move? 🍔✨";
    
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

  // Define tools for Gemini
  const tools: FunctionDeclaration[] = [
    {
      name: 'find_restaurants',
      parameters: {
        type: Type.OBJECT,
        description: 'Finds restaurants based on cuisine or name.',
        properties: {
          query: { type: Type.STRING, description: 'The cuisine or name to search for.' }
        },
        required: ['query']
      }
    },
    {
      name: 'add_food_to_cart',
      parameters: {
        type: Type.OBJECT,
        description: 'Adds a specific food item from a specific restaurant to the cart.',
        properties: {
          itemName: { type: Type.STRING, description: 'The name of the food item.' },
          restaurantName: { type: Type.STRING, description: 'The name of the restaurant.' }
        },
        required: ['itemName', 'restaurantName']
      }
    },
    {
      name: 'navigate_app',
      parameters: {
        type: Type.OBJECT,
        description: 'Moves the user to a different screen in the app.',
        properties: {
          screen: { 
            type: Type.STRING, 
            description: 'The target screen.',
            enum: ['HOME', 'CART', 'VOUCHERS', 'HISTORY', 'PROFILE']
          }
        },
        required: ['screen']
      }
    }
  ];

  const triggerMagicFeedback = (msg: string) => {
    setMagicFeedback(msg);
    setTimeout(() => setMagicFeedback(null), 3000);
  };

  const executeFunction = (name: string, args: any): string => {
    switch (name) {
      case 'navigate_app':
        if (onNavigate) {
          onNavigate(args.screen as AppScreen);
          triggerMagicFeedback(`Navigating to ${args.screen}...`);
          return `Successfully navigated to ${args.screen}.`;
        }
        return "Navigation failed.";

      case 'find_restaurants':
        if (onSelectRestaurant) {
          const success = onSelectRestaurant(args.query);
          if (success) {
            triggerMagicFeedback(`Opening ${args.query}...`);
            return `I've opened ${args.query} for you!`;
          }
        }
        return `I couldn't find a merchant named ${args.query}.`;

      case 'add_food_to_cart':
        const res = restaurants.find(r => r.name.toLowerCase().includes(args.restaurantName.toLowerCase()));
        if (res && onAddToCart) {
          const item = res.items.find(i => i.name.toLowerCase().includes(args.itemName.toLowerCase()));
          if (item) {
            onAddToCart(item.id);
            triggerMagicFeedback(`Added ${item.name} to cart!`);
            return `Successfully added ${item.name} from ${res.name} to your cart.`;
          }
        }
        return `Could not find ${args.itemName} at ${args.restaurantName}.`;

      default:
        return "Command not supported yet.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const menuContext = restaurants.map(r => 
        `${r.name}: ${r.items.map(i => i.name).join(', ')}`
      ).join('\n');
      
      const systemInstruction = `You are Ayoo Delivery Pro. You have powers! 
      Available Menu:
      ${menuContext}

      Use your tools to HELP the user. If they want food, use find_restaurants or add_food_to_cart. 
      If they want to pay or see history, use navigate_app.
      Be extremely high energy and fast.`;

      const contents = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          tools: [{ functionDeclarations: tools }],
          temperature: 0.2, // Lower temperature for more reliable tool calling
        }
      });

      let aiResponseText = response.text || "";

      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          const result = executeFunction(fc.name, fc.args);
          // Send tool result back to model for a conversational confirmation
          const followUp = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
              ...contents,
              { role: 'model', parts: [{ functionCall: fc }] },
              { role: 'user', parts: [{ functionResponse: { name: fc.name, response: { result } } }] }
            ],
            config: { systemInstruction }
          });
          aiResponseText = followUp.text || "Done! What's next?";
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: aiResponseText || "I've handled that for you! 🚀" }]);
    } catch (err) {
      console.error("AI Action Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: "Ayoo Cloud is lagging, but I'm still here! Try again? ⚡" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {magicFeedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in zoom-in-95 duration-500">
           <div className="ayoo-gradient p-[2px] rounded-full shadow-[0_0_40px_rgba(255,0,204,0.4)]">
              <div className="bg-black text-white px-8 py-3 rounded-full flex items-center gap-3">
                 <span className="animate-spin text-lg">✨</span>
                 <span className="font-black text-[10px] uppercase tracking-widest">{magicFeedback}</span>
              </div>
           </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${floatingClass || 'fixed bottom-32 right-6'} w-16 h-16 ayoo-gradient rounded-full shadow-[0_15px_35px_rgba(255,0,204,0.4)] flex items-center justify-center text-3xl z-[100] active:scale-90 transition-all border-4 border-white`}
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
                  <h4 className="font-black text-sm uppercase tracking-widest leading-none">Ayoo Pro AI</h4>
                  <p className="text-[10px] font-bold opacity-80 mt-1">Ready for Action</p>
               </div>
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
              placeholder="Try: 'Find pizza' or 'Add fries'"
              className="flex-1 bg-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF00CC]/20 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-14 h-14 bg-[#FF00CC] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50"
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
