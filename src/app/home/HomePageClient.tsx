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

  const featuredProducts = products.filter((product) => product.featured);
  const spotlightProducts = featuredProducts.length
    ? featuredProducts.slice(0, 4)
    : products.slice(0, 4);

  const wholesaleLink = toWhatsappLink(
    siteConfig.whatsapp.wholesale,
    locale === "ar"
      ? "طلب جملة من جوكس فاشون"
      : "Wholesale inquiry for Jox Fashion",
  );

  return (
    <div className="relative">
      <SiteHeader />
      <main className="flex flex-col gap-24 pb-24">
        <section className="relative overflow-hidden px-6 pt-20">
          <div className="pointer-events-none absolute inset-x-0 top-10 h-px bg-linear-to-r from-transparent via-gold/60 to-transparent animate-sweep" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.5em] text-gold/80">
                {t.hero.eyebrow}
              </p>
              <h1 className="text-balance font-display text-4xl tracking-[0.2em] text-gold sm:text-5xl">
                {t.hero.title}
              </h1>
              <p className="text-xl text-sand/90">{t.hero.subtitle}</p>
              <p className="max-w-xl text-base text-sand/70">
                {t.hero.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#collections"
                  className="rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90"
                >
                  {t.hero.primaryCta}
                </a>
                <Link
                  href="/products"
                  className="rounded-full border border-gold/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10"
                >
                  {t.hero.secondaryCta}
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-8 -top-6 h-24 w-24 rounded-full border border-gold/30 animate-float" />
              <div className="absolute -bottom-8 -right-6 h-32 w-32 rounded-full border border-gold/20 animate-float" />
              <div className="relative flex flex-col gap-6 rounded-3xl border border-gold/20 bg-stone/80 p-8 shadow-(--shadow) temple-panel">
                <div className="flex items-center gap-4">
                  <LogoMark className="h-16 w-16 text-gold" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-gold/70">
                      {t.sections.featured}
                    </p>
                    <h2 className="font-display text-2xl tracking-[0.2em] text-gold">
                      {t.sections.craft}
                    </h2>
                  </div>
                </div>
                <p className="text-sm text-sand/70">{t.craft.body}</p>
                <div className="grid gap-3 text-xs uppercase tracking-[0.2em] text-sand/70">
                  {t.craft.points.map((point) => (
                    <div key={point} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gold" />
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="collections" className="px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-3xl tracking-[0.2em] text-gold">
                {t.nav.collections}
              </h2>
              <p className="text-sm uppercase tracking-[0.3em] text-sand/60">
                {t.hero.eyebrow}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div
                id="summer"
                className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl tracking-[0.2em] text-gold">
                    {t.sections.summer}
                  </h3>
                  <span className="text-xs uppercase tracking-[0.3em] text-sand/60">
                    01
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {summerCategories.map((category) => (
                    <span
                      key={category.slug}
                      className="rounded-full border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sand"
                    >
                      {locale === "ar" ? category.name_ar : category.name_en}
                    </span>
                  ))}
                </div>
              </div>
              <div
                id="winter"
                className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl tracking-[0.2em] text-gold">
                    {t.sections.winter}
                  </h3>
                  <span className="text-xs uppercase tracking-[0.3em] text-sand/60">
                    02
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {winterCategories.map((category) => (
                    <span
                      key={category.slug}
                      className="rounded-full border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sand"
                    >
                      {locale === "ar" ? category.name_ar : category.name_en}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl tracking-[0.2em] text-gold">
                {t.sections.featured}
              </h2>
              <Link
                href="/products"
                className="text-xs uppercase tracking-[0.3em] text-sand/60"
              >
                {t.hero.secondaryCta}
              </Link>
            </div>
            {spotlightProducts.length ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
