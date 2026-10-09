import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // 'primary', 'secondary', 'terracotta', 'danger', 'outline', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  loading = false,
  disabled = false,
  className = '',
  icon: Icon = null,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-forest-900 hover:bg-forest-950 text-ivory-50 shadow-sm focus:ring-forest-800',
    secondary: 'bg-ivory-200 hover:bg-ivory-300 text-charcoal-800 border border-ivory-400 focus:ring-ivory-400',
    terracotta: 'bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-sm focus:ring-terracotta-400',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white shadow-sm focus:ring-rose-500',
    outline: 'border border-forest-800 text-forest-900 hover:bg-forest-50 focus:ring-forest-800',
    ghost: 'text-charcoal-700 hover:bg-ivory-200 focus:ring-charcoal-300',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};
