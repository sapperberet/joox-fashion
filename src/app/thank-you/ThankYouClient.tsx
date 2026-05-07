"use client";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";

type ThankYouClientProps = {
  orderId?: string;
};

export default function ThankYouClient({ orderId }: ThankYouClientProps) {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 sm:px-6 py-8 sm:py-20">
        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 sm:p-10 space-y-4 sm:space-y-6">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-gold/80">
              {t.thankYou.reference}
            </p>
            <h1 className="mt-3 sm:mt-4 font-display text-3xl sm:text-4xl md:text-5xl tracking-[0.2em] text-gold leading-tight">
              {t.thankYou.title}
            </h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-sand/70 leading-relaxed">{t.thankYou.body}</p>
          {orderId && (
            <div className="rounded-2xl border border-gold/20 bg-obsidian/70 px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base text-gold font-mono break-all">
              {orderId}
            </div>
          )}
          <Link
            href="/"
            className="inline-flex rounded-full border border-gold/40 px-5 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 items-center justify-center"
          >
            {t.thankYou.cta}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
