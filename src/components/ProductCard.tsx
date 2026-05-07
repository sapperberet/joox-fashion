"use client";

import Image from "next/image";
import Link from "next/link";
import { copy } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { useLanguage } from "./SiteProviders";
import { useCart } from "./CartProvider";
import { useState } from "react";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const { addItem } = useCart();
  const [showImageModal, setShowImageModal] = useState(false);
  const seasonLabel =
    product.season === "summer"
      ? t.sections.summer
      : product.season === "winter"
        ? t.sections.winter
        : "";

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-gold/15 bg-stone/80 p-4 shadow-(--shadow) hover:border-gold/30 transition">
      <button
        onClick={() => setShowImageModal(true)}
        className="relative aspect-4/5 overflow-hidden rounded-2xl bg-ink/40 cursor-pointer hover:opacity-90 transition"
        type="button"
        aria-label={locale === "ar" ? product.name_ar : product.name_en}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={locale === "ar" ? product.name_ar : product.name_en}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-110"
            priority={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-sand/50">
            {t.products.empty}
          </div>
        )}
        {seasonLabel && (
          <span className="absolute left-2 top-2 sm:left-3 sm:top-3 rounded-full border border-gold/40 bg-obsidian/80 px-2 py-1 sm:px-3 sm:py-1 text-[0.55rem] sm:text-[0.6rem] uppercase tracking-[0.2em] text-gold">
            {seasonLabel}
          </span>
        )}
        {product.is_on_sale && (
          <span className="absolute right-2 top-2 sm:right-3 sm:top-3 rounded-full bg-red-600 px-2 py-1 sm:px-3 sm:py-1 text-[0.55rem] sm:text-[0.6rem] uppercase tracking-[0.2em] text-white font-semibold">
            Sale
          </span>
        )}
      </button>
      <div className="mt-3 flex flex-1 flex-col gap-2 sm:mt-4 sm:gap-3">
        <div className="text-lg sm:text-xl font-semibold text-sand line-clamp-2">
          {locale === "ar" ? product.name_ar : product.name_en}
        </div>
        <div className="text-xs sm:text-sm text-sand/70 line-clamp-2">
          {locale === "ar" ? product.description_ar : product.description_en}
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <div className="text-base sm:text-lg font-semibold text-gold">
            {product.is_on_sale ? (
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm text-sand/60 line-through">
                  {formatCurrency(product.price, locale)}
                </span>
                <span>
                  {formatCurrency(
                    product.sale_price ?? Math.round((product.price * (100 - (product.sale_percent ?? 0))) / 100),
                    locale,
                  )}
                </span>
              </div>
            ) : (
              formatCurrency(product.price, locale)
            )}
          </div>
          <div className="flex w-full gap-2 text-xs uppercase tracking-[0.2em] text-sand">
            <Link
              href={`/product/${product.slug}`}
              className="flex-1 rounded-full border border-gold/30 px-2.5 py-2 sm:px-3 sm:py-2.5 transition hover:bg-gold/10 hover:text-gold sm:text-sm font-semibold inline-flex items-center justify-center"
            >
              {t.products.details}
            </Link>
            <button
              type="button"
              onClick={() => addItem(product, 1)}
              className="flex-1 rounded-full bg-gold px-2.5 py-2 sm:px-3 sm:py-2.5 text-ink sm:text-sm font-semibold transition hover:bg-gold/90 inline-flex items-center justify-center"
            >
              {t.products.order}
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && product.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            className="absolute top-4 right-4 text-gold hover:text-gold/80 transition z-10"
            onClick={(e) => {
              e.stopPropagation();
              setShowImageModal(false);
            }}
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative w-full max-w-2xl aspect-4/5" onClick={(e) => e.stopPropagation()}>
            <Image
              src={product.image_url}
              alt={locale === "ar" ? product.name_ar : product.name_en}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 800px"
              className="object-contain rounded-2xl"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
