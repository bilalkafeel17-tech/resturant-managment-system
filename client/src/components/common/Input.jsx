import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`block w-full rounded-xl border bg-white text-charcoal-900 placeholder-charcoal-400 text-sm transition-colors
              ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5
              ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-ivory-400 focus:border-forest-700 focus:ring-forest-100'}
              focus:outline-none focus:ring-2 ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-charcoal-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
