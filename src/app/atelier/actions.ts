"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminToken,
  verifyAdminToken,
  verifyCredentials,
} from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/site-config";

function requireAdmin(formData: FormData) {
  const token = String(formData.get("admin_token") ?? "");
  if (!verifyAdminToken(token)) {
    redirect(siteConfig.adminRoute);
  }
}

export async function loginAdmin(formData: FormData) {
  const user = String(formData.get("username") ?? "").trim();
  const pass = String(formData.get("password") ?? "").trim();

  if (verifyCredentials(user, pass)) {
    const token = createAdminToken();
    redirect(`${siteConfig.adminRoute}?token=${token}`);
  }

  redirect(siteConfig.adminRoute);
}

export async function logoutAdmin() {
  redirect(siteConfig.adminRoute);
}

export async function createCategory(formData: FormData) {
  requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const nameEn = String(formData.get("name_en") ?? "").trim();
  const nameAr = String(formData.get("name_ar") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const season = String(formData.get("season") ?? "").trim();
  const sortOrderRaw = String(formData.get("sort_order") ?? "").trim();
  const sortOrderValue = sortOrderRaw ? Number(sortOrderRaw) : NaN;
  const sortOrder = Number.isFinite(sortOrderValue)
    ? Math.max(0, sortOrderValue)
    : null;

  if (!nameEn || !slug) {
    return;
  }

  await supabase.from("categories").insert({
    name_en: nameEn,
    name_ar: nameAr,
    slug,
    season: season || null,
    sort_order: sortOrder,
  });

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
  requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const id = String(formData.get("category_id") ?? "").trim();
  if (!id) {
    return;
  }

  await supabase.from("categories").delete().eq("id", id);
  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
}

export async function createProduct(formData: FormData) {
  requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const nameEn = String(formData.get("name_en") ?? "").trim();
  const nameAr = String(formData.get("name_ar") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const season = String(formData.get("season") ?? "").trim();
  const descriptionEn = String(formData.get("description_en") ?? "").trim();
  const descriptionAr = String(formData.get("description_ar") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const priceRaw = Number(formData.get("price") ?? 0);
  const price = Number.isFinite(priceRaw) ? Math.max(priceRaw, 0) : 0;
  const stockRaw = String(formData.get("stock_qty") ?? "").trim();
  const stockValue = stockRaw ? Number(stockRaw) : NaN;
  const stockQty = Number.isFinite(stockValue) ? Math.max(stockValue, 0) : null;
  const minOrderRaw = String(formData.get("min_order_qty") ?? "").trim();
  const minOrderValue = minOrderRaw ? Number(minOrderRaw) : NaN;
  const minOrderQty = Number.isFinite(minOrderValue)
    ? Math.max(minOrderValue, 1)
    : 1;
  const maxOrderRaw = String(formData.get("max_order_qty") ?? "").trim();
  const maxOrderValue = maxOrderRaw ? Number(maxOrderRaw) : NaN;
  const maxOrderQty = Number.isFinite(maxOrderValue)
    ? Math.max(maxOrderValue, 1)
    : null;
  const multipleRaw = String(formData.get("order_multiple") ?? "").trim();
  const multipleValue = multipleRaw ? Number(multipleRaw) : NaN;
  const orderMultiple = Number.isFinite(multipleValue)
    ? Math.max(multipleValue, 1)
    : 1;
  const bundleQtyRaw = String(formData.get("bundle_qty") ?? "").trim();
  const bundleQtyValue = bundleQtyRaw ? Number(bundleQtyRaw) : NaN;
  const bundleQty = Number.isFinite(bundleQtyValue) ? Math.max(bundleQtyValue, 0) : null;
  const bundlePriceRaw = String(formData.get("bundle_price") ?? "").trim();
  const bundlePriceValue = bundlePriceRaw ? Number(bundlePriceRaw) : NaN;
  const bundlePrice = Number.isFinite(bundlePriceValue) ? Math.max(bundlePriceValue, 0) : null;
  const image = formData.get("image") as File | null;
  const isOnSaleRaw = String(formData.get("is_on_sale") ?? "").trim();
  const is_on_sale = isOnSaleRaw === "true";
  const salePriceRaw = String(formData.get("sale_price") ?? "").trim();
  const sale_price = salePriceRaw ? Number(salePriceRaw) : null;
  const salePercentRaw = String(formData.get("sale_percent") ?? "").trim();
  const sale_percent = salePercentRaw ? Number(salePercentRaw) : null;

  if (!nameEn || !slug || price <= 0) {
    return;
  }

  let imageUrl: string | null = null;
  if (image && image.size > 0) {
    const ext = image.name.split(".").pop() || "jpg";
    const filePath = `products/${slug}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await image.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, buffer, {
        contentType: image.type,
        upsert: true,
      });

    if (!uploadError) {
      const { data } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);
      imageUrl = data.publicUrl;
    }
  }

  await supabase.from("products").insert({
    name_en: nameEn,
    name_ar: nameAr,
    slug,
    description_en: descriptionEn,
    description_ar: descriptionAr,
    category_id: categoryId || null,
    price,
    image_url: imageUrl,
    season: season || null,
    is_active: true,
    is_on_sale: is_on_sale,
    sale_price: sale_price,
    sale_percent: sale_percent,
    featured: false,
    stock_qty: stockQty,
    min_order_qty: minOrderQty,
    max_order_qty:
      maxOrderQty && maxOrderQty >= minOrderQty ? maxOrderQty : null,
    order_multiple: orderMultiple,
    bundle_qty: bundleQty,
    bundle_price: bundlePrice,
  });

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
}

export async function deleteProduct(formData: FormData) {
  requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const id = String(formData.get("product_id") ?? "").trim();
  if (!id) {
    return;
  }

  await supabase.from("products").delete().eq("id", id);
  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
}

export async function createCoupon(formData: FormData) {
  requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "percent").trim();
  const valueRaw = String(formData.get("value") ?? "").trim();
  const value = valueRaw ? Number(valueRaw) : NaN;
  const minSubtotalRaw = String(formData.get("min_subtotal") ?? "").trim();
  const min_subtotal = minSubtotalRaw ? Number(minSubtotalRaw) : null;
  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  const max_uses = maxUsesRaw ? Number(maxUsesRaw) : null;
  const startsAtRaw = String(formData.get("starts_at") ?? "").trim();
  const expiresAtRaw = String(formData.get("expires_at") ?? "").trim();
  const starts_at = startsAtRaw ? new Date(startsAtRaw).toISOString() : null;
  const expires_at = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null;

  if (!code || !type || !Number.isFinite(value)) {
    return;
  }

  await supabase.from("coupons").insert({
    code,
    type,
    value,
    min_subtotal: min_subtotal ?? null,
    max_uses: max_uses ?? null,
    used_count: 0,
    starts_at: starts_at ?? null,
    expires_at: expires_at ?? null,
    is_active: true,
  });

  revalidatePath(siteConfig.adminRoute);
}

export async function deleteCoupon(formData: FormData) {
  requireAdmin(formData);
  const supabase = getSupabaseAdmin();
  const id = String(formData.get("coupon_id") ?? "").trim();
  if (!id) return;
  await supabase.from("coupons").delete().eq("id", id);
  revalidatePath(siteConfig.adminRoute);
}

export async function updateCoupon(formData: FormData) {
  requireAdmin(formData);
  const supabase = getSupabaseAdmin();
  const id = String(formData.get("coupon_id") ?? "").trim();
  if (!id) return;

  const updates: Record<string, unknown> = {};
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (code) updates.code = code;
  const type = String(formData.get("type") ?? "").trim();
  if (type) updates.type = type;
  const valueRaw = String(formData.get("value") ?? "").trim();
  if (valueRaw) updates.value = Number(valueRaw);
  const minSubtotalRaw = String(formData.get("min_subtotal") ?? "").trim();
  if (minSubtotalRaw) updates.min_subtotal = Number(minSubtotalRaw);
  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  if (maxUsesRaw) updates.max_uses = Number(maxUsesRaw);
  const startsAtRaw = String(formData.get("starts_at") ?? "").trim();
  if (startsAtRaw) updates.starts_at = new Date(startsAtRaw).toISOString();
  const expiresAtRaw = String(formData.get("expires_at") ?? "").trim();
  if (expiresAtRaw) updates.expires_at = new Date(expiresAtRaw).toISOString();
  const isActiveRaw = String(formData.get("is_active") ?? "").trim();
  if (isActiveRaw) updates.is_active = isActiveRaw === "true";

  if (!Object.keys(updates).length) return;

  await supabase.from("coupons").update(updates).eq("id", id);
  revalidatePath(siteConfig.adminRoute);
}

export async function toggleProductActive(formData: FormData) {
  requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const id = String(formData.get("product_id") ?? "").trim();
  const nextState = String(formData.get("next_state") ?? "").trim();

  if (!id) {
    return;
  }

  await supabase
    .from("products")
    .update({ is_active: nextState === "true" })
    .eq("id", id);

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
}

export async function updateProduct(formData: FormData) {
  requireAdmin(formData);
  const supabase = getSupabaseAdmin();
  const id = String(formData.get("product_id") ?? "").trim();
  if (!id) return;

  const updates: Record<string, unknown> = {};
  const stockRaw = String(formData.get("stock_qty") ?? "").trim();
  if (stockRaw) updates.stock_qty = Number(stockRaw);
  const isOnSaleRaw = String(formData.get("is_on_sale") ?? "").trim();
  if (isOnSaleRaw) updates.is_on_sale = isOnSaleRaw === "true";
  const salePriceRaw = String(formData.get("sale_price") ?? "").trim();
  if (salePriceRaw) updates.sale_price = Number(salePriceRaw);
  const salePercentRaw = String(formData.get("sale_percent") ?? "").trim();
  if (salePercentRaw) updates.sale_percent = Number(salePercentRaw);

  if (!Object.keys(updates).length) return;

  await supabase.from("products").update(updates).eq("id", id);
  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
}

export async function updateOrderStatus(formData: FormData) {
  requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const id = String(formData.get("order_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const paymentStatus = String(formData.get("payment_status") ?? "").trim();
  const shippingState = String(formData.get("shipping_state") ?? "").trim();

  if (!id) {
    return;
  }

  const updates: Record<string, string> = {};
  if (status) {
    updates.status = status;
  }
  if (paymentStatus) {
    updates.payment_status = paymentStatus;
  }
  if (shippingState) {
    updates.shipping_state = shippingState;
  }

  if (!Object.keys(updates).length) {
    return;
  }

  await supabase.from("orders").update(updates).eq("id", id);
  revalidatePath(siteConfig.adminRoute);
}
