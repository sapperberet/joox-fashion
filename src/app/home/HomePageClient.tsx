"use client";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LogoMark from "@/components/LogoMark";
import ProductCard from "@/components/ProductCard";
import { copy } from "@/lib/i18n";
import { fallbackCategories, siteConfig, toWhatsappLink } from "@/lib/site-config";
import { useLanguage } from "@/components/SiteProviders";
import type { Category, Product } from "@/lib/types";

type HomePageClientProps = {
  categories: Category[];
  products: Product[];
};

export default function HomePageClient({
  categories,
  products,
}: HomePageClientProps) {
  const { locale } = useLanguage();
  const t = copy[locale];

  const resolvedCategories: Category[] = categories.length
    ? categories
    : fallbackCategories.map((item, index) => ({
        id: `fallback-${item.slug}`,
        name_en: item.name_en,
        name_ar: item.name_ar,
        slug: item.slug,
        season: item.season,
        sort_order: index,
      }));

  const summerCategories = resolvedCategories.filter(
    (category) => category.season === "summer",
  );
  const winterCategories = resolvedCategories.filter(
    (category) => category.season === "winter",
  );

  const featuredProducts = products.filter(
    (product) =>
      product.featured &&
      (product.stock_qty === null ||
        product.stock_qty === undefined ||
        product.stock_qty > 0),
  );
  const spotlightProducts = featuredProducts.length
    ? featuredProducts.slice(0, 4)
    : products.filter((product) => (product.stock_qty ?? 1) > 0).slice(0, 4);

  const wholesaleLink = toWhatsappLink(
    siteConfig.whatsapp.wholesale,
    locale === "ar"
      ? "طلب جملة من جوكس فاشون"
      : "Wholesale inquiry for Joox Fashion",
  );

  return (
    <div className="relative">
      <SiteHeader />
      <main className="flex flex-col gap-12 sm:gap-16 md:gap-24 pb-12 sm:pb-24">
        <section className="relative overflow-hidden px-4 pt-8 sm:px-6 sm:pt-16 md:pt-20">
          <div className="pointer-events-none absolute inset-x-0 top-6 sm:top-10 h-px bg-linear-to-r from-transparent via-gold/60 to-transparent animate-sweep" />
          <div className="mx-auto grid max-w-6xl items-center gap-6 sm:gap-8 md:gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 sm:space-y-6">
              <p className="text-xs uppercase tracking-[0.5em] text-gold/80">
                ◇ {t.hero.eyebrow} ◇
              </p>
              <h1 className="text-balance font-display text-3xl sm:text-5xl md:text-6xl tracking-[0.2em] text-gold leading-tight">
                {t.hero.title}
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-sand/90">{t.hero.subtitle}</p>
              <p className="text-base sm:text-lg text-sand/70 max-w-xl leading-relaxed">
                {t.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2">
                <a
                  href="#collections"
                  className="rounded-full bg-gold px-5 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90 text-center sm:text-left inline-flex items-center justify-center"
                >
                  {t.hero.primaryCta}
                </a>
                <Link
                  href="/products"
                  className="rounded-full border border-gold/40 px-5 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 text-center sm:text-left inline-flex items-center justify-center"
                >
                  {t.hero.secondaryCta}
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -left-8 -top-6 h-24 w-24 rounded-full border border-gold/30 animate-float" />
              <div className="absolute -bottom-8 -right-6 h-32 w-32 rounded-full border border-gold/20 animate-float" />
              <div className="relative flex flex-col gap-6 rounded-3xl border border-gold/20 bg-stone/80 p-6 sm:p-8 shadow-(--shadow) temple-panel">
                <div className="flex items-center gap-3 sm:gap-4">
                  <LogoMark className="h-12 sm:h-16 w-12 sm:w-16 text-gold shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.4em] text-gold/70">
                      {t.sections.featured}
                    </p>
                    <h2 className="font-display text-xl sm:text-2xl tracking-[0.2em] text-gold truncate">
                      {t.sections.craft}
                    </h2>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-sand/70 leading-relaxed">{t.craft.body}</p>
                <div className="grid gap-2 sm:gap-3 text-xs uppercase tracking-[0.2em] text-sand/70">
                  {t.craft.points.map((point) => (
                    <div key={point} className="flex items-start gap-2">
                      <span className="h-2 w-2 rounded-full bg-gold mt-1 shrink-0" />
                      <span className="text-xs leading-snug">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="collections" className="px-4 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-[0.2em] text-gold">
                𓋹 {t.nav.collections} 𓋹
              </h2>
              <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-sand/60">
                ◇ {t.hero.eyebrow} ◇
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div
                id="summer"
                className="rounded-3xl border border-gold/20 bg-stone/80 p-4 sm:p-6 temple-panel"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg sm:text-2xl md:text-3xl tracking-[0.2em] text-gold">
                    𓇳 {t.sections.summer} 𓇳
                  </h3>
                  <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-sand/60 shrink-0">
                    ◇ 01 ◇
                  </span>
                </div>
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
                  {summerCategories.map((category) => (
                    <span
                      key={category.slug}
                      className="rounded-full border border-gold/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm uppercase tracking-[0.2em] text-sand hover:border-gold/60 hover:bg-gold/10 transition cursor-default"
                    >
                      {locale === "ar" ? category.name_ar : category.name_en}
                    </span>
                  ))}
                </div>
              </div>
              <div
                id="winter"
                className="rounded-3xl border border-gold/20 bg-stone/80 p-4 sm:p-6 temple-panel"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg sm:text-2xl md:text-3xl tracking-[0.2em] text-gold">
                    𓂀 {t.sections.winter} 𓂀
                  </h3>
                  <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-sand/60 shrink-0">
                    ◇ 02 ◇
                  </span>
                </div>
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
                  {winterCategories.map((category) => (
                    <span
                      key={category.slug}
                      className="rounded-full border border-gold/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm uppercase tracking-[0.2em] text-sand hover:border-gold/60 hover:bg-gold/10 transition cursor-default"
                    >
                      {locale === "ar" ? category.name_ar : category.name_en}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-[0.2em] text-gold">
                𓋹 {t.sections.featured} 𓋹
              </h2>
              <Link
                href="/products"
                className="text-xs uppercase tracking-[0.3em] text-sand/60 hover:text-gold transition w-fit"
              >
                {t.hero.secondaryCta}
              </Link>
            </div>
            {spotlightProducts.length ? (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
                {spotlightProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-gold/20 bg-stone/80 p-10 text-center text-sand/70 temple-panel">
                {t.products.empty}
              </div>
            )}
          </div>
        </section>

        <section id="payment" className="px-6">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div
              id="policy"
              className="rounded-3xl border border-gold/20 bg-stone/80 p-8 temple-panel"
            >
              <h3 className="font-display text-2xl tracking-[0.2em] text-gold">
                {t.sections.payment}
              </h3>
              <p className="mt-4 text-sand/70">{t.payment.body}</p>
              <div className="mt-6 rounded-2xl border border-gold/20 bg-obsidian/70 p-4 text-sm text-gold">
                {t.payment.walletDiscount}
              </div>
            </div>
            <div className="rounded-3xl border border-gold/20 bg-stone/80 p-8 temple-panel">
              <h3 className="font-display text-2xl tracking-[0.2em] text-gold">
                {t.sections.policy}
              </h3>
              <p className="mt-4 text-sand/70">{t.policy.body}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-sand/60">
                {t.payment.shipping}
              </p>
            </div>
          </div>
        </section>

        <section id="wholesale" className="px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 rounded-3xl border border-gold/20 bg-stone/80 p-8 temple-panel">
            <h3 className="font-display text-2xl tracking-[0.2em] text-gold">
              {t.sections.wholesale}
            </h3>
            <p className="text-sand/70">{t.wholesale.body}</p>
            <a
              href={wholesaleLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit rounded-full border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.2em] text-gold"
            >
              {t.wholesale.cta}
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
