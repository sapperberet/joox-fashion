"use client";

import Image from "next/image";
import { useLanguage } from "./SiteProviders";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      title={locale === "en" ? "العربية" : "English"}
      className="inline-flex items-center justify-center rounded-full px-3.5 py-2.5 sm:px-4 sm:py-2.5 bg-black/20 transition hover:bg-black/40"
    >
      {locale === "en" ? (
        <Image
          src="/flag-egypt.svg"
          alt="Egypt Flag"
          width={32}
          height={20}
          className="h-5 w-8 object-cover rounded-sm"
        />
      ) : (
        <Image
          src="/flag-uk.svg"
          alt="UK Flag"
          width={32}
          height={20}
          className="h-5 w-8 object-cover rounded-sm"
        />
      )}
    </button>
  );
}
