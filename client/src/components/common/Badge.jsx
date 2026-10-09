import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const variantStyles = {
    default: 'bg-ivory-200 text-charcoal-700 border border-ivory-400',
    forest: 'bg-forest-100 text-forest-900 border border-forest-300 font-semibold',
    terracotta: 'bg-terracotta-100 text-terracotta-800 border border-terracotta-200',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border border-purple-200',
  };

  // Map known statuses directly
  let chosenVariant = variant;
  const lower = String(children).toLowerCase();
  if (lower === 'paid' || lower === 'completed' || lower === 'available' || lower === 'ready') {
    chosenVariant = 'success';
  } else if (lower === 'unpaid' || lower === 'pending' || lower === 'in_kitchen' || lower === 'cooking') {
    chosenVariant = 'warning';
  } else if (lower === 'cancelled' || lower === 'failed' || lower === 'out of stock') {
    chosenVariant = 'danger';
  } else if (lower === 'occupied' || lower === 'reserved') {
    chosenVariant = 'terracotta';
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles[size]} ${variantStyles[chosenVariant]} ${className}`}
    >
      {children}
    </span>
  );
};
