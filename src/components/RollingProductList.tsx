"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "./SiteProviders";
import { useCart } from "./CartProvider";
import { useFeedback } from "./FeedbackProvider";
import { copy } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { fetchProductReviews, getReviewSummary } from "@/lib/reviews";
import {
  getDefaultVariant,
  getProductImages,
  getProductVariants,
  getVariantLabel,
  getVariantPrice,
} from "@/lib/product-display";

type RollingProductListProps = {
  products: Product[];
};

function RollingProductItem({ product, priority }: { product: Product; priority: boolean }) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const router = useRouter();
  const { addItem } = useCart();
  const { pushFeedback } = useFeedback();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const images = useMemo(() => getProductImages(product), [product]);
  const variants = useMemo(() => getProductVariants(product), [product]);
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product]);
  const [selectedColor, setSelectedColor] = useState<string | null>(defaultVariant?.color ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(defaultVariant?.size ?? null);
  const [ratingSummary, setRatingSummary] = useState(() => getReviewSummary([]));

  const sizeOrder = ["M", "L", "XL", "XXL", "XXXL"];

  const colorOptions = useMemo(
    () =>
      Array.from(
        new Map(
          variants
            .filter((variant) => Boolean(variant.color && variant.image_url))
            .map((variant) => [String(variant.color), variant]),
        ).values(),
      ),
    [variants],
  );

  const sizeOptions = useMemo(() => {
    const pool = selectedColor
      ? variants.filter((variant) => variant.color === selectedColor && variant.size)
      : variants.filter((variant) => Boolean(variant.size));

    const unique = Array.from(new Set(pool.map((variant) => variant.size).filter(Boolean))) as string[];
    return unique.sort((a, b) => {
      const indexA = sizeOrder.indexOf(a.toUpperCase());
      const indexB = sizeOrder.indexOf(b.toUpperCase());
      if (indexA === -1 && indexB === -1) {
        return a.localeCompare(b);
      }
      if (indexA === -1) {
        return 1;
      }
      if (indexB === -1) {
        return -1;
      }
      return indexA - indexB;
    });
  }, [selectedColor, variants]);

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) {
      return null;
    }

    const exact = variants.find((variant) => {
      const colorMatch = selectedColor ? variant.color === selectedColor : true;
      const sizeMatch = selectedSize ? variant.size === selectedSize : true;
      return colorMatch && sizeMatch;
    });
    if (exact) {
      return exact;
    }

    if (selectedColor) {
      const byColor = variants.find((variant) => variant.color === selectedColor);
      if (byColor) {
        return byColor;
      }
    }

    if (selectedSize) {
      const bySize = variants.find((variant) => variant.size === selectedSize);
      if (bySize) {
        return bySize;
      }
    }

    return defaultVariant;
  }, [defaultVariant, selectedColor, selectedSize, variants]);

  const displayImage = selectedVariant?.image_url ?? images[activeImageIndex] ?? product.image_url;
  const displayPrice = getVariantPrice(product, selectedVariant);
  const effectiveStock = selectedVariant?.stock_qty ?? product.stock_qty ?? null;
  const outOfStock = effectiveStock !== null && effectiveStock <= 0;

  useEffect(() => {
    if (!selectedColor || !selectedSize) {
      return;
    }
    const exists = variants.some(
      (variant) => variant.color === selectedColor && variant.size === selectedSize,
    );
    if (!exists) {
      const next = variants.find((variant) => variant.color === selectedColor && variant.size);
      setSelectedSize(next?.size ?? null);
    }
  }, [selectedColor, selectedSize, variants]);

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
    <div className="shrink-0 w-56 sm:w-64 md:w-72 group">
      <Link href={`/product/${product.id}`}>
        <div className="flex flex-col h-full overflow-hidden rounded-2xl border-2 border-gold/30 bg-linear-to-br from-obsidian/80 to-stone/70 hover:border-gold/60 transition-all duration-300 hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-1">
          <div className="relative aspect-3/4 overflow-hidden bg-linear-to-br from-ink/60 to-obsidian/40 group-hover:from-ink/40 group-hover:to-obsidian/60 transition-all duration-500">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={locale === "ar" ? product.name_ar : product.name_en}
                fill
                sizes="(max-width: 640px) 224px, (max-width: 1024px) 256px, 288px"
                className="object-contain p-3 group-hover:scale-110 transition-transform duration-700"
                priority={priority}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-sand/40 text-center px-4">
                {t.products.empty}
              </div>
            )}

            <div className="absolute inset-0 bg-linear-to-t from-obsidian/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {product.featured && (
              <div className="absolute left-3 top-3">
                <Image
                  src="/badges/best-seller.jpg"
                  alt={t.products.bestSeller}
                  width={64}
                  height={64}
                  className="h-12 w-12 object-contain drop-shadow-lg"
                />
              </div>
            )}

            {product.is_on_sale && (
              <div className="absolute right-3 top-3">
                <Image
                  src="/badges/sale.png"
                  alt={t.products.sale}
                  width={64}
                  height={64}
                  className="h-12 w-12 object-contain drop-shadow-lg"
                />
              </div>
            )}

            {outOfStock && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center">
                <Image
                  src="/badges/sold-out.png"
                  alt={t.products.soldOut}
                  width={140}
                  height={42}
                  className="h-9 w-auto object-contain drop-shadow-lg"
                />
              </div>
            )}

            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-obsidian/70 px-2 py-1 backdrop-blur-sm">
                {images.slice(0, 4).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
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

          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
            <div>
              <div className="text-sm sm:text-base font-bold text-sand line-clamp-2 group-hover:text-gold transition-colors duration-300">
                {locale === "ar" ? product.name_ar : product.name_en}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-gold/80">
                <span className="flex items-center gap-0.5 text-gold">
                  {Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (
                    <span key={star}>{star <= Math.round(ratingSummary.average) ? "★" : "☆"}</span>
                  ))}
                </span>
                <span>{ratingSummary.average > 0 ? ratingSummary.average.toFixed(1) : "0.0"}</span>
                <span className="text-sand/50">({ratingSummary.count})</span>
              </div>
              <div className="mt-1.5 text-xs text-sand/60 line-clamp-2 leading-relaxed">
                {locale === "ar" ? product.description_ar : product.description_en}
              </div>
            </div>

            {colorOptions.length > 0 && (
              <div className="flex items-center gap-2">
                {colorOptions.slice(0, 6).map((variant) => {
                  const isActive = selectedColor === variant.color;
                  return (
                    <button
                      key={variant.key}
                      type="button"
                      title={variant.color ?? ""}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSelectedColor(variant.color ?? null);
                      }}
                      className={`h-5 w-5 rounded-full border-2 transition ${isActive ? "border-gold scale-110" : "border-sand/50 hover:border-gold/70"}`}
                      style={{ backgroundColor: variant.color ?? "#777" }}
                      aria-label={variant.color ?? "color"}
                    />
                  );
                })}
              </div>
            )}

            {sizeOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sizeOptions.map((size) => {
                  const isActive = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSelectedSize(size);
                      }}
                      className={`rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] transition ${
                        isActive
                          ? "border-gold bg-gold/15 text-gold"
                          : "border-gold/20 bg-obsidian text-sand/70 hover:border-gold/50"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedVariant && (
              <div className="text-[0.6rem] uppercase tracking-[0.2em] text-sand/60">
                {getVariantLabel(selectedVariant, locale)}
              </div>
            )}

            <div className="mt-auto">
              <div className="mb-3.5 flex items-baseline gap-2">
                {selectedVariant && selectedVariant.sale_price ? (
                  <>
                    <span className="text-xs text-sand/50 line-through">
                      {formatCurrency(selectedVariant.price ?? product.price, locale)}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-gold">
                      {formatCurrency(displayPrice, locale)}
                    </span>
                  </>
                ) : product.is_on_sale ? (
                  <>
                    <span className="text-xs text-sand/50 line-through">
                      {formatCurrency(product.price, locale)}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-gold">
                      {formatCurrency(product.sale_price ?? Math.round((product.price * (100 - (product.sale_percent ?? 0))) / 100), locale)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg sm:text-xl font-bold text-gold">
                    {formatCurrency(displayPrice, locale)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={outOfStock || busyKey === `${product.id}:checkout`}
                  onClick={(e) => {
                    e.preventDefault();
                    setBusyKey(`${product.id}:checkout`);
                    addItem(product, 1, selectedVariant ?? defaultVariant);
                    pushFeedback({
                      variant: "success",
                      title: t.products.addedToCheckout,
                      description: locale === "ar" ? "سيتم فتح صفحة إتمام الطلب الآن." : "The item was added and checkout is opening.",
                    });
                    window.setTimeout(() => setBusyKey(null), 700);
                    router.push("/checkout");
                  }}
                  className="w-full rounded-lg bg-linear-to-r from-gold/90 to-gold/95 px-3 py-2 text-ink text-xs sm:text-sm font-bold uppercase tracking-[0.15em] transition-all duration-300 hover:from-gold hover:to-gold hover:shadow-lg hover:shadow-gold/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busyKey === `${product.id}:checkout` ? t.products.addedToCheckout : t.products.order}
                </button>
                <button
                  type="button"
                  disabled={outOfStock || busyKey === `${product.id}:basket`}
                  onClick={(e) => {
                    e.preventDefault();
                    setBusyKey(`${product.id}:basket`);
                    addItem(product, 1, selectedVariant ?? defaultVariant);
                    pushFeedback({
                      variant: "success",
                      title: t.products.addedToBasket,
                      description: locale === "ar" ? "تم حفظ المنتج في السلة." : "The item was saved in your basket.",
                    });
                    window.setTimeout(() => setBusyKey(null), 700);
                  }}
                  className="w-full rounded-lg border-2 border-gold/40 bg-transparent px-3 py-1.5 text-gold text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] transition-all duration-300 hover:border-gold/70 hover:bg-gold/5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busyKey === `${product.id}:basket` ? t.products.addedToBasket : t.products.addToBasket}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function RollingProductList({ products }: RollingProductListProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const safeProducts = products ?? [];

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(1);
        return;
      }
      if (window.innerWidth < 1024) {
        setItemsPerPage(2);
        return;
      }
      if (window.innerWidth < 1280) {
        setItemsPerPage(3);
        return;
      }
      setItemsPerPage(4);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const totalPages = Math.max(Math.ceil(safeProducts.length / itemsPerPage), 1);
  const canSlide = safeProducts.length > itemsPerPage;

  const goNext = () => {
    if (!canSlide) {
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const goPrev = () => {
    if (!canSlide) {
      return;
    }
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  useEffect(() => {
    if (currentIndex >= totalPages) {
      setCurrentIndex(0);
    }
  }, [currentIndex, totalPages]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!canSlide || isPaused || prefersReducedMotion) {
      return;
    }
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPages);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [canSlide, isPaused, prefersReducedMotion, totalPages]);

  const startIdx = currentIndex * itemsPerPage;
  const visibleProducts = safeProducts.slice(startIdx, startIdx + itemsPerPage);

  if (safeProducts.length === 0) {
    return null;
  }

  return (
    <div
      className="relative w-full rounded-3xl border-2 border-gold/20 bg-linear-to-br from-stone/90 via-stone/80 to-stone/70 overflow-hidden temple-panel"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          if (locale === "ar") {
            goPrev();
          } else {
            goNext();
          }
        }
        if (event.key === "ArrowLeft") {
          if (locale === "ar") {
            goNext();
          } else {
            goPrev();
          }
        }
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        const endX = event.changedTouches[0]?.clientX ?? null;
        if (touchStartX === null || endX === null) {
          setTouchStartX(null);
          return;
        }
        const delta = endX - touchStartX;
        if (Math.abs(delta) >= 45) {
          if (delta > 0) {
            goPrev();
          } else {
            goNext();
          }
        }
        setTouchStartX(null);
      }}
    >
      <div className="absolute inset-0 bg-linear-to-r from-obsidian/20 via-transparent to-obsidian/20 pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b-2 border-gold/20">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-gold/70" />
          <div>
            <div className="text-xs uppercase tracking-[0.5em] text-gold/80 font-semibold">
              {t.sections.mostSold}
            </div>
            <div className="text-xs uppercase tracking-[0.3em] text-sand/60">
              {t.sections.mostSoldSubtitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canSlide}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-gold/50 text-gold hover:border-gold hover:bg-gold/10 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            {locale === "ar" ? "→" : "←"}
          </button>
          <div className="text-xs text-sand/60 min-w-fit">
            {currentIndex + 1} / {totalPages}
          </div>
          <button
            type="button"
            onClick={goNext}
            disabled={!canSlide}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-gold/50 text-gold hover:border-gold hover:bg-gold/10 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            {locale === "ar" ? "←" : "→"}
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden px-4 py-8 sm:py-10">
        <div
          className="flex gap-4 sm:gap-6 transition-all duration-500 ease-in-out"
          key={currentIndex}
        >
          {visibleProducts.map((product, idx) => (
            <RollingProductItem
              key={`${product.id}-${currentIndex}-${idx}`}
              product={product}
              priority={idx < 2}
            />
          ))}
          {visibleProducts.length < itemsPerPage &&
            Array.from({ length: itemsPerPage - visibleProducts.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="shrink-0 w-56 sm:w-64 md:w-72 h-96 rounded-2xl border-2 border-gold/30 bg-obsidian/30 animate-pulse"
              />
            ))}
        </div>
      </div>

      {canSlide && (
        <div className="relative z-10 flex items-center justify-center gap-1.5 px-4 pb-5">
          {Array.from({ length: totalPages }).map((_, page) => (
            <button
              key={`rolling-page-${page}`}
              type="button"
              onClick={() => setCurrentIndex(page)}
              aria-label={`Go to page ${page + 1}`}
              className={`h-2.5 rounded-full transition-all ${currentIndex === page ? "w-6 bg-gold" : "w-2.5 bg-sand/45 hover:bg-gold/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

