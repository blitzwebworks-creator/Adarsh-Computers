"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = { id: string; quantity: number };
type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  itemCount: number;
  addItem: (id: string, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const storageKey = "adarsh-computers-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CartItem => item && typeof item.id === "string" && /^[0-9a-f-]{36}$/i.test(item.id) && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 20);
  } catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
    const onStorage = (event: StorageEvent) => { if (event.key === storageKey) setItems(readCart()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (ready) {
      try { localStorage.setItem(storageKey, JSON.stringify(items)); }
      catch { /* Keep the in-memory cart usable when storage is full or unavailable. */ }
    }
  }, [items, ready]);

  const addItem = useCallback((id: string, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === id);
      if (existing) return current.map((item) => item.id === id ? { ...item, quantity: Math.min(20, item.quantity + quantity) } : item);
      return [...current, { id, quantity: Math.min(20, Math.max(1, quantity)) }];
    });
  }, []);
  const setQuantity = useCallback((id: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.min(20, quantity) } : item));
  }, []);
  const removeItem = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const clearCart = useCallback(() => setItems([]), []);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const value = useMemo(() => ({ items, ready, itemCount, addItem, setQuantity, removeItem, clearCart }), [items, ready, itemCount, addItem, setQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider.");
  return value;
}
