"use client";

import Image from "next/image";
import { useLanguage } from "./SiteProviders";

type LanguageToggleProps = {
  compact?: boolean;
};

export default function LanguageToggle({ compact = false }: LanguageToggleProps) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className={`inline-flex items-center rounded-full border border-gold/25 bg-obsidian/75 p-1 ${compact ? "gap-1" : "gap-1.5"}`}>
      <button
        type="button"
        onClick={() => setLocale("ar")}
        title="العربية"
        className={`inline-flex items-center rounded-full transition ${compact ? "gap-1 px-2 py-1" : "gap-2 px-3 py-1.5"} ${locale === "ar" ? "bg-gold/20 text-gold" : "text-sand/70 hover:bg-gold/10 hover:text-gold"}`}
      >
        <Image
          src="/flag-egypt.svg"
          alt="Egypt Flag"
          width={24}
          height={16}
          className="h-4 w-6 rounded-sm object-cover"
        />
        <span className={`font-semibold uppercase tracking-[0.15em] ${compact ? "text-[0.62rem]" : "text-[0.68rem]"}`}>AR</span>
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        title="English"
        className={`inline-flex items-center rounded-full transition ${compact ? "gap-1 px-2 py-1" : "gap-2 px-3 py-1.5"} ${locale === "en" ? "bg-gold/20 text-gold" : "text-sand/70 hover:bg-gold/10 hover:text-gold"}`}
      >
        <Image
          src="/flag-uk.svg"
          alt="UK Flag"
          width={24}
          height={16}
          className="h-4 w-6 rounded-sm object-cover"
        />
        <span className={`font-semibold uppercase tracking-[0.15em] ${compact ? "text-[0.62rem]" : "text-[0.68rem]"}`}>EN</span>
      </button>
    </div>
  );
}
