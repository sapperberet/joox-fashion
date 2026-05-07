"use client";

import Link from "next/link";
import { useState } from "react";
import { copy } from "@/lib/i18n";
import { useLanguage } from "./SiteProviders";
import LanguageToggle from "./LanguageToggle";
import LogoLockup from "./LogoLockup";
import { useCart } from "./CartProvider";

export default function SiteHeader() {
  const { locale } = useLanguage();
  const t = copy[locale];
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/#collections", label: t.nav.collections },
    { href: "/#summer", label: t.nav.summer },
    { href: "/#winter", label: t.nav.winter },
    { href: "/#payment", label: t.nav.payment },
    { href: "/#policy", label: t.nav.policy },
  ];

  return (
    <header className="temple-header sticky top-0 z-40 border-b border-gold/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
        <Link href="/" className="shrink-0">
          <LogoLockup />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-[0.2em] text-sand md:gap-8 lg:flex">
          {navLinks.map((link) => (
            <a 
              key={link.href}
              href={link.href} 
              className="hover:text-gold transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Cart Icon */}
          <Link
            href="/cart"
            className="relative md:hidden rounded-full border border-gold/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10"
          >
            {t.nav.cart}
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[0.65rem] font-semibold text-ink">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Desktop Buttons */}
          <Link
            href="/products"
            className="hidden rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 md:inline-flex"
          >
            {t.nav.products}
          </Link>
          <Link
            href="/cart"
            className="relative hidden rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 md:inline-flex"
          >
            {t.nav.cart}
            {itemCount > 0 && (
              <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[0.6rem] font-semibold text-ink">
                {itemCount}
              </span>
            )}
          </Link>
          <Link
            href="/checkout"
            className="rounded-full bg-gold px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90 sm:px-4 sm:py-2"
          >
            {t.nav.checkout}
          </Link>

          <LanguageToggle />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-full border border-gold/40 px-3 py-2 text-gold transition hover:bg-gold/10"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gold/10 bg-obsidian/95 backdrop-blur md:hidden">
          <div className="flex flex-col gap-2 px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-sand transition hover:bg-gold/10 hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/products"
              className="rounded-lg px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-sand transition hover:bg-gold/10 hover:text-gold md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t.nav.products}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
