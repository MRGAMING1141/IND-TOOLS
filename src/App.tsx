/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ToastContainer } from './components/ToastContainer';
import { useRealtimeOrderWatcher } from './hooks/useRealtimeOrderWatcher';
import { Tool, PackId } from './types';
import { TOOLS } from './data/toolsData';
import { ShieldCheck } from 'lucide-react';

// Code-split major application views for accelerated initial page load
const ToolsDirectory = lazy(() =>
  import('./components/ToolsDirectory').then((m) => ({ default: m.ToolsDirectory }))
);
const Shop = lazy(() =>
  import('./components/Shop').then((m) => ({ default: m.Shop }))
);
const SalesLog = lazy(() =>
  import('./components/SalesLog').then((m) => ({ default: m.SalesLog }))
);
const Wiki = lazy(() =>
  import('./components/Wiki').then((m) => ({ default: m.Wiki }))
);

// Code-split heavy interactive modals (loaded strictly on-demand)
const ToolModal = lazy(() =>
  import('./components/ToolModal').then((m) => ({ default: m.ToolModal }))
);
const CheckoutModal = lazy(() =>
  import('./components/CheckoutModal').then((m) => ({ default: m.CheckoutModal }))
);
const MyOrdersModal = lazy(() =>
  import('./components/MyOrdersModal').then((m) => ({ default: m.MyOrdersModal }))
);
const SupportTicketsModal = lazy(() =>
  import('./components/SupportTicketsModal').then((m) => ({ default: m.SupportTicketsModal }))
);
const NotificationHistoryModal = lazy(() =>
  import('./components/NotificationHistoryModal').then((m) => ({ default: m.NotificationHistoryModal }))
);
const PrivacyPolicyModal = lazy(() =>
  import('./components/PrivacyPolicyModal').then((m) => ({ default: m.PrivacyPolicyModal }))
);
const TermsModal = lazy(() =>
  import('./components/TermsModal').then((m) => ({ default: m.TermsModal }))
);
const SystemStatusModal = lazy(() =>
  import('./components/SystemStatusModal').then((m) => ({ default: m.SystemStatusModal }))
);

// High-craft, lightweight loading indicators adhering to the zero-gradient light canvas design
const ViewLoadingFallback = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center space-y-4 animate-fadeIn">
    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-blue-600/20 border-t-blue-600 animate-spin" />
    </div>
    <div className="text-center">
      <span className="text-xs font-semibold text-slate-800 block">Loading IND HUB Workspace</span>
      <span className="text-[11px] font-mono text-slate-400">Initializing client-side engine...</span>
    </div>
  </div>
);

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col items-center gap-3">
      <div className="w-6 h-6 rounded-full border-2 border-blue-600/20 border-t-blue-600 animate-spin" />
      <span className="text-xs font-medium text-slate-700">Loading module...</span>
    </div>
  </div>
);

function AppContent() {
  const { user, isAdmin } = useAuth();
  const { isHistoryOpen, closeHistory } = useToast();

  const [currentView, setCurrentView] = useState<'tools' | 'shop' | 'sales-log' | 'wiki'>('tools');
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [checkoutConfig, setCheckoutConfig] = useState<{ packs: PackId[]; amount?: number } | null>(null);
  const [myOrdersOpen, setMyOrdersOpen] = useState(false);
  const [supportTicketsOpen, setSupportTicketsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [orderNotice, setOrderNotice] = useState<string | null>(null);
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');

  // Activate real-time Firestore listeners for sales log entries and order status changes
  useRealtimeOrderWatcher({
    onOpenSalesLog: isAdmin ? () => setCurrentView('sales-log') : undefined,
    onOpenMyOrders: () => setMyOrdersOpen(true),
  });

  // Prefetch secondary chunks during idle time for instantaneous tab switching without impacting initial LCP
  React.useEffect(() => {
    const prefetchIdleViews = () => {
      import('./components/Shop');
      import('./components/Wiki');
      if (isAdmin) {
        import('./components/SalesLog');
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(prefetchIdleViews, { timeout: 3500 });
      return () => (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(prefetchIdleViews, 2500);
      return () => clearTimeout(timer);
    }
  }, [isAdmin]);

  const handleOpenTool = (tool: Tool) => {
    setActiveTool(tool);
  };

  const handleFilterInDirectory = (query: string) => {
    setDirectorySearchQuery(query);
    setCurrentView('tools');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenToolById = (toolId: string) => {
    const t = TOOLS.find((x) => x.id === toolId);
    if (t) setActiveTool(t);
  };

  const handleOrderCompleted = (orderId: string) => {
    setCheckoutConfig(null);
    setOrderNotice(`Order #${orderId.slice(-8).toUpperCase()} recorded! Watch for real-time activation alerts.`);
    setMyOrdersOpen(true);
    setTimeout(() => setOrderNotice(null), 8000);
  };

  return (
    <div className="min-h-screen bg-light-canvas text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Light Geometric Diffused Accent (Gradient-free subtle single hue) */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[320px] bg-blue-500/[0.04] blur-[140px] pointer-events-none -z-10 rounded-full"
        aria-hidden="true"
      />

      {/* Real-time Toast Alerts Floating Stack */}
      <ToastContainer />

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(v) => {
          if (v === 'sales-log' && !isAdmin) {
            setCurrentView('tools');
            return;
          }
          setCurrentView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenTool={handleOpenTool}
        onFilterInDirectory={handleFilterInDirectory}
        onOpenMyOrders={() => setMyOrdersOpen(true)}
        onOpenSupportTickets={() => setSupportTicketsOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onOpenTerms={() => setTermsOpen(true)}
        onOpenStatus={isAdmin ? () => setStatusOpen(true) : undefined}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {orderNotice && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 animate-fadeIn">
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center justify-between glass-panel shadow-sm">
              <span className="font-semibold">{orderNotice}</span>
              <button
                onClick={() => setOrderNotice(null)}
                className="text-emerald-700 font-bold ml-2 hover:text-emerald-900 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <Suspense fallback={<ViewLoadingFallback />}>
          {currentView === 'tools' && (
            <ToolsDirectory
              onOpenTool={handleOpenTool}
              onOpenShop={() => setCurrentView('shop')}
              searchQuery={directorySearchQuery}
              onSearchChange={setDirectorySearchQuery}
            />
          )}

          {currentView === 'shop' && (
            <Shop
              onSelectPack={(packId) => setCheckoutConfig({ packs: [packId] })}
              onOpenMyOrders={() => setMyOrdersOpen(true)}
              onOpenTool={handleOpenToolById}
            />
          )}

          {currentView === 'wiki' && (
            <Wiki
              onOpenTool={handleOpenTool}
              onOpenShop={() => {
                setCurrentView('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenSupport={() => setSupportTicketsOpen(true)}
            />
          )}

          {currentView === 'sales-log' && (
            isAdmin ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <SalesLog />
              </div>
            ) : (
              <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Administrator Access Required</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The Sales Log Channel is only accessible to verified platform administrators.
                </p>
                <button
                  onClick={() => setCurrentView('tools')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Return to Tools
                </button>
              </div>
            )
          )}
        </Suspense>
      </main>

      {/* Production-Grade Multi-Column Footer */}
      <Footer
        onNavigate={(v) => {
          if (v === 'sales-log' && !isAdmin) {
            setCurrentView('tools');
            return;
          }
          setCurrentView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenMyOrders={() => setMyOrdersOpen(true)}
        onOpenSupportTickets={() => setSupportTicketsOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onOpenTerms={() => setTermsOpen(true)}
        onOpenStatus={isAdmin ? () => setStatusOpen(true) : undefined}
      />

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={(packs, totalAmount) => {
          setCheckoutConfig({ packs, amount: totalAmount });
        }}
      />

      {/* On-Demand Code-Split Modals (Lazy Loaded) */}
      <Suspense fallback={<ModalLoadingFallback />}>
        {/* Tool Execution Modal */}
        {activeTool && (
          <ToolModal
            tool={activeTool}
            onClose={() => setActiveTool(null)}
            onOpenCheckout={(packId) => {
              setActiveTool(null);
              setCheckoutConfig({ packs: [packId] });
            }}
          />
        )}

        {/* Checkout Modal (supports single pack or multi-pack cart checkout) */}
        {checkoutConfig && (
          <CheckoutModal
            packs={checkoutConfig.packs}
            amount={checkoutConfig.amount}
            onClose={() => setCheckoutConfig(null)}
            onOrderComplete={handleOrderCompleted}
          />
        )}

        {/* My Orders Modal */}
        {myOrdersOpen && (
          <MyOrdersModal
            onClose={() => setMyOrdersOpen(false)}
            onOpenShop={() => {
              setMyOrdersOpen(false);
              setCurrentView('shop');
            }}
          />
        )}

        {/* Support Tickets Modal */}
        {supportTicketsOpen && (
          <SupportTicketsModal onClose={() => setSupportTicketsOpen(false)} />
        )}

        {/* Privacy Policy Modal */}
        {privacyOpen && (
          <PrivacyPolicyModal
            onClose={() => setPrivacyOpen(false)}
            onOpenTerms={() => {
              setPrivacyOpen(false);
              setTermsOpen(true);
            }}
          />
        )}

        {/* Terms of Service Modal */}
        {termsOpen && (
          <TermsModal
            onClose={() => setTermsOpen(false)}
            onOpenPrivacy={() => {
              setTermsOpen(false);
              setPrivacyOpen(true);
            }}
            onOpenSupport={() => {
              setTermsOpen(false);
              setSupportTicketsOpen(true);
            }}
          />
        )}

        {/* System Diagnostics & Live Status Modal (Admin Only) */}
        {statusOpen && isAdmin && (
          <SystemStatusModal onClose={() => setStatusOpen(false)} />
        )}

        {/* Real-time Notification Activity History Modal */}
        {isHistoryOpen && (
          <NotificationHistoryModal
            onClose={closeHistory}
            onOpenSalesLog={isAdmin ? () => {
              closeHistory();
              setCurrentView('sales-log');
            } : undefined}
            onOpenMyOrders={() => {
              closeHistory();
              setMyOrdersOpen(true);
            }}
          />
        )}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
