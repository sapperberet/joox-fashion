"use client";

import { useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import RollingProductList from "@/components/RollingProductList";
import { copy } from "@/lib/i18n";
import { useLanguage } from "@/components/SiteProviders";
import type { Category, Product, Season } from "@/lib/types";

type ProductsClientProps = {
  products: Product[];
  categories: Category[];
  initialCategorySlug?: string;
};

type SeasonFilter = Season | "all";
type SortOption = "newest" | "priceLow" | "priceHigh";

export default function ProductsClient({
  products,
  categories,
  initialCategorySlug,
}: ProductsClientProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const normalizedInitialCategory = ["tops", "pants"].includes(String(initialCategorySlug ?? "").toLowerCase())
    ? String(initialCategorySlug).toLowerCase()
    : "all";
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>(normalizedInitialCategory);
  const [eventFilter, setEventFilter] = useState<"all" | "featured" | "sale" | "new" | "inStock" | "outOfStock">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [search, setSearch] = useState("");

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories) {
      map.set(category.id, category);
    }
    return map;
  }, [categories]);

  const visibleProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const seasonMatch =
        seasonFilter === "all" || product.season === seasonFilter;
      const category = product.category_id ? categoryById.get(product.category_id) : undefined;
      const categorySlug = String(category?.slug ?? "").toLowerCase();
      const categoryName = `${String(category?.name_en ?? "")} ${String(category?.name_ar ?? "")}`.toLowerCase();
      const categoryMatch =
        categoryFilter === "all" ||
        categorySlug === categoryFilter ||
        categoryName.includes(categoryFilter);
      const stock = product.stock_qty ?? null;
      const isOutOfStock = stock !== null && stock <= 0;
      const isNew = product.created_at ? Date.now() - Date.parse(product.created_at) < 1000 * 60 * 60 * 24 * 14 : false;
      const eventMatch =
        eventFilter === "all" ||
        (eventFilter === "featured" && !!product.featured) ||
        (eventFilter === "sale" && !!product.is_on_sale) ||
        (eventFilter === "new" && isNew) ||
        (eventFilter === "inStock" && !isOutOfStock) ||
        (eventFilter === "outOfStock" && isOutOfStock);
      const text = [product.name_en, product.name_ar, product.description_en, product.description_ar]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const searchMatch = !search.trim() || text.includes(search.trim().toLowerCase());
      return seasonMatch && categoryMatch && eventMatch && searchMatch;
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
  }, [products, seasonFilter, categoryFilter, categoryById, eventFilter, sortBy, search]);

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 sm:gap-12 px-4 sm:px-6 py-8 sm:py-16">
        {/* Decorative Header */}
        <div className="flex flex-col gap-4 sm:gap-6 border-b-2 border-gold/20 pb-6 sm:pb-8">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
            <span className="text-2xl sm:text-3xl">𓋹</span>
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
          </div>
          <div className="flex flex-col gap-2 sm:gap-3 text-center">
            <p className="text-xs sm:text-sm uppercase tracking-[0.5em] text-gold/70">
              ◇◇◇ {t.nav.products} ◇◇◇
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-[0.2em] text-gold">
              {t.nav.products}
            </h1>
            <p className="text-base sm:text-lg text-sand/70 flex items-center justify-center gap-2">
              𓂀 {t.hero.description} 𓂀
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span className="text-lg sm:text-xl">◆</span>
            <span className="text-xl sm:text-2xl">𓉐</span>
            <span className="text-lg sm:text-xl">◆</span>
          </div>
        </div>
        
        <RollingProductList products={products.slice(0, 6)} />

        {/* Filter Section with Egyptian Styling */}
        <div className="rounded-3xl border-2 border-gold/20 bg-stone/80 p-5 sm:p-8 shadow-lg temple-panel">
          <div className="mb-6">
            <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold mb-3 font-semibold">
              Search
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="w-full rounded-2xl border-2 border-gold/20 bg-obsidian px-4 py-3 text-base text-sand focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/30 transition hover:border-gold/40"
            />
          </div>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gold/20">
            <span className="text-2xl">𓁹</span>
            <div className="text-xs uppercase tracking-[0.4em] text-gold font-semibold">
              {t.products.filtersTitle}
            </div>
            <span className="text-lg">𓂀</span>
          </div>
          <div className="grid gap-6 sm:gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold mb-3 sm:mb-4 font-semibold flex items-center gap-2">
                <span>𓇳𓂀</span> {t.products.season}
              </div>
              <div className="flex flex-wrap gap-2">
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
                        ? "border-gold bg-gold text-ink font-semibold"
                        : "border-gold/30 text-sand hover:border-gold/60 hover:bg-gold/5"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold mb-3 sm:mb-4 font-semibold flex items-center gap-2">
                <span>◈</span> Category
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "tops", label: "Tops" },
                  { value: "pants", label: "Pants" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategoryFilter(option.value)}
                    className={`rounded-full border px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm uppercase tracking-[0.2em] transition ${
                      categoryFilter === option.value
                        ? "border-gold bg-gold text-ink font-semibold"
                        : "border-gold/30 text-sand hover:border-gold/60 hover:bg-gold/5"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold mb-3 sm:mb-4 font-semibold flex items-center gap-2">
                <span>𓂀</span> Events
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "featured", label: "Featured" },
                  { value: "sale", label: "Sale" },
                  { value: "new", label: "New" },
                  { value: "inStock", label: "In Stock" },
                  { value: "outOfStock", label: "Out of Stock" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEventFilter(option.value as "all" | "featured" | "sale" | "new" | "inStock" | "outOfStock")}
                    className={`rounded-full border px-3 py-2 text-[0.65rem] uppercase tracking-[0.2em] transition ${
                      eventFilter === option.value
                        ? "border-gold bg-gold text-ink font-semibold"
                        : "border-gold/30 text-sand hover:border-gold/60 hover:bg-gold/5"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold mb-3 sm:mb-4 font-semibold flex items-center gap-2">
                <span>𓋹</span> {t.products.sort}
              </div>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="w-full rounded-2xl border-2 border-gold/20 bg-obsidian px-4 py-3 text-base uppercase tracking-[0.2em] text-sand focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/30 transition hover:border-gold/40"
              >
                <option value="newest">{t.products.newest}</option>
                <option value="priceLow">{t.products.priceLow}</option>
                <option value="priceHigh">{t.products.priceHigh}</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Products Grid */}
        {visibleProducts.length ? (
          <>
            <div className="flex items-center justify-center gap-3 py-4">
              <span className="text-gold/60">◆</span>
              <span className="text-gold/40">◇</span>
              <span className="text-gold/60">◆</span>
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 py-4">
              <span className="text-gold/60">◆</span>
              <span className="text-gold/40">◇</span>
              <span className="text-gold/60">◆</span>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border-2 border-gold/20 bg-stone/80 p-8 sm:p-12 text-center shadow-lg">
            <p className="text-lg sm:text-xl text-gold mb-2">𓉐</p>
            <p className="text-xs sm:text-sm text-sand/70 uppercase tracking-[0.3em]">
              {t.products.empty}
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
