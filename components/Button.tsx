import * as React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
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
  const baseStyles = 'flex items-center justify-center rounded-[24px] px-8 py-4 font-black tracking-[0.04em] transition-all duration-200 active:scale-95';

  const variants = {
    primary: 'bg-gradient-to-r from-purple-700 via-purple-500 to-purple-300 text-white shadow-[0_18px_34px_rgba(124,58,237,0.2)] hover:shadow-[0_22px_38px_rgba(124,58,237,0.28)]',
    secondary: 'border border-purple-100 bg-white/90 text-[#6D28D9] shadow-md hover:bg-purple-50',
    outline: 'border-2 border-purple-200 bg-transparent text-[#7C3AED] hover:bg-purple-50',
  };

  const classes = [
    baseStyles,
    variants[variant],
    fullWidth ? 'w-full' : 'w-auto',
    disabled ? 'cursor-not-allowed opacity-50' : '',
    className,
  ].join(' ');

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
