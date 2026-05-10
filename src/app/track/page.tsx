"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";

export default function TrackPage() {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const id = orderId.trim().toUpperCase().replace("JOOX-", "");
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        throw new Error(t.track.notFound);
      }
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ["new", "confirmed", "packed", "shipped", "delivered"];
    return steps.indexOf(status.toLowerCase());
  };

  const currentStep = order ? getStatusStep(order.status) : -1;

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-16 md:py-24">
        <div className="flex flex-col gap-8">
          <div className="space-y-4 text-center">
            <h1 className="font-display text-3xl tracking-[0.2em] text-gold sm:text-4xl">
              {t.track.title}
            </h1>
            <p className="text-sand/70">{t.track.subtitle}</p>
          </div>

          <form onSubmit={handleTrack} className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder={t.track.inputPlaceholder}
              className="flex-1 rounded-full border border-gold/30 bg-obsidian/60 px-6 py-4 text-sand placeholder:text-sand/30 focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-gold px-8 py-4 font-bold uppercase tracking-[0.2em] text-ink transition-all hover:bg-gold/90 active:scale-95 disabled:opacity-50"
            >
              {loading ? "..." : t.track.button}
            </button>
          </form>

          {error && (
            <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-center text-red-400">
              {error}
            </div>
          )}

          {order && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 sm:p-8 temple-panel">
                <div className="flex flex-col justify-between gap-4 border-b border-gold/10 pb-6 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-sand/60">
                      {t.thankYou.reference}
                    </p>
                    <p className="text-xl font-bold text-gold">JOOX-{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-sand/60">
                      {t.track.status}
                    </p>
                    <p className="text-lg font-bold text-gold capitalize">
                      {t.track[`status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}` as keyof typeof t.track] || order.status}
                    </p>
                  </div>
                </div>

                <div className="mt-12">
                  <div className="relative flex justify-between">
                    <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-gold/20" />
                    <div
                      className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-gold transition-all duration-1000"
                      style={{ width: `${(currentStep / 4) * 100}%` }}
                    />

                    { ["new", "confirmed", "packed", "shipped", "delivered"].map((step, idx) => (
                      <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                            idx <= currentStep
                              ? "border-gold bg-gold text-ink"
                              : "border-gold/30 bg-obsidian text-sand/30"
                          }`}
                        >
                          {idx <= currentStep ? "✓" : idx + 1}
                        </div>
                        <span className={`text-[0.6rem] font-bold uppercase tracking-widest ${idx <= currentStep ? "text-gold" : "text-sand/30"} hidden sm:block`}>
                          {t.track[`status${step.charAt(0).toUpperCase() + step.slice(1)}` as keyof typeof t.track] || step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12 grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-[0.3em] text-gold/80 font-bold">
                      {t.track.shippingStatus}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-sand/60">{t.track.provider}:</span>
                        <span className="text-sand">{order.shipping_provider || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sand/60">{t.track.trackingNumber}:</span>
                        <span className="text-sand font-mono">{order.shipping_tracking_number || "—"}</span>
                      </div>
                      {order.shipping_tracking_number && order.shipping_provider === "Bosta" && (
                        <a
                          href={`https://tracking.bosta.co/track/${order.shipping_tracking_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-gold underline underline-offset-4"
                        >
                          {t.track.trackOnCourier}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-[0.3em] text-gold/80 font-bold">
                      {t.track.details}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-sand/60">{t.checkout.total}:</span>
                        <span className="text-gold font-bold">{formatCurrency(order.total, locale)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sand/60">{t.checkout.payment}:</span>
                        <span className="text-sand">{t.checkout[order.payment_method as keyof typeof t.checkout] || order.payment_method}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 sm:p-8 temple-panel">
                <h3 className="mb-6 text-xs uppercase tracking-[0.3em] text-gold font-bold">
                  {t.track.items}
                </h3>
                <div className="divide-y divide-gold/10">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        {item.image_url && (
                          <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-obsidian/40">
                            <img
                              src={item.image_url}
                              alt={item.name_en}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sand">{locale === "ar" ? item.name_ar : item.name_en}</p>
                          <p className="text-xs text-sand/60">
                            {item.variant_label ? (locale === "ar" ? item.variant_label_ar : item.variant_label_en) : ""}
                            {item.variant_label && " • "}
                            {t.checkout.qty}: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-gold">{formatCurrency(item.price * item.quantity, locale)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
