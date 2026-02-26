import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  fullWidth = true,
  className = '',
  disabled = false,
  type = 'button', 
  ...props 
}) => {
  const baseStyles = "py-4 px-8 rounded-full font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center";
  
  const variants = {
    primary: "bg-[#FF00CC] text-white shadow-lg hover:brightness-110", 
    secondary: "bg-white text-[#FF00CC] shadow-md hover:bg-gray-100",
    outline: "border-2 border-[#FF00CC] text-[#FF00CC] hover:bg-pink-50",
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${fullWidth ? 'w-full' : 'w-auto'} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props} 
    >
      {children}
    </button>
  );
};

export default Button;