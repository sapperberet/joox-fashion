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
        <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-20 text-sand/70">
          {t.products.empty}
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20">
        <section className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-gold/20 bg-stone/80 temple-panel">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={locale === "ar" ? product.name_ar : product.name_en}
              fill
              className="object-cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
              {t.nav.products}
            </p>
            <h1 className="font-display text-4xl tracking-[0.2em] text-gold">
              {locale === "ar" ? product.name_ar : product.name_en}
            </h1>
          </div>
          <p className="text-sand/70">
            {locale === "ar" ? product.description_ar : product.description_en}
          </p>
          <div className="text-2xl font-semibold text-gold">
            {formatCurrency(product.price, locale)}
          </div>
          {product.stock_qty !== null && product.stock_qty !== undefined && (
            <div className="text-xs uppercase tracking-[0.2em] text-sand/60">
              {product.stock_qty <= 0
                ? t.checkout.outOfStock
                : `${t.checkout.total}: ${product.stock_qty}`}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/checkout?product=${product.slug}`}
              className="rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
            >
              {t.products.order}
            </Link>
            <button
              type="button"
              onClick={() => addItem(product, 1)}
              className="rounded-full border border-gold/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold"
            >
              {t.nav.cart}
            </button>
            <Link
              href="/products"
              className="rounded-full border border-gold/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold"
            >
              {t.hero.secondaryCta}
            </Link>
          </div>
        </div>
        </section>
        {relatedProducts.length > 0 && (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl tracking-[0.2em] text-gold">
                {t.sections.featured}
              </h2>
              <Link
                href="/products"
                className="text-xs uppercase tracking-[0.3em] text-sand/60"
              >
                {t.hero.secondaryCta}
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
