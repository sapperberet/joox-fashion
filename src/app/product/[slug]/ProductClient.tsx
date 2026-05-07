"use client";

import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/CartProvider";

type ProductClientProps = {
  product: Product | null;
  relatedProducts: Product[];
};

export default function ProductClient({
  product,
  relatedProducts,
}: ProductClientProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const { addItem } = useCart();

  if (!product) {
    return (
      <div className="relative">
        <SiteHeader />
        <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 py-8 sm:py-20 text-xs sm:text-sm text-sand/70">
          {t.products.empty}
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 sm:gap-16 px-4 sm:px-6 py-8 sm:py-20">
        <section className="grid gap-6 sm:gap-10 lg:grid-cols-2">
          <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-gold/20 bg-stone/80 temple-panel">
            {product.image_url && (
              <Image
                src={product.image_url}
                alt={locale === "ar" ? product.name_ar : product.name_en}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                className="object-cover"
                priority
              />
            )}
          </div>
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-gold/80 flex items-center gap-2">
                <span>◇</span> {t.nav.products} <span>◇</span>
              </p>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-[0.2em] text-gold leading-tight mt-2 flex items-center gap-2">
                <span>𓋹</span> {locale === "ar" ? product.name_ar : product.name_en} <span>𓂀</span>
              </h1>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-sand/70 leading-relaxed">
              {locale === "ar" ? product.description_ar : product.description_en}
            </p>
            <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gold flex items-center gap-2">
              <span>𓂀</span>
              {product.is_on_sale ? (
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
                  <span className="text-sm sm:text-base text-sand/60 line-through">
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
            {product.stock_qty !== null && product.stock_qty !== undefined && (
              <div className="text-xs uppercase tracking-[0.2em] text-sand/60 font-semibold">
                {product.stock_qty <= 0
                  ? t.checkout.outOfStock
                  : `${t.checkout.total}: ${product.stock_qty}`}
              </div>
            )}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Link
                href={`/checkout?product=${product.slug}`}
                className="rounded-full bg-gold px-5 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90 text-center sm:text-left inline-flex items-center justify-center gap-2"
              >
                𓋹 {t.products.order}
              </Link>
              <button
                type="button"
                onClick={() => addItem(product, 1)}
                className="rounded-full border-2 border-gold/40 px-4 py-2.5 sm:px-6 sm:py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 hover:border-gold/60 text-center sm:text-left inline-flex items-center justify-center gap-2"
              >
                𓋹 {t.nav.cart}
              </button>
              <Link
                href="/products"
                className="rounded-full border-2 border-gold/40 px-4 py-2.5 sm:px-6 sm:py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 hover:border-gold/60 text-center sm:text-left inline-flex items-center justify-center gap-2"
              >
                𓁹 {t.hero.secondaryCta}
              </Link>
            </div>
          </div>
        </section>
          <section className="flex flex-col gap-6 sm:gap-8 border-t-2 border-gold/20 pt-8 sm:pt-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <h2 className="font-display text-xl sm:text-2xl tracking-[0.2em] text-gold flex items-center gap-2">
                <span>𓋹</span> {t.sections.featured} <span>𓂀</span>
              </h2>
              <Link
                href="/products"
                className="text-xs uppercase tracking-[0.3em] text-sand/60 hover:text-gold transition w-fit flex items-center gap-1"
              >
                <span>𓁹</span> {t.hero.secondaryCta}
              </Link>
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
      </main>
      <SiteFooter />
    </div>
  );
}
