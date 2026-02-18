
import React, { useState, useRef } from 'react';
import Logo from '../components/Logo';
import Button from '../components/Button';

interface OnboardingProps {
  onFinish: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const steps = [
    {
      // Ayoo Mascot: Friendly Brown Bear
      image: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Bear.png",
      title: "Hey, I'm Ayoo!",
      description: "Your friendly neighborhood Ayoo bear is here to bring the best of Iligan to your door.",
      isMascot: true
    },
    {
      // Modern Map Navigation Visual
      image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=600",
      title: "Expanding Horizons",
      description: "We are bridging the gap between local merchants and foodies across the world.",
      isMascot: false
    },
    {
      // High-Energy Food Delivery Visual
      image: "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fit=crop&q=80&w=600",
      title: "Lightning Speed",
      description: "Hot meals, fresh snacks, and ice-cold drinks delivered in record time to your doorstep.",
      isMascot: false
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStart.current === null || touchEnd.current === null) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  return (
    <div 
      className="bg-white h-screen flex flex-col items-center justify-between p-8 relative overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="w-full flex justify-end z-20">
        <button onClick={onFinish} className="text-[#FF00CC] font-black text-lg px-2 pt-2 active:opacity-50 uppercase tracking-tighter">
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="mb-10 z-20">
          <Logo variant="colored" size="sm" withSubtext={true} />
        </div>
        
        <div className="w-full relative h-[420px] overflow-hidden">
          <div 
            className="flex transition-transform duration-500 cubic-bezier(0.23, 1, 0.32, 1) h-full"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {steps.map((s, i) => (
              <div key={i} className="min-w-full flex flex-col items-center text-center px-4">
                <div className="relative mb-8 w-64 h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gray-50/50 opacity-40 rounded-[60px] transform -rotate-2"></div>
                  <img 
                    src={s.image} 
                    className={`w-52 h-52 object-cover rounded-[44px] shadow-2xl relative z-10 ${s.isMascot ? 'animate-bounce' : 'hover:scale-105 transition-transform duration-500'}`} 
                    alt={s.title} 
                    style={s.isMascot ? { animationDuration: '3s' } : {}}
                  />
                </div>
                
                <h2 className="text-4xl font-black mb-4 text-gray-900 tracking-tighter leading-tight uppercase">
                  {s.title}
                </h2>
                <p className="text-gray-900 text-lg leading-relaxed font-semibold px-4">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 my-8 z-20">
          {steps.map((_, i) => (
            <div 
              key={i} 
              onClick={() => setStep(i)}
              className={`h-4 w-4 rounded-full cursor-pointer transition-all duration-300 ${i === step ? 'bg-[#FF00CC] w-10' : 'bg-gray-200 hover:bg-gray-300'}`} 
            />
          ))}
        </div>

        <Button 
          className="pill-shadow py-6 text-xl font-black tracking-widest uppercase active:scale-95 z-20"
          onClick={handleNext}
        >
          {step === steps.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </div>
      
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-50 rounded-full blur-[120px] opacity-60 pointer-events-none"></div>
    </div>
  );
};

export default Onboarding;
