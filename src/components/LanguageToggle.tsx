"use client";

import { useLanguage } from "./SiteProviders";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-gold transition hover:bg-black/40"
    >
      {locale === "en" ? "AR" : "EN"}
    </button>
  );
}
