"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/components/SiteProviders";
import { useCart } from "@/components/CartProvider";
import { copy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { calculateCartTotals, calculateLineTotal } from "@/lib/cart";
import { siteConfig, toWhatsappLink } from "@/lib/site-config";
import type { Product } from "@/lib/types";
import { createOrder } from "./actions";

type CheckoutClientProps = {
  product: Product | null;
};

export default function CheckoutClient({ product }: CheckoutClientProps) {
  const { locale } = useLanguage();
  const router = useRouter();
  const t = copy[locale];
  const { items, coupon, clearCart } = useCart();

  const minQty = Math.max(product?.min_order_qty ?? 1, 1);
  const orderMultiple = Math.max(product?.order_multiple ?? 1, 1);
  const stockQty = product?.stock_qty ?? null;
  const maxQtyCandidate = product?.max_order_qty ?? null;
  const maxQty = maxQtyCandidate ?? stockQty ?? null;

  const normalizeQuantity = (value: number) => {
    if (!product) {
      return 1;
    }

    const safe = Number.isFinite(value) ? Math.floor(value) : minQty;
    let next = Math.max(safe, minQty);

    if (orderMultiple > 1) {
      const remainder = (next - minQty) % orderMultiple;
      if (remainder !== 0) {
        next = next - remainder + orderMultiple;
      }
    }

    if (maxQty !== null && Number.isFinite(maxQty)) {
      next = Math.min(next, maxQty);
    }

    return next;
  };

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "wallet">("cod");
  const [quantity, setQuantity] = useState(() => (product ? normalizeQuantity(minQty) : 1));
  const [estimatedTotal, setEstimatedTotal] = useState(product ? product.price : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const useCartMode = items.length > 0;
  const walletNumbers = [siteConfig.wallets.orange, siteConfig.wallets.vodafone].filter(Boolean);
  const walletFallbackLink = toWhatsappLink(
    siteConfig.whatsapp.orders,
    "I need the wallet number for payment",
  );

  const cartTotals = useMemo(() => calculateCartTotals(items, coupon), [items, coupon]);

  const subtotal = useCartMode
    ? cartTotals.subtotal
    : product
      ? calculateLineTotal({
          id: product.id,
          slug: product.slug,
          name_en: product.name_en,
          name_ar: product.name_ar,
          price: product.price,
          image_url: product.image_url,
          quantity: Math.max(quantity, 1),
          stock_qty: product.stock_qty ?? null,
          min_order_qty: product.min_order_qty ?? null,
          max_order_qty: product.max_order_qty ?? null,
          order_multiple: product.order_multiple ?? null,
          bundle_qty: product.bundle_qty ?? null,
          bundle_price: product.bundle_price ?? null,
        }).total
      : Math.max(estimatedTotal, 0);

  const couponDiscount = useCartMode ? cartTotals.couponDiscount : 0;
  const walletDiscount = paymentMethod === "wallet" ? subtotal * siteConfig.walletDiscount : 0;
  const total = Math.max(subtotal - walletDiscount - couponDiscount, 0);

  const isOutOfStock = useCartMode
    ? items.some((item) => item.stock_qty !== null && (item.stock_qty <= 0 || item.quantity > item.stock_qty))
    : stockQty !== null && (stockQty <= 0 || quantity > stockQty);

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);

      if (useCartMode) {
        formData.append(
          "cart_items_json",
          JSON.stringify(items.map((item) => ({ id: item.id, quantity: item.quantity }))),
        );
        if (coupon) {
          formData.append("coupon_code", coupon.code);
        }
      } else {
        formData.append("product_id", product?.id ?? "");
        formData.append("quantity", String(quantity));
      }

      const result = await createOrder(formData);

      if (!result.success) {
        alert(result.error || "Failed to place order.");
        return;
      }

      if (useCartMode) {
        clearCart();
      }

      router.push(`/thank-you?order=${result.orderId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          action={handleSubmit}
          className="flex flex-col gap-6 rounded-3xl border border-gold/20 bg-stone/80 p-8 temple-panel"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gold/80">{t.checkout.subtitle}</p>
            <h1 className="font-display text-3xl tracking-[0.2em] text-gold">{t.checkout.title}</h1>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.name}</label>
              <input name="name" required className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.phone}</label>
              <input name="phone" required className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.city}</label>
                <input name="city" required className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.address}</label>
                <input name="address" required className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.district}</label>
                <input name="district" required className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.landmark}</label>
                <input name="landmark" className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.building}</label>
                <input name="building_number" className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.floor}</label>
                <input name="floor" className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.apartment}</label>
                <input name="apartment" className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
              </div>
            </div>

            {!useCartMode && !product && (
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.items}</label>
                <textarea name="items_detail" required rows={3} className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
              </div>
            )}

            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.notes}</label>
              <textarea name="notes" rows={3} className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
            </div>
          </div>

          {useCartMode && (
            <div className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-4 text-sm text-sand/80">
              <div className="mb-4 flex items-center justify-between border-b border-gold/10 pb-3">
                <span className="text-xs uppercase tracking-[0.2em] text-gold/80">{"Cart items"}</span>
                <span>{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{locale === "ar" ? item.name_ar : item.name_en}</div>
                      <div className="text-xs text-sand/60">x{item.quantity}</div>
                    </div>
                    <div className="text-right">{formatCurrency(calculateLineTotal(item).total, locale)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!useCartMode && product && (
            <div className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-4 text-sm text-sand/80">
              <div className="flex items-center justify-between">
                <span>{locale === "ar" ? product.name_ar : product.name_en}</span>
                <span>{formatCurrency(product.price, locale)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.qty}</label>
                <input
                  type="number"
                  min={minQty}
                  step={orderMultiple}
                  max={maxQty ?? undefined}
                  value={quantity}
                  onChange={(event) => setQuantity(normalizeQuantity(Number(event.target.value)))}
                  className="w-20 rounded-xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand"
                />
              </div>
            </div>
          )}

          {!useCartMode && !product && (
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.estTotal}</label>
              <input
                type="number"
                name="estimated_total"
                min={0}
                value={estimatedTotal}
                onChange={(event) => setEstimatedTotal(Number(event.target.value) || 0)}
                className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
              />
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.payment}</label>
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sand">
                <input type="radio" name="payment_method" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                {t.checkout.cod}
              </label>
              <label className="flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sand">
                <input type="radio" name="payment_method" value="wallet" checked={paymentMethod === "wallet"} onChange={() => setPaymentMethod("wallet")} />
                {t.checkout.wallet}
              </label>
            </div>
          </div>

          {paymentMethod === "wallet" && (
            <div>
              <div className="rounded-2xl border border-gold/20 bg-obsidian/70 p-4 text-sm text-sand/80">
                <div className="text-xs uppercase tracking-[0.2em] text-gold/80">{t.checkout.walletInfoTitle}</div>
                <p className="mt-2">{t.checkout.walletInfoBody}</p>
                {walletNumbers.length ? (
                  <div className="mt-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-sand/60">{t.checkout.walletNumbers}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {walletNumbers.map((number) => (
                        <span key={number} className="rounded-full border border-gold/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">{number}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-sand/60">
                    {"Wallet numbers are not set yet. Contact us on WhatsApp to get the number."}
                  </p>
                )}
              </div>
              <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.receipt}</label>
              <input type="file" name="receipt" accept="image/*" required className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
              <p className="mt-2 text-xs text-sand/60">
                {t.checkout.walletUploadHelp}{" "}
                {!walletNumbers.length && (
                  <a href={walletFallbackLink} className="text-gold">{"WhatsApp"}</a>
                )}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isOutOfStock || isSubmitting || (useCartMode && items.length === 0)}
            className="mt-4 rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : t.checkout.place}
          </button>
        </form>

        <div className="flex flex-col gap-6 rounded-3xl border border-gold/20 bg-stone/80 p-8 temple-panel">
          <h2 className="font-display text-2xl tracking-[0.2em] text-gold">{"Order summary"}</h2>
          <div className="space-y-3 text-sm text-sand/70">
            <div className="flex items-center justify-between">
              <span>{"Subtotal"}</span>
              <span>{formatCurrency(subtotal, locale)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-gold">
                <span>{"Coupon discount"}</span>
                <span>-{formatCurrency(couponDiscount, locale)}</span>
              </div>
            )}
            {walletDiscount > 0 && (
              <div className="flex items-center justify-between text-gold">
                <span>{t.checkout.discount}</span>
                <span>-{formatCurrency(walletDiscount, locale)}</span>
              </div>
            )}
            <div className="border-t border-gold/10 pt-3 text-lg font-semibold text-gold">{formatCurrency(total, locale)}</div>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-sand/60">{t.payment.shipping}</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


