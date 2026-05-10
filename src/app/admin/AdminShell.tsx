"use client";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LanguageToggle from "@/components/LanguageToggle";
import { copy } from "@/lib/i18n";
import { useLanguage } from "@/components/SiteProviders";

type AdminShellProps = {
  title: string;
  active: "customers" | "entries" | "search" | "reviews";
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
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl tracking-[0.2em] text-gold">{title}</h1>
              <p className="mt-2 text-sm text-sand/70">{t.subtitle}</p>
            </div>
            <LanguageToggle />
          </div>
          {flashMessage ? (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${flashClass}`}>
              {flashMessage}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Tab href="/admin/customers" label={t.tabs.customers} active={active === "customers"} />
          <Tab href="/admin/entries" label={t.tabs.entries} active={active === "entries"} />
          <Tab href="/admin/search" label={t.tabs.search} active={active === "search"} />
          <Tab href="/admin/reviews" label={t.tabs.reviews} active={active === "reviews"} />
        </div>
        {children}
      </main>
      <SiteFooter />
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
