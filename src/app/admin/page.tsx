"use client";

import Link from "next/link";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";

export default function AdminIndexPage() {
  const { locale } = useLanguage();
  const t = copy[locale].admin;
  const isArabic = locale === "ar";
  const sections = [
    {
      href: "/admin/reviews",
      title: isArabic ? "التقييمات" : "Reviews",
      subtitle: isArabic ? "إدارة تقييمات المنتجات وإظهارها" : "Moderate product feedback and visibility",
      icon: "★",
    },
    {
      href: "/admin/customers",
      title: isArabic ? "العملاء" : "Customers",
      subtitle: isArabic ? "متابعة النقاط والملفات الشخصية" : "View customer score, points, and profile data",
      icon: "◉",
    },
    {
      href: "/admin/entries",
      title: isArabic ? "الطلبات الجديدة" : "Entries",
      subtitle: isArabic ? "مراجعة الطلبات الجديدة" : "Inspect new entries and latest actions",
      icon: "▣",
    },
    {
      href: "/admin/search",
      title: isArabic ? "بحث" : "Search",
      subtitle: isArabic ? "بحث سريع في الطلبات والعملاء" : "Find orders, customers, and content fast",
      icon: "⌕",
    },
    {
      href: "/admin/scores",
      title: isArabic ? "النقاط" : "Scores",
      subtitle: isArabic ? "متابعة النقاط والكوبونات" : "Review points, tiers, and coupon claims",
      icon: "●",
    },
    {
      href: "/atelier",
      title: isArabic ? "إدارة المتجر" : "Commerce Admin",
      subtitle: isArabic ? "المنتجات والكوبونات والعروض" : "Products, coupons, deals, and fulfillment",
      icon: "●",
    },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-300 px-6 py-14">
      <div className="rounded-3xl border border-gold/20 bg-stone/80 p-8 temple-panel">
        <p className="text-xs uppercase tracking-[0.34em] text-gold/70">{t.title}</p>
        <h1 className="mt-3 font-display text-4xl tracking-[0.16em] text-gold">
          {isArabic ? "مركز التحكم" : "Control Center"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-sand/70">
          {isArabic
            ? "إدارة التقييمات والعملاء وأدوات البحث والعمليات التجارية من مكان واحد."
            : "Manage reviews, customers, search tools, and commerce operations from one place."}
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-3xl border border-gold/20 bg-obsidian/65 p-6 transition hover:border-gold/50 hover:bg-obsidian/85"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-lg text-gold">
              {section.icon}
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-[0.08em] text-gold">{section.title}</h2>
            <p className="mt-2 text-sm text-sand/70">{section.subtitle}</p>
            <div className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 group-hover:text-gold">
              {isArabic ? "فتح" : "Open"}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
