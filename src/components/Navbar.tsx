import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ADMIN_EMAIL } from '../firebase';
import { IndHubLogo } from './IndHubLogo';
import { GlobalSearchBar } from './GlobalSearchBar';
import { Tool } from '../types';
import {
  Wrench,
  ShoppingBag,
  Package,
  ShieldAlert,
  ShieldCheck,
  Menu,
  X,
  LogIn,
  LogOut,
  User as UserIcon,
  Sparkles,
  LifeBuoy,
  Bell,
  BookOpen,
  Lock,
  FileText,
  Activity,
  Search,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'tools' | 'shop' | 'sales-log' | 'wiki';
  onNavigate: (view: 'tools' | 'shop' | 'sales-log' | 'wiki') => void;
  onOpenMyOrders: () => void;
  onOpenSupportTickets: () => void;
  onOpenTool: (tool: Tool) => void;
  onFilterInDirectory?: (query: string) => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenStatus?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenMyOrders,
  onOpenSupportTickets,
  onOpenTool,
  onFilterInDirectory,
  onOpenPrivacy,
  onOpenTerms,
  onOpenStatus,
}) => {
  const { user, isAdmin, unlockedPacks, signIn, signOut } = useAuth();
  const { itemCount, openCart } = useCart();
  const { unreadCount, openHistory } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click or Escape key
  useEffect(() => {
    if (!userDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdown]);

  return (
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-slate-200/90 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 lg:gap-4">
        {/* Brand with vector IND HUB Logo */}
        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          <button
            onClick={() => onNavigate('tools')}
            className="flex items-center text-left focus:outline-none group cursor-pointer shrink-0"
          >
            <IndHubLogo size="md" subtitle="MAX SUITE" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 text-xs font-semibold shrink-0">
            <button
              onClick={() => onNavigate('tools')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'tools'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span>Tools</span>
            </button>

            <button
              onClick={() => onNavigate('shop')}
              onMouseEnter={() => { import('./Shop'); }}
              onFocus={() => { import('./Shop'); }}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'shop'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span>Shop & Packs</span>
            </button>

            <button
              onClick={() => onNavigate('wiki')}
              onMouseEnter={() => { import('./Wiki'); }}
              onFocus={() => { import('./Wiki'); }}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'wiki'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Wiki / Docs</span>
            </button>

            {/* Sales Log Channel Link (Admin only in top bar) */}
            {isAdmin && (
              <button
                onClick={() => onNavigate('sales-log')}
                onMouseEnter={() => { import('./SalesLog'); }}
                onFocus={() => { import('./SalesLog'); }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'sales-log'
                    ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Sales Log</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase shrink-0">
                  Admin
                </span>
              </button>
            )}

            {/* Ultra-wide quick access tab */}
            <button
              onClick={onOpenMyOrders}
              className="hidden 2xl:flex px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all items-center gap-1.5 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span>My Orders</span>
              {unlockedPacks.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          </nav>
        </div>

        {/* Global Search Bar (Filter tools by name or description) */}
        <div className="hidden lg:block flex-1 min-w-[150px] max-w-xs xl:max-w-sm mx-2">
          <GlobalSearchBar
            onOpenTool={onOpenTool}
            onFilterInDirectory={onFilterInDirectory}
          />
        </div>

        {/* User Account, Notifications & Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile / Tablet Search Toggle Button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className={`lg:hidden relative p-2 rounded-xl text-slate-600 hover:text-slate-900 clay-button flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
              mobileSearchOpen ? 'bg-blue-50 text-blue-700 border-blue-200' : ''
            }`}
            title="Search Tools"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Real-time Notifications Bell */}
          <button
            onClick={openHistory}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 clay-button flex items-center justify-center cursor-pointer transition-colors shrink-0"
            title="Real-Time Alerts & Notification Log"
          >
            <Bell className="w-4 h-4 shrink-0" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-mono font-bold bg-blue-600 text-white flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={openCart}
            className="relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 clay-button flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap"
            title="Open Cart"
          >
            <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-600 text-white shrink-0">
                {itemCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none clay-button border border-slate-200 shrink-0 cursor-pointer"
              >
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-lg border border-slate-200 object-cover shrink-0"
                />
                <div className="hidden 2xl:block text-left text-xs leading-tight pr-1">
                  <span className="font-semibold text-slate-900 block max-w-[110px] truncate">
                    {user.displayName || 'Developer'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {unlockedPacks.length > 0 ? `${unlockedPacks.length} packs active` : 'Free Tier'}
                  </span>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {userDropdown && (
                <div className="absolute right-0 mt-2 w-64 glass-panel bg-white/95 border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-fadeIn text-slate-700">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-900 block truncate">{user.displayName}</span>
                    <span className="text-slate-500 text-[11px] truncate block">{user.email}</span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdown(false);
                        onOpenMyOrders();
                      }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-slate-500" />
                      <span>My Orders & Unlocked Tools</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdown(false);
                        onOpenSupportTickets();
                      }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                    >
                      <LifeBuoy className="w-4 h-4 text-emerald-600" />
                      <span>Support & Help Tickets</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdown(false);
                        openHistory();
                      }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-blue-600" />
                      <div className="flex items-center justify-between flex-1">
                        <span>Real-Time Alerts Log</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-blue-600 text-white font-mono">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdown(false);
                        onNavigate('wiki');
                      }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>Wiki & Documentation</span>
                    </button>

                    {isAdmin && onOpenStatus && (
                      <button
                        onClick={() => {
                          setUserDropdown(false);
                          onOpenStatus();
                        }}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-600" />
                          <span>System Diagnostics & Status</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 font-mono font-bold">Admin</span>
                      </button>
                    )}

                    {onOpenPrivacy && (
                      <button
                        onClick={() => {
                          setUserDropdown(false);
                          onOpenPrivacy();
                        }}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-4 h-4 text-slate-500" />
                        <span>Privacy Policy</span>
                      </button>
                    )}

                    {onOpenTerms && (
                      <button
                        onClick={() => {
                          setUserDropdown(false);
                          onOpenTerms();
                        }}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>Terms of Service</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setUserDropdown(false);
                          onNavigate('sales-log');
                        }}
                        className="w-full px-4 py-2 text-left text-blue-700 hover:bg-blue-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Sales Log Admin Channel</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setUserDropdown(false);
                        signOut();
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signIn}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold text-white clay-button-primary flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all shrink-0 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign in</span>
            </button>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 clay-button focus:outline-none"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Search Overlay Bar */}
      {mobileSearchOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-2xl px-4 py-3 animate-fadeIn shadow-lg">
          <GlobalSearchBar
            onOpenTool={(tool) => {
              onOpenTool(tool);
              setMobileSearchOpen(false);
            }}
            onFilterInDirectory={(q) => {
              onFilterInDirectory?.(q);
              setMobileSearchOpen(false);
            }}
            className="w-full"
          />
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-2xl px-4 py-4 space-y-2 text-xs animate-fadeIn shadow-xl">
          {/* Quick Search in Mobile Menu */}
          <div className="pb-3 mb-2 border-b border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-2">
              Filter Utilities by Name or Description
            </div>
            <GlobalSearchBar
              onOpenTool={(tool) => {
                onOpenTool(tool);
                setMobileMenuOpen(false);
              }}
              onFilterInDirectory={(q) => {
                onFilterInDirectory?.(q);
                setMobileMenuOpen(false);
              }}
              className="w-full"
            />
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('tools');
            }}
            className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-2 text-left cursor-pointer ${
              currentView === 'tools' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Tools Directory</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('shop');
            }}
            className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-2 text-left cursor-pointer ${
              currentView === 'shop' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Shop & Packs</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('wiki');
            }}
            className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-2 text-left cursor-pointer ${
              currentView === 'wiki' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Wiki & Guides</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenMyOrders();
            }}
            className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
          >
            <Package className="w-4 h-4 text-slate-500" />
            <span>My Orders & Entitlements</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenSupportTickets();
            }}
            className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4 text-emerald-600" />
            <span>Support Tickets</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('sales-log');
              }}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-left cursor-pointer ${
                currentView === 'sales-log' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Sales Log Channel</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 font-mono font-bold">Admin</span>
            </button>
          )}

          {isAdmin && onOpenStatus && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenStatus();
              }}
              className="w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>System Status</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 font-mono font-bold">Admin</span>
            </button>
          )}

          {onOpenPrivacy && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPrivacy();
              }}
              className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Privacy Policy</span>
            </button>
          )}

          {onOpenTerms && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTerms();
              }}
              className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Terms of Service</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
