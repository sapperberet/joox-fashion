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
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-20">
        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-10">
          <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
            {t.thankYou.reference}
          </p>
          <h1 className="mt-4 font-display text-3xl tracking-[0.2em] text-gold">
            {t.thankYou.title}
          </h1>
          <p className="mt-4 text-sand/70">{t.thankYou.body}</p>
          {orderId && (
            <div className="mt-6 rounded-2xl border border-gold/20 bg-obsidian/70 px-4 py-3 text-sm text-gold">
              {orderId}
            </div>
          )}
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full border border-gold/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold"
          >
            {t.thankYou.cta}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
