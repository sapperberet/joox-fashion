"use client";

import { useLanguage } from "./SiteProviders";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      title={locale === "en" ? "العربية" : "English"}
      className="inline-flex items-center justify-center rounded-full border border-gold/40 bg-black/20 w-10 h-10 text-xl transition hover:bg-black/40 hover:border-gold/60"
    >
      {locale === "en" ? "🇪🇬" : "🇬🇧"}
    </button>
  );
}
