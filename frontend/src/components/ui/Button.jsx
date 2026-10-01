import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow active:scale-[0.99] focus:ring-blue-500',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium active:scale-[0.99] focus:ring-slate-400',
  outline:
    'border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium active:scale-[0.99] focus:ring-slate-400',
  danger:
    'bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm active:scale-[0.99] focus:ring-red-500',
  ghost:
    'hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-medium focus:ring-slate-300',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-lg',
};

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};