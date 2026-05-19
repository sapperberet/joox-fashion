"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import Breadcrumb from "@/components/Breadcrumb";
import CartSidebar from "@/components/CartSidebar";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/CartProvider";
import { useFeedback } from "@/components/FeedbackProvider";
import {
  getDefaultVariant,
  getProductImages,
  getProductVariants,
  getSelectedVariant,
  getVariantLabel,
  getVariantPrice,
} from "@/lib/product-display";
import { useRouter } from "next/navigation";
import { hasWishlistItem, toggleWishlistItem } from "@/lib/wishlist";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import {
  buildProductReview,
  fetchProductReviews,
  getReviewSummary,
  submitProductReview,
  sortProductReviews,
  type ReviewSort,
} from "@/lib/reviews";

type ProductClientProps = {
  product: Product | null;
  relatedProducts: Product[];
  category?: any;
  subcategory?: any;
};

export default function ProductClient({
  product,
  relatedProducts,
  category,
  subcategory,
}: ProductClientProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const router = useRouter();
  const { addItem } = useCart();
  const { pushFeedback } = useFeedback();
  const productImages = useMemo(() => getProductImages(product ?? ({} as Product)), [product]);
  const variants = useMemo(() => getProductVariants(product ?? ({} as Product)), [product]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [liked, setLiked] = useState(() => (product ? hasWishlistItem(product.id) : false));
  const [reviewSort, setReviewSort] = useState<ReviewSort>("newest");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewUserName, setReviewUserName] = useState("");
  const [reviewUserEmail, setReviewUserEmail] = useState("");
  const [reviewAuthed, setReviewAuthed] = useState(false);
  const [reviews, setReviews] = useState([] as Awaited<ReturnType<typeof fetchProductReviews>>);
  const [reviewSummary, setReviewSummary] = useState(() => getReviewSummary([]));
  const [cartAction, setCartAction] = useState<"basket" | "checkout" | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const selectedVariant = useMemo(() => {
    if (!product) {
      return null;
    }

    const matched = getSelectedVariant(product, { color: selectedColor, size: selectedSize });
    return matched ?? getDefaultVariant(product);
  }, [product, selectedColor, selectedSize]);
  const effectiveStock = selectedVariant?.stock_qty ?? product?.stock_qty ?? null;
  const outOfStock = effectiveStock !== null && effectiveStock <= 0;

  const displayImages = useMemo(() => {
    const list = [...productImages];
    if (selectedVariant?.image_url) {
      list.unshift(selectedVariant.image_url);
    }
    return Array.from(new Set(list.filter(Boolean)));
  }, [productImages, selectedVariant]);

  useEffect(() => {
    if (variants.length > 0) {
      const first = variants[0];
      setSelectedColor(first?.color ?? null);
      setSelectedSize(first?.size ?? null);
    }
  }, [variants]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedVariant?.key, displayImages.length]);

  useEffect(() => {
    if (!product) {
      return;
    }

    let mounted = true;
    fetchProductReviews(product.id).then((storedReviews) => {
      if (!mounted) {
        return;
      }
      setReviews(storedReviews);
      setReviewSummary(getReviewSummary(storedReviews));
    });

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setReviewAuthed(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      setReviewAuthed(Boolean(session));
      if (!session) {
        return;
      }
      setReviewUserEmail(session.user.email ?? "");
      setReviewUserName(
        String(session.user.user_metadata?.fullName ?? session.user.user_metadata?.name ?? session.user.email ?? ""),
      );
    });

    return () => {
      mounted = false;
    };
  }, [product]);

  const orderedReviews = useMemo(() => sortProductReviews(reviews, reviewSort), [reviews, reviewSort]);

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewError("");
    setReviewSuccess("");
    setSubmittingReview(true);

    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        setReviewError("Sign in to review this product.");
        pushFeedback({
          variant: "error",
          title: locale === "ar" ? "تعذر إرسال التقييم" : "Unable to submit review",
          description: locale === "ar" ? "سجّل الدخول أولاً." : "Please sign in first.",
        });
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session || !product) {
        setReviewError("Sign in to review this product.");
        pushFeedback({
          variant: "error",
          title: locale === "ar" ? "تعذر إرسال التقييم" : "Unable to submit review",
          description: locale === "ar" ? "سجّل الدخول أولاً." : "Please sign in first.",
        });
        return;
      }

      const userEmail = session.user.email ?? reviewUserEmail;
      const userName = reviewUserName.trim() || String(session.user.user_metadata?.fullName ?? session.user.user_metadata?.name ?? userEmail ?? "Customer");
      if (!userEmail) {
        setReviewError("Sign in to review this product.");
        pushFeedback({
          variant: "error",
          title: locale === "ar" ? "تعذر إرسال التقييم" : "Unable to submit review",
          description: locale === "ar" ? "لم يتم العثور على حسابك." : "Your account is unavailable.",
        });
        return;
      }
      if (!reviewTitle.trim() || !reviewBody.trim()) {
        setReviewError("Write a title and review.");
        pushFeedback({
          variant: "error",
          title: locale === "ar" ? "اكتب عنواناً وتقييماً" : "Write a title and review",
        });
        return;
      }

      const review = buildProductReview({
        productKey: product.id,
        userName,
        userEmail,
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
      });

      const { review: savedReview } = await submitProductReview({
        productKey: review.product_slug,
        userName: review.user_name,
        userEmail: review.user_email,
        rating: review.rating,
        title: review.title,
        body: review.body,
        token: session.access_token,
      });

      const nextReviews = [savedReview, ...reviews.filter((item) => item.user_email !== userEmail)];
      setReviews(nextReviews);
      setReviewSummary(getReviewSummary(nextReviews));
      setReviewTitle("");
      setReviewBody("");
      setReviewRating(5);
      setReviewSuccess("Review posted.");
      pushFeedback({
        variant: "success",
        title: locale === "ar" ? "تم إرسال التقييم" : "Review posted",
        description: locale === "ar" ? "سيظهر بعد المراجعة." : "It will appear after moderation.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit review.";
      setReviewError(message);
      pushFeedback({
        variant: "error",
        title: locale === "ar" ? "تعذر إرسال التقييم" : "Unable to submit review",
        description: message,
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!product) {
    return (
      <div className="relative">
        <SiteHeader />
        <main className="mx-auto flex max-w-350 flex-col gap-8 px-4 sm:px-6 py-8 sm:py-20 text-xs sm:text-sm text-sand/70">
          {t.products.empty}
        </main>
        <SiteFooter />
      </div>
    );
  }

  const pathSegments = [
    locale === "ar" ? "المنتجات" : "Products",
    category ? (locale === "ar" ? category.name_ar : category.name_en) : null,
    subcategory ? (locale === "ar" ? subcategory.name_ar : subcategory.name_en) : null,
    locale === "ar" ? product.name_ar : product.name_en,
  ].filter(Boolean) as string[];
  const pathLabel = pathSegments.join(" / ");

  return (
    <div className="relative">
      <SiteHeader />
      <CartSidebar />
      <main className="mx-auto flex max-w-350 flex-col gap-10 sm:gap-16 px-4 sm:px-6 py-8 sm:py-20">
        <div className="mb-2 space-y-2">
          {(category || subcategory) && (
            <Breadcrumb
              items={[
                ...(category
                  ? [
                      {
                        label: locale === "ar" ? category.name_ar : category.name_en,
                        href: `/products?category=${category.slug}`,
                      },
                    ]
                  : []),
                ...(subcategory
                  ? [
                      {
                        label: locale === "ar" ? subcategory.name_ar : subcategory.name_en,
                        href: `/products?subcategory=${subcategory.slug}`,
                      },
                    ]
                  : []),
                { label: locale === "ar" ? product?.name_ar : product?.name_en, href: "" },
              ]}
            />
          )}
          <div className="text-[0.65rem] uppercase tracking-[0.25em] text-sand/60">
            {t.product.pathLabel}: {pathLabel}
          </div>
        </div>
        <section className="grid gap-6 sm:gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-gold/20 bg-stone/80 temple-panel">
              {displayImages.length > 0 ? (
                <Image
                  src={displayImages[selectedImageIndex]}
                  alt={locale === "ar" ? product.name_ar : product.name_en}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-sand/60">
                  {t.products.empty}
                </div>
              )}
              {displayImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex((current) => (current - 1 + displayImages.length) % displayImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-gold/30 bg-obsidian/70 px-3 py-2 text-gold"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex((current) => (current + 1) % displayImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-gold/30 bg-obsidian/70 px-3 py-2 text-gold"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
              {product.featured && (
                <div className="absolute left-3 top-3">
                  <Image
                    src="/badges/best-seller.jpg"
                    alt={t.products.bestSeller}
                    width={80}
                    height={80}
                    className="h-14 w-14 object-contain drop-shadow-lg"
                  />
                </div>
              )}
              {product.is_on_sale && (
                <div className="absolute right-3 top-3">
                  <Image
                    src="/badges/sale.png"
                    alt={t.products.sale}
                    width={80}
                    height={80}
                    className="h-14 w-14 object-contain drop-shadow-lg"
                  />
                </div>
              )}
              {outOfStock && (
                <div className="absolute inset-x-0 bottom-3 flex justify-center">
                  <Image
                    src="/badges/sold-out.png"
                    alt={t.products.soldOut}
                    width={180}
                    height={50}
                    className="h-11 w-auto object-contain drop-shadow-lg"
                  />
                </div>
              )}
            </div>
            {displayImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {displayImages.slice(0, 5).map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${selectedImageIndex === index ? "border-gold" : "border-gold/10"}`}
                  >
                    <Image src={imageUrl} alt="Preview" fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-gold/80 flex items-center gap-2">
                {t.nav.products}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-[0.2em] text-gold leading-tight">
                  {locale === "ar" ? product.name_ar : product.name_en}
                </h1>
                <span className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] ${outOfStock ? "border-red-500/40 text-red-300" : "border-emerald-500/30 text-emerald-200"}`}>
                  {outOfStock ? t.products.soldOut : t.products.inStock}
                </span>
              </div>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-sand/70 leading-relaxed">
              {locale === "ar" ? product.description_ar : product.description_en}
            </p>
            {selectedVariant && (
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold/80">
                <span className="rounded-full border border-gold/20 bg-obsidian px-3 py-2">
                  {getVariantLabel(selectedVariant, locale)}
                </span>
                {selectedVariant.sku && (
                  <span className="rounded-full border border-gold/20 bg-obsidian px-3 py-2">
                    {selectedVariant.sku}
                  </span>
                )}
              </div>
            )}
            <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gold flex items-center gap-2">
              {selectedVariant ? (
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
                  {selectedVariant.sale_price ? (
                    <span className="text-sm sm:text-base text-sand/60 line-through">
                      {formatCurrency(selectedVariant.price ?? product.price, locale)}
                    </span>
                  ) : null}
                  <span>{formatCurrency(getVariantPrice(product, selectedVariant), locale)}</span>
                </div>
              ) : product.is_on_sale ? (
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
            {selectedVariant?.stock_qty !== null && selectedVariant?.stock_qty !== undefined ? (
              <div className="text-xs uppercase tracking-[0.2em] text-sand/60 font-semibold">
                {selectedVariant.stock_qty <= 0 ? t.checkout.outOfStock : `${t.checkout.total}: ${selectedVariant.stock_qty}`}
              </div>
            ) : product.stock_qty !== null && product.stock_qty !== undefined && (
              <div className="text-xs uppercase tracking-[0.2em] text-sand/60 font-semibold">
                {product.stock_qty <= 0
                  ? t.checkout.outOfStock
                  : `${t.checkout.total}: ${product.stock_qty}`}
              </div>
            )}
            {variants.length > 0 && (
              <div className="grid gap-4 rounded-2xl border border-gold/20 bg-obsidian/50 p-4 sm:p-5">
                <div className="text-xs uppercase tracking-[0.25em] text-gold/70 font-semibold">{t.product.colors}</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean) as string[])).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${selectedColor === color ? "border-gold bg-gold text-ink" : "border-gold/20 text-sand hover:border-gold/40"}`}
                    >
                      {color}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const next = toggleWishlistItem({
                        product_id: product.id,
                        name_en: product.name_en,
                        name_ar: product.name_ar,
                        image_url: displayImages[0] ?? product.image_url,
                        price: getVariantPrice(product, selectedVariant ?? getDefaultVariant(product)),
                      });
                      setLiked(next.liked);
                    }}
                    className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${liked ? "border-gold bg-gold text-ink" : "border-gold/20 text-gold hover:bg-gold/10"}`}
                  >
                    {liked ? "♥ Saved to wishlist" : "♡ Save to wishlist"}
                  </button>
                </div>
                <div className="text-xs uppercase tracking-[0.25em] text-gold/70 font-semibold">{t.product.sizes}</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(variants.map((variant) => variant.size).filter(Boolean) as string[])).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${selectedSize === size ? "border-gold bg-gold text-ink" : "border-gold/20 text-sand hover:border-gold/40"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pt-2 sm:pt-4">
              <button
                type="button"
                disabled={outOfStock || cartAction === "checkout"}
                onClick={() => {
                  setCartAction("checkout");
                  addItem(product, 1, selectedVariant ?? getDefaultVariant(product));
                  pushFeedback({
                    variant: "success",
                    title: t.products.addedToCheckout,
                    description: locale === "ar" ? "سيتم فتح صفحة إتمام الطلب الآن." : "The item was added and checkout is opening.",
                  });
                  window.setTimeout(() => setCartAction(null), 700);
                  router.push("/checkout");
                }}
                className="rounded-full bg-gold px-5 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90 text-center sm:text-left inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cartAction === "checkout" ? t.products.addedToCheckout : t.products.order}
              </button>
              <button
                type="button"
                disabled={outOfStock || cartAction === "basket"}
                onClick={() => {
                  setCartAction("basket");
                  addItem(product, 1, selectedVariant ?? getDefaultVariant(product));
                  pushFeedback({
                    variant: "success",
                    title: t.products.addedToBasket,
                    description: locale === "ar" ? "تم حفظ المنتج في السلة." : "The item was saved in your basket.",
                  });
                  window.setTimeout(() => setCartAction(null), 700);
                }}
                className="rounded-full border-2 border-gold/40 px-4 py-2.5 sm:px-6 sm:py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 hover:border-gold/60 text-center sm:text-left inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cartAction === "basket" ? t.products.addedToBasket : t.products.addToBasket}
              </button>
              <Link
                href="/products"
                className="rounded-full border-2 border-gold/40 px-4 py-2.5 sm:px-6 sm:py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10 hover:border-gold/60 text-center sm:text-left inline-flex items-center justify-center gap-2"
              >
                {t.hero.secondaryCta}
              </Link>
            </div>
          </div>
        </section>
          <section className="flex flex-col gap-6 sm:gap-8 border-t-2 border-gold/20 pt-8 sm:pt-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <h2 className="font-display text-xl sm:text-2xl tracking-[0.2em] text-gold flex items-center gap-2">
                {t.product.related}
              </h2>
              <Link
                href="/products"
                className="text-xs uppercase tracking-[0.3em] text-sand/60 hover:text-gold transition w-fit flex items-center gap-1"
              >
                {t.hero.secondaryCta}
              </Link>
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.slice(0, 4).map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-6 border-t-2 border-gold/20 pt-8 sm:pt-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <h2 className="font-display text-xl sm:text-2xl tracking-[0.2em] text-gold flex items-center gap-2">
                {t.product.alsoBuy}
              </h2>
              <p className="text-xs uppercase tracking-[0.3em] text-sand/60">{t.product.completeLook}</p>
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.slice().reverse().map((related) => (
                <ProductCard key={`also-${related.id}`} product={related} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 border-t-2 border-gold/20 pt-8 sm:pt-12">
            <div>
              <h2 className="font-display text-xl sm:text-2xl tracking-[0.2em] text-gold flex items-center gap-2">
                {t.product.faq}
              </h2>
              <p className="mt-2 text-sm text-sand/60">{t.product.faqSubtitle}</p>
            </div>
            <div className="grid gap-3">
              {[
                {
                  title: t.product.faqGeneralTitle,
                  body: t.product.faqGeneralBody,
                },
                {
                  title: t.product.faqDeliveryTitle,
                  body: t.product.faqDeliveryBody,
                },
                {
                  title: t.product.faqContactTitle,
                  body: t.product.faqContactBody,
                },
              ].map((item) => (
                <details key={item.title} className="group rounded-3xl border border-gold/20 bg-stone/80 p-5 temple-panel">
                  <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.2em] text-gold">
                    {item.title}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-sand/75">{item.body}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-6 border-t-2 border-gold/20 pt-8 sm:pt-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl tracking-[0.2em] text-gold flex items-center gap-2">
                  <span>★</span> {t.product.reviewsTitle} <span>☆</span>
                </h2>
                <p className="mt-2 text-sm text-sand/60">
                  {reviewSummary.average > 0 ? `${reviewSummary.average.toFixed(1)} out of 5` : t.product.reviewsSubtitle} · {reviewSummary.count} {t.product.reviewsCount}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {["newest", "highest"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setReviewSort(option as ReviewSort)}
                    className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${reviewSort === option ? "border-gold bg-gold text-ink" : "border-gold/20 text-gold hover:bg-gold/10"}`}
                  >
                    {option === "newest" ? t.product.reviewSortNewest : t.product.reviewSortHighest}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-5 sm:p-6 lg:grid-cols-[0.9fr_1.1fr] temple-panel">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl font-black text-gold">{reviewSummary.average > 0 ? reviewSummary.average.toFixed(1) : "0.0"}</div>
                  <div className="text-sm text-sand/60">
                    <div>{reviewSummary.count} ratings</div>
                    <div className="mt-1 flex gap-1 text-gold">
                      {Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (
                        <span key={star}>{star <= Math.round(reviewSummary.average) ? "★" : "☆"}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating, index) => {
                    const count = reviewSummary.distribution[index] ?? 0;
                    const width = reviewSummary.count > 0 ? (count / reviewSummary.count) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-3 text-xs text-sand/70">
                        <span className="w-8">{rating}★</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-obsidian">
                          <div className="h-full rounded-full bg-gold" style={{ width: `${width}%` }} />
                        </div>
                        <span className="w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="grid gap-3 rounded-3xl border border-gold/20 bg-obsidian/60 p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={reviewUserName}
                    onChange={(e) => setReviewUserName(e.target.value)}
                    placeholder={t.product.reviewNamePlaceholder}
                    disabled={!reviewAuthed}
                    className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand placeholder:text-sand/40 disabled:opacity-60"
                  />
                  <input
                    value={reviewUserEmail}
                    onChange={(e) => setReviewUserEmail(e.target.value)}
                    placeholder={t.product.reviewEmailPlaceholder}
                    disabled={!reviewAuthed}
                    className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand placeholder:text-sand/40 disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      disabled={!reviewAuthed}
                      className={`text-2xl transition ${star <= reviewRating ? "text-gold" : "text-sand/30"} disabled:opacity-60`}
                      aria-label={`${star} star rating`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <input
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder={t.product.reviewTitlePlaceholder}
                  disabled={!reviewAuthed}
                  className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand placeholder:text-sand/40 disabled:opacity-60"
                />
                <textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder={t.product.reviewBodyPlaceholder}
                  rows={5}
                  disabled={!reviewAuthed}
                  className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand placeholder:text-sand/40 disabled:opacity-60"
                />
                <div className="flex flex-wrap items-center gap-3">
                  {submittingReview ? (
                    <div className="text-xs uppercase tracking-[0.25em] text-gold/70">{t.product.reviewPosting}</div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={submittingReview || !reviewAuthed}
                    className="rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? t.product.reviewPosting : t.product.reviewPost}
                  </button>
                  {!reviewAuthed && (
                    <span className="text-xs uppercase tracking-[0.2em] text-sand/60">
                      {t.product.reviewSignedOut}
                    </span>
                  )}
                  {reviewError && <span className="text-sm text-red-400">{reviewError}</span>}
                  {reviewSuccess && <span className="text-sm text-emerald">{reviewSuccess}</span>}
                </div>
              </form>
            </div>

            <div className="grid gap-4">
              {orderedReviews.length === 0 ? (
                <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 text-sm text-sand/60 temple-panel">
                  {t.product.reviewEmpty}
                </div>
              ) : (
                orderedReviews.map((review) => (
                  <article key={review.id} className="rounded-3xl border border-gold/20 bg-stone/80 p-5 sm:p-6 temple-panel">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-sand">{review.user_name}</div>
                        <div className="mt-1 flex gap-1 text-gold">
                          {Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (
                            <span key={star}>{star <= review.rating ? "★" : "☆"}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs uppercase tracking-[0.2em] text-sand/50">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gold">{review.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-sand/75">{review.body}</p>
                  </article>
                ))
              )}
            </div>
          </section>
      </main>
      <SiteFooter />
    </div>
  );
}
