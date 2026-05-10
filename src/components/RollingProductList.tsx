"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "./SiteProviders";
import { useCart } from "./CartProvider";
import { copy } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

type RollingProductListProps = {
  products: Product[];
};

export default function RollingProductList({ products }: RollingProductListProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const { addItem } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  if (!products || products.length === 0) {
    return null;
  }

  const displayProducts = [...products, ...products, ...products].slice(0, Math.max(12, products.length * 3));

  return (
    <div className="relative w-full rounded-3xl border-2 border-gold/20 bg-gradient-to-br from-stone/90 via-stone/80 to-stone/70 overflow-hidden temple-panel">
      <div className="absolute inset-0 bg-gradient-to-r from-obsidian/20 via-transparent to-obsidian/20 pointer-events-none" />
      
      <div className="relative z-10 flex items-center gap-4 px-6 sm:px-8 py-5 sm:py-6 border-b-2 border-gold/20">
        <div className="flex items-center gap-3">
          <span className="text-3xl sm:text-4xl">🏆</span>
          <div>
            <div className="text-xs uppercase tracking-[0.5em] text-gold/80 font-semibold">
              Most Sold
            </div>
            <div className="text-xs uppercase tracking-[0.3em] text-sand/60">
              Premium Collection
            </div>
          </div>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent" />
      </div>

      <div
        className="relative overflow-hidden px-4 py-8 sm:py-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`flex gap-4 sm:gap-6 transition-all duration-100 ${
            isHovered ? "[animation-play-state:paused]" : ""
          }`}
          style={{
            animation: `scroll-left 80s linear infinite`,
          }}
          onAnimationIteration={() => setScrollPosition(0)}
        >
          {displayProducts.map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className="flex-shrink-0 w-56 sm:w-64 md:w-72 group"
            >
              <Link href={`/product/${product.slug}`}>
                <div className="flex flex-col h-full overflow-hidden rounded-2xl border-2 border-gold/30 bg-gradient-to-br from-obsidian/80 to-stone/70 hover:border-gold/60 transition-all duration-300 hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-1">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-ink/60 to-obsidian/40 group-hover:from-ink/40 group-hover:to-obsidian/60 transition-all duration-500">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={locale === "ar" ? product.name_ar : product.name_en}
                        fill
                        sizes="(max-width: 640px) 224px, (max-width: 1024px) 256px, 288px"
                        className="object-contain p-3 group-hover:scale-110 transition-transform duration-700"
                        priority={idx < 3}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-sand/40 text-center px-4">
                        {t.products.empty}
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {product.is_on_sale && (
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-red-600/95 px-3 py-1.5 backdrop-blur-sm shadow-lg">
                        <span className="text-base">🔥</span>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                          Sale
                        </span>
                      </div>
                    )}
                    
                    {product.featured && (
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-gold/90 px-2.5 py-1 backdrop-blur-sm shadow-lg">
                        <span className="text-base">⭐</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                    <div>
                      <div className="text-sm sm:text-base font-bold text-sand line-clamp-2 group-hover:text-gold transition-colors duration-300">
                        {locale === "ar" ? product.name_ar : product.name_en}
                      </div>
                      <div className="mt-1.5 text-xs text-sand/60 line-clamp-2 leading-relaxed">
                        {locale === "ar" ? product.description_ar : product.description_en}
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="mb-3.5 flex items-baseline gap-2">
                        {product.is_on_sale ? (
                          <>
                            <span className="text-xs text-sand/50 line-through">
                              {formatCurrency(product.price, locale)}
                            </span>
                            <span className="text-lg sm:text-xl font-bold text-gold">
                              {formatCurrency(
                                product.sale_price ?? Math.round((product.price * (100 - (product.sale_percent ?? 0))) / 100),
                                locale,
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg sm:text-xl font-bold text-gold">
                            {formatCurrency(product.price, locale)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/checkout?product=${product.slug}`;
                          }}
                          className="w-full rounded-lg bg-gradient-to-r from-gold/90 to-gold px-3 py-2 text-ink text-xs sm:text-sm font-bold uppercase tracking-[0.15em] transition-all duration-300 hover:from-gold hover:to-gold/95 hover:shadow-lg hover:shadow-gold/30 active:scale-95"
                        >
                          {t.products.order}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            addItem(product, 1);
                          }}
                          className="w-full rounded-lg border-2 border-gold/40 bg-transparent px-3 py-1.5 text-gold text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] transition-all duration-300 hover:border-gold/70 hover:bg-gold/5 active:scale-95"
                        >
                          {t.products.addToBasket}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-stone/90 from-20% via-stone/40 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-stone/70 from-20% via-stone/40 to-transparent" />
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-33.333% - 1.5rem));
          }
        }
      `}</style>
    </div>
  );
}

