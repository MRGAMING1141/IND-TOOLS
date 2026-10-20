import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, ADMIN_EMAIL, isUserAdmin } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Order, OrderStatus, PackId } from '../types';
import { PACKS } from '../data/toolsData';
import { DailyOrderVolumeChart } from './DailyOrderVolumeChart';
import { SalesAnalytics } from './SalesAnalytics';
import { AdminTicketsManager } from './AdminTicketsManager';
import { UserEntitlementsManager } from './UserEntitlementsManager';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  UserCheck,
  Package,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Lock,
  ArrowRight,
  Sparkles,
  LifeBuoy,
  KeyRound,
} from 'lucide-react';

export const SalesLog: React.FC = () => {
  const { user, signIn, signOut } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'rejected'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rejectModalOrder, setRejectModalOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment reference could not be verified in bank statement.');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'orders' | 'users' | 'tickets'>('orders');
  const [chartView, setChartView] = useState<'volume' | 'revenue'>('volume');

  // Mark Order as Completed
  const handleMarkCompleted = async (order: Order) => {
    setProcessingId(order.id);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'completed',
        approvedBy: user?.email || ADMIN_EMAIL,
        updatedAt: serverTimestamp(),
      });

      // Ensure user_entitlements has the unlocked packs
      const entRef = doc(db, 'user_entitlements', order.userId);
      const entSnap = await getDoc(entRef);
      let currentPacks: PackId[] = [];
      let approvedOrders: string[] = [];

      if (entSnap.exists()) {
        const data = entSnap.data();
        currentPacks = (data.unlockedPacks || []) as PackId[];
        approvedOrders = (data.approvedOrders || []) as string[];
      }

      const newPacks = Array.from(new Set([...currentPacks, ...order.packs]));
      if (!approvedOrders.includes(order.id)) {
        approvedOrders.push(order.id);
      }

      await setDoc(
        entRef,
        {
          userId: order.userId,
          userEmail: order.userEmail,
          unlockedPacks: newPacks,
          approvedOrders,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setActionSuccess(`Order #${order.id.slice(-6)} marked as Completed!`);
      addToast({
        type: 'order-completed',
        title: `✅ Order #${order.id.slice(-6).toUpperCase()} Completed`,
        message: `Order marked Completed and confirmed in live ledger.`,
      });
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Updating Order',
        message: err.message || 'Failed to update order.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Manual Grant state
  const [grantEmail, setGrantEmail] = useState('');
  const [grantUid, setGrantUid] = useState('');
  const [grantPack, setGrantPack] = useState<PackId>('elite');
  const [granting, setGranting] = useState(false);
  const [grantMsg, setGrantMsg] = useState('');

  const isAuthorized = isUserAdmin(user?.email);

  // Real-time listener for orders
  useEffect(() => {
    if (!user || !isAuthorized) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
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
  }, [user, isAuthorized]);

  const copyText = (t: string, id: string) => {
    navigator.clipboard.writeText(t);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1-Click Approve Order & Grant Packs directly to the user
  const handleApprove = async (order: Order) => {
    if (!order.userId) {
      addToast({
        type: 'error',
        title: 'Missing User ID',
        message: 'Order does not have a valid customer User ID.',
      });
      return;
    }
    setProcessingId(order.id);
    setActionSuccess(null);

    try {
      // 1. Update Order status
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'approved',
        approvedBy: user?.email || ADMIN_EMAIL,
        updatedAt: serverTimestamp(),
      });

      // 2. Update/create user_entitlements/{userId}
      const entRef = doc(db, 'user_entitlements', order.userId);
      const entSnap = await getDoc(entRef);

      let currentPacks: PackId[] = [];
      let approvedOrders: string[] = [];

      if (entSnap.exists()) {
        const data = entSnap.data();
        currentPacks = (data.unlockedPacks || []) as PackId[];
        approvedOrders = (data.approvedOrders || []) as string[];
      }

      // Add packs from this order
      const newPacks = Array.from(new Set([...currentPacks, ...order.packs]));
      if (!approvedOrders.includes(order.id)) {
        approvedOrders.push(order.id);
      }

      await setDoc(
        entRef,
        {
          userId: order.userId,
          userEmail: order.userEmail,
          unlockedPacks: newPacks,
          approvedOrders,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setActionSuccess(`Order #${order.id.slice(-6)} approved! Packs [${order.packs.join(', ')}] unlocked for ${order.userEmail}.`);
      addToast({
        type: 'order-approved',
        title: `⚡ Order #${order.id.slice(-6).toUpperCase()} Approved`,
        message: `Unlocked [${order.packs.join(', ')}] for ${order.userEmail}. Entitlements synced.`,
      });
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error approving order:', err);
      addToast({
        type: 'error',
        title: 'Approval Error',
        message: err.message || 'Failed to approve order.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Reject Order
  const handleConfirmReject = async () => {
    if (!rejectModalOrder) return;
    setProcessingId(rejectModalOrder.id);
    try {
      const orderRef = doc(db, 'orders', rejectModalOrder.id);
      await updateDoc(orderRef, {
        status: 'rejected',
        rejectionReason: rejectReason,
        approvedBy: user?.email || ADMIN_EMAIL,
        updatedAt: serverTimestamp(),
      });
      addToast({
        type: 'order-rejected',
        title: `❌ Order #${rejectModalOrder.id.slice(-6).toUpperCase()} Rejected`,
        message: `Reason: ${rejectReason}`,
      });
      setRejectModalOrder(null);
      setActionSuccess(`Order #${rejectModalOrder.id.slice(-6)} rejected.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Rejection Error',
        message: err.message || 'Failed to reject order.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Revoke Order
  const handleRevoke = async (order: Order) => {
    setProcessingId(order.id);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'rejected',
        rejectionReason: 'Access revoked by administrator.',
        updatedAt: serverTimestamp(),
      });

      // Remove from user_entitlements
      const entRef = doc(db, 'user_entitlements', order.userId);
      const entSnap = await getDoc(entRef);
      if (entSnap.exists()) {
        const data = entSnap.data();
        const remainingPacks = (data.unlockedPacks || []).filter((p: string) => !order.packs.includes(p as any));
        const remainingOrders = (data.approvedOrders || []).filter((id: string) => id !== order.id);
        await updateDoc(entRef, {
          unlockedPacks: remainingPacks,
          approvedOrders: remainingOrders,
          updatedAt: serverTimestamp(),
        });
      }
      setActionSuccess(`Access revoked for order #${order.id.slice(-6)}.`);
      addToast({
        type: 'warning',
        title: `Access Revoked`,
        message: `Order #${order.id.slice(-6).toUpperCase()} packs revoked from user entitlements.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Revoke Error',
        message: err.message || 'Failed to revoke access.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Manual Direct Grant by Admin
  const handleManualGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUid.trim()) {
      addToast({
        type: 'error',
        title: 'Missing UID',
        message: 'Enter customer User UID (from order or Firebase Auth).',
      });
      return;
    }
    setGranting(true);
    setGrantMsg('');
    try {
      const entRef = doc(db, 'user_entitlements', grantUid.trim());
      const entSnap = await getDoc(entRef);
      let currentPacks: PackId[] = [];
      if (entSnap.exists()) {
        currentPacks = entSnap.data().unlockedPacks || [];
      }
      const newPacks = Array.from(new Set([...currentPacks, grantPack]));
      await setDoc(
        entRef,
        {
          userId: grantUid.trim(),
          userEmail: grantEmail.trim() || 'manual-grant@user',
          unlockedPacks: newPacks,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setGrantMsg(`Successfully granted ${grantPack.toUpperCase()} to ${grantEmail || grantUid}!`);
      addToast({
        type: 'success',
        title: `Manual Entitlement Granted`,
        message: `Granted ${grantPack.toUpperCase()} pack to ${grantEmail || grantUid}.`,
      });
      setGrantUid('');
      setGrantEmail('');
    } catch (err: any) {
      setGrantMsg(`Error: ${err.message}`);
      addToast({
        type: 'error',
        title: 'Grant Error',
        message: err.message || 'Failed to grant entitlement.',
      });
    } finally {
      setGranting(false);
    }
  };

  // If user is not authorized as admin
  if (!user || !isAuthorized) {
    return (
      <div className="max-w-xl mx-auto py-16 px-6 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center mb-6 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 mb-3 shadow-xs">
          Restricted Sales Log Channel
        </span>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Admin Authentication Required</h2>
        <p className="text-slate-600 text-sm leading-relaxed mb-8">
          The Sales Log channel and Order Approval system is restricted exclusively to the store administrator:
          <span className="block mt-2 font-mono text-slate-800 text-xs bg-slate-100 py-1.5 px-3.5 rounded-xl border border-slate-200 max-w-fit mx-auto shadow-xs font-semibold">
            {ADMIN_EMAIL}
          </span>
        </p>

        {user ? (
          <div className="bg-white/90 border border-slate-200 rounded-3xl p-6 max-w-md mx-auto mb-6 text-left space-y-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-800 shadow-xs">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs text-slate-500 font-medium">Currently Signed In User</span>
                <span className="block text-xs text-slate-900 font-mono font-semibold truncate">{user.email}</span>
              </div>
            </div>
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl leading-relaxed">
              This account does not have administrator privileges. Please sign in with <strong>{ADMIN_EMAIL}</strong> to access approvals and analytics.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => signOut()}
                className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer shadow-xs"
              >
                Sign Out
              </button>
              <button
                onClick={() => signIn()}
                className="flex-1 py-2.5 px-3 clay-button-primary text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Switch Account
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="px-6 py-3 rounded-xl clay-button-primary text-white font-semibold text-sm transition-colors inline-flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign in with Google ({ADMIN_EMAIL})</span>
          </button>
        )}
      </div>
    );
  }

  // Filtered orders
  const exactCompletedCount = orders.filter((o) => o.status === 'completed').length;
  const approvedCount = orders.filter((o) => o.status === 'approved').length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const rejectedCount = orders.filter((o) => o.status === 'rejected').length;
  const completedCount = exactCompletedCount > 0 ? exactCompletedCount : approvedCount;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        if (exactCompletedCount > 0) {
          if (o.status !== 'completed') return false;
        } else {
          // If no orders have been explicitly marked 'completed' yet, show approved/completed orders
          if (o.status !== 'completed' && o.status !== 'approved') return false;
        }
      } else if (o.status !== statusFilter) {
        return false;
      }
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.userEmail?.toLowerCase().includes(q) ||
      o.userName?.toLowerCase().includes(q) ||
      o.payerName?.toLowerCase().includes(q) ||
      o.utr?.toLowerCase().includes(q) ||
      o.packNames?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = orders
    .filter((o) => o.status === 'approved' || o.status === 'completed')
    .reduce((acc, o) => acc + (o.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Real-Time Sync
            </span>
            <span className="text-xs text-slate-500">Authenticated: <strong className="text-slate-800">{user?.email}</strong></span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Orders & Access Approvals</h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              addToast({
                type: 'order-updated',
                title: '⚡ Real-Time Notification Test',
                message: 'WebSocket & Firestore real-time listener is live and connected!',
              });
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold clay-button text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            title="Send a sample real-time notification alert"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Test Alert Toast</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 flex items-center justify-between animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-950 cursor-pointer font-bold">✕</button>
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 max-w-fit shadow-xs overflow-x-auto">
        <button
          onClick={() => setAdminTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'orders'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span>Orders & Revenue ({orders.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4 text-blue-300 shrink-0" />
          <span>Users & UIDs Control</span>
        </button>

        <button
          onClick={() => setAdminTab('tickets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'tickets'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LifeBuoy className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Customer Support Tickets</span>
        </button>
      </div>

      {adminTab === 'users' ? (
        <UserEntitlementsManager />
      ) : adminTab === 'tickets' ? (
        <AdminTicketsManager />
      ) : (
        <>
          {/* Analytics Sub-Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-1.5 p-1 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 text-xs shadow-xs">
              <button
                onClick={() => setChartView('volume')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  chartView === 'volume'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Daily Order Volume (30D Bar Chart)</span>
              </button>
              <button
                onClick={() => setChartView('revenue')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  chartView === 'revenue'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Revenue & Processing Trends</span>
              </button>
            </div>
          </div>

          {/* Render selected visualization */}
          {chartView === 'volume' ? (
            <DailyOrderVolumeChart orders={orders} />
          ) : (
            <SalesAnalytics orders={orders} />
          )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900 font-mono">₹{totalRevenue.toLocaleString()}</span>
          <span className="block text-[11px] text-slate-500 mt-1">Approved & completed sales</span>
        </div>

        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Orders</span>
            <Clock className={`w-4 h-4 ${pendingCount > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <span className="text-2xl font-bold text-amber-700 font-mono">{pendingCount}</span>
          <span className="block text-[11px] text-slate-500 mt-1">Awaiting approval</span>
        </div>

        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Approved Sales</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-blue-700 font-mono">{approvedCount}</span>
          <span className="block text-[11px] text-slate-500 mt-1">Active customer packs</span>
        </div>

        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Orders</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-emerald-700 font-mono">{completedCount}</span>
          <span className="block text-[11px] text-slate-500 mt-1">Fulfilled orders</span>
        </div>
      </div>

      {/* Filter and Search Bar with Status Filter Dropdown */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 glass-panel bg-white/85 p-3.5 rounded-2xl border border-slate-200/90 text-xs shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, email, UTR, payer name..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-xs"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <label htmlFor="sales-status-dropdown" className="font-semibold text-slate-700 text-xs shrink-0">
              Filter by Status:
            </label>
            <select
              id="sales-status-dropdown"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-900 font-medium focus:outline-none cursor-pointer text-xs pr-1"
            >
              <option value="all">All Orders ({orders.length})</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="approved">Approved ({approvedCount})</option>
              <option value="completed">Completed ({completedCount})</option>
              <option value="rejected">Rejected ({rejectedCount})</option>
            </select>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="hidden lg:flex items-center gap-1">
            {(['all', 'pending', 'approved', 'completed', 'rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs capitalize transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'clay-button text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          <span>Synchronizing orders from Firestore...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400">
          <Package className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="font-semibold text-slate-300 text-sm">No orders match the current filter.</p>
          <p className="text-xs text-slate-500 mt-1">When buyers checkout in the shop, their orders appear here immediately.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isProcessing = processingId === order.id;
            const dateStr = order.createdAt?.toDate
              ? order.createdAt.toDate().toLocaleString()
              : new Date(order.createdAt || Date.now()).toLocaleString();

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-white bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <button
                      onClick={() => copyText(order.id, order.id)}
                      className="text-slate-400 hover:text-white"
                      title="Copy Full Order ID"
                    >
                      {copiedId === order.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                        order.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : order.status === 'approved'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : order.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {order.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {order.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                      {order.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-400" />}
                      {order.status === 'pending' && <Clock className="w-3 h-3 text-amber-400" />}
                      <span>{order.status}</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-white font-mono">₹{order.amount}</span>
                    <span className="text-[11px] text-slate-500 block">{dateStr}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Customer</span>
                    <strong className="text-slate-200 block truncate">{order.userName || 'Customer'}</strong>
                    <span className="text-slate-400 text-[11px] font-mono truncate block">{order.userEmail}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Pack / Items</span>
                    <strong className="text-blue-400 block truncate">{order.packNames || order.packs.join(', ')}</strong>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Packs: {order.packs.join(', ')}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Payer Account</span>
                    <strong className="text-slate-200 block truncate">{order.payerName || '—'}</strong>
                    <span className="text-slate-500 text-[11px] font-mono">UTR: {order.utr || 'Not provided'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Contact / Notes</span>
                    <span className="text-slate-300 block truncate">{order.contact || 'None'}</span>
                    {order.notes && <span className="text-slate-500 text-[11px] block truncate">"{order.notes}"</span>}
                  </div>
                </div>

                {order.rejectionReason && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 text-xs text-rose-300">
                    <strong>Rejection reason:</strong> {order.rejectionReason}
                  </div>
                )}

                {/* Action Controls for Admin */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-500">
                    Customer UID: <code className="text-slate-400 font-mono">{order.userId.slice(0, 14)}...</code>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => setRejectModalOrder(order)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(order)}
                          disabled={isProcessing}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Approve & Unlock Pack</span>
                        </button>
                      </>
                    ) : order.status === 'approved' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMarkCompleted(order)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mark as Completed</span>
                        </button>
                        <button
                          onClick={() => handleRevoke(order)}
                          disabled={isProcessing}
                          className="px-3 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded text-xs transition-colors"
                        >
                          Revoke Access
                        </button>
                      </div>
                    ) : order.status === 'completed' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Order Fulfilled</span>
                        </span>
                        <button
                          onClick={() => handleRevoke(order)}
                          disabled={isProcessing}
                          className="px-3 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded text-xs transition-colors"
                        >
                          Revoke
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApprove(order)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                      >
                        Re-Approve & Unlock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Direct Grant Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Manual Direct Pack Grant</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Need to grant a pack directly to a student, partner, or custom payment without an order submission?
          Enter their Firebase User UID and assign the pack instantly.
        </p>

        <form onSubmit={handleManualGrant} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            value={grantUid}
            onChange={(e) => setGrantUid(e.target.value)}
            placeholder="Customer Firebase UID *"
            required
            className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500"
          />
          <input
            type="email"
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            placeholder="Customer Email (optional)"
            className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500"
          />
          <select
            value={grantPack}
            onChange={(e) => setGrantPack(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
          >
            {PACKS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (₹{p.price})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={granting}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-semibold py-2.5 transition-colors"
          >
            {granting ? 'Granting...' : 'Grant Access'}
          </button>
        </form>
        {grantMsg && <p className="text-xs text-emerald-400">{grantMsg}</p>}
      </div>
      </>
      )}

      {/* Reject Order Modal Dialog */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>Reject Order #{rejectModalOrder.id.slice(-6)}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              State the reason for rejecting this payment (this will be displayed to customer under their My Orders dashboard).
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setRejectModalOrder(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
