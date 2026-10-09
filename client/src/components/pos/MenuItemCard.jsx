import React from 'react';
import { Plus, Utensils, Sparkles } from 'lucide-react';

export const MenuItemCard = ({ item, currencySymbol = 'Rs.', onAddToCart }) => {
  const hasVariants = item.variants && item.variants.length > 0;
  const hasAddOns = item.addOns && item.addOns.length > 0;

  return (
    <div
      onClick={() => onAddToCart(item)}
      className={`group relative bg-white rounded-2xl border border-ivory-300 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        !item.isAvailable ? 'opacity-60 grayscale-[50%] pointer-events-none' : 'active:scale-[0.98]'
      }`}
    >
      {/* Item Image / Fallback Container */}
      <div className="relative h-32 w-full bg-ivory-200 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        <div
          className={`w-full h-full flex items-center justify-center bg-ivory-200 text-forest-900 ${
            item.imageUrl ? 'hidden' : 'flex'
          }`}
        >
          <Utensils className="w-8 h-8 opacity-40" />
        </div>

        {/* Featured Ribbon */}
        {item.isFeatured && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-terracotta-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3" />
            <span>Chef's Choice</span>
          </div>
        )}

        {/* Out of stock badge */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-charcoal-950/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-forest-950 line-clamp-1 group-hover:text-forest-800 transition-colors">
            {item.name}
          </h4>
          {item.description && (
            <p className="text-[11px] text-charcoal-500 line-clamp-2 mt-0.5 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between pt-2 border-t border-ivory-200">
          <div>
            <span className="text-xs sm:text-sm font-bold font-mono text-forest-900">
              {currencySymbol} {item.basePrice.toLocaleString()}
            </span>
            {(hasVariants || hasAddOns) && (
              <span className="block text-[9px] text-terracotta-600 font-semibold">
                Customizable
              </span>
            )}
          </div>

          <button
            type="button"
            className="w-7 h-7 rounded-xl bg-forest-900 text-ivory-50 flex items-center justify-center group-hover:bg-forest-950 group-hover:scale-105 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
