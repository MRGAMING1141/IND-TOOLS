import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import {
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Package,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

interface MyOrdersModalProps {
  onClose: () => void;
  onOpenShop: () => void;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({ onClose, onOpenShop }) => {
  const { user, signIn, unlockedPacks } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersRef = collection(db, 'orders');
    // Query orders for this user
    const q = query(
      ordersRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const copyText = (t: string, id: string) => {
    navigator.clipboard.writeText(t);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/90">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>My Orders & Unlocked Packs</span>
            </h3>
            <span className="text-xs text-slate-500">Linked to: {user?.email || 'Guest'}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs bg-white/70">
          {!user ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-slate-600">Sign in with your Google account to view your orders and activated packs.</p>
              <button
                onClick={() => signIn()}
                className="px-5 py-2.5 clay-button-primary text-white rounded-xl font-semibold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : (
            <>
              {/* Active Entitlements Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Active Account Entitlements
                </span>
                {unlockedPacks.length === 0 ? (
                  <p className="text-slate-500 text-xs">No paid packs active yet. Browse the Shop to unlock tools.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {unlockedPacks.map((p) => (
                      <span
                        key={p}
                        className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{p.toUpperCase()} UNLOCKED</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Orders History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Order History ({orders.length})</span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenShop();
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Browse Shop</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading your orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-xs">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-semibold text-slate-800">No purchase orders found.</p>
                    <p className="text-[11px] text-slate-500 mt-1">When you place an order, it will appear here with live verification updates.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o) => {
                      const dateStr = o.createdAt?.toDate
                        ? o.createdAt.toDate().toLocaleString()
                        : new Date(o.createdAt || Date.now()).toLocaleString();

                      return (
                        <div
                          key={o.id}
                          className="bg-white border border-slate-200/90 rounded-2xl p-4.5 space-y-3 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">#{o.id.slice(-8).toUpperCase()}</span>
                              <button
                                onClick={() => copyText(o.id, o.id)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Copy ID"
                              >
                                {copiedId === o.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${
                                o.status === 'approved' || o.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : o.status === 'rejected'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {(o.status === 'approved' || o.status === 'completed') && <CheckCircle2 className="w-3 h-3" />}
                              {o.status === 'rejected' && <XCircle className="w-3 h-3" />}
                              {o.status === 'pending' && <Clock className="w-3 h-3" />}
                              <span>{o.status === 'pending' ? 'Verification Pending' : o.status}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-700">
                            <div>
                              <strong className="text-slate-900 text-xs block">{o.packNames}</strong>
                              <span className="text-[11px] text-slate-500 font-mono">UTR: {o.utr || '—'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-slate-900 font-mono">₹{o.amount}</span>
                              <span className="block text-[10px] text-slate-500">{dateStr}</span>
                            </div>
                          </div>

                          {(o.status === 'approved' || o.status === 'completed') && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-emerald-800 text-xs flex items-center justify-between">
                              <span>✓ Pack unlocked for your account. Start using any tool in this pack right away!</span>
                            </div>
                          )}

                          {o.status === 'pending' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-amber-800 text-xs">
                              ⏳ The administrator is reviewing your UTR in the Sales Log. Once approved, your tools unlock automatically.
                            </div>
                          )}

                          {o.status === 'rejected' && (
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-rose-800 text-xs">
                              ✕ Order could not be verified: {o.rejectionReason || 'Please contact administrator.'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
