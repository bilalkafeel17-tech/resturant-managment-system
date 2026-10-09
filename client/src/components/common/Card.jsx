import React from 'react';

export const Card = ({ children, className = '', header, footer, ...props }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-ivory-300 shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-ivory-200 bg-ivory-50/50 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-3 border-t border-ivory-200 bg-ivory-50 text-sm">
          {footer}
        </div>
      )}
    </div>
  );
};
