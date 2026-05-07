"use client";

import Image from "next/image";
import Link from "next/link";
import { copy } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { useLanguage } from "./SiteProviders";
import { useCart } from "./CartProvider";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const { addItem } = useCart();
  const seasonLabel =
    product.season === "summer"
      ? t.sections.summer
      : product.season === "winter"
        ? t.sections.winter
        : "";

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-gold/15 bg-stone/80 p-5 shadow-(--shadow)">
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-ink/40">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={locale === "ar" ? product.name_ar : product.name_en}
            fill
            className="object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-sand/50">
            {t.products.empty}
          </div>
        )}
        {seasonLabel && (
          <span className="absolute left-3 top-3 rounded-full border border-gold/40 bg-obsidian/80 px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-gold">
            {seasonLabel}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-2">
        <div className="text-lg font-semibold text-sand">
          {locale === "ar" ? product.name_ar : product.name_en}
        </div>
        <div className="text-sm text-sand/70">
          {locale === "ar" ? product.description_ar : product.description_en}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="text-base font-semibold text-gold">
            {formatCurrency(product.price, locale)}
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-sand">
            <Link
              href={`/product/${product.slug}`}
              className="rounded-full border border-gold/30 px-3 py-2 transition hover:bg-gold/10"
            >
              {t.products.details}
            </Link>
            <button
              type="button"
              onClick={() => addItem(product, 1)}
              className="rounded-full bg-gold px-3 py-2 text-ink"
            >
              {t.products.order}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
