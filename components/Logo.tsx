
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'white' | 'colored';
  withSubtext?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'colored', withSubtext = true }) => {
  const containerSize = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  }[size];

  const textClass = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
    xl: 'text-7xl',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${containerSize} ayoo-gradient rounded-[35%] p-[2px] flex items-center justify-center relative shadow-xl transform hover:scale-105 transition-transform duration-300`}>
        {/* Colorful Bubbles around the logo */}
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#FFD700] rounded-full border-2 border-white shadow-sm"></div>
        <div className="absolute top-4 -right-2 w-3 h-3 bg-[#00C2FF] rounded-full border border-white"></div>
        <div className="absolute -bottom-2 -left-1 w-3 h-3 bg-[#FF00CC] rounded-full border border-white"></div>
        
        <div className="bg-white rounded-[32%] w-full h-full flex items-center justify-center shadow-inner">
            <span className="text-[#FF00CC] font-black text-xl select-none tracking-tighter">ay</span>
        </div>
      </div>
      
      <div className="flex items-center mt-2">
        <h1 className={`font-black tracking-tighter leading-none ${variant === 'white' ? 'text-white' : 'text-[#FF00CC]'} ${textClass}`}>
          ayoo
        </h1>
        {withSubtext && size === 'sm' && (
          <div className="ml-2 flex flex-col text-left">
            <span className={`text-[10px] font-bold leading-none ${variant === 'white' ? 'text-white/90' : 'text-pink-400'}`}>Ayoo MyFind</span>
            <span className={`text-[10px] font-medium leading-none ${variant === 'white' ? 'text-white/70' : 'text-gray-400'}`}>and More</span>
          </div>
        )}
      </div>
      
      {withSubtext && size !== 'sm' && (
        <p className={`text-[10px] mt-1 font-bold tracking-widest uppercase ${variant === 'white' ? 'text-white/80' : 'text-gray-400'}`}>
          Food. Delivery. Services.
        </p>
      )}
    </div>
  );
};

export default Logo;
