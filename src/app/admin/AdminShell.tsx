"use client";

import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import { copy } from "@/lib/i18n";
import { useLanguage } from "@/components/SiteProviders";

type AdminShellProps = {
  title: string;
  active: "customers" | "entries" | "search" | "reviews" | "scores";
  children: React.ReactNode;
  flash?: {
    kind?: "success" | "error" | "info";
    code?: string;
  } | null;
};

export default function AdminShell({ title, active, children, flash }: AdminShellProps) {
  const { locale } = useLanguage();
  const t = copy[locale].admin;
  const flashMessage = flash?.code ? t.flash[flash.code as keyof typeof t.flash] ?? flash.code : "";
  const flashClass =
    flash?.kind === "error"
      ? "border-red-500/30 bg-red-950/60 text-red-100"
      : flash?.kind === "success"
        ? "border-emerald-500/30 bg-emerald-950/50 text-emerald-100"
        : "border-gold/20 bg-obsidian/70 text-sand";

  return (
    <div className="relative">
      <header className="sticky top-0 z-40 border-b border-gold/10 bg-obsidian/90 backdrop-blur">
        <div className="mx-auto flex max-w-300 flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">
              {t.title}
            </Link>
            <span className="text-xs uppercase tracking-[0.2em] text-sand/50">{t.subtitle}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-gold/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/10"
            >
              {copy[locale].nav.home}
            </Link>
            <LanguageToggle />
          </div>
        </div>
        <div className="border-t border-gold/10">
          <div className="mx-auto flex max-w-300 flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
            <Tab href="/admin/customers" label={t.tabs.customers} active={active === "customers"} />
            <Tab href="/admin/entries" label={t.tabs.entries} active={active === "entries"} />
            <Tab href="/admin/search" label={t.tabs.search} active={active === "search"} />
            <Tab href="/admin/reviews" label={t.tabs.reviews} active={active === "reviews"} />
            <Tab href="/admin/scores" label={t.tabs.scores} active={active === "scores"} />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-300 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl tracking-[0.2em] text-gold">{title}</h1>
              <p className="mt-2 text-sm text-sand/70">{t.subtitle}</p>
            </div>
          </div>
          {flashMessage ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${flashClass}`}>
              {flashMessage}
            </div>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
        active ? "bg-gold text-ink font-semibold" : "border border-gold/30 text-gold hover:bg-gold/10"
      }`}
    >
      {label}
    </Link>
  );
}
