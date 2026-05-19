"use client";

import Image from "next/image";
import { useLanguage } from "./SiteProviders";

type LanguageToggleProps = {
  compact?: boolean;
};

export default function LanguageToggle({ compact = false }: LanguageToggleProps) {
  const { locale, setLocale } = useLanguage();

  const languages = {
    ar: {
      code: "AR",
      detail: "EG",
      label: "Arabic",
      title: "العربية",
      flagAlt: "Egypt Flag",
    },
    en: {
      code: "EN",
      detail: "GB",
      label: "English",
      title: "English",
      flagAlt: "UK Flag",
    },
  } as const;

  return (
    <div className={`inline-flex items-center rounded-full border border-gold/25 bg-obsidian/75 p-1 ${compact ? "gap-1" : "gap-1.5"}`}>
      <button
        type="button"
        onClick={() => setLocale("ar")}
        title={languages.ar.title}
        aria-pressed={locale === "ar"}
        aria-label="Switch language to Arabic"
        className={`inline-flex items-center rounded-full transition ${compact ? "gap-1.5 px-2.5 py-1.5" : "gap-2.5 px-3 py-1.5"} ${locale === "ar" ? "bg-gold/20 text-gold" : "text-sand/70 hover:bg-gold/10 hover:text-gold"}`}
      >
        <Image
          src="/flag-egypt.svg"
          alt={languages.ar.flagAlt}
          width={24}
          height={16}
          className="h-4 w-6 rounded-sm object-cover"
        />
        <span className="flex flex-col items-start leading-none">
          <span className={`font-semibold uppercase tracking-[0.15em] ${compact ? "text-[0.62rem]" : "text-[0.68rem]"}`}>
            {languages.ar.code} · {languages.ar.detail}
          </span>
          {!compact && <span className="text-[0.55rem] uppercase tracking-[0.18em] text-sand/55">{languages.ar.label}</span>}
        </span>
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        title={languages.en.title}
        aria-pressed={locale === "en"}
        aria-label="Switch language to English"
        className={`inline-flex items-center rounded-full transition ${compact ? "gap-1.5 px-2.5 py-1.5" : "gap-2.5 px-3 py-1.5"} ${locale === "en" ? "bg-gold/20 text-gold" : "text-sand/70 hover:bg-gold/10 hover:text-gold"}`}
      >
        <Image
          src="/flag-uk.svg"
          alt={languages.en.flagAlt}
          width={24}
          height={16}
          className="h-4 w-6 rounded-sm object-cover"
        />
        <span className="flex flex-col items-start leading-none">
          <span className={`font-semibold uppercase tracking-[0.15em] ${compact ? "text-[0.62rem]" : "text-[0.68rem]"}`}>
            {languages.en.code} · {languages.en.detail}
          </span>
          {!compact && <span className="text-[0.55rem] uppercase tracking-[0.18em] text-sand/55">{languages.en.label}</span>}
        </span>
      </button>
    </div>
  );
}
