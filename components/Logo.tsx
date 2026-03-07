import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'icon' | 'full' | 'colored' | 'white';
  withSubtext?: boolean;
  showWordmark?: boolean;
}

const sizes = {
  sm: { container: 'w-16 h-16', text: 'text-3xl' },
  md: { container: 'w-24 h-24', text: 'text-5xl' },
  lg: { container: 'w-36 h-36', text: 'text-7xl' },
  xl: { container: 'w-48 h-48', text: 'text-8xl' },
  '2xl': { container: 'w-56 h-56', text: 'text-9xl' },
};

const AYOO_IMAGE_URL = 'https://d64gsuwffb70l.cloudfront.net/68eb2e4f3c019d04aff05499_1770844273557_ae970a79.jpg';

const getVariantClasses = (variant?: string) => {
  switch (variant) {
    case 'white':
      return 'bg-white/10 backdrop-blur-md';
    case 'colored':
      return 'bg-gradient-to-br from-pink-500 via-purple-500 to-pink-400';
    default:
      return 'bg-transparent';
  }
};

const getTextColor = (variant?: string) => {
  switch (variant) {
    case 'white':
      return 'text-white';
    case 'colored':
      return 'text-white drop-shadow-md';
    default:
      return 'text-white';
  }
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  withSubtext = true,
  showWordmark = true
}) => {
  const sizeConfig = sizes[size];
  const variantClass = getVariantClasses(variant);
  const textColor = getTextColor(variant);

  // For icon variant
  if (variant === 'icon') {
    return (
      <div className={`${sizeConfig.container} rounded-[30px] bg-gradient-to-br from-pink-500 via-purple-500 to-pink-400 flex items-center justify-center shadow-xl overflow-hidden`}>
        <img
          src={AYOO_IMAGE_URL}
          alt="Ayoo Icon"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Glassmorphism Icon Container */}
      <div className={`relative ${sizeConfig.container} ${variantClass} rounded-[30px] flex items-center justify-center shadow-xl overflow-hidden`}>
        <img
          src={AYOO_IMAGE_URL}
          alt="Ayoo Icon"
          className="w-full h-full object-contain drop-shadow-2xl"
        />
      </div>

      {/* Text Branding */}
      {showWordmark && (
        <h1 className={`${sizeConfig.text} ${textColor} font-black tracking-tight leading-none mt-2 drop-shadow-md`}>
          ayoo
        </h1>
      )}

      {/* Subtext / Tagline */}
      {withSubtext && (
        <p className="text-white/90 text-xs md:text-sm font-bold uppercase tracking-wider mt-2 drop-shadow-md">
          #1 Tatak Pinoy Food Delivery in the Philippines
        </p>
      )}
    </div>
  );
};

export default Logo;

