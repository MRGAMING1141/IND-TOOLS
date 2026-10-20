import React, { createContext, useContext, useState, useEffect } from 'react';
import { PackId, CartItem } from '../types';
import { PACKS } from '../data/toolsData';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (packId: PackId) => void;
  removeFromCart: (packId: PackId) => void;
  clearCart: () => void;
  isInCart: (packId: PackId) => boolean;
  totalAmount: number;
  itemCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  smartUpgradeAvailable: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'ind_hub_cart_v2';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasAccessToPack } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  const addToCart = (packId: PackId) => {
    // If already owned, don't re-add
    if (hasAccessToPack(packId)) return;

    const pack = PACKS.find((p) => p.id === packId);
    if (!pack) return;

    // If user adds Elite Tier (₹299), clear any individual packs since Elite includes everything!
    if (packId === 'elite') {
      setItems([
        {
          packId: 'elite',
          name: pack.name,
          price: pack.price,
          currency: pack.currency,
          tagline: pack.tagline,
          isBundle: true,
        },
      ]);
      setIsCartOpen(true);
      return;
    }

    // If user already has Elite in cart, other packs are redundant
    if (items.some((i) => i.packId === 'elite')) {
      setIsCartOpen(true);
      return;
    }

    // Avoid duplicates
    if (items.some((i) => i.packId === packId)) {
      setIsCartOpen(true);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        packId: pack.id,
        name: pack.name,
        price: pack.price,
        currency: pack.currency,
        tagline: pack.tagline,
        isBundle: pack.isBundle,
      },
    ]);
    setIsCartOpen(true);
  };

  const removeFromCart = (packId: PackId) => {
    setItems((prev) => prev.filter((i) => i.packId !== packId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (packId: PackId) => {
    if (items.some((i) => i.packId === 'elite')) return true; // Elite covers all
    return items.some((i) => i.packId === packId);
  };

  // Calculate total amount
  const rawSubtotal = items.reduce((acc, i) => acc + i.price, 0);

  // If user has separate items that exceed or equal Elite tier (299), cap or suggest Elite
  const hasElite = items.some((i) => i.packId === 'elite');
  const smartUpgradeAvailable = !hasElite && (rawSubtotal >= 299 || items.length >= 3);
  const totalAmount = hasElite ? 299 : rawSubtotal;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        totalAmount,
        itemCount: items.length,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        smartUpgradeAvailable,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
