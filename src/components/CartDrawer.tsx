import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { PACKS } from '../data/toolsData';
import {
  ShoppingBag,
  X,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Check,
  Package,
} from 'lucide-react';
import { PackId } from '../types';

interface CartDrawerProps {
  onProceedToCheckout: (packs: PackId[], totalAmount: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    removeFromCart,
    clearCart,
    totalAmount,
    itemCount,
    isCartOpen,
    closeCart,
    smartUpgradeAvailable,
    addToCart,
  } = useCart();

  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    if (items.length === 0) return;
    const packIds = items.map((i) => i.packId);
    closeCart();
    onProceedToCheckout(packIds, totalAmount);
  };

  const handleUpgradeToElite = () => {
    addToCart('elite');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Glassmorphic Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white/95 backdrop-blur-2xl border-l border-slate-200/90 flex flex-col shadow-2xl relative">
          {/* Header */}
          <div className="px-5 py-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/90">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Your Toolkit Cart</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {itemCount} {itemCount === 1 ? 'pack' : 'packs'}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">Direct lifetime account activation</p>
              </div>
            </div>

            <button
              onClick={closeCart}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white/70">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Explore our developer, creator, Roblox, and gaming utility packs to unlock professional tools.
                  </p>
                </div>
                <button
                  onClick={closeCart}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 transition-colors cursor-pointer shadow-xs"
                >
                  Browse Available Packs
                </button>
              </div>
            ) : (
              <>
                {/* Smart Upgrade Recommendation if multiple packs total >= ₹299 */}
                {smartUpgradeAvailable && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900">Smart Bundle Upgrade</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      You have multiple packs selected. Get the <strong>Elite Tier (₹299)</strong> instead to unlock <strong>ALL 6 suites</strong> (Dev, Creator, Roblox, Gaming & Pro) for lifetime with direct account approval!
                    </p>
                    <button
                      onClick={handleUpgradeToElite}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white clay-button-primary flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>Upgrade to Elite Tier (₹299)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => {
                    const packDetails = PACKS.find((p) => p.id === item.packId);
                    return (
                      <div
                        key={item.packId}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-3 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                                {item.isBundle && (
                                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                    Bundle
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{item.tagline}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold font-mono text-slate-900">
                              {item.currency}{item.price}
                            </span>
                            <span className="text-[10px] text-slate-500 block">lifetime</span>
                          </div>
                        </div>

                        {/* Feature snippet */}
                        {packDetails && packDetails.features.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="truncate max-w-[200px]">
                              ✓ {packDetails.features[0]}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.packId)}
                              className="text-slate-400 hover:text-red-600 p-1 transition-colors rounded-lg hover:bg-red-50 flex items-center gap-1 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Remove</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer & Order Total */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-200/80 bg-slate-50/90 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Selected Items</span>
                  <span className="font-mono text-slate-800 font-semibold">{itemCount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Activation Mode</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct Account Grant</span>
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-bold text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-xl font-mono text-emerald-600 font-extrabold">
                    ₹{totalAmount}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCheckoutClick}
                  className="w-full py-3 rounded-xl font-bold text-xs text-white clay-button-primary flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Proceed to UPI Checkout (₹{totalAmount})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={closeCart}
                    className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Keep Shopping
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
