import React from 'react';
import { IndHubLogo } from './IndHubLogo';
import {
  ShieldCheck,
  LifeBuoy,
  BookOpen,
  ShoppingBag,
  FileText,
  Lock,
  Activity,
  Package,
  Wrench,
  Sparkles,
  ExternalLink,
  Heart,
} from 'lucide-react';
import { ADMIN_EMAIL } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface FooterProps {
  onNavigate: (view: 'tools' | 'shop' | 'sales-log' | 'wiki') => void;
  onOpenMyOrders: () => void;
  onOpenSupportTickets: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenStatus?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenMyOrders,
  onOpenSupportTickets,
  onOpenPrivacy,
  onOpenTerms,
  onOpenStatus,
}) => {
  const { isAdmin } = useAuth();
  return (
    <footer className="border-t border-white/[0.08] bg-slate-950/70 backdrop-blur-xl mt-20 text-xs text-slate-400 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={() => onNavigate('tools')}
              className="text-left cursor-pointer"
            >
              <IndHubLogo size="md" subtitle="MAX SUITE" />
            </button>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Fast, privacy-focused browser developer workstation for software engineers, Roblox architects, creators, and competitive gamers. Built with zero-telemetry, client-side WebAssembly execution.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px]">
              <span className="text-emerald-400 font-medium">Zero Tool Telemetry</span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="text-slate-300">Elite Lifetime ₹299</span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="text-slate-500">Pure Client-Side Execution</span>
            </div>
          </div>

          {/* Column 2: Suite & Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Suite & Tools
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('tools')}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Wrench className="w-3 h-3 text-slate-500" />
                  <span>Tools Directory</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3 h-3 text-slate-500" />
                  <span>Pricing & Packs</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-purple-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Elite Lifetime (₹299)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenMyOrders}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Package className="w-3 h-3 text-slate-500" />
                  <span>My Orders & Access</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Documentation & Wiki */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Documentation
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('wiki')}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-left flex items-center gap-1.5 font-medium text-slate-300"
                >
                  <BookOpen className="w-3 h-3 text-blue-400" />
                  <span>Official Wiki & Guides</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('wiki')}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left"
                >
                  Luau VM Obfuscator Manual
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('wiki')}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left"
                >
                  API & Webhook Tester Spec
                </button>
              </li>
              {isAdmin && onOpenStatus && (
                <li>
                  <button
                    onClick={onOpenStatus}
                    className="hover:text-emerald-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>System Diagnostics</span>
                    <span className="px-1 py-0.2 rounded text-[9px] bg-blue-900/60 text-blue-300 font-mono">Admin</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Trust & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Support & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onOpenSupportTickets}
                  className="hover:text-emerald-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <LifeBuoy className="w-3 h-3 text-emerald-400" />
                  <span>Support Tickets</span>
                </button>
              </li>
              {isAdmin && (
                <li>
                  <button
                    onClick={() => onNavigate('sales-log')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    <span>Sales Log Channel</span>
                    <span className="px-1 py-0.2 rounded text-[9px] bg-blue-900/60 text-blue-300 font-mono">Admin</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={onOpenPrivacy}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTerms}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <FileText className="w-3 h-3 text-slate-500" />
                  <span>Terms of Service</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* System Status Indicator Pill - Interactive for Admin, Informational for Normal Users */}
            {isAdmin && onOpenStatus ? (
              <button
                onClick={onOpenStatus}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all cursor-pointer clay-button"
                title="Click to view live network & service diagnostics (Admin)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational</span>
                <span className="text-[10px] text-blue-400 font-mono">Admin Diagnostics</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/80 border border-slate-800/80 text-slate-400 select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>All Systems Operational</span>
                <span className="text-[10px] text-slate-500 font-mono">v3.5.0</span>
              </div>
            )}

            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">
              Supervised by {ADMIN_EMAIL}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={onOpenTerms}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate('wiki')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Wiki
            </button>
            <span>•</span>
            <span>© 2026 IND HUB</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
