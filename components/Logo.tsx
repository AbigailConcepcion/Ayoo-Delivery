import React from 'react';
import { COLORS, IMAGES } from '../constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'white' | 'colored' | 'image';
  withSubtext?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'colored', withSubtext = true }) => {
  const dimensions = {
    sm: { container: 'w-12 h-12', text: 'text-xl', imgW: 48 },
    md: { container: 'w-20 h-20', text: 'text-3xl', imgW: 80 },
    lg: { container: 'w-32 h-32', text: 'text-5xl', imgW: 128 },
    xl: { container: 'w-48 h-48', text: 'text-7xl', imgW: 192 },
  }[size];

  // Primary style base sa bagong #FF1493
  const primaryColor = variant === 'white' ? COLORS.white : COLORS.primary;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative group transition-transform duration-300 hover:scale-105`}>
        
        {/* Actual Image Logo Option */}
        <div className={`${dimensions.container} overflow-hidden rounded-[30%] shadow-lg border-2 border-white`}>
          <img 
            src={IMAGES.logoPink} 
            alt="Ayoo Logo" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Decorative Bubbles gamit ang bagong Secondary/Accent colors */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFD700] rounded-full border-2 border-white shadow-sm animate-bounce"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#7B2FF7] rounded-full border border-white"></div>
      </div>
      
      <div className="flex flex-col items-center mt-3">
        <h1 
          className="font-black tracking-tighter leading-none italic"
          style={{ 
            color: primaryColor, 
            fontSize: dimensions.text === 'text-xl' ? '1.25rem' : 
                      dimensions.text === 'text-3xl' ? '2rem' : '3.5rem' 
          }}
        >
          ayoo
        </h1>
        
        {withSubtext && (
          <p 
            className="mt-1 font-bold tracking-[0.2em] uppercase"
            style={{ 
                color: variant === 'white' ? 'rgba(255,255,255,0.8)' : COLORS.gray500,
                fontSize: size === 'sm' ? '8px' : '10px'
            }}
          >
            Food • Delivery • More
          </p>
        )}
      </div>
    </div>
  );
};

export default Logo;