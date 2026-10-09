import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button.jsx';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-3xl bg-ivory-200 border border-ivory-300 text-forest-900 mb-4 shadow-sm">
        <UtensilsCrossed className="w-12 h-12 text-terracotta-500" />
      </div>
      <h1 className="text-4xl font-extrabold font-heading text-forest-950">404</h1>
      <h2 className="text-lg font-bold font-heading text-charcoal-800 mt-1">
        Page Not Found
      </h2>
      <p className="text-xs text-charcoal-500 max-w-sm mt-2">
        The requested screen does not exist or you do not have permission to view it.
      </p>

      <div className="mt-6">
        <Link to="/dashboard">
          <Button icon={ArrowLeft}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};
