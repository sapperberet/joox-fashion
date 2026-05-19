"use client";

export type WishlistItem = {
  product_id: string;
  slug?: string | null;
  name_en: string;
  name_ar: string;
  image_url: string | null;
  price: number;
  added_at: string;
};

const storageKey = "joox:wishlist";

export function loadWishlist(): WishlistItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as WishlistItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => ({
        ...item,
        product_id: item.product_id ?? item.slug ?? "",
      }))
      .filter((item) => item.product_id);
  } catch {
    return [];
  }
}

export function saveWishlist(items: WishlistItem[]) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(storageKey, JSON.stringify(items));
}

export function hasWishlistItem(productId: string, productSlug?: string | null) {
  return loadWishlist().some((item) =>
    item.product_id === productId || (!!productSlug && item.slug === productSlug),
  );
}

export function toggleWishlistItem(item: Omit<WishlistItem, "added_at">) {
  const current = loadWishlist();
  const matches = (entry: WishlistItem) =>
    entry.product_id === item.product_id || (!!item.slug && entry.slug === item.slug);
  const exists = current.some(matches);
  if (exists) {
    const next = current.filter((entry) => !matches(entry));
    saveWishlist(next);
    return { items: next, liked: false };
  }
  const next = [{ ...item, added_at: new Date().toISOString() }, ...current].slice(0, 100);
  saveWishlist(next);
  return { items: next, liked: true };
}