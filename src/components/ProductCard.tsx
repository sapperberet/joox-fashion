"use client";

import Image from "next/image";
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
    <div className="group flex flex-col overflow-hidden rounded-3xl border-2 border-gold/20 bg-stone/80 p-4 shadow-lg hover:shadow-2xl hover:border-gold/40 transition">
      <button
        onClick={() => setShowImageModal(true)}
        className="relative aspect-4/5 overflow-hidden rounded-2xl bg-ink/40 cursor-pointer hover:opacity-95 transition group-hover:border-2 group-hover:border-gold/20 border-2 border-transparent"
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
          <span className="absolute left-2 top-2 sm:left-3 sm:top-3 rounded-full border border-gold/40 bg-obsidian/90 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.3em] text-gold font-semibold flex items-center gap-1">
            {seasonLabel === t.sections.summer ? '𓇳' : '𓂀'} {seasonLabel}
          </span>
        )}
        {product.is_on_sale && (
          <span className="absolute right-2 top-2 sm:right-3 sm:top-3 rounded-full bg-red-600 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.3em] text-white font-bold flex items-center gap-1">
            𓆣 Sale
          </span>
        )}
      </button>
      <div className="mt-3 flex flex-1 flex-col gap-2.5 sm:mt-4 sm:gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-lg sm:text-xl font-semibold text-sand line-clamp-2 flex-1">
            {locale === "ar" ? product.name_ar : product.name_en}
          </div>
          <span className="text-xl sm:text-2xl mt-0.5">𓋹</span>
        </div>
        <div className="text-xs sm:text-sm text-sand/70 line-clamp-2">
          {locale === "ar" ? product.description_ar : product.description_en}
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gold">
            <span>𓂀</span>
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
          <button
            type="button"
            onClick={() => addItem(product, 1)}
            className="w-full rounded-full bg-gold px-3 py-2.5 sm:px-4 sm:py-3 text-ink text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold transition hover:bg-gold/90 inline-flex items-center justify-center gap-1">
            {t.products.order}
          </button>
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
