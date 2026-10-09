import React from 'react';
import {
  Utensils,
  Flame,
  Soup,
  Coffee,
  Cake,
  Sandwich,
  LayoutGrid,
} from 'lucide-react';

const ICON_MAP = {
  Utensils,
  Flame,
  Soup,
  Coffee,
  Cake,
  Sandwich,
};

export const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => onSelectCategory(null)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 border ${
          selectedCategory === null
            ? 'bg-forest-900 text-ivory-50 border-forest-900 shadow-sm'
            : 'bg-white text-charcoal-700 border-ivory-300 hover:bg-ivory-200'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>All Items</span>
      </button>

      {categories.map((cat) => {
        const IconComponent = ICON_MAP[cat.iconName] || Utensils;
        const isSelected = selectedCategory === cat._id;

        return (
          <button
            key={cat._id}
            onClick={() => onSelectCategory(cat._id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 border ${
              isSelected
                ? 'bg-forest-900 text-ivory-50 border-forest-900 shadow-sm'
                : 'bg-white text-charcoal-700 border-ivory-300 hover:bg-ivory-200'
            }`}
          >
            <IconComponent className="w-4 h-4" />
            <span>{cat.name}</span>
            {cat.itemCount !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-forest-800 text-ivory-100' : 'bg-ivory-200 text-charcoal-600'
                }`}
              >
                {cat.itemCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
