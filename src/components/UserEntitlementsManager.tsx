import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isUserAdmin } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PackId, UserEntitlement, UserProfile } from '../types';
import { PACKS } from '../data/toolsData';
import { generateSpecialUid, formatRelativeTime } from '../utils/uidHelper';
import {
  UserCheck,
  Search,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  PlusCircle,
  Clock,
  Package,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Users,
  KeyRound,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface ManagedUser {
  uid: string;
  specialUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  lastLoginAt?: any;
  lastLoginMillis?: number;
  unlockedPacks: PackId[];
  totalOrdersCount: number;
  totalSpent: number;
}

interface UserEntitlementsManagerProps {
  initialSearchUid?: string;
}

export const UserEntitlementsManager: React.FC<UserEntitlementsManagerProps> = ({
  initialSearchUid = '',
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [inputQuery, setInputQuery] = useState(initialSearchUid);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [recentUsers, setRecentUsers] = useState<ManagedUser[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchRecentUsers = async () => {
    setRecentLoading(true);
    try {
      const usersRef = collection(db, 'users');
      let q = query(usersRef, orderBy('lastLoginAt', 'desc'), limit(15));
      let snapshot = await getDocs(q);

      if (snapshot.empty) {
        q = query(usersRef, limit(15));
        snapshot = await getDocs(q);
      }

      const list: ManagedUser[] = [];
      for (const d of snapshot.docs) {
        const uData = d.data();
        const uid = d.id;
        const specialUid = uData.specialUid || generateSpecialUid(uid);

        const entSnap = await getDoc(doc(db, 'user_entitlements', uid));
        const entData = entSnap.exists() ? entSnap.data() : null;

        list.push({
          uid,
          specialUid,
          email: uData.email || 'No email',
          displayName: uData.displayName || 'IND HUB Member',
          photoURL: uData.photoURL,
          lastLoginAt: uData.lastLoginAt,
          lastLoginMillis: uData.lastLoginMillis,
          unlockedPacks: (entData?.unlockedPacks || []) as PackId[],
          totalOrdersCount: 0,
          totalSpent: 0,
        });
      }

      setRecentUsers(list);
    } catch (err: any) {
      console.warn('Could not load recent users:', err);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentUsers();
  }, []);

  useEffect(() => {
    if (initialSearchUid) {
      setInputQuery(initialSearchUid);
      lookupUser(initialSearchUid);
    }
  }, [initialSearchUid]);

  const lookupUser = async (rawQuery: string) => {
    const qStr = rawQuery.trim();
    if (!qStr) {
      setFeedback({ type: 'error', message: 'Please paste a Special UID, Firebase UID, or user email address.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      let resolvedUid: string | null = null;
      let userData: any = null;

      const directDocRef = doc(db, 'users', qStr);
      const directDoc = await getDoc(directDocRef);
      if (directDoc.exists()) {
        resolvedUid = directDoc.id;
        userData = directDoc.data();
      }

      if (!resolvedUid) {
        const usersRef = collection(db, 'users');
        const qSpecial = query(usersRef, where('specialUid', '==', qStr.toUpperCase()));
        const snapSpecial = await getDocs(qSpecial);
        if (!snapSpecial.empty) {
          const docItem = snapSpecial.docs[0];
          resolvedUid = docItem.id;
          userData = docItem.data();
        } else {
          const qEmail = query(usersRef, where('email', '==', qStr.toLowerCase()));
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            const docItem = snapEmail.docs[0];
            resolvedUid = docItem.id;
            userData = docItem.data();
          }
        }
      }

      if (!resolvedUid) {
        const ordersRef = collection(db, 'orders');
        const qOrderUid = query(ordersRef, where('userId', '==', qStr), limit(1));
        const snapOrderUid = await getDocs(qOrderUid);
        if (!snapOrderUid.empty) {
          const ord = snapOrderUid.docs[0].data();
          resolvedUid = ord.userId;
          userData = {
            uid: ord.userId,
            email: ord.userEmail,
            displayName: ord.userName || ord.payerName,
          };
        } else {
          const qOrderEmail = query(ordersRef, where('userEmail', '==', qStr.toLowerCase()), limit(1));
          const snapOrderEmail = await getDocs(qOrderEmail);
          if (!snapOrderEmail.empty) {
            const ord = snapOrderEmail.docs[0].data();
            resolvedUid = ord.userId;
            userData = {
              uid: ord.userId,
              email: ord.userEmail,
              displayName: ord.userName || ord.payerName,
            };
          }
        }
      }

      if (!resolvedUid) {
        const entDirectRef = doc(db, 'user_entitlements', qStr);
        const entDirectSnap = await getDoc(entDirectRef);
        if (entDirectSnap.exists()) {
          resolvedUid = entDirectSnap.id;
          const ed = entDirectSnap.data();
          userData = {
            uid: resolvedUid,
            email: ed.userEmail || 'unknown@user',
            displayName: 'IND HUB Member',
          };
        }
      }

      if (!resolvedUid && /^[a-zA-Z0-9_\-]{15,128}$/.test(qStr)) {
        resolvedUid = qStr;
        userData = {
          uid: qStr,
          email: 'unknown-auth-user',
          displayName: 'Firebase User',
        };
      }

      if (!resolvedUid) {
        setFeedback({
          type: 'error',
          message: `No user found matching "${qStr}". Verify the UID or email.`,
        });
        setSelectedUser(null);
        setLoading(false);
        return;
      }

      const entRef = doc(db, 'user_entitlements', resolvedUid);
      const entSnap = await getDoc(entRef);
      const entData = entSnap.exists() ? entSnap.data() : null;
      const unlockedPacks = (entData?.unlockedPacks || []) as PackId[];

      const ordersRef = collection(db, 'orders');
      const orderQuery = query(ordersRef, where('userId', '==', resolvedUid));
      const orderSnap = await getDocs(orderQuery);
      let totalSpent = 0;
      orderSnap.forEach((od) => {
        const d = od.data();
        if (d.status === 'completed' || d.status === 'approved') {
          totalSpent += Number(d.amount || 0);
        }
      });

      const specialUid = userData?.specialUid || generateSpecialUid(resolvedUid);

      setSelectedUser({
        uid: resolvedUid,
        specialUid,
        email: userData?.email || 'Unknown',
        displayName: userData?.displayName || 'IND HUB Member',
        photoURL: userData?.photoURL,
        lastLoginAt: userData?.lastLoginAt,
        lastLoginMillis: userData?.lastLoginMillis,
        unlockedPacks,
        totalOrdersCount: orderSnap.size,
        totalSpent,
      });

      setFeedback({
        type: 'success',
        message: `Loaded profile for ${userData?.displayName || userData?.email || specialUid}`,
      });
    } catch (err: any) {
      console.error('Error looking up user:', err);
      handleFirestoreError(err, OperationType.GET, 'users');
      setFeedback({ type: 'error', message: err.message || 'Error looking up user' });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPack = async (packId: PackId) => {
    if (!selectedUser) return;
    setActionInProgress(`grant-${packId}`);
    try {
      const entRef = doc(db, 'user_entitlements', selectedUser.uid);
      const currentPacks = selectedUser.unlockedPacks;
      const updatedPacks = Array.from(new Set([...currentPacks, packId]));

      await setDoc(
        entRef,
        {
          userId: selectedUser.uid,
          userEmail: selectedUser.email,
          unlockedPacks: updatedPacks,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSelectedUser({
        ...selectedUser,
        unlockedPacks: updatedPacks,
      });

      addToast({
        type: 'success',
        title: 'Pack Granted',
        message: `Successfully granted ${packId.toUpperCase()} to ${selectedUser.specialUid}`,
      });

      setFeedback({
        type: 'success',
        message: `Granted pack ${packId.toUpperCase()} to ${selectedUser.specialUid}!`,
      });

      fetchRecentUsers();
    } catch (err: any) {
      console.error('Failed to grant pack:', err);
      addToast({ type: 'error', title: 'Grant Failed', message: err.message });
      setFeedback({ type: 'error', message: `Failed to grant pack: ${err.message}` });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRemovePack = async (packId: PackId) => {
    if (!selectedUser) return;
    const packObj = PACKS.find((p) => p.id === packId);
    const packName = packObj ? packObj.name : packId.toUpperCase();

    if (!window.confirm(`Are you sure you want to remove ${packName} from ${selectedUser.specialUid} (${selectedUser.email})?`)) {
      return;
    }

    setActionInProgress(`remove-${packId}`);
    try {
      const entRef = doc(db, 'user_entitlements', selectedUser.uid);
      const updatedPacks = selectedUser.unlockedPacks.filter((p) => p !== packId);

      await setDoc(
        entRef,
        {
          userId: selectedUser.uid,
          userEmail: selectedUser.email,
          unlockedPacks: updatedPacks,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSelectedUser({
        ...selectedUser,
        unlockedPacks: updatedPacks,
      });

      addToast({
        type: 'success',
        title: 'Pack Revoked',
        message: `Removed ${packName} from ${selectedUser.specialUid}`,
      });

      setFeedback({
        type: 'success',
        message: `Revoked ${packName} from ${selectedUser.specialUid}.`,
      });

      fetchRecentUsers();
    } catch (err: any) {
      console.error('Failed to remove pack:', err);
      addToast({ type: 'error', title: 'Revoke Failed', message: err.message });
      setFeedback({ type: 'error', message: `Failed to revoke pack: ${err.message}` });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleGrantAll = async () => {
    if (!selectedUser) return;
    setActionInProgress('grant-all');
    try {
      const allPacks: PackId[] = ['elite', 'pro', 'dev', 'creator', 'roblox', 'gaming'];
      const entRef = doc(db, 'user_entitlements', selectedUser.uid);
      await setDoc(
        entRef,
        {
          userId: selectedUser.uid,
          userEmail: selectedUser.email,
          unlockedPacks: allPacks,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSelectedUser({
        ...selectedUser,
        unlockedPacks: allPacks,
      });

      addToast({
        type: 'success',
        title: 'Elite Access Granted',
        message: `All packs granted to ${selectedUser.specialUid}!`,
      });

      setFeedback({
        type: 'success',
        message: `Granted Elite Lifetime Access (All packs) to ${selectedUser.specialUid}!`,
      });

      fetchRecentUsers();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action Failed', message: err.message });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Reset ${selectedUser.specialUid} (${selectedUser.email}) to Free Tier and revoke all packs?`)) {
      return;
    }
    setActionInProgress('revoke-all');
    try {
      const entRef = doc(db, 'user_entitlements', selectedUser.uid);
      await setDoc(
        entRef,
        {
          userId: selectedUser.uid,
          userEmail: selectedUser.email,
          unlockedPacks: [],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSelectedUser({
        ...selectedUser,
        unlockedPacks: [],
      });

      addToast({
        type: 'info',
        title: 'All Packs Revoked',
        message: `Reset ${selectedUser.specialUid} to Free Community Tier.`,
      });

      setFeedback({
        type: 'success',
        message: `Reset ${selectedUser.specialUid} to Free Tier (0 active packs).`,
      });

      fetchRecentUsers();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action Failed', message: err.message });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">User UID & Entitlement Control Center</h2>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                Admin Live Tool
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Lookup any user by pasting their Special UID (e.g. <span className="font-mono text-blue-300">IND-9A4E-7C21</span>), raw Firebase Auth UID, or email. Inspect login activity, unlock packs, or revoke entitlements instantly.
            </p>
          </div>
        </div>

        <button
          onClick={fetchRecentUsers}
          disabled={recentLoading}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recentLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookupUser(inputQuery);
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Paste Special UID (e.g. IND-XXXX-XXXX), Firebase UID, or user email..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
            />
            {inputQuery && (
              <button
                type="button"
                onClick={() => setInputQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={async () => {
                try {
                  const clip = await navigator.clipboard.readText();
                  if (clip) {
                    setInputQuery(clip.trim());
                    lookupUser(clip.trim());
                  }
                } catch {
                  // clipboard read permission prompt
                }
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              title="Paste from clipboard and lookup"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Paste & Find</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl clay-button-primary text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Searching...' : 'Lookup User'}</span>
            </button>
          </div>
        </form>

        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center justify-between border animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="font-bold text-slate-500 hover:text-slate-900 cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {selectedUser ? (
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-600/20 text-blue-700 flex items-center justify-center text-xl font-bold font-mono shrink-0 shadow-xs">
                    {selectedUser.photoURL ? (
                      <img
                        src={selectedUser.photoURL}
                        alt={selectedUser.displayName}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      selectedUser.displayName[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>{selectedUser.displayName}</span>
                      {selectedUser.unlockedPacks.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {selectedUser.unlockedPacks.includes('elite') ? 'Elite Lifetime' : `${selectedUser.unlockedPacks.length} Packs Active`}
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-slate-500 block">{selectedUser.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleGrantAll}
                    disabled={actionInProgress !== null}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Grant Elite (All)</span>
                  </button>

                  <button
                    onClick={handleRevokeAll}
                    disabled={actionInProgress !== null || selectedUser.unlockedPacks.length === 0}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke All</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Special User UID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs">
                      {selectedUser.specialUid}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedUser.specialUid, 'special-uid')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Copy Special UID"
                    >
                      {copiedKey === 'special-uid' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Firebase Auth UID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 truncate max-w-[200px] shadow-xs block">
                      {selectedUser.uid}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedUser.uid, 'auth-uid')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Copy Auth UID"
                    >
                      {copiedKey === 'auth-uid' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Last Login Activity</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {formatRelativeTime(selectedUser.lastLoginMillis || selectedUser.lastLoginAt)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    {selectedUser.lastLoginAt?.toDate
                      ? selectedUser.lastLoginAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : selectedUser.lastLoginMillis
                      ? new Date(selectedUser.lastLoginMillis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Never recorded'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Orders Record</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {selectedUser.totalOrdersCount} purchase{selectedUser.totalOrdersCount === 1 ? '' : 's'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Total spent: ₹{selectedUser.totalSpent}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Entitlements Status</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {selectedUser.unlockedPacks.length} / {PACKS.length} Packs Active
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">
                    {selectedUser.unlockedPacks.includes('elite') ? 'All tools unlocked' : 'Custom entitlements'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Currently Active Packs ({selectedUser.unlockedPacks.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Click &apos;Remove&apos; to instantly revoke access</span>
                </div>

                {selectedUser.unlockedPacks.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                    This user currently has zero paid packs unlocked (Free Community Tier only).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedUser.unlockedPacks.map((packId) => {
                      const p = PACKS.find((x) => x.id === packId);
                      return (
                        <div
                          key={packId}
                          className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-emerald-950 text-xs block truncate">
                              {p ? p.name : packId.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-emerald-700 block">
                              {p ? `₹${p.price} • ${p.tagline}` : 'Active entitlement'}
                            </span>
                          </div>

                          <button
                            onClick={() => handleRemovePack(packId)}
                            disabled={actionInProgress === `remove-${packId}`}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-blue-600" />
                    <span>Grant Any Pack to User</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Instant database update</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {PACKS.map((pack) => {
                    const isAlreadyUnlocked = selectedUser.unlockedPacks.includes(pack.id);
                    return (
                      <div
                        key={pack.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 shadow-xs ${
                          isAlreadyUnlocked
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-white hover:border-blue-300 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs block truncate">{pack.name}</span>
                            <span className="font-mono text-xs font-bold text-slate-600">₹{pack.price}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{pack.tagline}</p>
                        </div>

                        <button
                          onClick={() => handleGrantPack(pack.id)}
                          disabled={isAlreadyUnlocked || actionInProgress === `grant-${pack.id}`}
                          className={`w-full py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isAlreadyUnlocked
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'clay-button-primary text-white shadow-xs'
                          }`}
                        >
                          {isAlreadyUnlocked ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Already Active</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3 h-3" />
                              <span>Grant Pack</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-12 text-center shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center shadow-xs">
                <Search className="w-8 h-8 text-blue-400" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">No User Selected</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Paste a Special UID (e.g. <span className="font-mono font-semibold text-blue-600">IND-9A4E-7C21</span>), Firebase UID, or user email address above, or click any recent user on the right.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Active Users</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{recentUsers.length} loaded</span>
            </div>

            {recentLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <div className="w-5 h-5 rounded-full border-2 border-blue-600/20 border-t-blue-600 animate-spin" />
                <span className="text-[11px]">Loading user records...</span>
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No user profiles logged yet. Users are automatically recorded when they sign in.
              </div>
            ) : (
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {recentUsers.map((u) => {
                  const isCurrent = selectedUser?.uid === u.uid;
                  return (
                    <button
                      key={u.uid}
                      onClick={() => lookupUser(u.uid)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-500/20 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                          {u.displayName[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {u.displayName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block truncate">
                            {u.specialUid}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-0.5">
                        <span className="text-[10px] font-medium text-slate-400 block flex items-center justify-end gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatRelativeTime(u.lastLoginMillis || u.lastLoginAt)}</span>
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono bg-slate-100 text-slate-600 block">
                          {u.unlockedPacks.length} packs
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
