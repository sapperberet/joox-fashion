"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/i18n";
import { useLanguage } from "./SiteProviders";
import { siteConfig } from "@/lib/site-config";

export default function SiteFooter() {
  const { locale } = useLanguage();
  const router = useRouter();
  const t = copy[locale];
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const startHoldTimer = () => {
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      router.push(siteConfig.adminRoute);
    }, 3000);
  };

  return (
    <footer className="border-t border-gold/10 bg-obsidian px-4 py-8 sm:px-6 sm:py-12 text-sand">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8 md:gap-6">
        <div className="flex flex-col gap-2">
          <div className="font-display text-2xl sm:text-3xl tracking-[0.2em] text-gold">
            {siteConfig.brand}
          </div>
          <p className="text-sm sm:text-base text-sand/70 leading-relaxed">{t.hero.subtitle}</p>
        </div>
        <div className="grid gap-6 text-sm sm:text-base md:grid-cols-3 md:gap-6">
          <div className="space-y-3">
            <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold font-semibold flex items-center gap-2">
              𓋹 {t.sections.payment}
            </div>
            <p className="text-sand/70 leading-relaxed text-sm sm:text-base">{t.payment.body}</p>
          </div>
          <div className="space-y-3">
            <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold font-semibold flex items-center gap-2">
              {t.sections.policy}
            </div>
            <p className="text-sand/70 leading-relaxed text-sm sm:text-base">{t.policy.body}</p>
          </div>
          <div className="space-y-3">
            <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold font-semibold flex items-center gap-2">
              {t.sections.wholesale}
            </div>
            <p className="text-sand/70 leading-relaxed text-sm sm:text-base">
              {t.wholesale.body} ({siteConfig.whatsapp.wholesale})
            </p>
          </div>
        </div>
        <div className="border-t border-gold/10 pt-4 sm:pt-6 mt-4 sm:mt-6">
          <p
            className="text-xs text-sand/60 text-center select-none cursor-pointer transition hover:text-gold"
            onPointerDown={startHoldTimer}
            onPointerUp={clearHoldTimer}
            onPointerLeave={clearHoldTimer}
            onPointerCancel={clearHoldTimer}
            title="Hold for 3 seconds"
          >
            ◆ &copy; {new Date().getFullYear()} {siteConfig.brand} ◆ All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
