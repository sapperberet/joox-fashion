"use client";

import Link from "next/link";
import { useLanguage } from "./SiteProviders";
import { copy } from "@/lib/i18n";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const { locale } = useLanguage();

  return (
    <nav className="flex items-center gap-2 text-xs sm:text-sm text-sand/60 uppercase tracking-[0.1em]">
      <Link
        href="/"
        className="hover:text-gold transition-colors duration-300"
      >
        {locale === "ar" ? "الرئيسية" : "Home"}
      </Link>

      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-gold/40">{locale === "ar" ? "←" : "→"}</span>
          {idx === items.length - 1 ? (
            <span className="text-gold font-semibold">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-gold transition-colors duration-300"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
