import React from 'react';
import { COLORS, SHADOWS } from '../constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  isLoading = false,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) => {
  const baseStyles = "font-semibold transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const sizeStyles = {
    sm: "py-2 px-4 text-sm rounded-xl",
    md: "py-3.5 px-6 text-base rounded-2xl",
    lg: "py-4 px-8 text-lg rounded-2xl",
  };

  // Use inline styles for gradients
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
          color: 'white',
          boxShadow: SHADOWS.button,
        };
      case 'secondary':
        return {
          background: 'white',
          color: COLORS.primary,
          border: `2px solid ${COLORS.primary}`,
        };
      case 'outline':
        return {
          background: 'transparent',
          color: COLORS.primary,
          border: `2px solid ${COLORS.primary}`,
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: COLORS.gray600,
        };
      case 'danger':
        return {
          background: COLORS.error,
          color: 'white',
        };
      default:
        return {};
    }
  };

  const getHoverStyles = (): React.CSSProperties => {
    if (variant === 'primary') {
      return { boxShadow: SHADOWS.pink };
    }
    if (variant === 'secondary' || variant === 'outline') {
      return { backgroundColor: COLORS.primaryBg };
    }
    if (variant === 'ghost') {
      return { backgroundColor: COLORS.gray100, color: COLORS.gray800 };
    }
    return {};
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${fullWidth ? 'w-full' : 'w-auto'} ${className}`}
      style={{
        ...getVariantStyles(),
        borderRadius: size === 'sm' ? '12px' : '16px',
      }}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};

export default Button;
