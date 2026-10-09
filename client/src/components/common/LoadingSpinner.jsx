import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ label = 'Loading...', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-forest-900 gap-3">
      <Loader2 className={`${sizeMap[size]} animate-spin text-forest-800`} />
      {label && <span className="text-xs font-medium text-charcoal-600 animate-pulse">{label}</span>}
    </div>
  );
};
