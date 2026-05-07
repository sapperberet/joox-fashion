"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartCoupon, CartItem, Product } from "@/lib/types";
import { normalizeCartQuantity } from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  coupon: CartCoupon | null;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setCoupon: (coupon: CartCoupon | null) => void;
};

type StoredCart = {
  items: CartItem[];
  coupon: CartCoupon | null;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "joox:cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCouponState] = useState<CartCoupon | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredCart;
        setItems(parsed.items ?? []);
        setCouponState(parsed.coupon ?? null);
      } catch {
        setItems([]);
        setCouponState(null);
      }
    }
  }, []);

  useEffect(() => {
    const payload: StoredCart = { items, coupon };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [items, coupon]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const baseItem: CartItem = {
        id: product.id,
        slug: product.slug,
        name_en: product.name_en,
        name_ar: product.name_ar,
        price: product.price,
        image_url: product.image_url,
        quantity: 1,
        stock_qty: product.stock_qty ?? null,
        min_order_qty: product.min_order_qty ?? null,
        max_order_qty: product.max_order_qty ?? null,
        order_multiple: product.order_multiple ?? null,
        bundle_qty: product.bundle_qty ?? null,
        bundle_price: product.bundle_price ?? null,
      };

      if (existing) {
        const nextQty = normalizeCartQuantity(
          existing,
          existing.quantity + quantity,
        );
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: nextQty } : item,
        );
      }

      const nextQty = normalizeCartQuantity(baseItem, quantity);
      return [...prev, { ...baseItem, quantity: nextQty }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }
        const nextQty = normalizeCartQuantity(item, quantity);
        return { ...item, quantity: nextQty };
      }),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setCouponState(null);
  };

  const setCoupon = (next: CartCoupon | null) => {
    setCouponState(next);
  };

  const value = useMemo(
    () => ({
      items,
      coupon,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      setCoupon,
    }),
    [items, coupon],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}
