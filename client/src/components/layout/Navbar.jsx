import React, { useState } from 'react';
import { Menu, MapPin, Radio, LogOut, ChevronDown, User, Store, CookingPot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';

export const Navbar = ({ onOpenSidebar }) => {
  const { user, restaurant, branches, activeBranch, switchBranch, logout, isAdmin } = useAuth();
  const { isConnected } = useSocket();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-ivory-300 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left side: Hamburger & Branch Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-charcoal-600 hover:text-charcoal-900 hover:bg-ivory-200 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Branch Selector Dropdown */}
        {branches && branches.length > 0 && (
          <div className="flex items-center gap-2 bg-ivory-100 px-3 py-1.5 rounded-xl border border-ivory-300">
            <MapPin className="w-4 h-4 text-terracotta-500" />
            <select
              value={activeBranch?._id || ''}
              onChange={(e) => switchBranch(e.target.value)}
              className="bg-transparent text-xs font-semibold text-charcoal-800 focus:outline-none cursor-pointer pr-1"
            >
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Realtime status, Action shortcuts, User Menu */}
      <div className="flex items-center gap-3">
        {/* Socket Status Indicator */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-ivory-200 border border-ivory-300"
          title={isConnected ? 'Real-time WebSocket Live' : 'Connecting to real-time server...'}
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[11px] text-charcoal-600 font-mono">
            {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
          </span>
        </div>

        {/* Quick Nav Action Shortcuts */}
        <Link
          to="/pos"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-900 rounded-xl text-xs font-semibold border border-forest-200 transition-colors"
        >
          <Store className="w-3.5 h-3.5 text-forest-700" />
          <span>POS</span>
        </Link>

        <Link
          to="/kitchen"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-900 rounded-xl text-xs font-semibold border border-terracotta-200 transition-colors"
        >
          <CookingPot className="w-3.5 h-3.5 text-terracotta-700" />
          <span>Kitchen</span>
        </Link>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 pl-2.5 bg-ivory-100 hover:bg-ivory-200 rounded-xl border border-ivory-300 transition-colors"
          >
            <span className="text-xs font-semibold text-charcoal-800 hidden sm:inline-block">
              {user?.name?.split(' ')[0]}
            </span>
            <div className="w-7 h-7 rounded-lg bg-forest-900 text-ivory-50 flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-charcoal-500" />
          </button>

          {userDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-ivory-300 py-2 z-20 animate-scale-up">
                <div className="px-4 py-2 border-b border-ivory-200">
                  <div className="text-xs font-bold text-charcoal-900 truncate">{user?.name}</div>
                  <div className="text-[11px] text-charcoal-500 truncate">{user?.email}</div>
                  <div className="mt-1 inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-forest-100 text-forest-800">
                    {user?.role}
                  </div>
                </div>

                {isAdmin && (
                  <Link
                    to="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-charcoal-700 hover:bg-ivory-100 hover:text-forest-900"
                  >
                    <User className="w-4 h-4 text-charcoal-400" />
                    Restaurant Settings
                  </Link>
                )}

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
