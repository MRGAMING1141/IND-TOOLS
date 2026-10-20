import React from 'react';
import { PACKS, TOOLS } from '../data/toolsData';
import { PackId } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  Check,
  Package,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

interface ShopProps {
  onSelectPack: (packId: PackId) => void;
  onOpenMyOrders: () => void;
  onOpenTool: (toolId: string) => void;
}

export const Shop: React.FC<ShopProps> = ({
  onSelectPack,
  onOpenMyOrders,
  onOpenTool,
}) => {
  const { hasAccessToPack } = useAuth();
  const { addToCart, isInCart } = useCart();

  const bundles = PACKS.filter((p) => p.isBundle);
  const addons = PACKS.filter((p) => !p.isBundle);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Shop Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>One-Time Lifetime Access · Zero Subscriptions</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Unlock Professional Suites
        </h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          32 tools are permanently free. Add specialized developer, Roblox VM, and gaming suites with an instant one-time unlock.
          Approved directly on your Google account—no license keys or renewal fees needed.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={onOpenMyOrders}
            className="px-4 py-2 clay-button rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Package className="w-4 h-4 text-blue-600" />
            <span>View My Orders & Active Entitlements</span>
          </button>
        </div>
      </div>

      {/* Main Bundles (Elite Tier ₹299 & Pro Tier ₹199) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bundles.map((pack) => {
          const isUnlocked = hasAccessToPack(pack.id);
          const isElite = pack.id === 'elite';
          const inCart = isInCart(pack.id);

          return (
            <div
              key={pack.id}
              className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between relative transition-all ${
                isElite
                  ? 'glass-panel bg-white/80 border-2 border-blue-500 shadow-md'
                  : 'glass-card bg-white/70 border border-slate-200/90'
              }`}
            >
              {isElite && (
                <div className="absolute -top-3 left-6 px-3.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[11px] tracking-wider uppercase shadow-sm">
                  ★ Most Complete Suite (Best Value)
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">{pack.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{pack.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono block">
                      {pack.currency}{pack.price}
                    </span>
                    <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-bold">
                      Lifetime Unlock
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="pt-4 border-t border-slate-100 mb-6 space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    What's Included:
                  </span>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {pack.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                {isUnlocked ? (
                  <div className="w-full py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs text-center flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Unlocked & Active on Account</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addToCart(pack.id)}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        inCart
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                          : 'clay-button text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{inCart ? 'In Cart' : 'Add to Cart'}</span>
                    </button>

                    <button
                      onClick={() => onSelectPack(pack.id)}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isElite
                          ? 'clay-button-primary'
                          : 'clay-button bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
                      }`}
                    >
                      <span>Buy Now (₹{pack.price})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Standalone Add-on Packs */}
      <div className="space-y-4 pt-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Standalone Add-on Suites</h3>
          <p className="text-xs text-slate-600">
            Need specific workflows? Add individual specialized suites for Roblox development, competitive gaming, or frontend UI tools.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {addons.map((pack) => {
            const isUnlocked = hasAccessToPack(pack.id);
            const inCart = isInCart(pack.id);
            const includedTools = TOOLS.filter((t) => t.pack === pack.id);

            return (
              <div
                key={pack.id}
                className="glass-card bg-white/70 border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                      {pack.tagline}
                    </span>
                    <span className="font-mono font-bold text-base text-slate-900">
                      {pack.currency}{pack.price}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-1">{pack.name}</h4>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">{pack.description}</p>

                  <div className="space-y-2 mb-6">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Suite Features:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {pack.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {includedTools.length > 0 && (
                    <div className="mb-4 pt-3 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 font-medium block mb-1.5">
                        Tools included in this pack:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {includedTools.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => onOpenTool(t.id)}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {isUnlocked ? (
                    <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs text-center flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Unlocked</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addToCart(pack.id)}
                        className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          inCart
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                            : 'clay-button text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{inCart ? 'In Cart' : 'Cart'}</span>
                      </button>

                      <button
                        onClick={() => onSelectPack(pack.id)}
                        className="flex-1 py-2 px-3 rounded-xl font-bold text-xs clay-button-primary transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>₹{pack.price}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
