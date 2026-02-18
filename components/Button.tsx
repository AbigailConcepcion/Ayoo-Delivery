
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  fullWidth = true,
  className = '',
  disabled = false
}) => {
  const baseStyles = "py-4 px-8 rounded-full font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center";
  
  const variants = {
    primary: "bg-ayoo-pink text-white shadow-lg hover:brightness-110",
    secondary: "bg-white text-ayoo-pink shadow-md hover:bg-gray-100",
    outline: "border-2 border-ayoo-pink text-ayoo-pink hover:bg-pink-50",
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${fullWidth ? 'w-full' : 'w-auto'} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
