"use client";

import { useLanguage } from "./SiteProviders";
import { copy } from "@/lib/i18n";
import { siteConfig, toWhatsappLink } from "@/lib/site-config";

export default function FloatingWhatsapp() {
  const { locale } = useLanguage();
  const t = copy[locale];
  const link = toWhatsappLink(
    siteConfig.whatsapp.wholesale,
    locale === "ar" ? "طلب جملة من جوكس فاشون" : "Wholesale inquiry for Joox Fashion",
  );

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className={`fixed bottom-6 z-50 inline-flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-linear-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(6,95,70,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(6,95,70,0.55)] ${
        locale === "ar" ? "left-6" : "right-6"
      }`}
      aria-label={t.sections.wholesale}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="19" height="19" fill="currentColor" aria-hidden="true">
          <path d="M19.11 17.33c-.27-.14-1.56-.77-1.8-.85-.24-.09-.42-.14-.6.14-.18.27-.69.85-.85 1.03-.15.18-.31.2-.58.07-.27-.14-1.13-.42-2.15-1.35-.79-.7-1.32-1.57-1.47-1.84-.15-.27-.02-.41.11-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.14-.6-1.45-.82-1.98-.22-.52-.44-.45-.6-.46-.15-.01-.34-.01-.52-.01-.18 0-.47.07-.72.34-.24.27-.94.92-.94 2.24 0 1.32.96 2.6 1.1 2.78.14.18 1.89 2.89 4.58 4.05.64.28 1.14.45 1.53.58.64.2 1.23.17 1.69.1.52-.08 1.56-.64 1.78-1.25.22-.61.22-1.14.15-1.25-.06-.11-.24-.18-.51-.31z"/>
          <path d="M16 3C8.83 3 3 8.83 3 16c0 2.3.61 4.55 1.77 6.53L3 29l6.67-1.74A12.93 12.93 0 0 0 16 29c7.17 0 13-5.83 13-13S23.17 3 16 3zm0 23.7c-2.02 0-3.98-.54-5.69-1.56l-.41-.24-3.95 1.03 1.06-3.86-.27-.43A10.64 10.64 0 0 1 5.3 16C5.3 10.1 10.1 5.3 16 5.3c5.9 0 10.7 4.8 10.7 10.7 0 5.9-4.8 10.7-10.7 10.7z"/>
        </svg>
      </span>
      <div className="flex flex-col leading-tight text-left">
        <span className="text-[0.64rem] font-bold uppercase tracking-[0.18em]">WhatsApp</span>
        <span className="text-[0.73rem] text-emerald-50">{t.wholesale.cta}</span>
      </div>
    </a>
  );
}
