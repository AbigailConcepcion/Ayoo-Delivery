
import React, { useState } from 'react';
import { UserRole } from '../types';
import Button from '../components/Button';
import Logo from '../components/Logo';

interface AyooManualProps {
  role: UserRole;
  onFinish: () => void;
}

const AyooManual: React.FC<AyooManualProps> = ({ role, onFinish }) => {
  const [step, setStep] = useState(0);

  const manuals: Record<UserRole, { title: string; subtitle: string; icon: string; steps: { title: string; text: string; action?: string }[] }> = {
    CUSTOMER: {
      title: "Foodie Protocol",
      subtitle: "The Master Guide for Hunger",
      icon: "🍔",
      steps: [
        { title: "Vibe Check AI", text: "Feeling Lazy? Spicy? Stressed? Use our mood buttons! Ayoo AI scans thousands of local dishes to find your perfect match instantly." },
        { title: "Squad Orders", text: "Tired of math? Start a Squad Order in the cart. Invite friends with a link and split the bill perfectly upon delivery." },
        { title: "Live Prep Cam", text: "Total transparency. Tap 'Live Cam' on a restaurant page to watch the Head Chef prepare your meal in real-time." },
        { title: "Ayoo Intercom", text: "Need to say 'No Onions'? Use the Intercom to speak directly to the kitchen via our Gemini-powered AI chef." }
      ]
    },
    MERCHANT: {
      title: "Kitchen Hub Ops",
      subtitle: "Merchant Performance Guide",
      icon: "🏪",
      steps: [
        { title: "Live Prep Stream", text: "Go to the 'Live' tab and start your broadcast. Merchants with active cams see a 40% increase in customer trust!" },
        { title: "Menu Forge", text: "Update your items in real-time. Change prices, add new seasonal dishes, and categorize your menu instantly." },
        { title: "Order Terminal", text: "Track incoming tasks. Once ready, push the order to the Market for our fleet of riders to pick up." },
        { title: "Financial Ledger", text: "View your earnings breakdown. Payouts are instant once a delivery is confirmed as 'Settled'." }
      ]
    },
    RIDER: {
      title: "Fleet Commander",
      subtitle: "Logistics Optimization",
      icon: "🛵",
      steps: [
        { title: "Task Market", text: "Browse the market for available orders in your city. Pick the ones that fit your route best." },
        { title: "Smart GPS Track", text: "Your customers see you on a high-fidelity map. Keep your app open to ensure accurate 'In Transit' signals." },
        { title: "Earnings & Tips", text: "Riders keep 100% of tips. Monitor your wallet daily and cash out anytime to your linked GCash or Maya." },
        { title: "Verification", text: "Always confirm delivery with the customer to settle the transaction and release funds to your ledger." }
      ]
    }
  };

  const currentManual = manuals[role];

  const handleNext = () => {
    if (step < currentManual.steps.length - 1) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col p-10 animate-in fade-in duration-700 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-8">
           <div className="w-24 h-24 ayoo-gradient rounded-[40px] flex items-center justify-center text-5xl mb-6 shadow-2xl mx-auto">
             {currentManual.icon}
           </div>
           <h2 className="text-3xl font-black uppercase tracking-tighter text-[#FF00CC]">{currentManual.title}</h2>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{currentManual.subtitle}</p>
        </div>

        <div className="w-full max-w-sm bg-[#161616] rounded-[50px] p-10 border border-white/5 shadow-2xl relative">
           <div className="absolute top-0 right-10 -mt-4 bg-[#FF00CC] text-white px-4 py-1 rounded-full text-[8px] font-black uppercase">
             Step {step + 1} / {currentManual.steps.length}
           </div>
           
           <h3 className="text-xl font-black mb-4 uppercase tracking-tight">{currentManual.steps[step].title}</h3>
           <p className="text-gray-400 font-bold text-sm leading-relaxed">
             {currentManual.steps[step].text}
           </p>

           <div className="flex gap-2 mt-10">
              {currentManual.steps.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i === step ? 'bg-[#FF00CC]' : 'bg-white/10'}`}></div>
              ))}
           </div>
        </div>
      </div>

      <div className="pt-10 flex flex-col gap-4">
         <Button onClick={handleNext} className="py-6 text-lg font-black uppercase tracking-widest ayoo-gradient">
           {step === currentManual.steps.length - 1 ? "Start Missions" : "Next Protocol"}
         </Button>
         <button onClick={onFinish} className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Skip Guide</button>
      </div>
    </div>
  );
};

export default AyooManual;
