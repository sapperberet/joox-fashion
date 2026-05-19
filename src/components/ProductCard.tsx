"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { copy } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { useLanguage } from "./SiteProviders";
import { useCart } from "./CartProvider";
import { useFeedback } from "./FeedbackProvider";
import { hasWishlistItem, toggleWishlistItem } from "@/lib/wishlist";
import { fetchProductReviews, getReviewSummary } from "@/lib/reviews";
import {
  getDefaultVariant,
  getProductImages,
  getProductVariants,
  getVariantLabel,
  getVariantPrice,
} from "@/lib/product-display";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const router = useRouter();
  const { addItem } = useCart();
  const { pushFeedback } = useFeedback();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [busyAction, setBusyAction] = useState<"basket" | "checkout" | null>(null);
  const [liked, setLiked] = useState(() => hasWishlistItem(product.id));
  const [ratingSummary, setRatingSummary] = useState(() => getReviewSummary([]));
  const images = useMemo(() => getProductImages(product), [product]);
  const variants = useMemo(() => getProductVariants(product), [product]);
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product]);
  const displayPrice = getVariantPrice(product, defaultVariant);
  const effectiveStock = defaultVariant?.stock_qty ?? product.stock_qty ?? null;
  const outOfStock = effectiveStock !== null && effectiveStock <= 0;
  const lowStock = effectiveStock !== null && effectiveStock > 0 && effectiveStock <= 5;
  const stockLabel = outOfStock
    ? t.products.soldOut
    : lowStock
      ? `${t.products.lowStock} (${effectiveStock})`
      : t.products.inStock;
  const seasonLabel =
    product.season === "summer"
      ? t.sections.summer
      : product.season === "winter"
        ? t.sections.winter
        : "";

  const galleryImage = images[activeImageIndex] ?? product.image_url;

  useEffect(() => {
    let mounted = true;
    fetchProductReviews(product.id).then((reviews) => {
      if (!mounted) {
        return;
      }
      setRatingSummary(getReviewSummary(reviews));
    });
    return () => {
      mounted = false;
    };
  }, [product.id]);

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-3xl border-2 border-gold/20 bg-stone/80 p-4 shadow-lg transition hover:border-gold/40 hover:shadow-2xl"
      role="link"
      tabIndex={0}
      aria-label={locale === "ar" ? product.name_ar : product.name_en}
      onClick={() => router.push(`/product/${product.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/product/${product.id}`);
        }
      }}
    >
      <div
        className="relative aspect-4/5 overflow-hidden rounded-2xl bg-ink/40 cursor-pointer hover:opacity-95 transition group-hover:border-2 group-hover:border-gold/20 border-2 border-transparent"
      >
        {galleryImage ? (
          <Image
            src={galleryImage}
            alt={locale === "ar" ? product.name_ar : product.name_en}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-2 transition duration-700 group-hover:scale-[1.02]"
            priority={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-sand/50">
            {t.products.empty}
          </div>
        )}
        {seasonLabel && (
          <span className="absolute left-2 top-2 sm:left-3 sm:top-3 rounded-full border border-gold/40 bg-obsidian/90 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.3em] text-gold font-semibold flex items-center gap-1">
            {seasonLabel}
          </span>
        )}
        {product.featured && (
          <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
            <Image
              src="/badges/best-seller.jpg"
              alt={t.products.bestSeller}
              width={72}
              height={72}
              className="h-14 w-14 object-contain drop-shadow-lg"
            />
          </div>
        )}
        {product.is_on_sale && (
          <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
            <Image
              src="/badges/sale.png"
              alt={t.products.sale}
              width={72}
              height={72}
              className="h-14 w-14 object-contain drop-shadow-lg"
            />
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-x-0 bottom-2 sm:bottom-3 flex justify-center">
            <Image
              src="/badges/sold-out.png"
              alt={t.products.soldOut}
              width={160}
              height={48}
              className="h-10 w-auto object-contain drop-shadow-lg"
            />
          </div>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            const next = toggleWishlistItem({
              product_id: product.id,
              name_en: product.name_en,
              name_ar: product.name_ar,
              image_url: galleryImage ?? product.image_url,
              price: getVariantPrice(product, defaultVariant),
            });
            setLiked(next.liked);
          }}
          className={`absolute right-2 bottom-2 rounded-full border px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] transition ${liked ? "border-gold bg-gold text-ink" : "border-gold/30 bg-obsidian/80 text-gold hover:bg-gold/10"}`}
        >
          {liked ? t.products.saved : t.products.save}
        </button>
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-obsidian/70 px-2 py-1 backdrop-blur-sm">
            {images.slice(0, 4).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveImageIndex(index);
                }}
                className={`h-2.5 w-2.5 rounded-full transition ${activeImageIndex === index ? "bg-gold" : "bg-sand/50"}`}
                aria-label={`Show image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-2.5 sm:mt-4 sm:gap-3">
        <div className="flex items-start justify-between gap-2 text-left">
          <div className="text-lg sm:text-xl font-semibold text-sand line-clamp-2 flex-1 hover:text-gold transition">
            {locale === "ar" ? product.name_ar : product.name_en}
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.2em] ${outOfStock ? "border-red-500/40 text-red-300" : lowStock ? "border-amber-400/40 text-amber-200" : "border-emerald-500/30 text-emerald-200"}`}>
            {stockLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold/80">
          <span className="flex items-center gap-1 text-gold">
            {Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (
              <span key={star}>{star <= Math.round(ratingSummary.average) ? "★" : "☆"}</span>
            ))}
          </span>
          <span>
            {ratingSummary.average > 0 ? ratingSummary.average.toFixed(1) : "0.0"} ({ratingSummary.count})
          </span>
        </div>
        <div className="text-xs sm:text-sm text-sand/70 line-clamp-2">
          {locale === "ar" ? product.description_ar : product.description_en}
        </div>
        {variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {variants.slice(0, 3).map((variant) => (
              <span
                key={variant.key}
                className="rounded-full border border-gold/20 bg-obsidian px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-sand/70"
              >
                {getVariantLabel(variant, locale)}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gold">
            {defaultVariant ? (
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                {defaultVariant.sale_price ? (
                  <span className="text-xs sm:text-sm text-sand/60 line-through">
                    {formatCurrency(defaultVariant.price ?? product.price, locale)}
                  </span>
                ) : null}
                <span>{formatCurrency(displayPrice, locale)}</span>
              </div>
            ) : product.is_on_sale ? (
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={outOfStock || busyAction === "checkout"}
              onClick={(event) => {
                event.stopPropagation();
                setBusyAction("checkout");
                addItem(product, 1, defaultVariant);
                pushFeedback({
                  variant: "success",
                  title: locale === "ar" ? t.products.addedToCheckout : t.products.addedToCheckout,
                  description: locale === "ar" ? "سيتم فتح صفحة إتمام الطلب الآن." : "The item was added and checkout is opening.",
                });
                window.setTimeout(() => setBusyAction(null), 700);
                router.push("/checkout");
              }}
              className="w-full rounded-full bg-gold px-3 py-2.5 sm:px-4 sm:py-3 text-ink text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold transition hover:bg-gold/90 inline-flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {busyAction === "checkout" ? t.products.addedToCheckout : t.products.order}
            </button>
            <button
              type="button"
              disabled={outOfStock || busyAction === "basket"}
              onClick={(event) => {
                event.stopPropagation();
                setBusyAction("basket");
                addItem(product, 1, defaultVariant);
                pushFeedback({
                  variant: "success",
                  title: t.products.addedToBasket,
                  description: locale === "ar" ? "تم حفظ المنتج في السلة." : "The item was saved in your basket.",
                });
                window.setTimeout(() => setBusyAction(null), 700);
              }}
              className="w-full rounded-full border border-gold/40 px-3 py-2.5 sm:px-4 sm:py-3 text-gold text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold transition hover:bg-gold/10 inline-flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {busyAction === "basket" ? t.products.addedToBasket : t.products.addToBasket}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
