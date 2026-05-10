"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminToken, verifyAdminToken, verifyCredentials } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/site-config";

type FlashCode =
  | "loginSuccess"
  | "loginFailed"
  | "categoryCreated"
  | "categoryDeleted"
  | "productCreated"
  | "productUpdated"
  | "productDeleted"
  | "productToggled"
  | "couponCreated"
  | "couponUpdated"
  | "couponDeleted"
  | "orderUpdated"
  | "actionFailed"
  | "missingData";

function toSlug(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return normalized || `item-${Date.now()}`;
}

function getReturnUrl(token: string | null, flash?: FlashCode) {
  const params = new URLSearchParams();
  if (token) {
    params.set("token", token);
  }
  if (flash) {
    params.set("flash", flash);
    params.set("kind", flash === "actionFailed" || flash === "missingData" || flash === "loginFailed" ? "error" : "success");
  }
  const query = params.toString();
  return query ? `${siteConfig.adminRoute}?${query}` : siteConfig.adminRoute;
}

function redirectTo(token: string | null, flash?: FlashCode) {
  redirect(getReturnUrl(token, flash));
}

function readToken(formData: FormData) {
  return String(formData.get("admin_token") ?? "").trim();
}

function requireAdmin(formData: FormData) {
  const token = readToken(formData);
  if (!verifyAdminToken(token)) {
    redirectTo(null, "loginFailed");
  }
  return token;
}

function readBoolean(formData: FormData, name: string, fallback = false) {
  const values = formData.getAll(name).map((value) => String(value).trim().toLowerCase());
  if (values.length === 0) {
    return fallback;
  }
  return values.some((value) => value === "true" || value === "on" || value === "1");
}

function readNumber(input: FormDataEntryValue | null, fallback: number | null = null) {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function uploadImage(file: File | null, folder: string, slug: string) {
  if (!file || file.size === 0) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${folder}/${slug}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(folder).upload(filePath, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    return null;
  }

  const { data } = supabase.storage.from(folder).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function loginAdmin(formData: FormData) {
  const user = readText(formData, "username");
  const pass = readText(formData, "password");

  if (!verifyCredentials(user, pass)) {
    redirectTo(null, "loginFailed");
  }

  const token = createAdminToken();
  redirect(getReturnUrl(token, "loginSuccess"));
}

export async function logoutAdmin() {
  redirect(siteConfig.adminRoute);
}

export async function createCategory(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const nameEn = readText(formData, "name_en");
  const nameAr = readText(formData, "name_ar");
  const slugInput = readText(formData, "slug");
  const season = readText(formData, "season");
  const sortOrder = readNumber(formData.get("sort_order"), null);

  if (!nameEn || !nameAr) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("categories").insert({
    name_en: nameEn,
    name_ar: nameAr,
    slug: toSlug(slugInput || nameEn || nameAr),
    season: season || null,
    sort_order: sortOrder !== null && sortOrder >= 0 ? sortOrder : null,
  });

  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/rolling");
  redirectTo(token, "categoryCreated");
}

export async function deleteCategory(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();
  const id = readText(formData, "category_id");

  if (!id) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/rolling");
  redirectTo(token, "categoryDeleted");
}

export async function createProduct(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const nameEn = readText(formData, "name_en");
  const nameAr = readText(formData, "name_ar");
  const slugInput = readText(formData, "slug");
  const season = readText(formData, "season");
  const descriptionEn = readText(formData, "description_en");
  const descriptionAr = readText(formData, "description_ar");
  const categoryId = readText(formData, "category_id");
  const price = readNumber(formData.get("price"), 0) ?? 0;
  const stockQty = readNumber(formData.get("stock_qty"), null);
  const minOrderQty = readNumber(formData.get("min_order_qty"), 1) ?? 1;
  const maxOrderQty = readNumber(formData.get("max_order_qty"), null);
  const orderMultiple = readNumber(formData.get("order_multiple"), 1) ?? 1;
  const bundleQty = readNumber(formData.get("bundle_qty"), null);
  const bundlePrice = readNumber(formData.get("bundle_price"), null);
  const image = formData.get("image") as File | null;
  const isOnSale = readBoolean(formData, "is_on_sale");
  const featured = readBoolean(formData, "featured");
  const isActive = readBoolean(formData, "is_active", true);
  const salePrice = readNumber(formData.get("sale_price"), null);
  const salePercent = readNumber(formData.get("sale_percent"), null);

  if (!nameEn || !nameAr || price <= 0) {
    redirectTo(token, "missingData");
  }

  const slug = toSlug(slugInput || nameEn || nameAr);
  const imageUrl = await uploadImage(image, "products", slug);

  const { error } = await supabase.from("products").insert({
    name_en: nameEn,
    name_ar: nameAr,
    slug,
    description_en: descriptionEn || null,
    description_ar: descriptionAr || null,
    category_id: categoryId || null,
    price,
    image_url: imageUrl,
    gallery_images: imageUrl ? [imageUrl] : [],
    variants: [],
    season: season || null,
    is_active: isActive,
    is_on_sale: isOnSale,
    sale_price: salePrice,
    sale_percent: salePercent,
    featured,
    stock_qty: stockQty,
    min_order_qty: minOrderQty,
    max_order_qty: maxOrderQty && maxOrderQty >= minOrderQty ? maxOrderQty : null,
    order_multiple: orderMultiple,
    bundle_qty: bundleQty,
    bundle_price: bundlePrice,
  });

  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/rolling");
  redirectTo(token, "productCreated");
}

export async function deleteProduct(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();
  const id = readText(formData, "product_id");

  if (!id) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/rolling");
  redirectTo(token, "productDeleted");
}

export async function createCoupon(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const code = readText(formData, "code").toUpperCase();
  const type = readText(formData, "type") || "percent";
  const value = readNumber(formData.get("value"), null);
  const minSubtotal = readNumber(formData.get("min_subtotal"), null);
  const maxUses = readNumber(formData.get("max_uses"), null);
  const startsAtRaw = readText(formData, "starts_at");
  const expiresAtRaw = readText(formData, "expires_at");

  if (!code || value === null) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("coupons").insert({
    code,
    type,
    value,
    min_subtotal: minSubtotal,
    max_uses: maxUses,
    used_count: 0,
    starts_at: startsAtRaw ? new Date(startsAtRaw).toISOString() : null,
    expires_at: expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null,
    is_active: true,
  });

  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  redirectTo(token, "couponCreated");
}

export async function deleteCoupon(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();
  const id = readText(formData, "coupon_id");

  if (!id) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  redirectTo(token, "couponDeleted");
}

export async function updateCoupon(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();
  const id = readText(formData, "coupon_id");

  if (!id) {
    redirectTo(token, "missingData");
  }

  const updates: Record<string, unknown> = {};
  const code = readText(formData, "code").toUpperCase();
  const type = readText(formData, "type");
  const value = readNumber(formData.get("value"), null);
  const minSubtotal = readNumber(formData.get("min_subtotal"), null);
  const maxUses = readNumber(formData.get("max_uses"), null);
  const startsAtRaw = readText(formData, "starts_at");
  const expiresAtRaw = readText(formData, "expires_at");

  if (code) updates.code = code;
  if (type) updates.type = type;
  if (value !== null) updates.value = value;
  if (minSubtotal !== null) updates.min_subtotal = minSubtotal;
  if (maxUses !== null) updates.max_uses = maxUses;
  if (startsAtRaw) updates.starts_at = new Date(startsAtRaw).toISOString();
  if (expiresAtRaw) updates.expires_at = new Date(expiresAtRaw).toISOString();
  if (formData.has("is_active")) updates.is_active = readBoolean(formData, "is_active");

  if (!Object.keys(updates).length) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("coupons").update(updates).eq("id", id);
  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  redirectTo(token, "couponUpdated");
}

export async function toggleProductActive(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const id = readText(formData, "product_id");
  const nextState = readBoolean(formData, "next_state");

  if (!id) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("products").update({ is_active: nextState }).eq("id", id);
  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/rolling");
  redirectTo(token, "productToggled");
}

export async function updateProduct(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();
  const id = readText(formData, "product_id");

  if (!id) {
    redirectTo(token, "missingData");
  }

  const updates: Record<string, unknown> = {};
  const stockQty = readNumber(formData.get("stock_qty"), null);
  const salePrice = readNumber(formData.get("sale_price"), null);
  const salePercent = readNumber(formData.get("sale_percent"), null);
  const season = readText(formData, "season");

  if (stockQty !== null) updates.stock_qty = stockQty;
  if (salePrice !== null) updates.sale_price = salePrice;
  if (salePercent !== null) updates.sale_percent = salePercent;
  if (season) updates.season = season;
  if (formData.has("is_on_sale")) updates.is_on_sale = readBoolean(formData, "is_on_sale");
  if (formData.has("featured")) updates.featured = readBoolean(formData, "featured");
  if (formData.has("is_active")) updates.is_active = readBoolean(formData, "is_active", true);

  if (!Object.keys(updates).length) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("products").update(updates).eq("id", id);
  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/rolling");
  redirectTo(token, "productUpdated");
}

export async function updateOrderStatus(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const id = readText(formData, "order_id");
  const status = readText(formData, "status");
  const paymentStatus = readText(formData, "payment_status");
  const shippingState = readText(formData, "shipping_state");

  if (!id) {
    redirectTo(token, "missingData");
  }

  const updates: Record<string, string> = {};
  if (status) updates.status = status;
  if (paymentStatus) updates.payment_status = paymentStatus;
  if (shippingState) updates.shipping_state = shippingState;

  if (!Object.keys(updates).length) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("orders").update(updates).eq("id", id);
  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  redirectTo(token, "orderUpdated");
}
