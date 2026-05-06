"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import type { Product } from "@/lib/types";
import { createOrder } from "./actions";

type CheckoutClientProps = {
  product: Product | null;
};

export default function CheckoutClient({ product }: CheckoutClientProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "wallet">("cod");
  const [quantity, setQuantity] = useState(1);
  const [estimatedTotal, setEstimatedTotal] = useState(
    product ? product.price : 0,
  );

  const subtotal = product
    ? product.price * Math.max(quantity, 1)
    : Math.max(estimatedTotal, 0);
  const discount =
    paymentMethod === "wallet" ? subtotal * siteConfig.walletDiscount : 0;
  const total = Math.max(subtotal - discount, 0);

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          action={createOrder}
          encType="multipart/form-data"
          className="flex flex-col gap-6 rounded-3xl border border-gold/20 bg-stone/80 p-8 temple-panel"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
              {t.checkout.subtitle}
            </p>
            <h1 className="font-display text-3xl tracking-[0.2em] text-gold">
              {t.checkout.title}
            </h1>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                {t.checkout.name}
              </label>
              <input
                name="name"
                required
                className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                {t.checkout.phone}
              </label>
              <input
                name="phone"
                required
                className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                  {t.checkout.city}
                </label>
                <input
                  name="city"
                  required
                  className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                  {t.checkout.address}
                </label>
                <input
                  name="address"
                  required
                  className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                  {t.checkout.district}
                </label>
                <input
                  name="district"
                  required
                  className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                  {t.checkout.landmark}
                </label>
                <input
                  name="landmark"
                  className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                  {t.checkout.building}
                </label>
                <input
                  name="building_number"
                  className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                  {t.checkout.floor}
                </label>
                <input
                  name="floor"
                  className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                  {t.checkout.apartment}
                </label>
                <input
                  name="apartment"
                  className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                />
              </div>
            </div>
            {!product && (
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                  {t.checkout.items}
                </label>
                <textarea
                  name="items_detail"
                  required
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                />
              </div>
            )}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                {t.checkout.notes}
              </label>
              <textarea
                name="notes"
                rows={3}
                className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
              />
            </div>
          </div>

          {product && (
            <div className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-4 text-sm text-sand/80">
              <div className="flex items-center justify-between">
                <span>{locale === "ar" ? product.name_ar : product.name_en}</span>
                <span>{formatCurrency(product.price, locale)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                  {t.checkout.qty}
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Number(event.target.value) || 1)
                  }
                  className="w-20 rounded-xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand"
                />
              </div>
            </div>
          )}

          {!product && (
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                {t.checkout.estTotal}
              </label>
              <input
                type="number"
                name="estimated_total"
                min={0}
                value={estimatedTotal}
                onChange={(event) =>
                  setEstimatedTotal(Number(event.target.value) || 0)
                }
                className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
              />
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
              {t.checkout.payment}
            </label>
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sand">
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                {t.checkout.cod}
              </label>
              <label className="flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sand">
                <input
                  type="radio"
                  name="payment_method"
                  value="wallet"
                  checked={paymentMethod === "wallet"}
                  onChange={() => setPaymentMethod("wallet")}
                />
                {t.checkout.wallet}
              </label>
            </div>
          </div>

          {paymentMethod === "wallet" && (
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-sand/70">
                {t.checkout.receipt}
              </label>
              <input
                type="file"
                name="receipt"
                accept="image/*"
                required
                className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
              />
            </div>
          )}

          <input type="hidden" name="product_id" value={product?.id ?? ""} />
          {product && <input type="hidden" name="quantity" value={quantity} />}

          <button
            type="submit"
            className="mt-4 rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
          >
            {t.checkout.place}
          </button>
        </form>

        <div className="flex flex-col gap-6 rounded-3xl border border-gold/20 bg-stone/80 p-8 temple-panel">
          <h2 className="font-display text-2xl tracking-[0.2em] text-gold">
            {t.checkout.total}
          </h2>
          <div className="space-y-3 text-sm text-sand/70">
            <div className="flex items-center justify-between">
              <span>{t.checkout.total}</span>
              <span>{formatCurrency(subtotal, locale)}</span>
            </div>
            <div className="flex items-center justify-between text-gold">
              <span>{t.checkout.discount}</span>
              <span>-{formatCurrency(discount, locale)}</span>
            </div>
            <div className="border-t border-gold/10 pt-3 text-lg font-semibold text-gold">
              {formatCurrency(total, locale)}
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-sand/60">
            {t.payment.shipping}
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
