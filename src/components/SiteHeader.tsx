"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { copy } from "@/lib/i18n";
import { calculateCartTotals, calculateLineTotal } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";
import { useLanguage } from "./SiteProviders";
import LanguageToggle from "./LanguageToggle";
import LogoLockup from "./LogoLockup";
import { useCart } from "./CartProvider";

export default function SiteHeader() {
  const { locale } = useLanguage();
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState("");
  const t = copy[locale];
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotals = calculateCartTotals(items, null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const previewItems = items.slice(0, 3);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    setActiveCategory((params.get("category") ?? "").toLowerCase());
  }, [pathname]);

  const isHomeActive = pathname === "/";
  const isProductsActive =
    pathname.startsWith("/products") ||
    pathname.startsWith("/product/") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/thank-you");
  const isTopsActive = pathname.startsWith("/products") && activeCategory === "tops";
  const isPantsActive = pathname.startsWith("/products") && activeCategory === "pants";

  return (
    <header className="temple-header sticky top-0 z-40 border-b border-gold/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
        <Link href="/" className="shrink-0">
          <LogoLockup />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold uppercase tracking-[0.2em] text-sand md:gap-8 lg:flex">
          <Link
            href="/"
            className={`inline-flex items-center rounded-full px-3 py-1.5 transition ${isHomeActive ? "bg-gold/15 text-gold shadow-[0_0_0_1px_rgba(215,180,106,0.25)]" : "text-sand hover:bg-gold/10 hover:text-gold"}`}
          >
            Home
          </Link>

          <Link
            href="/products"
            className={`inline-flex items-center rounded-full px-3 py-1.5 transition ${isProductsActive && !isTopsActive && !isPantsActive ? "bg-gold/15 text-gold shadow-[0_0_0_1px_rgba(215,180,106,0.25)]" : "text-sand hover:bg-gold/10 hover:text-gold"}`}
          >
            Products
          </Link>
          <Link
            href="/products?category=tops"
            className={`inline-flex items-center rounded-full px-3 py-1.5 transition ${isTopsActive ? "bg-gold/15 text-gold shadow-[0_0_0_1px_rgba(215,180,106,0.25)]" : "text-sand hover:bg-gold/10 hover:text-gold"}`}
          >
            Tops
          </Link>
          <Link
            href="/products?category=pants"
            className={`inline-flex items-center rounded-full px-3 py-1.5 transition ${isPantsActive ? "bg-gold/15 text-gold shadow-[0_0_0_1px_rgba(215,180,106,0.25)]" : "text-sand hover:bg-gold/10 hover:text-gold"}`}
          >
            Pants
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/cart"
            title={t.nav.cart}
            className="relative inline-flex items-center justify-center gap-2 rounded-2xl border border-gold/25 bg-linear-to-br from-obsidian/90 to-stone/70 px-3.5 py-2.5 text-lg text-gold shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:border-gold/50 hover:shadow-[0_10px_30px_rgba(215,180,106,0.18)] md:hidden"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gold/12 text-xl">
              🛒
              {itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-obsidian bg-gold px-1 text-[0.65rem] font-extrabold leading-none text-ink shadow-lg">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </span>
            <span className="hidden text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-sand/80 sm:inline">Cart</span>
          </Link>

          <div className="group relative hidden md:block">
            <Link
              href="/cart"
              title={t.nav.cart}
              className="relative inline-flex items-center gap-3 rounded-full border border-gold/25 bg-linear-to-r from-obsidian/90 via-stone/80 to-obsidian/90 px-4 py-2.5 text-gold shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:border-gold/50 hover:shadow-[0_10px_30px_rgba(215,180,106,0.18)]"
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-2xl">
                🛒
                {itemCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border border-obsidian bg-gold px-1.5 text-[0.68rem] font-extrabold leading-none text-ink shadow-lg">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </span>
              <span className="flex flex-col items-start text-left leading-tight">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-sand/60">Bag</span>
                <span className="text-sm font-bold uppercase tracking-[0.18em] text-sand">{t.nav.cart}</span>
              </span>
            </Link>
            <div className="pointer-events-none absolute right-0 top-full z-50 mt-3 w-80 rounded-3xl border border-gold/20 bg-obsidian/95 p-4 opacity-0 shadow-2xl backdrop-blur transition group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100">
              <div className="mb-3 flex items-center justify-between border-b border-gold/10 pb-2 text-xs uppercase tracking-[0.25em] text-gold/80">
                <span>𓂀 {itemCount > 0 ? `${itemCount} items` : "Cart empty"} 𓂀</span>
                <span>{formatCurrency(cartTotals.total, locale)}</span>
              </div>
              {itemCount > 0 ? (
                <div className="space-y-2">
                  {previewItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm text-sand/80">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{locale === "ar" ? item.name_ar : item.name_en}</div>
                        <div className="text-xs text-sand/55">𓏏 x{item.quantity}</div>
                      </div>
                      <div className="shrink-0 text-gold">{formatCurrency(calculateLineTotal(item).total, locale)}</div>
                    </div>
                  ))}
                  {itemCount > previewItems.length && (
                    <div className="text-xs uppercase tracking-[0.25em] text-sand/55">𓅓 +{itemCount - previewItems.length} more</div>
                  )}
                  <Link
                    href="/cart"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gold px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90"
                  >
                    𓋹 Open cart
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-sand/60">𓂀 Cart is empty</div>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-full border border-gold/20 bg-obsidian/70 px-2 py-1">
            <span className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-sand/70">Language</span>
            <LanguageToggle compact />
          </div>

          <div className="md:hidden flex items-center gap-2 rounded-full border border-gold/20 bg-obsidian/70 px-2 py-1">
            <span className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-sand/70">Lang</span>
            <LanguageToggle compact />
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-full px-3 py-2 text-gold transition hover:bg-gold/10"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-gold/10 bg-obsidian/95 backdrop-blur md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-4 sm:px-6">
            <Link
              href="/"
              className={`rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition border border-transparent hover:bg-gold/10 hover:border-gold/40 ${isHomeActive ? "text-gold bg-gold/15 shadow-[0_0_0_1px_rgba(215,180,106,0.25)]" : "text-sand hover:text-gold"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition border border-transparent hover:bg-gold/10 hover:border-gold/40 ${isProductsActive && !isTopsActive && !isPantsActive ? "text-gold bg-gold/15 shadow-[0_0_0_1px_rgba(215,180,106,0.25)]" : "text-sand hover:text-gold"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t.nav.products}
            </Link>
            <Link
              href="/products?category=tops"
              className={`rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition border border-transparent hover:bg-gold/10 hover:border-gold/40 ${isTopsActive ? "text-gold bg-gold/15 shadow-[0_0_0_1px_rgba(215,180,106,0.25)]" : "text-sand hover:text-gold"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Tops
            </Link>
            <Link
              href="/products?category=pants"
              className={`rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition border border-transparent hover:bg-gold/10 hover:border-gold/40 ${isPantsActive ? "text-gold bg-gold/15 shadow-[0_0_0_1px_rgba(215,180,106,0.25)]" : "text-sand hover:text-gold"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Pants
            </Link>
            <Link
              href="/checkout"
              className="rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] bg-gold text-ink transition hover:bg-gold/90 border border-gold hover:border-gold/60 mt-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t.nav.checkout}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
