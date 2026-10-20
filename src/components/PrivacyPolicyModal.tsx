import React, { useEffect } from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  EyeOff,
  Database,
  Server,
  FileText,
  Mail,
  Printer,
  CheckCircle,
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
  onOpenTerms?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  onClose,
  onOpenTerms,
}) => {
  const handlePrint = () => {
    window.print();
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
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  IND HUB Privacy Policy
                </h2>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  GDPR & CCPA Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Effective Date: October 2026 • Version 3.5.0 Production
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Print Policy"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed scrollbar-thin bg-white/70">
          {/* Key Privacy Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 shadow-xs">
            <div className="flex items-start gap-2.5">
              <EyeOff className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-xs">Zero Tool Telemetry</p>
                <p className="text-[11px] text-slate-600">Your scripts, inputs, and payloads never leave your browser.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-xs">Client-Side Obfuscation</p>
                <p className="text-[11px] text-slate-600">All Luau AST parsing & hashing runs 100% locally in V8 / WebAssembly.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Database className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-xs">Minimal Cloud Sync</p>
                <p className="text-[11px] text-slate-600">Only Google Auth email and paid order entitlement statuses are stored in Firestore.</p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
              <span>1. Information We Do NOT Collect</span>
            </h3>
            <p className="text-slate-400 mb-2">
              Unlike traditional cloud software, IND HUB is built from the ground up as an ephemeral, client-side workstation:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong className="text-slate-200">No Tool Input Logging:</strong> Any Lua/Luau script, JSON payload, API token, password, or regex pattern you paste into any tool is processed exclusively in your device&apos;s memory and is destroyed when you refresh or close the tab.</li>
              <li><strong className="text-slate-200">No Keylogging or Screen Scraping:</strong> We do not track keystrokes, clipboard history, or screen contents.</li>
              <li><strong className="text-slate-200">No Ad-Tracking or Third-Party Pixel Networks:</strong> We do not sell your personal data or partner with ad networks.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              2. Information We Collect and Process
            </h3>
            <p className="text-slate-400 mb-2">
              To provide authentication, persistent tool access, and payment verification, we collect the minimum necessary data:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong className="text-slate-200">Google Authentication Profile:</strong> Your name, email address, and avatar URL provided via Google OAuth popup for sign-in and cross-device entitlement access.</li>
              <li><strong className="text-slate-200">Order & Payment Data:</strong> When purchasing a pack or Elite Tier (₹299), we record your chosen pack IDs, order reference ID, UPI UTR / transaction identifier, payer name, and timestamp in Google Cloud Firestore. We never receive or store debit/credit card numbers or bank account passwords.</li>
              <li><strong className="text-slate-200">Support Ticket Inquiries:</strong> Any correspondence, ticket description, and responses you send through the built-in Support Tickets hub to facilitate customer support.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              3. Web Audio API & Sound Synthesizer Notice
            </h3>
            <p className="text-slate-400">
              IND HUB uses the standard browser Web Audio API to synthesize real-time audio chimes for notifications and alerts. No microphone input is ever accessed, recorded, or transmitted. Users may freely mute sound chimes at any time using the live sound toggle button.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              4. Local Storage & Session State
            </h3>
            <p className="text-slate-400">
              We store non-sensitive preferences in your browser&apos;s \`localStorage\`, such as:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 mt-1">
              <li>Audio chime toggle state (\`ind_hub_sound_enabled\`)</li>
              <li>Notification alert history (\`ind_hub_toasts_history\`)</li>
              <li>Active cart items (\`ind_hub_cart\`)</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              5. User Rights & Data Deletion (GDPR / CCPA)
            </h3>
            <p className="text-slate-400">
              You retain full rights over your data. You may request an export of your order history or permanent deletion of your account and ticket history by submitting a request in the Support Tickets portal or contacting our Data Protection Officer at <span className="text-blue-400 font-mono">lasthope.mr@gmail.com</span>.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              6. Security Safeguards
            </h3>
            <p className="text-slate-400">
              All communications with Google Cloud Firestore are encrypted via TLS 1.3. Firestore security rules strictly enforce role-based access control (RBAC), guaranteeing that only you and authenticated administrators can view your orders and support tickets.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4.5 border-t border-slate-200/80 bg-slate-50/90 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Guaranteed zero-telemetry client execution.</span>
          </div>

          <div className="flex items-center gap-3">
            {onOpenTerms && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTerms();
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline"
              >
                View Terms of Service
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl clay-button-primary text-white font-bold cursor-pointer shadow-sm transition-all"
            >
              I Understand & Agree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
