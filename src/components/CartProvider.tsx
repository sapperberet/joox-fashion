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
import {
  buildVariantSelectionKey,
  getDefaultVariant,
  getVariantLabel,
  getVariantPrice,
  type ProductVariantSelection,
} from "@/lib/product-display";

type CartContextValue = {
  items: CartItem[];
  coupon: CartCoupon | null;
  addItem: (product: Product, quantity?: number, variant?: ProductVariantSelection | null) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  removeItem: (cartKey: string) => void;
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

  const addItem = (product: Product, quantity = 1, variant: ProductVariantSelection | null = null) => {
    const selectedVariant = variant ?? getDefaultVariant(product);
    const stock = selectedVariant?.stock_qty ?? product.stock_qty ?? null;
    if (stock !== null && stock <= 0) {
      return;
    }
    const resolvedPrice = getVariantPrice(product, selectedVariant);
    const resolvedImage = selectedVariant?.image_url ?? product.image_url;
    const resolvedLabel = getVariantLabel(selectedVariant, "en");
    const cartKey = buildVariantSelectionKey(product.id, selectedVariant);

    setItems((prev) => {
      const existing = prev.find((item) => (item.cart_key ?? item.id) === cartKey);
      const baseItem: CartItem = {
        id: product.id,
        cart_key: cartKey,
        slug: product.slug,
        name_en: product.name_en,
        name_ar: product.name_ar,
        price: resolvedPrice,
        image_url: resolvedImage,
        variant: selectedVariant ?? null,
        variant_label: resolvedLabel || null,
        variant_color: selectedVariant?.color ?? null,
        variant_size: selectedVariant?.size ?? null,
        variant_image_url: selectedVariant?.image_url ?? null,
        variant_price: selectedVariant?.price ?? null,
        variant_sale_price: selectedVariant?.sale_price ?? null,
        variant_sale_percent: selectedVariant?.sale_percent ?? null,
        variant_sku: selectedVariant?.sku ?? null,
        quantity: 1,
        stock_qty: selectedVariant?.stock_qty ?? product.stock_qty ?? null,
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
          (item.cart_key ?? item.id) === cartKey ? { ...item, quantity: nextQty } : item,
        );
      }

      const nextQty = normalizeCartQuantity(baseItem, quantity);
      return [...prev, { ...baseItem, quantity: nextQty }];
    });
  };

  const updateQuantity = (cartKey: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if ((item.cart_key ?? item.id) !== cartKey) {
          return item;
        }
        const nextQty = normalizeCartQuantity(item, quantity);
        return { ...item, quantity: nextQty };
      }),
    );
  };

  const removeItem = (cartKey: string) => {
    setItems((prev) => prev.filter((item) => (item.cart_key ?? item.id) !== cartKey));
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
