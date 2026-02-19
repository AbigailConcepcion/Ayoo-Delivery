
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse, Part } from "@google/genai";
import { Restaurant, AppScreen } from '../types';

interface Message {
  role: 'user' | 'model';
  parts: Part[];
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicFeedback, setMagicFeedback] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set initial greeting if history is empty
  useEffect(() => {
    if (messages.length === 0) {
      const greetingText = context === 'login help' 
        ? "Having trouble logging in? I'm here to help! 🔑" 
        : context === 'signup help'
        ? "Ready to join the Ayoo family? Let me help you set up! 📝"
        : "Hey! I'm Ayoo AI. I can find food, add it to your cart, or take you to checkout. What's the move? 🍔✨";
      
      setMessages([{ role: 'model', parts: [{ text: greetingText }] }]);
    }
  }, [context, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

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
        return "Navigation feature currently disabled.";

      case 'find_restaurants':
        if (onSelectRestaurant) {
          const match = restaurants.find(r => 
            r.name.toLowerCase().includes(args.query.toLowerCase()) ||
            r.cuisine.toLowerCase().includes(args.query.toLowerCase())
          );
          
          if (match) {
            onSelectRestaurant(match.name);
            triggerMagicFeedback(`Opening ${match.name}...`);
            return `I've opened the menu for ${match.name}.`;
          }
        }
        return `Merchant '${args.query}' not found in current sector.`;

      case 'add_food_to_cart':
        // Robust matching: Look for restaurant first
        let targetRes = restaurants.find(r => r.name.toLowerCase().includes(args.restaurantName?.toLowerCase() || ''));
        
        // If restaurant not specified, search all items for the dish name
        if (!targetRes && args.itemName) {
           for (const r of restaurants) {
              if (r.items.some(i => i.name.toLowerCase().includes(args.itemName.toLowerCase()))) {
                 targetRes = r;
                 break;
              }
           }
        }

        if (targetRes && onAddToCart) {
          const item = targetRes.items.find(i => i.name.toLowerCase().includes(args.itemName.toLowerCase()));
          if (item) {
            onAddToCart(item.id);
            triggerMagicFeedback(`Added ${item.name} to cart!`);
            return `Added ${item.name} from ${targetRes.name} to your session cart.`;
          }
        }
        return `I couldn't find "${args.itemName}" at ${args.restaurantName || 'any nearby merchant'}.`;

      default:
        return "Command sequence unknown.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    const userMessage: Message = { role: 'user', parts: [{ text: userText }] };
    const historyWithUser = [...messages, userMessage];
    setMessages(historyWithUser);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const menuContext = restaurants.map(r => 
        `${r.name}: ${r.items.map(i => i.name).join(', ')}`
      ).join('\n');
      
      const systemInstruction = `You are Ayoo Delivery Pro. Be fast, high energy, and helpful. 
      Available Menu Data:
      ${menuContext}

      Capabilities:
      - Search merchants: Use 'find_restaurants'
      - Add to cart: Use 'add_food_to_cart'
      - App Navigation: Use 'navigate_app'
      
      Instructions:
      1. Always prioritize using a tool if the user's request matches one.
      2. If a user asks to "Open [Merchant]", use 'find_restaurants'.
      3. If a user asks to go to Profile, Cart, or History, use 'navigate_app'.
      4. If you use a tool, explain briefly what happened in your final response.
      5. Use emojis. 🚀🍔✨`;

      // Initial Call
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: historyWithUser.map(m => ({ role: m.role, parts: m.parts })),
        config: {
          systemInstruction: systemInstruction,
          tools: [{ functionDeclarations: tools }],
          temperature: 0.1,
        }
      });

      let finalAITurn: Message;

      if (response.functionCalls && response.functionCalls.length > 0) {
        // Handle tool calls
        const modelTurnWithCalls: Message = {
           role: 'model',
           parts: response.functionCalls.map(fc => ({ functionCall: fc }))
        };

        const toolResultsParts: Part[] = [];
        for (const fc of response.functionCalls) {
          const result = executeFunction(fc.name, fc.args);
          toolResultsParts.push({
            functionResponse: { name: fc.name, response: { result }, id: fc.id }
          });
        }

        const userTurnWithResponses: Message = {
           role: 'user',
           parts: toolResultsParts
        };

        // Get final descriptive text from AI
        const followUpResponse: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            ...historyWithUser.map(m => ({ role: m.role, parts: m.parts })),
            { role: modelTurnWithCalls.role, parts: modelTurnWithCalls.parts },
            { role: userTurnWithResponses.role, parts: userTurnWithResponses.parts }
          ],
          config: { 
            systemInstruction,
            tools: [{ functionDeclarations: tools }]
          }
        });

        finalAITurn = { 
           role: 'model', 
           parts: [
              ...modelTurnWithCalls.parts,
              ...userTurnWithResponses.parts,
              { text: followUpResponse.text || "Action executed. What else can I help with?" }
           ] 
        };
      } else {
        // Standard text response
        finalAITurn = { role: 'model', parts: [{ text: response.text || "Understood. What's next? 🚀" }] };
      }

      setMessages(prev => [...prev, finalAITurn]);
    } catch (err) {
      console.error("AI Assistant Fault:", err);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Sync disrupted. Please retry your command. ⚡" }] }]);
    } finally {
      setLoading(false);
    }
  };

  const getMessageText = (parts: Part[]): string => {
     return parts.map(p => p.text || "").join(" ").trim();
  };

  return (
    <>
      {magicFeedback && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[500] animate-in zoom-in-95 duration-500">
           <div className="ayoo-gradient p-[2px] rounded-full shadow-[0_0_40px_rgba(255,0,204,0.4)]">
              <div className="bg-black text-white px-8 py-3 rounded-full flex items-center gap-3">
                 <span className="animate-spin text-lg">✨</span>
                 <span className="font-black text-[10px] uppercase tracking-widest">{magicFeedback}</span>
              </div>
           </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${floatingClass || 'fixed bottom-32 right-6'} w-16 h-16 ayoo-gradient rounded-full shadow-[0_15px_35px_rgba(255,0,204,0.4)] flex items-center justify-center text-3xl z-[100] active:scale-90 transition-all border-4 border-white`}
      >
        {isOpen ? '✕' : '✨'}
      </button>

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
            <button onClick={() => setIsOpen(false)} className="opacity-50 hover:opacity-100">✕</button>
          </div>

          <div ref={scrollRef} className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide bg-gray-50/30">
            {messages.map((m, i) => {
              const text = getMessageText(m.parts);
              if (!text) return null;
              
              return (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] p-4 rounded-[24px] text-sm font-bold shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-[#FF00CC] text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}>
                    {text}
                  </div>
                </div>
              );
            })}
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
              placeholder="Try: 'Open Jollibee' or 'Go to Cart'"
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
