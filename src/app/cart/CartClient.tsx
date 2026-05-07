"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/components/SiteProviders";
import { useCart } from "@/components/CartProvider";
import { copy } from "@/lib/i18n";
import { calculateCartTotals, normalizeCartQuantity } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";

export default function CartClient() {
  const { locale } = useLanguage();
  const t = copy[locale];
  const { items, updateQuantity, removeItem, clearCart, coupon, setCoupon } =
    useCart();
  const [couponInput, setCouponInput] = useState(coupon?.code ?? "");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const totals = calculateCartTotals(items, coupon);

  const handleApplyCoupon = async () => {
    setCouponMessage(null);
    const code = couponInput.trim();
    if (!code) {
      setCoupon(null);
      return;
    }

    const response = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      setCouponMessage(
        locale === "ar" ? "الكوبون غير صالح" : "Invalid coupon code",
      );
      setCoupon(null);
      return;
    }

    const payload = (await response.json()) as {
      valid: boolean;
      coupon?: { code: string; type: "percent" | "fixed"; value: number };
      min_subtotal?: number | null;
    };

    if (!payload.valid || !payload.coupon) {
      setCouponMessage(
        locale === "ar" ? "الكوبون غير صالح" : "Invalid coupon code",
      );
      setCoupon(null);
      return;
    }

    setCoupon({
      code: payload.coupon.code,
      type: payload.coupon.type,
      value: payload.coupon.value,
      min_subtotal: payload.min_subtotal ?? null,
    });
    setCouponMessage(
      locale === "ar" ? "تم تطبيق الكوبون" : "Coupon applied",
    );
  };

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl tracking-[0.2em] text-gold">
              {t.nav.cart}
            </h1>
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold"
              >
                {locale === "ar" ? "تفريغ السلة" : "Clear cart"}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="rounded-3xl border border-gold/20 bg-stone/80 p-10 text-center text-sand/70 temple-panel">
              {t.products.empty}
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-3xl border border-gold/15 bg-stone/80 p-5 temple-panel md:grid-cols-[96px_1fr_auto]"
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-ink/40">
                    {item.image_url && (
                      <Image
                        src={item.image_url}
                        alt={locale === "ar" ? item.name_ar : item.name_en}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-lg font-semibold text-sand">
                      {locale === "ar" ? item.name_ar : item.name_en}
                    </div>
                    <div className="text-sm text-sand/60">
                      {formatCurrency(item.price, locale)}
                    </div>
                    {item.stock_qty !== null && item.stock_qty !== undefined && (
                      <div className="text-xs uppercase tracking-[0.2em] text-sand/50">
                        {item.stock_qty <= 0
                          ? t.checkout.outOfStock
                          : `${t.checkout.total}: ${item.stock_qty}`}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <input
                      type="number"
                      min={Math.max(item.min_order_qty ?? 1, 1)}
                      step={Math.max(item.order_multiple ?? 1, 1)}
                      max={item.max_order_qty ?? item.stock_qty ?? undefined}
                      value={item.quantity}
                      onChange={(event) =>
                        updateQuantity(
                          item.id,
                          normalizeCartQuantity(
                            item,
                            Number(event.target.value),
                          ),
                        )
                      }
                      className="w-20 rounded-xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-full border border-gold/30 px-3 py-2 text-xs uppercase tracking-[0.2em] text-gold"
                    >
                      {locale === "ar" ? "إزالة" : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-6 rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <h2 className="font-display text-2xl tracking-[0.2em] text-gold">
            {t.checkout.total}
          </h2>
          <div className="space-y-3 text-sm text-sand/70">
            <div className="flex items-center justify-between">
              <span>{t.checkout.total}</span>
              <span>{formatCurrency(totals.subtotal, locale)}</span>
            </div>
            {totals.bundleDiscount > 0 && (
              <div className="flex items-center justify-between text-gold">
                <span>{locale === "ar" ? "خصم الباندل" : "Bundle discount"}</span>
                <span>-{formatCurrency(totals.bundleDiscount, locale)}</span>
              </div>
            )}
            {totals.couponDiscount > 0 && (
              <div className="flex items-center justify-between text-gold">
                <span>{locale === "ar" ? "خصم الكوبون" : "Coupon discount"}</span>
                <span>-{formatCurrency(totals.couponDiscount, locale)}</span>
              </div>
            )}
            <div className="border-t border-gold/10 pt-3 text-lg font-semibold text-gold">
              {formatCurrency(totals.total, locale)}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs uppercase tracking-[0.2em] text-sand/60">
              {locale === "ar" ? "كود الخصم" : "Coupon code"}
            </label>
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                className="flex-1 rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold"
              >
                {locale === "ar" ? "تطبيق" : "Apply"}
              </button>
            </div>
            {couponMessage && (
              <p className="text-xs text-sand/60">{couponMessage}</p>
            )}
          </div>

          <Link
            href="/checkout"
            className="rounded-full bg-gold px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink"
          >
            {t.nav.checkout}
          </Link>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
