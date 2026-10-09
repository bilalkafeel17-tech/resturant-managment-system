import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  CookingPot,
  ReceiptText,
  UtensilsCrossed,
  Armchair,
  CalendarDays,
  Boxes,
  ScrollText,
  Truck,
  Receipt,
  BarChart3,
  Users,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, restaurant, isAdmin, isManager, isCashier, isKitchen } = useAuth();

  const navGroups = [
    {
      title: 'Operations',
      items: [
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'superadmin'] },
        { label: 'POS Terminal', to: '/pos', icon: Store, roles: ['admin', 'manager', 'cashier', 'superadmin'] },
        { label: 'Kitchen Display', to: '/kitchen', icon: CookingPot, roles: ['admin', 'manager', 'kitchen', 'cashier', 'superadmin'] },
        { label: 'Orders', to: '/orders', icon: ReceiptText, roles: ['admin', 'manager', 'cashier', 'superadmin'] },
      ],
    },
    {
      title: 'Floor & Menu',
      items: [
        { label: 'Tables & Floor', to: '/tables', icon: Armchair, roles: ['admin', 'manager', 'cashier', 'superadmin'] },
        { label: 'Reservations', to: '/reservations', icon: CalendarDays, roles: ['admin', 'manager', 'cashier', 'superadmin'] },
        { label: 'Menu Items', to: '/menu', icon: UtensilsCrossed, roles: ['admin', 'manager', 'superadmin'] },
      ],
    },
    {
      title: 'Inventory & Supply',
      items: [
        { label: 'Ingredients & Stock', to: '/inventory', icon: Boxes, roles: ['admin', 'manager', 'superadmin'] },
        { label: 'Recipe Book', to: '/recipes', icon: ScrollText, roles: ['admin', 'manager', 'superadmin'] },
        { label: 'Purchases & Suppliers', to: '/purchases', icon: Truck, roles: ['admin', 'manager', 'superadmin'] },
        { label: 'Expenses', to: '/expenses', icon: Receipt, roles: ['admin', 'manager', 'superadmin'] },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Reports & Analytics', to: '/reports', icon: BarChart3, roles: ['admin', 'manager', 'superadmin'] },
        { label: 'Staff & Roles', to: '/staff', icon: Users, roles: ['admin', 'superadmin'] },
        { label: 'Restaurant Settings', to: '/settings', icon: Settings, roles: ['admin', 'superadmin'] },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-forest-950 text-ivory-100 flex flex-col border-r border-forest-900 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-forest-900 bg-forest-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest-800 flex items-center justify-center border border-forest-700 shadow-inner">
              <span className="font-heading font-extrabold text-lg text-terracotta-400">S</span>
            </div>
            <div>
              <div className="font-heading font-bold text-base tracking-wide text-ivory-50 flex items-center gap-1.5">
                Servora
                <span className="text-[10px] font-semibold bg-terracotta-500/20 text-terracotta-300 px-1.5 py-0.5 rounded border border-terracotta-500/30">
                  PRO
                </span>
              </div>
              <div className="text-[11px] text-forest-300/80 truncate max-w-[130px]">
                {restaurant?.name || 'Restaurant SaaS'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-forest-400 hover:text-ivory-100 hover:bg-forest-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => {
            const filteredItems = group.items.filter(
              (item) => !user || item.roles.includes(user.role)
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.title}>
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-forest-400/70">
                  {group.title}
                </div>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                            isActive
                              ? 'bg-forest-800 text-ivory-50 border border-forest-700 shadow-sm font-semibold'
                              : 'text-forest-200/80 hover:text-ivory-100 hover:bg-forest-900/60'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 opacity-80" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer User Info */}
        <div className="p-3 border-t border-forest-900 bg-forest-950/80">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-forest-900/50 border border-forest-800/80">
            <div className="w-8 h-8 rounded-lg bg-terracotta-500/20 text-terracotta-300 font-bold flex items-center justify-center text-xs border border-terracotta-500/30">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-ivory-100 truncate">{user?.name}</div>
              <div className="text-[10px] text-forest-300 capitalize font-medium">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
