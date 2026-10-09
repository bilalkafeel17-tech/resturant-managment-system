import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button.jsx';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/70 border border-dashed border-ivory-400 rounded-2xl my-4">
      <div className="p-4 rounded-2xl bg-ivory-200 text-forest-900 border border-ivory-300 mb-3">
        <Icon className="w-8 h-8 opacity-80" />
      </div>
      <h4 className="text-base font-bold text-forest-950 font-heading">{title}</h4>
      <p className="text-xs text-charcoal-500 max-w-sm mt-1">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
