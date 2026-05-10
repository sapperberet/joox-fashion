"use client";

export type WishlistItem = {
  slug: string;
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
    return Array.isArray(parsed) ? parsed : [];
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

export function hasWishlistItem(slug: string) {
  return loadWishlist().some((item) => item.slug === slug);
}

export function toggleWishlistItem(item: Omit<WishlistItem, "added_at">) {
  const current = loadWishlist();
  const exists = current.findIndex((entry) => entry.slug === item.slug);
  if (exists >= 0) {
    const next = current.filter((entry) => entry.slug !== item.slug);
    saveWishlist(next);
    return { items: next, liked: false };
  }
  const next = [{ ...item, added_at: new Date().toISOString() }, ...current].slice(0, 100);
  saveWishlist(next);
  return { items: next, liked: true };
}