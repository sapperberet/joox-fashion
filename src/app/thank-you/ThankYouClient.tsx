"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/types";

type ThankYouClientProps = {
  orderId?: string;
};

export default function ThankYouClient({ orderId }: ThankYouClientProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const isArabic = locale === "ar";
  const paymentStepMessage = order?.payment_method
    ? order.payment_method === "cod"
      ? isArabic
        ? "جهّز المبلغ عند الاستلام وسيتم التأكيد عبر واتساب."
        : "Prepare cash on delivery; we will confirm via WhatsApp."
      : isArabic
        ? "تم استلام الإيصال وسيتم التحقق من الدفع قبل الشحن."
        : "We received your receipt and will verify payment before shipping."
    : isArabic
      ? "سيتم تأكيد طلبك قريباً."
      : "We will confirm your order shortly.";

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getPaymentStatusColor = (status?: string | null) => {
    switch (status) {
      case "paid":
        return "bg-emerald/20 text-emerald border-emerald/30";
      case "pending":
        return "bg-gold/20 text-gold border-gold/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-sand/10 text-sand/70 border-sand/20";
    }
  };

  const getShippingStatusColor = (status?: string | null) => {
    switch (status) {
      case "delivered":
        return "bg-emerald/20 text-emerald border-emerald/30";
      case "in_transit":
        return "bg-gold/20 text-gold border-gold/30";
      case "created":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-sand/10 text-sand/70 border-sand/20";
    }
  };

  const getStatusLabel = (status?: string | null) => {
    const labels: Record<string, string> = {
      "paid": "• Paid",
      "pending": "◌ Pending",
      "failed": "× Failed",
      "delivered": "• Delivered",
      "in_transit": "» In Transit",
      "created": "○ Created",
    };
    return labels[status ?? ""] || (status?.toUpperCase() ?? "PENDING");
  };

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 py-8 sm:py-20">
        <div style={{ background: "linear-gradient(135deg, rgba(28,24,20,0.92), rgba(12,10,8,0.95))" }} className="rounded-3xl border-2 border-gold/20 p-6 sm:p-10 space-y-6 sm:space-y-8 temple-panel">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald/20 border-2 border-emerald">
                <span className="text-3xl">•</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-gold/80">
              {t.thankYou.reference}
            </p>
            <h1 className="mt-3 sm:mt-4 font-display text-3xl sm:text-4xl md:text-5xl tracking-[0.2em] text-gold leading-tight">
              {t.thankYou.title}
            </h1>
                <p className="text-xl font-bold text-gold break-all">{order.id}</p>
              {t.thankYou.body}
            </p>
          </div>

          {orderId && (
            <div style={{ background: "linear-gradient(90deg, rgba(12,10,8,0.85), rgba(28,24,20,0.75))" }} className="rounded-2xl border-2 border-gold/40 p-4 sm:p-6">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.4em] text-gold/70 font-semibold">
                  📋 Order Reference
                </p>
                <p className="mt-3 font-mono text-sm sm:text-lg font-bold text-gold break-all">
                  {orderId}
                </p>
                <p className="mt-2 text-xs text-sand/60">
                  You will receive a WhatsApp confirmation shortly
                </p>
              </div>
            </div>
          )}

          <div style={{ background: "linear-gradient(135deg, rgba(12,10,8,0.86), rgba(28,24,20,0.7))" }} className="rounded-2xl border-2 border-gold/30 p-5 sm:p-6">
            <h3 className="text-sm uppercase tracking-[0.3em] text-gold font-semibold mb-3">
              {isArabic ? "الخطوات التالية" : "Next steps"}
            </h3>
            <ul className="space-y-2 text-sm text-sand/70">
              <li>
                {isArabic
                  ? "احتفظ برقم الطلب لمتابعة حالتك لاحقاً."
                  : "Save your order reference for tracking."}
              </li>
              <li>
                {paymentStepMessage}
              </li>
              <li>
                {isArabic
                  ? "يمكنك تتبع الشحنة من صفحة التتبع في أي وقت."
                  : "You can track the shipment from the tracking page anytime."}
              </li>
            </ul>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gold/20 bg-obsidian/60 px-4 sm:px-6 py-8 sm:py-10 text-center text-sand/60 animate-pulse">
              Loading order details...
            </div>
          ) : order ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div style={{ background: "linear-gradient(90deg, rgba(12,10,8,0.72), rgba(28,24,20,0.55))" }} className="rounded-2xl border border-gold/20 p-4 sm:p-6 space-y-3">
                  <h3 className="text-sm uppercase tracking-[0.3em] text-gold font-semibold flex items-center gap-2">
                    <span>👤</span> Customer Info
                  </h3>
                  <div className="space-y-2 text-sm text-sand/80">
                    <div>
                      <span className="text-sand/60 text-xs">Name</span>
                      <div className="font-medium">{order.customer_name}</div>
                    </div>
                    <div>
                      <span className="text-sand/60 text-xs">Phone</span>
                      <div className="font-mono text-xs">{order.phone}</div>
                    </div>
                    <div className="pt-2 border-t border-gold/10">
                      <span className="text-sand/60 text-xs">Delivery To</span>
                      <div className="text-xs mt-1 leading-relaxed">
                        {order.address}
                        {order.building_number && `, Building ${order.building_number}`}
                        {order.floor && `, Floor ${order.floor}`}
                        {order.apartment && `, Apt ${order.apartment}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: "linear-gradient(90deg, rgba(12,10,8,0.72), rgba(28,24,20,0.55))" }} className="rounded-2xl border border-gold/20 p-4 sm:p-6 space-y-3">
                  <h3 className="text-sm uppercase tracking-[0.3em] text-gold font-semibold flex items-center gap-2">
                    <span>💰</span> Order Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-sand/80">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(order.subtotal, locale)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald">
                        <span>Discount:</span>
                        <span>-{formatCurrency(order.discount, locale)}</span>
                      </div>
                    )}
                    {order.coupon_discount && order.coupon_discount > 0 && (
                      <div className="flex justify-between text-emerald">
                        <span>Coupon:</span>
                        <span>-{formatCurrency(order.coupon_discount, locale)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gold/10 flex justify-between font-bold text-gold text-base">
                      <span>Total:</span>
                      <span>{formatCurrency(order.total, locale)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: "linear-gradient(135deg, rgba(12,10,8,0.72), rgba(28,24,20,0.55))" }} className="rounded-2xl border border-gold/20 p-4 sm:p-6 space-y-3">
                  <h3 className="text-sm uppercase tracking-[0.3em] text-gold font-semibold flex items-center gap-2">
                    <span>📊</span> Status
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-sand/60">Payment</span>
                      <div className={`mt-1 px-3 py-1.5 rounded-lg border text-xs font-bold text-center ${getPaymentStatusColor(order.payment_status)}`}>
                        {getStatusLabel(order.payment_status)}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-sand/60">Shipping</span>
                      <div className={`mt-1 px-3 py-1.5 rounded-lg border text-xs font-bold text-center ${getShippingStatusColor(order.shipping_state)}`}>
                        {getStatusLabel(order.shipping_state)}
                      </div>
                    </div>
                    <div className="text-xs text-sand/60 pt-2 border-t border-gold/10">
                      <span>Method: <span className="text-sand font-semibold">{order.payment_method.toUpperCase()}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {order.shipping_tracking_number && (
                <div style={{ background: "linear-gradient(90deg, rgba(12,10,8,0.85), rgba(28,24,20,0.75))" }} className="rounded-2xl border-2 border-gold/30 p-4 sm:p-6">
                  <div className="text-sm text-sand/60 mb-2">🚚 Tracking Number</div>
                  <div className="font-mono text-lg font-bold text-gold break-all">
                    {order.shipping_tracking_number}
                  </div>
                  {order.shipping_provider && (
                    <div className="text-xs text-sand/60 mt-2">
                      via {order.shipping_provider}
                    </div>
                  )}
                </div>
              )}

              {order.receipt_url && (
                <div style={{ background: "linear-gradient(135deg, rgba(12,10,8,0.85), rgba(28,24,20,0.75))" }} className="rounded-2xl border-2 border-gold/30 p-4 sm:p-6">
                  <h3 className="text-sm uppercase tracking-[0.3em] text-gold font-semibold mb-4 flex items-center gap-2">
                    <span>📸</span> Payment Receipt
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden border-2 border-gold/20 bg-obsidian">
                      <Image
                        src={order.receipt_url}
                        alt="Payment receipt"
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-col justify-center gap-3">
                      <div className="rounded-lg bg-gold/10 border border-gold/20 p-4">
                        <div className="text-xs text-sand/60 mb-1">Receipt uploaded</div>
                        <div className="text-emerald font-semibold">• Confirmed</div>
                      </div>
                      <p className="text-sm text-sand/70">
                        Your payment receipt has been received and is being processed. You'll receive a confirmation via WhatsApp when payment is verified.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {Array.isArray(order.items) && order.items.length > 0 && (
                <div className="rounded-2xl border border-gold/20 bg-obsidian/60 p-4 sm:p-6">
                  <h3 className="text-sm uppercase tracking-[0.3em] text-gold font-semibold mb-4 flex items-center gap-2">
                    <span>📦</span> Order Items ({order.items.length})
                  </h3>
                  <div className="space-y-3">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center rounded-lg bg-obsidian/50 p-3 border border-gold/10">
                        <div className="flex-1">
                          <div className="font-semibold text-sand">{item.name_en || item.name_ar}</div>
                          <div className="text-xs text-sand/60">Qty: {item.quantity} × {formatCurrency(item.unit_price, locale)}</div>
                        </div>
                        <div className="text-sm font-bold text-gold">{formatCurrency(item.line_total, locale)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
            <Link
              href="/"
              className="rounded-full bg-gold px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90 text-center inline-flex items-center justify-center gap-2"
            >
              🏠 {t.thankYou.cta}
            </Link>
            <Link
              href="/track"
              className="rounded-full border-2 border-gold/40 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 text-center inline-flex items-center justify-center gap-2"
            >
              📦 {isArabic ? "تتبع الطلب" : "Track order"}
            </Link>
            <a
              href="https://wa.me/+201064482371"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-gold/40 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 text-center inline-flex items-center justify-center gap-2"
            >
              💬 Contact Us
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


