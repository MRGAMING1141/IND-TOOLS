import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'activation' | 'troubleshooting' | 'obfuscation' | 'account';
  tags: string[];
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I activate my purchased pack after making a UPI payment?',
    answer: 'After completing your payment via UPI (vpa: kush.0410-0@waicici) or scanning the QR code in the Checkout modal, submit your 12-digit UTR/transaction reference number. Our system records your order in the live sales ledger, and administrators review and approve activations in real time. Once approved, your entitlements update instantly across all active sessions.',
    category: 'activation',
    tags: ['UPI', 'Activation', 'Checkout', 'UTR'],
  },
  {
    id: 'faq-2',
    question: 'Where can I find my Special UID and Firebase UID?',
    answer: 'Your unique Special UID (formatted as IND-XXXX-XXXX) and Firebase UID are automatically generated and displayed in your user profile dropdown menu and account settings. You can copy it with a single click to share with administrators for manual pack verification or support inquiries.',
    category: 'account',
    tags: ['UID', 'Profile', 'Firebase', 'Account'],
  },
  {
    id: 'faq-3',
    question: 'What should I do if my payment was successful but my pack is still locked?',
    answer: 'If your order status shows as pending, verify that you entered the correct 12-digit UTR and payer name. If verification takes more than a few minutes, click "Need Assistance?" in the top bar or open a support ticket with your order ID, UTR reference, and Special UID. An administrator will verify the transaction and grant access immediately.',
    category: 'troubleshooting',
    tags: ['Pending', 'Payment', 'Support', 'Locked'],
  },
  {
    id: 'faq-4',
    question: 'How do administrators approve or manage user packs?',
    answer: 'Administrators with authorized email credentials have access to the Sales Log and User Entitlements Manager. From there, they can review pending orders, search users by pasting their Special UID or email, inspect login timestamps, and give or remove any pack with a single click.',
    category: 'activation',
    tags: ['Admin', 'Sales Log', 'Entitlements', 'Management'],
  },
  {
    id: 'faq-5',
    question: 'Are obfuscated Luau VM scripts 100% safe to run in Roblox Studio?',
    answer: 'Yes! IND HUB Luau VM Obfuscator compiles source code into pure custom bytecode executed entirely through a register-based VM dispatcher without ever calling loadstring or load. It includes Roblox-safe anti-tamper heuristics and memoized string decryption for 60+ FPS performance.',
    category: 'obfuscation',
    tags: ['Roblox', 'Luau', 'Obfuscator', 'VM', 'Performance'],
  },
  {
    id: 'faq-6',
    question: 'Which Roblox executors support IND HUB obfuscated scripts?',
    answer: 'Our Luau Obfuscator outputs standard Luau bytecode compatible with standard Roblox Studio runtime environments and modern executors including Synapse Z, Wave, Potassium, Hydrogen, Delta, Solara, and MacSploit.',
    category: 'obfuscation',
    tags: ['Executors', 'Synapse', 'Wave', 'Solara', 'Roblox'],
  },
  {
    id: 'faq-7',
    question: 'Can I use IND HUB developer tools offline?',
    answer: 'Yes! The application utilizes robust client-side caching and Vite PWA architecture. Once loaded, all code formatters, hash generators, SVG converters, and calculators execute locally in your browser without requiring an active internet connection.',
    category: 'troubleshooting',
    tags: ['Offline', 'PWA', 'Browser', 'Cache'],
  },
  {
    id: 'faq-8',
    question: 'Can I access my unlocked packs on multiple devices?',
    answer: 'Yes! Because your pack entitlements are securely bound to your Google account UID in Firestore, simply sign in with the same Google account on your desktop, laptop, or mobile browser to enjoy instant lifetime access.',
    category: 'account',
    tags: ['Multi-device', 'Sync', 'Google', 'Login'],
  },
];

interface WikiFAQSectionProps {
  onOpenShop?: () => void;
  onOpenSupport?: () => void;
}

export const WikiFAQSection: React.FC<WikiFAQSectionProps> = ({
  onOpenShop,
  onOpenSupport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'faq-1': true, // Open first by default
  });
  const [copiedUpi, setCopiedUpi] = useState(false);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    FAQ_ITEMS.forEach((item) => {
      all[item.id] = true;
    });
    setOpenIds(all);
  };

  const collapseAll = () => {
    setOpenIds({});
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCat = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQ =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesQ;
    });
  }, [searchQuery, activeCategory]);

  const copyUpiId = () => {
    navigator.clipboard.writeText('kush.0410-0@waicici');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* FAQ Banner Header */}
      <div className="p-6 md:p-8 rounded-3xl glass-panel bg-white/90 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 mb-3 shadow-xs">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Interactive Knowledge Base & Troubleshooting</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
              Frequently Asked Questions (FAQ)
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Find instant answers regarding pack activation, UPI UTR verification, Special UIDs, Luau obfuscation, and multi-device account sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenShop && (
              <button
                onClick={onOpenShop}
                className="px-4 py-2 rounded-xl text-xs font-bold clay-button-primary flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Explore Packs & Shop</span>
              </button>
            )}
            {onOpenSupport && (
              <button
                onClick={onOpenSupport}
                className="px-4 py-2 rounded-xl text-xs font-bold clay-button text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Submit Ticket</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 relative z-10">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions (e.g. UPI, UTR, activation, UID, offline)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={expandAll}
              className="px-3 py-2 rounded-xl text-xs font-semibold clay-button text-slate-700 cursor-pointer flex-1 sm:flex-initial"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 rounded-xl text-xs font-semibold clay-button text-slate-700 cursor-pointer flex-1 sm:flex-initial"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'activation', label: 'Pack Activation & UPI' },
            { id: 'troubleshooting', label: 'Troubleshooting & Support' },
            { id: 'obfuscation', label: 'Luau & Obfuscator' },
            { id: 'account', label: 'UID & Multi-Device' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* UPI Quick Card Highlight */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200">Merchant UPI Reference</h4>
            <p className="text-sm font-mono font-bold text-white mt-0.5">kush.0410-0@waicici</p>
          </div>
        </div>
        <button
          onClick={copyUpiId}
          className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          {copiedUpi ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">UPI Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-blue-200" />
              <span>Copy UPI ID</span>
            </>
          )}
        </button>
      </div>

      {/* Accordion FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-panel bg-white/70 border border-slate-200">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">No matching questions found</p>
            <p className="text-xs text-slate-500 mt-1">Try searching for another keyword or reset the category filter.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-semibold clay-button text-slate-700 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredFaqs.map((item) => {
            const isOpen = Boolean(openIds[item.id]);
            return (
              <div
                key={item.id}
                className={`rounded-2xl transition-all border ${
                  isOpen
                    ? 'bg-white/95 border-blue-300 shadow-md ring-2 ring-blue-500/10'
                    : 'glass-card bg-white/75 border-slate-200/90 hover:bg-white/90'
                }`}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 leading-snug">
                      {item.question}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600">
                      {item.category}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed animate-fadeIn">
                    <p className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 leading-relaxed">
                      {item.answer}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-[11px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-400 font-medium">Tags:</span>
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded font-mono text-slate-600 bg-slate-100 border border-slate-200"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {onOpenSupport && (
                        <button
                          onClick={onOpenSupport}
                          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Still need help? Open Ticket</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
