"use client";

import Link from "next/link";
import { copy } from "@/lib/i18n";
import { useLanguage } from "./SiteProviders";
import LanguageToggle from "./LanguageToggle";
import LogoLockup from "./LogoLockup";

export default function SiteHeader() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <header className="temple-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="shrink-0">
          <LogoLockup />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold uppercase tracking-[0.2em] text-sand md:flex">
          <a href="/#collections" className="hover:text-gold">
            {t.nav.collections}
          </a>
          <a href="/#summer" className="hover:text-gold">
            {t.nav.summer}
          </a>
          <a href="/#winter" className="hover:text-gold">
            {t.nav.winter}
          </a>
          <a href="/#payment" className="hover:text-gold">
            {t.nav.payment}
          </a>
          <a href="/#policy" className="hover:text-gold">
            {t.nav.policy}
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="hidden rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 sm:inline-flex"
          >
            {t.nav.products}
          </Link>
          <Link
            href="/checkout"
            className="rounded-full bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90"
          >
            {t.nav.checkout}
          </Link>
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
