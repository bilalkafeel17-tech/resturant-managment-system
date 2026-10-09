import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = null, // { value: '+12.5%', isPositive: true }
  variant = 'default', // 'default', 'forest', 'terracotta'
}) => {
  const iconBgStyles = {
    default: 'bg-ivory-200 text-forest-900 border border-ivory-300',
    forest: 'bg-forest-100 text-forest-800 border border-forest-200',
    terracotta: 'bg-terracotta-100 text-terracotta-700 border border-terracotta-200',
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-ivory-300 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBgStyles[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-heading text-forest-950">{value}</span>
      </div>
      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-charcoal-500">
          {trend && (
            <span
              className={`font-semibold px-1.5 py-0.5 rounded ${
                trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
