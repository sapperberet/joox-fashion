"use client";

import { useLanguage } from "./SiteProviders";
import { copy } from "@/lib/i18n";
import { siteConfig, toWhatsappLink } from "@/lib/site-config";

export default function FloatingWhatsapp() {
  const { locale } = useLanguage();
  const t = copy[locale];
  const link = toWhatsappLink(
    siteConfig.whatsapp.wholesale,
    locale === "ar"
      ? "طلب جملة من جوكس فاشون"
      : "Wholesale inquiry for Joox Fashion",
  );

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className={`fixed bottom-6 z-50 inline-flex items-center gap-2 rounded-full bg-emerald px-4 py-3 text-lg font-semibold text-ink shadow-2xl transition hover:scale-[1.05] ${
        locale === "ar" ? "left-6" : "right-6"
      }`}
      aria-label={t.sections.wholesale}
    >
      <span>💬</span>
      <span className="text-xs">{t.wholesale.cta}</span>
    </a>
  );
}
