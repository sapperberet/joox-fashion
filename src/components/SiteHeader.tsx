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
        <nav className="hidden items-center gap-6 text-sm font-semibold uppercase tracking-[0.2em] text-sand md:gap-8 lg:flex">
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
            title={t.nav.cart}
            className="relative md:hidden rounded-full border border-gold/40 px-3 py-2.5 text-lg transition hover:bg-gold/10 inline-flex items-center justify-center hover:border-gold/60"
          >
            🛒
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-xs font-semibold text-ink">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Desktop Buttons */}
          <Link
            href="/products"
            className="hidden rounded-full border border-gold/40 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 hover:border-gold/60 md:inline-flex items-center justify-center"
          >
            {t.nav.products}
          </Link>
          <Link
            href="/cart"
            title={t.nav.cart}
            className="relative hidden rounded-full border border-gold/40 px-4 py-2.5 text-lg transition hover:bg-gold/10 hover:border-gold/60 md:inline-flex items-center justify-center"
          >
            🛒
            {itemCount > 0 && (
              <span className="ml-2 rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-ink">
                {itemCount}
              </span>
            )}
          </Link>
          {/* Mobile Language Toggle */}
          <div className="md:hidden">
            <LanguageToggle />
          </div>

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
          <nav className="flex flex-col gap-1 px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-sand transition hover:bg-gold/10 hover:text-gold border border-transparent hover:border-gold/40"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/products"
              className="rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-sand transition hover:bg-gold/10 hover:text-gold border border-transparent hover:border-gold/40"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t.nav.products}
            </Link>
            <Link
              href="/checkout"
              className="rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] bg-gold text-ink transition hover:bg-gold/90 border border-gold hover:border-gold/60 mt-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t.nav.checkout}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
