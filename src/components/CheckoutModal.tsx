import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { PackId, ToolPack } from '../types';
import { PACKS } from '../data/toolsData';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Package,
} from 'lucide-react';

interface CheckoutModalProps {
  packId?: PackId;
  packs?: PackId[];
  amount?: number;
  onClose: () => void;
  onOrderComplete: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  packId,
  packs: initialPacks,
  amount: initialAmount,
  onClose,
  onOrderComplete,
}) => {
  const { user, signIn } = useAuth();
  const { clearCart } = useCart();

  // Resolve packs to purchase
  const selectedPackIds: PackId[] = initialPacks && initialPacks.length > 0
    ? initialPacks
    : packId
    ? [packId]
    : ['elite'];

  const selectedPacks: ToolPack[] = selectedPackIds
    .map((id) => PACKS.find((p) => p.id === id))
    .filter((p): p is ToolPack => Boolean(p));

  const hasElite = selectedPackIds.includes('elite');
  const computedTotal = hasElite
    ? 299
    : initialAmount !== undefined
    ? initialAmount
    : selectedPacks.reduce((acc, p) => acc + p.price, 0);

  const packNamesSummary = selectedPacks.map((p) => p.name).join(' + ');

  const [payerName, setPayerName] = useState(user?.displayName || '');
  const [utr, setUtr] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const UPI_ID = 'kush.0410-0@waicici';
  const PAYEE_NAME = 'Kush';
  const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${computedTotal}&cu=INR&tn=${encodeURIComponent('IND HUB ' + (packNamesSummary || 'Tools'))}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data=${encodeURIComponent(upiUri)}`;

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in with Google before placing your order so your pack can be linked to your account.');
      return;
    }
    if (!payerName.trim()) {
      setError('Please enter the name on your UPI or bank account.');
      return;
    }
    if (!utr.trim()) {
      setError('Please enter the 12-digit UTR or transaction reference number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderRef = collection(db, 'orders');
      const docSnap = await addDoc(orderRef, {
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || payerName,
        packs: selectedPackIds,
        packNames: packNamesSummary,
        amount: computedTotal,
        currency: '₹',
        payerName: payerName.trim(),
        utr: utr.trim(),
        contact: contact.trim(),
        notes: notes.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      clearCart();
      onOrderComplete(docSnap.id);
    } catch (err: any) {
      console.error('Error placing order:', err);
      handleFirestoreError(err, OperationType.CREATE, 'orders');
      setError(err.message || 'Failed to submit order. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Complete Pack Activation</h3>
              <p className="text-[11px] text-slate-500">Direct account grant · Instant synchronization</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs bg-white/70">
          {/* Order Summary Pill Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Selected Package(s)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedPacks.map((p) => (
                  <span
                    key={p.id}
                    className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Lifetime access unlocked across all tools once approved.
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-2xl font-bold font-mono text-emerald-600 block">
                ₹{computedTotal}
              </span>
              <span className="text-[10px] text-slate-500">Fixed one-time price</span>
            </div>
          </div>

          {/* Payment Instructions (UPI) */}
          <div className="p-4.5 rounded-2xl bg-blue-50/40 border border-blue-200/70 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>UPI Payment Instructions (GPay, PhonePe, Paytm, Any Bank)</span>
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md font-mono font-semibold">
                Instant Verification
              </span>
            </div>

            <div className="space-y-2 text-slate-700">
              <p className="text-[11px] leading-relaxed text-slate-600">
                1. Transfer exactly <strong>₹{computedTotal}</strong> to the verified merchant UPI ID below:
              </p>

              {/* UPI ID Copy Field & Actions */}
              <div className="bg-white p-3.5 rounded-xl border border-blue-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 font-medium block">Payee UPI ID</span>
                    <span className="font-mono text-blue-600 font-bold text-sm tracking-wide select-all truncate block">
                      {UPI_ID}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Payee: {PAYEE_NAME}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowQr(!showQr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        showQr
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                      }`}
                      title="Toggle UPI QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={copyUpi}
                      className="px-3.5 py-1.5 rounded-xl clay-button-primary text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer text-xs shadow-xs"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Direct Pay Button */}
                <div className="sm:hidden pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Pay directly on your phone:</span>
                  <a
                    href={upiUri}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 shadow-xs hover:bg-emerald-700 transition-colors"
                  >
                    <span>Open UPI App</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>

                {/* Collapsible UPI QR Code Card */}
                {showQr && (
                  <div className="pt-2 border-t border-slate-100 flex flex-col items-center justify-center space-y-2 animate-fadeIn">
                    <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <img
                        src={qrCodeUrl}
                        alt={`UPI QR Code for ${UPI_ID}`}
                        className="w-40 h-40 object-contain rounded-xl"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 text-center block">
                      Scan with GPay, PhonePe, Paytm, BHIM, or any bank app
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[11px] leading-relaxed text-slate-600 pt-1">
                2. After making the payment, note down the <strong>12-digit UTR / Ref No.</strong> and submit the form below.
              </p>
            </div>
          </div>

          {/* Authentication Status Check */}
          {!user ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Sign in required before submitting order</span>
              </div>
              <p className="text-[11px] text-slate-600">
                We link your purchased packs directly to your Google identity so tools unlock automatically on every device without requiring license keys.
              </p>
              <button
                type="button"
                onClick={signIn}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Sign in with Google</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`}
                  alt=""
                  className="w-7 h-7 rounded-full border border-slate-200"
                />
                <div>
                  <span className="text-slate-900 font-semibold block">{user.displayName}</span>
                  <span className="text-[10px] text-slate-500">{user.email}</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Account Verified</span>
              </span>
            </div>
          )}

          {/* Order Details Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-slate-800 font-semibold mb-1">
                Name on UPI / Bank Account <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-semibold mb-1">
                12-digit UPI Reference / UTR Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. 428901847592"
                required
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Found on your payment confirmation screen or SMS from your bank.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-semibold mb-1">
                  WhatsApp / Discord / Telegram (Optional)
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="@username or phone"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-semibold mb-1">
                  Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Need fast approval, etc."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !user}
                className={`w-full py-3 rounded-xl font-bold text-xs text-white clay-button-primary flex items-center justify-center gap-2 shadow-md ${
                  loading || !user ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {loading ? (
                  <span>Recording Order in Sales Channel...</span>
                ) : (
                  <>
                    <span>Submit Order for Direct Approval (₹{computedTotal})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
