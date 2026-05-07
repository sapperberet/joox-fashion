"use client";

import { useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import { copy } from "@/lib/i18n";
import { useLanguage } from "@/components/SiteProviders";
import type { Category, Product, Season } from "@/lib/types";

type ProductsClientProps = {
  products: Product[];
  categories: Category[];
};

type SeasonFilter = Season | "all";
type SortOption = "newest" | "priceLow" | "priceHigh";

export default function ProductsClient({
  products,
  categories,
}: ProductsClientProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const visibleProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      if (product.stock_qty !== null && product.stock_qty !== undefined) {
        if (product.stock_qty <= 0) {
          return false;
        }
      }
      const seasonMatch =
        seasonFilter === "all" || product.season === seasonFilter;
      const categoryMatch =
        categoryFilter === "all" || product.category_id === categoryFilter;
      return seasonMatch && categoryMatch;
    });

    if (sortBy === "priceLow") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    }
    if (sortBy === "priceHigh") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    }
    if (sortBy === "newest") {
      filtered = [...filtered].sort((a, b) => {
        const timeA = a.created_at ? Date.parse(a.created_at) : 0;
        const timeB = b.created_at ? Date.parse(b.created_at) : 0;
        return timeB - timeA;
      });
    }

    return filtered;
  }, [products, seasonFilter, categoryFilter, sortBy]);

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 sm:gap-12 px-4 sm:px-6 py-8 sm:py-16">
        <div className="flex flex-col gap-2 sm:gap-3">
          <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-gold/80">
            {t.nav.products}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-[0.2em] text-gold">
            {t.nav.products}
          </h1>
          <p className="text-base sm:text-lg text-sand/70">{t.hero.description}</p>
        </div>
        <div className="grid gap-3 sm:gap-4 rounded-3xl border border-gold/15 bg-stone/80 p-3 sm:p-5 temple-panel md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="md:col-span-3">
            <div className="text-xs uppercase tracking-[0.3em] text-gold/70">
              {t.products.filtersTitle}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/60 mb-2 sm:mb-3 font-semibold">
              {t.products.season}
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[
                { value: "all", label: t.products.all },
                { value: "summer", label: t.sections.summer },
                { value: "winter", label: t.sections.winter },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSeasonFilter(option.value as SeasonFilter)}
                  className={`rounded-full border px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm uppercase tracking-[0.2em] transition ${
                    seasonFilter === option.value
                      ? "border-gold bg-gold text-ink"
                      : "border-gold/30 text-sand hover:border-gold/60 hover:bg-gold/5"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/60 mb-2 sm:mb-3 font-semibold">
              {t.products.category}
            </div>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base uppercase tracking-[0.2em] text-sand focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition"
            >
              <option value="all">{t.products.all}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {locale === "ar" ? category.name_ar : category.name_en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-sand/60 mb-2 sm:mb-3 font-semibold">
              {t.products.sort}
            </div>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-base uppercase tracking-[0.2em] text-sand focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition"
            >
              <option value="newest">{t.products.newest}</option>
              <option value="priceLow">{t.products.priceLow}</option>
              <option value="priceHigh">{t.products.priceHigh}</option>
            </select>
          </div>
        </div>
        {visibleProducts.length ? (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 sm:p-10 text-center text-xs sm:text-sm text-sand/70 temple-panel">
            {t.products.empty}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
