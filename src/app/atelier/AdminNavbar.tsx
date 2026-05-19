"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LanguageToggle from "@/components/LanguageToggle";
import { logoutAdmin } from "./actions";

function Icon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    main: (
      <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10.5L12 4l8 6.5V20H4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
    products: (
      <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18v10H3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
    categories: (
      <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2"/></svg>
    ),
    deals: (
      <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
    ),
    coupons: (
      <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
    ),
    orders: (
      <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18v12H3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
    ),
    events: (
      <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/></svg>
    ),
  };
  return icons[name] ?? null;
}

export default function AdminNavbar({ token, isArabic }: { token: string; isArabic: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: `/atelier?admin_token=${encodeURIComponent(token)}`, label: isArabic ? "الرئيسية" : "Main", key: "main" },
    { href: `/atelier/products?admin_token=${encodeURIComponent(token)}`, label: isArabic ? "المنتجات" : "Products", key: "products" },
    { href: `/atelier/categories?admin_token=${encodeURIComponent(token)}`, label: isArabic ? "المجموعات" : "Categories", key: "categories" },
    { href: `/atelier/deals?admin_token=${encodeURIComponent(token)}`, label: isArabic ? "العروض" : "Deals", key: "deals" },
    { href: `/atelier/coupons?admin_token=${encodeURIComponent(token)}`, label: isArabic ? "الكوبونات" : "Coupons", key: "coupons" },
    { href: `/atelier/orders?admin_token=${encodeURIComponent(token)}`, label: isArabic ? "الطلبات" : "Orders", key: "orders" },
    { href: `/atelier/events?admin_token=${encodeURIComponent(token)}`, label: isArabic ? "الفعاليات" : "Events", key: "events" },
  ];

  const crumbs = pathname?.split("/").filter(Boolean) ?? [];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-gold/20 bg-stone/80 px-4 py-2 text-sm font-semibold text-gold">ADMIN</div>
          <div className="hidden sm:block text-sand/70 text-sm">{isArabic ? "لوحة التحكم" : "Administration"}</div>
          <nav aria-label={isArabic ? "مسار الصفحة" : "Breadcrumb"} className="hidden md:flex items-center gap-2 text-sand/50 text-sm ml-3">
            {crumbs.map((c) => (
              <span key={c} className="capitalize">{c.replace(/[-_]/g, " ")}</span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <form action={logoutAdmin}>
              <button className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                {isArabic ? "تسجيل الخروج" : "Sign Out"}
              </button>
            </form>
            <div className="h-8 w-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-semibold">AD</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            className="sm:hidden rounded p-2 border border-gold/20"
            aria-label={isArabic ? "فتح قائمة التنقل" : "Toggle navigation menu"}
            aria-expanded={open}
            aria-controls="admin-navbar-menu"
          >
            <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      <nav id="admin-navbar-menu" aria-label={isArabic ? "التنقل الإداري" : "Admin navigation"} className={`gap-2 ${open ? "flex flex-col items-stretch" : "hidden"} sm:flex sm:flex-row sm:items-center overflow-x-auto`}>
        {links.map((l) => {
          const active = pathname?.startsWith(l.href.split("?", 1)[0]);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? "bg-gold text-ink shadow" : "border border-gold/20 bg-obsidian text-sand"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="opacity-70">{<Icon name={l.key} />}</span>
              <span>{l.label}</span>
            </Link>
          );
        })}

        <div className="sm:hidden mt-2 flex items-center justify-between gap-2">
          <LanguageToggle />
          <form action={logoutAdmin}>
            <button className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {isArabic ? "تسجيل الخروج" : "Sign Out"}
            </button>
          </form>
        </div>
      </nav>
    </div>
  );
}
