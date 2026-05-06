"use client";

import { copy } from "@/lib/i18n";
import { useLanguage } from "./SiteProviders";
import { siteConfig } from "@/lib/site-config";

export default function SiteFooter() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <footer className="border-t border-gold/10 bg-obsidian px-6 py-12 text-sand">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="font-display text-xl tracking-[0.2em] text-gold">
            {siteConfig.brand}
          </div>
          <p className="text-sm text-sand/70">{t.hero.subtitle}</p>
        </div>
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">
              {t.sections.payment}
            </div>
            <p className="mt-2 text-sand/70">{t.payment.body}</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">
              {t.sections.policy}
            </div>
            <p className="mt-2 text-sand/70">{t.policy.body}</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">
              {t.sections.wholesale}
            </div>
            <p className="mt-2 text-sand/70">
              {t.wholesale.body} ({siteConfig.whatsapp.wholesale})
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
