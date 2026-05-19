"use client";

import Image from "next/image";
import { useMemo } from "react";
import LanguageToggle from "@/components/LanguageToggle";
import AdminAlert from "@/components/AdminAlert";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { Category, Order, Product, ProductVariant, Event } from "@/lib/types";
import {
  createCategory,
  createCoupon,
  createEvent,
  createProduct,
  deleteCategory,
  deleteCoupon,
  deleteEvent,
  deleteProduct,
  loginAdmin,
  logoutAdmin,
  retryBostaDelivery,
  toggleProductActive,
  updateCategory,
  updateCoupon,
  updateEvent,
  updateOrderAddress,
  updateOrderStatus,
  updateProduct,
} from "./actions";

type AtelierClientProps = {
  token: string;
  isAuthorized: boolean;
  envReady: boolean;
  flash?: {
    code?: string;
    kind?: "success" | "error" | "info";
  } | null;
  categories: Category[];
  products: Product[];
  coupons: any[];
  orders: Order[];
  events: Event[];
};

const sizeOrder = ["M", "L", "XL", "XXL", "XXXL"];

function serializeGallery(images?: string[] | null) {
  return Array.isArray(images) ? images.join("\n") : "";
}

function serializeVariants(variants?: ProductVariant[] | null) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return "[]";
  }
  try {
    return JSON.stringify(variants, null, 2);
  } catch {
    return "[]";
  }
}

export default function AtelierClient({
  token,
  isAuthorized,
  envReady,
  flash,
  categories,
  products,
  coupons,
  orders,
}: AtelierClientProps) {
  const { locale } = useLanguage();
  const labels = copy[locale].admin;
  const isArabic = locale === "ar";

  const flashMessage = flash?.code
    ? labels.flash[flash.code as keyof typeof labels.flash] ?? flash.code
    : "";

  const statusOptions = useMemo(
    () => [
      { value: "new", label: labels.statusNew },
      { value: "confirmed", label: labels.statusConfirmed },
      { value: "packed", label: labels.statusPacked },
      { value: "shipped", label: labels.statusShipped },
      { value: "delivered", label: labels.statusDelivered },
      { value: "cancelled", label: labels.statusCancelled },
    ],
    [labels],
  );

  const paymentOptions = useMemo(
    () => [
      { value: "pending", label: labels.paymentPending },
      { value: "paid", label: labels.paymentPaid },
      { value: "failed", label: labels.paymentFailed },
      { value: "refunded", label: labels.paymentRefunded },
    ],
    [labels],
  );

  const shippingOptions = useMemo(
    () => [
      { value: "pending", label: labels.shippingPending },
      { value: "created", label: labels.shippingCreated },
      { value: "in_transit", label: labels.shippingInTransit },
      { value: "delivered", label: labels.shippingDelivered },
      { value: "failed", label: labels.shippingFailed },
    ],
    [labels],
  );

  const ui = {
    salesAdmin: isArabic ? "إدارة العروض" : "Sales Admin",
    dealsTitle: isArabic ? "عروض والمنتجات المجانية" : "Deals And Free Items",
    dealsBody: isArabic
      ? "إدارة عروض شراء X والحصول على Y، والمنتجات المجانية."
      : "Manage buy-x-get-y deals, trigger products, and applicable free products.",
    couponsAdmin: isArabic ? "إدارة الكوبونات" : "Coupons Admin",
    couponsTitle: isArabic ? "متطلبات النقاط والكوبونات" : "Score Triggers And Claims",
    couponsBody: isArabic
      ? "حدد شروط النقاط والإنفاق وتابع الاستخدام."
      : "Set score and spend requirements, monitor usage, and control customer coupon eligibility.",
    collectionsOptional: isArabic ? "المجموعات (اختياري)" : "Collections (optional)",
    sortOrder: isArabic ? "ترتيب العرض" : "Sort order",
    uploadImage: isArabic ? "رفع صورة المنتج" : "Upload Product Image",
    variantsLabel: isArabic ? "Variants (JSON)" : "Variants (JSON)",
    variantsHint: isArabic
      ? "الأحجام المعتادة: M / L / XL / XXL / XXXL. أدخل JSON للمتغيرات."
      : "Typical sizes: M / L / XL / XXL / XXXL. Enter variant JSON.",
    galleryLabel: isArabic ? "صور إضافية (سطر لكل رابط)" : "Gallery images (one URL per line)",
    productsTitle: isArabic ? "المنتجات" : "Products",
    couponsTitleShort: isArabic ? "الكوبونات" : "Coupons",
    collectionsTitle: isArabic ? "المجموعات" : "Collections",
    ordersTitle: isArabic ? "الطلبات" : "Orders",
    customerLabel: isArabic ? "العميل" : "Customer",
    addressLabel: isArabic ? "العنوان" : "Address",
    paymentLabel: isArabic ? "الدفع" : "Payment",
    shippingLabel: isArabic ? "الشحن" : "Shipping",
    retryBosta: isArabic ? "إعادة إنشاء شحنة بوستا" : "Retry Bosta",
    updateAddress: isArabic ? "تحديث العنوان" : "Update address",
    addressHelper: isArabic
      ? "لو المنطقة غير موجودة في بوستا، عدل المنطقة ثم أعد المحاولة."
      : "If district is not found in Bosta, edit it and retry.",
    variantsToggle: isArabic ? "الصور والمتغيرات" : "Variants & gallery",
  };

  const variantPlaceholder = JSON.stringify(
    [
      {
        color: "Black",
        size: "M",
        price: 450,
        stock_qty: 10,
        image_url: "https://...",
      },
    ],
    null,
    2,
  );

  const formatShippingError = (error?: string | null) => {
    if (!error) {
      return "";
    }
    const normalized = error.toLowerCase();
    if (normalized.includes("district not found")) {
      return isArabic
        ? "المنطقة غير موجودة في بوستا. يرجى تعديل المنطقة وإعادة المحاولة."
        : "Bosta district not found. Update the district and retry.";
    }
    if (normalized.includes("city not found")) {
      return isArabic
        ? "المدينة غير موجودة في بوستا. يرجى تعديل المدينة وإعادة المحاولة."
        : "Bosta city not found. Update the city and retry.";
    }
    return error;
  };

  if (!isAuthorized) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-20">
        <form
          action={loginAdmin}
          className="flex w-full flex-col gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-2xl tracking-[0.2em] text-gold">
              {labels.loginTitle}
            </h1>
            <LanguageToggle />
          </div>
          {flashMessage && (
            <AdminAlert
              type={flash?.kind ?? "info"}
              message={flashMessage}
              dismissible={true}
            />
          )}
          <input
            name="username"
            placeholder={labels.username}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <input
            name="password"
            type="password"
            placeholder={labels.password}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <button
            type="submit"
            className="rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
          >
            {labels.signIn}
          </button>
        </form>
      </main>
    );
  }

  if (!envReady) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-sand/70">
        {labels.envMissing}
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
        <div>
          <h1 className="font-display text-3xl tracking-[0.2em] text-gold">
            {labels.title}
          </h1>
          <p className="mt-2 text-sm text-sand/70">{labels.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <form action={logoutAdmin}>
            <button className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {labels.signOut}
            </button>
          </form>
        </div>
      </div>
      {flashMessage && (
        <AdminAlert
          type={flash?.kind ?? "info"}
          message={flashMessage}
          dismissible={true}
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href={`/atelier/events?admin_token=${encodeURIComponent(token)}`}
          className="rounded-3xl border border-gold/25 bg-stone/80 p-6 transition hover:border-gold/50 hover:bg-stone/90"
        >
          <div className="text-xs uppercase tracking-[0.24em] text-gold/80">{isArabic ? "الفعاليات" : "Events"}</div>
          <h2 className="mt-2 font-display text-xl tracking-[0.14em] text-gold">{isArabic ? "إدارة الفعاليات" : "Manage Events"}</h2>
          <p className="mt-2 text-sm text-sand/70">{isArabic ? "فعاليات موسمية وعروض ترويجية" : "Seasonal and promotional events"}</p>
        </a>
        <a
          href={`/atelier/categories?admin_token=${encodeURIComponent(token)}`}
          className="rounded-3xl border border-gold/25 bg-stone/80 p-6 transition hover:border-gold/50 hover:bg-stone/90"
        >
          <div className="text-xs uppercase tracking-[0.24em] text-gold/80">{isArabic ? "المجموعات" : "Categories"}</div>
          <h2 className="mt-2 font-display text-xl tracking-[0.14em] text-gold">{isArabic ? "إدارة المجموعات" : "Manage Categories"}</h2>
          <p className="mt-2 text-sm text-sand/70">{isArabic ? "مجموعات وتسلسلات هرمية" : "Rich category hierarchy"}</p>
        </a>
        <a
          href={`/atelier/deals?admin_token=${encodeURIComponent(token)}`}
          className="rounded-3xl border border-gold/25 bg-stone/80 p-6 transition hover:border-gold/50 hover:bg-stone/90"
        >
          <div className="text-xs uppercase tracking-[0.24em] text-gold/80">{ui.salesAdmin}</div>
          <h2 className="mt-2 font-display text-xl tracking-[0.14em] text-gold">{ui.dealsTitle}</h2>
          <p className="mt-2 text-sm text-sand/70">{ui.dealsBody}</p>
        </a>
        <a
          href={`/atelier/coupons?admin_token=${encodeURIComponent(token)}`}
          className="rounded-3xl border border-gold/25 bg-stone/80 p-6 transition hover:border-gold/50 hover:bg-stone/90"
        >
          <div className="text-xs uppercase tracking-[0.24em] text-gold/80">{ui.couponsAdmin}</div>
          <h2 className="mt-2 font-display text-xl tracking-[0.14em] text-gold">{ui.couponsTitle}</h2>
          <p className="mt-2 text-sm text-sand/70">{ui.couponsBody}</p>
        </a>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          action={createCategory}
          className="flex flex-col gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6"
        >
          <input type="hidden" name="admin_token" value={token} />
          <h2 className="font-display text-xl tracking-[0.2em] text-gold">
            {labels.createCategory}
          </h2>
          <input
            name="name_en"
            placeholder={labels.nameEn}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <input
            name="name_ar"
            placeholder={labels.nameAr}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <select
            name="season"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          >
            <option value="">{labels.season}</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
          </select>
          <input
            name="sort_order"
            type="number"
            min={0}
            placeholder={ui.sortOrder}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <button className="rounded-full bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90 hover:shadow-lg inline-flex items-center justify-center w-full">
            {labels.createCategory}
          </button>
        </form>

        <form
          action={createProduct}
          encType="multipart/form-data"
          className="flex flex-col gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6"
        >
          <input type="hidden" name="admin_token" value={token} />
          <h2 className="font-display text-xl tracking-[0.2em] text-gold">
            {labels.createProduct}
          </h2>
          <input
            name="name_en"
            placeholder={labels.nameEn}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <input
            name="name_ar"
            placeholder={labels.nameAr}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <select
            name="season"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          >
            <option value="">{labels.season}</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
          </select>
          <select
            name="category_id"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          >
            <option value="">{ui.collectionsOptional}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {isArabic ? category.name_ar : category.name_en}
              </option>
            ))}
          </select>
          <input
            name="price"
            type="number"
            min={0}
            step="1"
            placeholder={labels.price}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <input
            name="stock_qty"
            type="number"
            min={0}
            step="1"
            placeholder={labels.stockQty}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <input
              name="min_order_qty"
              type="number"
              min={1}
              step="1"
              placeholder={labels.minOrderQty}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
            <input
              name="max_order_qty"
              type="number"
              min={1}
              step="1"
              placeholder={labels.maxOrderQty}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
            <input
              name="order_multiple"
              type="number"
              min={1}
              step="1"
              placeholder={labels.orderMultiple}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="bundle_qty"
              type="number"
              min={0}
              step="1"
              placeholder={labels.bundleQty}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
            <input
              name="bundle_price"
              type="number"
              min={0}
              step="0.01"
              placeholder={labels.bundlePrice}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="flex items-center gap-2">
              <input type="hidden" name="is_on_sale" value="false" />
              <input type="checkbox" name="is_on_sale" value="true" className="h-4 w-4" />
              <span className="text-xs text-sand/60">Sale</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="hidden" name="featured" value="false" />
              <input type="checkbox" name="featured" value="true" className="h-4 w-4" />
              <span className="text-xs text-sand/60">Featured</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_active" value="true" defaultChecked className="h-4 w-4" />
              <span className="text-xs text-sand/60">Active</span>
            </label>
            <input name="sale_price" type="number" min={0} step="0.01" placeholder="Sale price (EGP)" className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
            <input name="sale_percent" type="number" min={0} max={100} step="1" placeholder="Sale % off" className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
          </div>
          <div className="relative">
            <input
              name="image"
              type="file"
              accept="image/*"
              className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
              id="product-image-upload"
            />
            <label
              htmlFor="product-image-upload"
              className="block rounded-2xl border border-gold/20 bg-obsidian/70 px-4 py-3 text-sm text-sand text-center cursor-pointer hover:bg-obsidian hover:border-gold/40 transition"
            >
              📎 {ui.uploadImage}
            </label>
          </div>
          <textarea
            name="gallery_images"
            placeholder={ui.galleryLabel}
            rows={2}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <textarea
            name="variants_json"
            placeholder={variantPlaceholder}
            rows={4}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-xs text-sand font-mono"
          />
          <p className="text-xs text-sand/60">{ui.variantsHint}</p>
          <textarea
            name="description_en"
            placeholder={labels.descriptionEN}
            rows={2}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <textarea
            name="description_ar"
            placeholder={labels.descriptionAR}
            rows={2}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <button className="rounded-full bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90 hover:shadow-lg inline-flex items-center justify-center w-full">
            {labels.createProduct}
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-gold/20 bg-stone/80 p-6">
        <h2 className="font-display text-xl tracking-[0.2em] text-gold">
          {ui.productsTitle}
        </h2>
        <div className="mt-4 space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-gold/10 bg-obsidian/70 px-4 py-4 text-sm text-sand"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name_en} width={64} height={80} className="rounded-md object-cover" />
                  ) : (
                    <div className="h-16 w-12 rounded-md bg-obsidian/40" />
                  )}
                  <div className="flex flex-col">
                    <span>{isArabic ? product.name_ar : product.name_en}</span>
                    <span className="text-xs text-sand/60">
                      {formatCurrency(product.price, "en")}
                    </span>
                    {product.stock_qty !== null && product.stock_qty !== undefined && (
                      <span className="text-xs text-sand/40">
                        {labels.stockQty}: {product.stock_qty}
                      </span>
                    )}
                    {(product.bundle_qty || product.bundle_price) && (
                      <div className="text-xs text-sand/40">
                        Bundle: {product.bundle_qty ?? "-"} for {product.bundle_price ? formatCurrency(product.bundle_price, "en") : "-"}
                      </div>
                    )}
                    {product.is_on_sale && (
                      <div className="text-xs text-red-400">On sale: {product.sale_price ? formatCurrency(product.sale_price, "en") : `${product.sale_percent}% off`}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em]">
                  <span className="text-sand/60">
                    {product.is_active ? labels.active : labels.inactive}
                  </span>
                  <form action={toggleProductActive}>
                    <input type="hidden" name="admin_token" value={token} />
                    <input type="hidden" name="product_id" value={product.id} />
                    <input
                      type="hidden"
                      name="next_state"
                      value={product.is_active ? "false" : "true"}
                    />
                    <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">
                      {labels.toggle}
                    </button>
                  </form>
                  <form action={deleteProduct} className="flex items-center justify-end">
                    <input type="hidden" name="admin_token" value={token} />
                    <input type="hidden" name="product_id" value={product.id} />
                    <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">
                      {labels.delete}
                    </button>
                  </form>
                </div>
              </div>

              <form action={updateProduct} className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="admin_token" value={token} />
                <input type="hidden" name="product_id" value={product.id} />
                <div className="flex flex-wrap items-center gap-2">
                  <input name="stock_qty" defaultValue={product.stock_qty ?? ""} type="number" className="w-24 rounded-2xl border border-gold/20 bg-obsidian px-2 py-1 text-xs text-sand" />
                  <select name="season" defaultValue={product.season ?? ""} className="w-28 rounded-2xl border border-gold/20 bg-obsidian px-2 py-1 text-xs text-sand">
                    <option value="">Event</option>
                    <option value="summer">Summer</option>
                    <option value="winter">Winter</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="hidden" name="is_on_sale" value="false" />
                    <input type="checkbox" name="is_on_sale" value="true" defaultChecked={!!product.is_on_sale} />
                    <span>Sale</span>
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="hidden" name="featured" value="false" />
                    <input type="checkbox" name="featured" value="true" defaultChecked={!!product.featured} />
                    <span>Featured</span>
                  </label>
                  <input name="sale_price" defaultValue={product.sale_price ?? ""} type="number" step="0.01" placeholder="Sale" className="w-24 rounded-2xl border border-gold/20 bg-obsidian px-2 py-1 text-xs text-sand" />
                  <input name="sale_percent" defaultValue={product.sale_percent ?? ""} type="number" step="1" placeholder="%" className="w-16 rounded-2xl border border-gold/20 bg-obsidian px-2 py-1 text-xs text-sand" />
                  <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">{labels.update}</button>
                </div>

                <details className="rounded-2xl border border-gold/20 bg-obsidian/60 p-3">
                  <summary className="cursor-pointer text-xs uppercase tracking-[0.2em] text-gold/70">
                    {ui.variantsToggle}
                  </summary>
                  <div className="mt-3 grid gap-3">
                    <textarea
                      name="gallery_images"
                      defaultValue={serializeGallery(product.gallery_images)}
                      placeholder={ui.galleryLabel}
                      rows={2}
                      className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-xs text-sand"
                    />
                    <textarea
                      name="variants_json"
                      defaultValue={serializeVariants(product.variants)}
                      placeholder={variantPlaceholder}
                      rows={5}
                      className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-xs text-sand font-mono"
                    />
                    <div className="text-xs text-sand/60">
                      {ui.variantsHint}
                    </div>
                  </div>
                </details>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gold/20 bg-stone/80 p-6">
        <h2 className="font-display text-xl tracking-[0.2em] text-gold">{ui.couponsTitleShort}</h2>
        <form action={createCoupon} className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
          <input type="hidden" name="admin_token" value={token} />
          <input name="code" placeholder="Code" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
          <select name="type" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand">
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
          </select>
          <input name="value" type="number" min={0} step="0.01" placeholder="Value" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
          <div className="flex gap-2">
            <input name="min_subtotal" type="number" min={0} step="0.01" placeholder="Min subtotal" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
            <input name="max_uses" type="number" min={0} step="1" placeholder="Max uses" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
          </div>
          <div className="flex gap-2">
            <input name="starts_at" type="date" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
            <input name="expires_at" type="date" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
            <button className="rounded-full bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink">Add</button>
          </div>
        </form>

        <div className="mt-4 space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="grid grid-cols-1 gap-2 rounded-2xl border border-gold/10 bg-obsidian/70 px-4 py-3 text-sm text-sand md:grid-cols-3">
              <div>
                <div className="font-medium">{c.code}</div>
                <div className="text-xs text-sand/60">{c.type} — {c.value}</div>
                <div className="text-xs text-sand/60">Min: {c.min_subtotal ?? 0} • Uses: {c.used_count ?? 0}/{c.max_uses ?? "∞"}</div>
                <div className="text-xs text-sand/60">{c.starts_at ? `From ${new Date(c.starts_at).toLocaleDateString()}` : ""} {c.expires_at ? `Until ${new Date(c.expires_at).toLocaleDateString()}` : ""}</div>
              </div>
              <form action={updateCoupon} className="flex items-center gap-2">
                <input type="hidden" name="admin_token" value={token} />
                <input type="hidden" name="coupon_id" value={c.id} />
                <input name="code" defaultValue={c.code} className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
                <input name="value" defaultValue={String(c.value)} type="number" step="0.01" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
                <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">{labels.update}</button>
              </form>
              <form action={deleteCoupon} className="flex items-center justify-end">
                <input type="hidden" name="admin_token" value={token} />
                <input type="hidden" name="coupon_id" value={c.id} />
                <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">{labels.delete}</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gold/20 bg-stone/80 p-6">
        <h2 className="font-display text-xl tracking-[0.2em] text-gold">
          {ui.collectionsTitle}
        </h2>
        <div className="mt-4 space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/10 bg-obsidian/70 px-4 py-3 text-sm text-sand"
            >
              <div>
                <span>{isArabic ? category.name_ar : category.name_en}</span>
              </div>
              <form action={deleteCategory}>
                <input type="hidden" name="admin_token" value={token} />
                <input type="hidden" name="category_id" value={category.id} />
                <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">
                  {labels.delete}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gold/20 bg-stone/80 p-6">
        <h2 className="font-display text-xl tracking-[0.2em] text-gold mb-6">
          {ui.ordersTitle}
        </h2>
        <div className="space-y-4">
          {orders.map((order) => {
            const shippingError = formatShippingError(order.shipping_error);
            const showRetry = order.payment_method === "cod";
            return (
              <div
                key={order.id}
                className="rounded-2xl border-2 border-gold/20 bg-obsidian/80 overflow-hidden hover:border-gold/40 transition"
              >
                <div className="grid gap-4 lg:grid-cols-3 p-4 sm:p-6">
                  <div className="lg:col-span-1 space-y-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-gold/60 font-semibold">Order ID</div>
                      <div className="font-mono text-sm text-gold font-bold mt-1 break-all">{order.id}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-sand/60 font-semibold">{ui.customerLabel}</div>
                      <div className="mt-1">
                        <div className="font-semibold text-sand">{order.customer_name}</div>
                        <div className="text-xs text-sand/60 font-mono">{order.phone}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-sand/60 font-semibold">{ui.addressLabel}</div>
                      <div className="text-xs text-sand/70 mt-1">
                        {order.address}
                        {order.building_number && `, Building ${order.building_number}`}
                        {order.floor && `, Floor ${order.floor}`}
                        {order.apartment && `, Apt ${order.apartment}`}
                        <br />
                        {order.city}
                        {order.district && `, ${order.district}`}
                      </div>
                    </div>
                    <form action={updateOrderAddress} className="grid gap-2 rounded-2xl border border-gold/15 bg-obsidian/70 p-3">
                      <input type="hidden" name="admin_token" value={token} />
                      <input type="hidden" name="order_id" value={order.id} />
                      <input name="city" defaultValue={order.city} className="rounded-lg border border-gold/20 bg-obsidian px-3 py-2 text-xs text-sand" />
                      <input name="district" defaultValue={order.district ?? ""} className="rounded-lg border border-gold/20 bg-obsidian px-3 py-2 text-xs text-sand" />
                      <input name="address" defaultValue={order.address} className="rounded-lg border border-gold/20 bg-obsidian px-3 py-2 text-xs text-sand" />
                      <input name="landmark" defaultValue={order.landmark ?? ""} className="rounded-lg border border-gold/20 bg-obsidian px-3 py-2 text-xs text-sand" />
                      <button className="rounded-full border border-gold/30 px-3 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-gold">
                        {ui.updateAddress}
                      </button>
                      <div className="text-[0.65rem] text-sand/50">{ui.addressHelper}</div>
                    </form>
                  </div>

                  <div className="lg:col-span-1 space-y-3">
                    <div className="text-xl sm:text-2xl font-bold text-gold">{formatCurrency(order.total, "en")}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-gold/10 border border-gold/20 p-2">
                        <div className="text-xs text-sand/60">{ui.paymentLabel}</div>
                        <div className={`text-xs font-bold mt-1 ${
                          order.payment_status === "paid" ? "text-emerald" :
                          order.payment_status === "pending" ? "text-gold" :
                          "text-red-400"
                        }`}>
                          {order.payment_status?.toUpperCase() || "PENDING"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gold/10 border border-gold/20 p-2">
                        <div className="text-xs text-sand/60">{ui.shippingLabel}</div>
                        <div className={`text-xs font-bold mt-1 ${
                          order.shipping_state === "delivered" ? "text-emerald" :
                          order.shipping_state === "in_transit" ? "text-gold" :
                          "text-sand/60"
                        }`}>
                          {order.shipping_state?.toUpperCase() || "PENDING"}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-sand/60">
                      Method: <span className="text-sand font-semibold">{order.payment_method.toUpperCase()}</span>
                    </div>
                    {order.shipping_tracking_number && (
                      <div className="rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-xs">
                        <div className="text-sand/60">Tracking</div>
                        <div className="font-mono text-gold mt-1 break-all">{order.shipping_tracking_number}</div>
                      </div>
                    )}
                    {order.shipping_reference && !order.shipping_tracking_number && (
                      <div className="rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-xs">
                        <div className="text-sand/60">Ref</div>
                        <div className="font-mono text-gold mt-1 break-all">{order.shipping_reference}</div>
                      </div>
                    )}
                    {shippingError && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        ⚠️ {shippingError}
                      </div>
                    )}
                    {showRetry && (
                      <form action={retryBostaDelivery}>
                        <input type="hidden" name="admin_token" value={token} />
                        <input type="hidden" name="order_id" value={order.id} />
                        <button className="rounded-full border border-gold/30 px-3 py-2 text-xs uppercase tracking-[0.2em] text-gold">
                          {ui.retryBosta}
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="lg:col-span-1 space-y-3">
                    {order.receipt_url && (
                      <div className="rounded-lg overflow-hidden border border-gold/20">
                        <div className="relative h-32 bg-obsidian flex items-center justify-center">
                          <Image
                            src={order.receipt_url}
                            alt="Receipt"
                            fill
                            className="object-contain p-2"
                            unoptimized
                          />
                        </div>
                        <div className="p-2 bg-obsidian/50 border-t border-gold/10">
                          <a
                            href={order.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-gold hover:text-gold/70 font-semibold"
                          >
                            View Full Receipt →
                          </a>
                        </div>
                      </div>
                    )}
                    <form
                      action={updateOrderStatus}
                      className="space-y-2 rounded-lg border border-gold/20 bg-obsidian/80 p-3"
                    >
                      <input type="hidden" name="admin_token" value={token} />
                      <input type="hidden" name="order_id" value={order.id} />
                      <label className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-[0.2em] text-sand/60 font-semibold">
                          {labels.status}
                        </span>
                        <select
                          name="status"
                          defaultValue={order.status ?? "new"}
                          className="rounded-lg border border-gold/20 bg-obsidian px-2 py-1.5 text-xs text-sand"
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-[0.2em] text-sand/60 font-semibold">
                          {labels.paymentStatus}
                        </span>
                        <select
                          name="payment_status"
                          defaultValue={order.payment_status ?? "pending"}
                          className="rounded-lg border border-gold/20 bg-obsidian px-2 py-1.5 text-xs text-sand"
                        >
                          {paymentOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-[0.2em] text-sand/60 font-semibold">
                          {labels.shippingStatus}
                        </span>
                        <select
                          name="shipping_state"
                          defaultValue={order.shipping_state ?? "pending"}
                          className="rounded-lg border border-gold/20 bg-obsidian px-2 py-1.5 text-xs text-sand"
                        >
                          {shippingOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="w-full rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/20 transition">
                        {labels.update}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
