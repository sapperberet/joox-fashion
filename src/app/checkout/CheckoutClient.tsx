"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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

const INSTAPAY_LINK = "https://ipn.eg/S/youssefelasyoutyjoox/instapay/4dRPrW";
const INSTAPAY_HANDLE = "youssefelasyoutyjoox@instapay";

type CheckoutClientProps = {
  product: Product | null;
};

export default function CheckoutClient({ product }: CheckoutClientProps) {
  const { locale } = useLanguage();
  const router = useRouter();
  const t = copy[locale];
  const { items, coupon, clearCart, updateQuantity, removeItem } = useCart();

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

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "wallet" | "instapay">("cod");
  const [quantity, setQuantity] = useState(() => (product ? normalizeQuantity(minQty) : 1));
  const [estimatedTotal, setEstimatedTotal] = useState(product ? product.price : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);

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
          cart_key: product.id,
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
    ? items.some((item) => {
        const stockQty = item.stock_qty ?? null;
        return stockQty !== null && (stockQty <= 0 || item.quantity > stockQty);
      })
    : stockQty !== null && (stockQty <= 0 || quantity > stockQty);

  useEffect(() => {
    return () => {
      if (receiptPreviewUrl) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }
    };
  }, [receiptPreviewUrl]);

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);

      if (useCartMode) {
        formData.append(
          "cart_items_json",
          JSON.stringify(
            items.map((item) => ({
              id: item.id,
              cart_key: item.cart_key,
              quantity: item.quantity,
              unit_price: item.price,
              variant: item.variant,
            })),
          ),
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
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:gap-10 sm:px-6 sm:py-16 lg:grid lg:grid-cols-[1fr_1fr] lg:gap-8">
        <form
          action={handleSubmit}
          className="flex flex-col gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-4 sm:gap-6 sm:p-8 temple-panel"
        >
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-gold/80 mb-2 flex items-center justify-center gap-2">
              <span>◇◇◇</span> {t.checkout.subtitle} <span>◇◇◇</span>
            </p>
            <h1 className="font-display text-2xl sm:text-3xl tracking-[0.2em] text-gold flex items-center justify-center gap-3">
              <span>𓋹</span> {t.checkout.title} <span>𓂀</span>
            </h1>
          </div>

          <div className="grid gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/70 block mb-2 font-semibold">{t.checkout.name}</label>
              <input name="name" required className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition" placeholder={t.checkout.name} />
            </div>
            <div>
              <label className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/70 block mb-2 font-semibold">{t.checkout.phone}</label>
              <input name="phone" required type="tel" className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition" placeholder={t.checkout.phone} />
            </div>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/70 block mb-2 font-semibold">{t.checkout.city}</label>
                <input name="city" required className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition" placeholder={t.checkout.city} />
              </div>
              <div>
                <label className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/70 block mb-2 font-semibold">{t.checkout.address}</label>
                <input name="address" required className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition" placeholder={t.checkout.address} />
              </div>
            </div>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/70 block mb-2 font-semibold">{t.checkout.district}</label>
                <input name="district" required className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition" placeholder={t.checkout.district} />
              </div>
              <div>
                <label className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/70 block mb-2 font-semibold">{t.checkout.landmark}</label>
                <input name="landmark" className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition" placeholder={t.checkout.landmark} />
              </div>
            </div>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/70 block mb-2 font-semibold">{t.checkout.building}</label>
                <input name="building_number" type="text" pattern="[0-9]*" inputMode="numeric" className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition" placeholder={t.checkout.building} />
              </div>
              <div>
                <label className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/70 block mb-2 font-semibold">{t.checkout.floor}</label>
                <input name="floor" type="text" pattern="[0-9]*" inputMode="numeric" className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition" placeholder={t.checkout.floor} />
              </div>
              <div>
                <label className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/70 block mb-2 font-semibold">{t.checkout.apartment}</label>
                <input name="apartment" type="text" pattern="[0-9]*" inputMode="numeric" className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition" placeholder={t.checkout.apartment} />
              </div>
            </div>

            {!useCartMode && !product && (
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70 block mb-2">{t.checkout.items}</label>
                <textarea name="items_detail" required rows={3} className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition resize-none" placeholder={t.checkout.items} />
              </div>
            )}

            <div>
              <label className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/70 block mb-2 font-semibold">{t.checkout.notes}</label>
              <textarea name="notes" className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition resize-none" rows={4} placeholder={t.checkout.notes} />
            </div>
          </div>

          {!useCartMode && !product && (
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-sand/70">{t.checkout.estTotal}</label>
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="decimal"
                name="estimated_total"
                value={estimatedTotal}
                onChange={(event) => {
                  const numVal = parseFloat(event.target.value) || 0;
                  setEstimatedTotal(Math.max(numVal, 0));
                }}
                className="mt-2 w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand placeholder:text-sand/40 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition"
              />
            </div>
          )}

          <div className="rounded-2xl border-2 border-gold/20 bg-obsidian/40 p-4">
            <label className="text-xs uppercase tracking-[0.2em] text-gold/80 block mb-4 font-semibold">{t.checkout.payment}</label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 rounded-xl border-2 border-gold/20 bg-obsidian px-4 py-3 cursor-pointer hover:border-gold/40 transition">
                <input 
                  type="radio" 
                  name="payment_method" 
                  value="cod" 
                  checked={paymentMethod === "cod"} 
                  onChange={() => setPaymentMethod("cod")}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-sm font-semibold text-sand">💵 {t.checkout.cod}</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border-2 border-gold/20 bg-obsidian px-4 py-3 cursor-pointer hover:border-gold/40 transition">
                <input 
                  type="radio" 
                  name="payment_method" 
                  value="wallet" 
                  checked={paymentMethod === "wallet"} 
                  onChange={() => setPaymentMethod("wallet")}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-sm font-semibold text-sand">📱 {t.checkout.wallet}</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border-2 border-gold/20 bg-obsidian px-4 py-3 cursor-pointer hover:border-gold/40 transition">
                <input 
                  type="radio" 
                  name="payment_method" 
                  value="instapay" 
                  checked={paymentMethod === "instapay"} 
                  onChange={() => setPaymentMethod("instapay")}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-sm font-semibold text-sand">💳 {t.checkout.instapay}</span>
              </label>
            </div>
          </div>

          {paymentMethod === "wallet" && (
            <div className="rounded-2xl border-2 border-gold/20 bg-obsidian/70 p-4 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-gold/80 font-semibold">{t.checkout.walletInfoTitle}</div>
                <p className="mt-2 text-sm text-sand/80">{t.checkout.walletInfoBody}</p>
                {walletNumbers.length ? (
                  <div className="mt-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-sand/60 font-semibold">{t.checkout.walletNumbers}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {walletNumbers.map((number) => (
                        <span key={number} className="rounded-lg border-2 border-gold/30 bg-obsidian px-3 py-2 text-sm font-mono text-gold">{number}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-sand/60">
                    Wallet numbers are not set yet. Contact us on WhatsApp to get the number.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70 block mb-3 font-semibold">{t.checkout.receipt}</label>
                <div className="relative">
                  <input
                    type="file"
                    name="receipt"
                    accept="image/*"
                    required
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        setReceiptFileName(null);
                        if (receiptPreviewUrl) {
                          URL.revokeObjectURL(receiptPreviewUrl);
                        }
                        setReceiptPreviewUrl(null);
                        return;
                      }

                      setReceiptFileName(file.name);
                      if (receiptPreviewUrl) {
                        URL.revokeObjectURL(receiptPreviewUrl);
                      }
                      setReceiptPreviewUrl(URL.createObjectURL(file));
                    }}
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                    id="receipt-upload"
                  />
                  <label
                    htmlFor="receipt-upload"
                    className="block w-full rounded-2xl border-2 border-dashed border-gold/30 bg-obsidian/70 px-4 py-6 sm:py-8 text-sm text-sand text-center cursor-pointer hover:bg-obsidian hover:border-gold/50 transition"
                  >
                    <div className="text-3xl mb-2">📸</div>
                    <div className="font-semibold text-gold mb-1">{t.checkout.receipt}</div>
                    <p className="text-xs text-sand/60">PNG, JPG or GIF (max. 10MB)</p>
                  </label>
                </div>
              </div>

              {receiptFileName && (
                <div className="rounded-2xl border-2 border-gold/40 bg-linear-to-br from-gold/10 to-gold/5 p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl leading-none text-emerald">✓</div>
                    <div className="flex-1">
                      <div className="font-semibold text-emerald text-sm">{t.checkout.receiptSelected}</div>
                      <p className="text-xs text-sand/70 mt-1">{receiptFileName}</p>
                    </div>
                  </div>
                  {receiptPreviewUrl && (
                    <div className="mt-4">
                      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gold/70 font-semibold">{t.checkout.receiptPreview}</p>
                      <div className="relative h-48 rounded-xl overflow-hidden border border-gold/30 bg-obsidian/60">
                        <Image src={receiptPreviewUrl} alt="Receipt" fill className="object-contain" unoptimized />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {paymentMethod === "instapay" && (
            <div className="rounded-2xl border-2 border-gold/20 bg-obsidian/70 p-4 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-gold/80 font-semibold mb-3">{t.checkout.instapayInfo}</div>
                <div className="rounded-lg bg-obsidian border border-gold/20 p-3 mb-3">
                  <div className="text-xs text-sand/60 mb-1">Instapay Handle</div>
                  <div className="font-mono text-gold font-bold">{INSTAPAY_HANDLE}</div>
                </div>
                <a
                  href={INSTAPAY_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-xl bg-linear-to-r from-gold/80 to-gold/90 px-4 py-3 text-center font-semibold text-ink uppercase tracking-[0.2em] text-sm hover:from-gold hover:to-gold transition"
                >
                  🔗 {t.checkout.instapayButton}
                </a>
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-sand/70 block mb-3 font-semibold">{t.checkout.receipt}</label>
                <div className="relative">
                  <input
                    type="file"
                    name="receipt"
                    accept="image/*"
                    required
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        setReceiptFileName(null);
                        if (receiptPreviewUrl) {
                          URL.revokeObjectURL(receiptPreviewUrl);
                        }
                        setReceiptPreviewUrl(null);
                        return;
                      }

                      setReceiptFileName(file.name);
                      if (receiptPreviewUrl) {
                        URL.revokeObjectURL(receiptPreviewUrl);
                      }
                      setReceiptPreviewUrl(URL.createObjectURL(file));
                    }}
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                    id="instapay-receipt-upload"
                  />
                  <label
                    htmlFor="instapay-receipt-upload"
                    className="block w-full rounded-2xl border-2 border-dashed border-gold/30 bg-obsidian/70 px-4 py-6 sm:py-8 text-sm text-sand text-center cursor-pointer hover:bg-obsidian hover:border-gold/50 transition"
                  >
                    <div className="text-3xl mb-2">📸</div>
                    <div className="font-semibold text-gold mb-1">{t.checkout.receipt}</div>
                    <p className="text-xs text-sand/60">Upload confirmation screenshot</p>
                  </label>
                </div>
              </div>

              {receiptFileName && (
                <div className="rounded-2xl border-2 border-gold/40 bg-linear-to-br from-gold/10 to-gold/5 p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl leading-none text-emerald">✓</div>
                    <div className="flex-1">
                      <div className="font-semibold text-emerald text-sm">{t.checkout.receiptSelected}</div>
                      <p className="text-xs text-sand/70 mt-1">{receiptFileName}</p>
                    </div>
                  </div>
                  {receiptPreviewUrl && (
                    <div className="mt-4">
                      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gold/70 font-semibold">{t.checkout.receiptPreview}</p>
                      <div className="relative h-48 rounded-xl overflow-hidden border border-gold/30 bg-obsidian/60">
                        <Image src={receiptPreviewUrl} alt="Receipt" fill className="object-contain" unoptimized />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isOutOfStock || isSubmitting || (useCartMode && items.length === 0) || (paymentMethod !== "cod" && !receiptFileName)}
            className="mt-4 rounded-full bg-gold px-6 py-4 text-base sm:text-lg font-semibold uppercase tracking-[0.2em] text-ink disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center w-full hover:bg-gold/90 transition"
          >
            {isSubmitting ? "🔄 Processing..." : `✓ ${t.checkout.place}`}
          </button>
        </form>

        <div className="flex flex-col gap-4">
          <div className="sticky top-24 rounded-3xl border border-gold/20 bg-stone/80 p-6 sm:p-8 space-y-4 temple-panel">
            <div className="text-sm uppercase tracking-[0.3em] text-gold font-semibold flex items-center gap-2">
              <span>🛒</span> {t.checkout.cartSummary}
            </div>

            {useCartMode && items.length > 0 ? (
              <>
                <div className="max-h-64 overflow-y-auto space-y-3 border-b border-gold/10 pb-4">
                  {items.map((item) => {
                    const lineTotal = calculateLineTotal(item);
                    const cartKey = item.cart_key ?? item.id;
                    return (
                      <div key={cartKey} className="rounded-lg border border-gold/10 bg-obsidian/50 p-3">
                        <div className="flex gap-3">
                          <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-obsidian border border-gold/10">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={locale === "ar" ? item.name_ar : item.name_en}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-sand truncate">
                              {locale === "ar" ? item.name_ar : item.name_en}
                            </h4>
                            {item.variant_label && (
                              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-gold/70 truncate">
                                {item.variant_label}
                              </p>
                            )}
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      updateQuantity(cartKey, item.quantity - 1);
                                    }
                                  }}
                                  className="h-5 w-5 rounded border border-gold/20 bg-obsidian text-xs text-gold hover:border-gold/50 transition"
                                >
                                  −
                                </button>
                                <span className="text-xs font-semibold text-sand w-4 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const max = item.stock_qty ?? null;
                                    if (max === null || item.quantity < max) {
                                      updateQuantity(cartKey, item.quantity + 1);
                                    }
                                  }}
                                  className="h-5 w-5 rounded border border-gold/20 bg-obsidian text-xs text-gold hover:border-gold/50 transition"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  removeItem(cartKey);
                                }}
                                className="text-xs text-red-400 hover:text-red-300 transition font-semibold"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center text-xs text-sand/70 border-t border-gold/10 pt-2">
                          <span>{formatCurrency(item.price, locale)} × {item.quantity}</span>
                          <span className="font-semibold text-gold">{formatCurrency(lineTotal.total, locale)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 border-b border-gold/10 pb-4">
                  <div className="flex justify-between text-sm text-sand/80">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartTotals.subtotal, locale)}</span>
                  </div>
                  {coupon && couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-emerald">
                      <span>Coupon ({coupon.code})</span>
                      <span>-{formatCurrency(couponDiscount, locale)}</span>
                    </div>
                  )}
                  {paymentMethod === "wallet" && walletDiscount > 0 && (
                    <div className="flex justify-between text-sm text-emerald">
                      <span>Wallet Discount</span>
                      <span>-{formatCurrency(walletDiscount, locale)}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-linear-to-r from-gold/10 to-gold/5 border border-gold/20 p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sand">Total</span>
                    <span className="text-xl font-bold text-gold">{formatCurrency(total, locale)}</span>
                  </div>
                </div>

                <div className="text-xs text-sand/60 bg-obsidian/50 rounded-lg p-2 text-center">
                  Items: {items.reduce((sum, item) => sum + item.quantity, 0)} | {items.length} Product{items.length !== 1 ? "s" : ""}
                </div>
              </>
            ) : !useCartMode && product ? (
              <>
                <div className="rounded-lg border border-gold/20 bg-obsidian/50 p-4 space-y-4">
                  <div className="relative h-40 rounded-lg overflow-hidden bg-obsidian border border-gold/10">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={locale === "ar" ? product.name_ar : product.name_en}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sand text-sm">{locale === "ar" ? product.name_ar : product.name_en}</h3>
                    <p className="text-xs text-sand/60 mt-1">{locale === "ar" ? product.description_ar : product.description_en}</p>
                  </div>
                </div>

                <div className="space-y-2 border-b border-gold/10 pb-4">
                  <div className="flex justify-between text-sm text-sand/80">
                    <span>Price</span>
                    <span>{formatCurrency(product.price, locale)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-sand/80">
                    <span>Quantity</span>
                    <span>× {quantity}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-linear-to-r from-gold/10 to-gold/5 border border-gold/20 p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sand">Total</span>
                    <span className="text-xl font-bold text-gold">{formatCurrency(subtotal, locale)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-gold/10 bg-obsidian/50 p-6 text-center">
                <p className="text-sm text-sand/60">{t.checkout.cartEmpty}</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


