"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useLanguage } from "@/components/SiteProviders";
import { useCart } from "@/components/CartProvider";
import { calculateCartTotals, normalizeCartQuantity } from "@/lib/cart";
import { copy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";

export default function CartSidebar() {
  const { locale } = useLanguage();
  const t = copy[locale];
  const { items, updateQuantity, removeItem, coupon } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totals = useMemo(
    () => calculateCartTotals(items, coupon, []),
    [items, coupon],
  );

  return (
    <aside className="hidden lg:block fixed right-6 top-24 z-30 w-80">
      <div className="rounded-3xl border border-gold/20 bg-linear-to-br from-obsidian/90 to-stone/80 p-5 shadow-2xl temple-panel">
        <div className="flex items-center justify-between gap-3 border-b border-gold/10 pb-3">
          <div className="text-xs uppercase tracking-[0.3em] text-gold/70">
            {t.nav.cart}
          </div>
          <div className="rounded-full border border-gold/30 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-gold">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 text-sm text-sand/60">
            {t.checkout.cartEmpty}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => {
                const cartKey = item.cart_key ?? item.id;
                return (
                  <div key={cartKey} className="rounded-2xl border border-gold/10 bg-obsidian/60 p-3">
                    <div className="flex gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gold/10 bg-obsidian">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={locale === "ar" ? item.name_ar : item.name_en}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-sand">
                          {locale === "ar" ? item.name_ar : item.name_en}
                        </div>
                        {item.variant_label && (
                          <div className="mt-1 truncate text-[0.6rem] uppercase tracking-[0.2em] text-gold/70">
                            {item.variant_label}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={String(item.quantity)}
                            onChange={(event) =>
                              updateQuantity(
                                cartKey,
                                normalizeCartQuantity(item, Number(event.target.value)),
                              )
                            }
                            className="h-6 w-12 rounded border border-gold/20 bg-obsidian px-2 text-center text-xs text-sand"
                            aria-label={t.checkout.qty}
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(cartKey)}
                            className="text-[0.65rem] uppercase tracking-[0.2em] text-red-300 hover:text-red-200"
                          >
                            {t.checkout.remove}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 border-t border-gold/10 pt-3 text-sm text-sand/70">
              <div className="flex items-center justify-between">
                <span>{t.checkout.total}</span>
                <span>{formatCurrency(totals.subtotal, locale)}</span>
              </div>
              {totals.couponDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald">
                  <span>Coupon</span>
                  <span>-{formatCurrency(totals.couponDiscount, locale)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base font-semibold text-gold">
                <span>{t.checkout.total}</span>
                <span>{formatCurrency(totals.total, locale)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-gold px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90"
            >
              {t.nav.checkout}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
