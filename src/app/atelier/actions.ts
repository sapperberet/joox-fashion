"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminToken, verifyAdminToken, verifyCredentials } from "@/lib/admin-auth";
import { createBostaDelivery } from "@/lib/bosta";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/site-config";
import type { ProductVariant } from "@/lib/types";

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

const allowedSizes = new Set(["M", "L", "XL", "XXL", "XXXL"]);

function normalizeSize(value: string | null) {
  if (!value) {
    return null;
  }
  const cleaned = value.replace(/\s+/g, "").toUpperCase();
  if (!cleaned) {
    return null;
  }
  if (allowedSizes.has(cleaned)) {
    return cleaned;
  }
  return cleaned;
}

function parseVariantsInput(raw: string) {
  if (!raw.trim()) {
    return { variants: [] as ProductVariant[], error: false };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return { variants: [] as ProductVariant[], error: true };
    }

    const variants = parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          return null;
        }
        const record = entry as Record<string, unknown>;
        const textValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");
        const numberValue = (value: unknown) => {
          const parsedValue = typeof value === "number" ? value : Number(value);
          return Number.isFinite(parsedValue) ? parsedValue : null;
        };

        const color = textValue(record.color) || null;
        const size = normalizeSize(textValue(record.size)) || null;
        const labelEn = textValue(record.label_en) || null;
        const labelAr = textValue(record.label_ar) || null;
        const price = numberValue(record.price);
        const salePrice = numberValue(record.sale_price);
        const salePercent = numberValue(record.sale_percent);
        const imageUrl = textValue(record.image_url) || null;
        const stockQty = numberValue(record.stock_qty);
        const sku = textValue(record.sku) || null;
        const id = textValue(record.id) || null;

        const hasData = Boolean(
          color || size || labelEn || labelAr || price || salePrice || salePercent || imageUrl || stockQty || sku,
        );
        if (!hasData) {
          return null;
        }

        return {
          id,
          color,
          size,
          label_en: labelEn,
          label_ar: labelAr,
          price,
          sale_price: salePrice,
          sale_percent: salePercent,
          image_url: imageUrl,
          stock_qty: stockQty,
          sku,
        } satisfies ProductVariant;
      })
      .filter(Boolean) as ProductVariant[];

    return { variants, error: false };
  } catch {
    return { variants: [] as ProductVariant[], error: true };
  }
}

function parseGalleryImages(raw: string) {
  const parts = raw
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
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
  const galleryInput = readText(formData, "gallery_images");
  const variantsInput = readText(formData, "variants_json");
  const parsedVariants = parseVariantsInput(variantsInput);
  if (parsedVariants.error) {
    redirectTo(token, "actionFailed");
  }

  if (!nameEn || !nameAr || price <= 0) {
    redirectTo(token, "missingData");
  }

  const slug = toSlug(slugInput || nameEn || nameAr);
  const imageUrl = await uploadImage(image, "products", slug);
  const galleryImages = parseGalleryImages(galleryInput);
  if (imageUrl && !galleryImages.includes(imageUrl)) {
    galleryImages.unshift(imageUrl);
  }
  const saleEnabled = Boolean(isOnSale || (salePrice ?? 0) > 0 || (salePercent ?? 0) > 0);

  const { error } = await supabase.from("products").insert({
    name_en: nameEn,
    name_ar: nameAr,
    slug,
    description_en: descriptionEn || null,
    description_ar: descriptionAr || null,
    category_id: categoryId || null,
    price,
    image_url: imageUrl,
    gallery_images: galleryImages,
    variants: parsedVariants.variants,
    season: season || null,
    is_active: isActive,
    is_on_sale: saleEnabled,
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
  const galleryInput = readText(formData, "gallery_images");
  const variantsInput = readText(formData, "variants_json");
  const parsedVariants = parseVariantsInput(variantsInput);
  if (parsedVariants.error) {
    redirectTo(token, "actionFailed");
  }

  updates.stock_qty = stockQty;
  updates.sale_price = salePrice;
  updates.sale_percent = salePercent;
  if (season) updates.season = season;
  const saleEnabled = Boolean(readBoolean(formData, "is_on_sale") || (salePrice ?? 0) > 0 || (salePercent ?? 0) > 0);
  updates.is_on_sale = saleEnabled;
  if (formData.has("featured")) updates.featured = readBoolean(formData, "featured");
  if (formData.has("is_active")) updates.is_active = readBoolean(formData, "is_active", true);
  updates.gallery_images = parseGalleryImages(galleryInput);
  updates.variants = parsedVariants.variants;

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

export async function updateOrderAddress(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const id = readText(formData, "order_id");
  const city = readText(formData, "city");
  const district = readText(formData, "district");
  const address = readText(formData, "address");
  const landmark = readText(formData, "landmark");

  if (!id || !city || !address) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      city,
      district: district || null,
      address,
      landmark: landmark || null,
    })
    .eq("id", id);

  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  redirectTo(token, "orderUpdated");
}

export async function retryBostaDelivery(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();
  const orderId = readText(formData, "order_id");

  if (!orderId) {
    redirectTo(token, "missingData");
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, customer_name, phone, address, city, district, landmark, building_number, floor, apartment, payment_method, subtotal, total, items",
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    redirectTo(token, "actionFailed");
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsCount = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  const itemsDescription = items
    .map((item) => `${item.name_en ?? item.name_ar ?? "Item"} x${item.quantity ?? 1}`)
    .join(", ");
  const codAmount = order.payment_method === "cod" ? Number(order.total ?? 0) : 0;
  const goodsValue = Number(order.subtotal ?? 0);

  const bostaDelivery = await createBostaDelivery({
    orderId: order.id,
    customerName: order.customer_name,
    phone: order.phone,
    notes: null,
    codAmount,
    goodsValue,
    itemsCount,
    itemsDescription: itemsDescription || "Order items",
    address: {
      city: order.city,
      district: order.district ?? "",
      firstLine: order.address,
      secondLine: order.landmark ?? null,
      buildingNumber: order.building_number ?? null,
      floor: order.floor ?? null,
      apartment: order.apartment ?? null,
    },
  });

  if (!bostaDelivery) {
    await supabase
      .from("orders")
      .update({ shipping_error: "Bosta API not configured." })
      .eq("id", order.id);
    redirectTo(token, "actionFailed");
  }

  const shippingState = bostaDelivery.error ? "failed" : bostaDelivery.state || "created";
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shipping_provider: "bosta",
      shipping_tracking_number: bostaDelivery.trackingNumber || null,
      shipping_reference: bostaDelivery.businessReference || null,
      shipping_state: shippingState,
      shipping_error: bostaDelivery.error || null,
    })
    .eq("id", order.id);

  if (updateError) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  redirectTo(token, "orderUpdated");
}

export async function createEvent(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const nameEn = readText(formData, "name_en");
  const nameAr = readText(formData, "name_ar");
  const slugInput = readText(formData, "slug");
  const eventType = readText(formData, "event_type");
  const descriptionEn = readText(formData, "description_en");
  const descriptionAr = readText(formData, "description_ar");
  const iconUrl = readText(formData, "icon_url");
  const bannerUrl = readText(formData, "banner_url");
  const startDate = readText(formData, "start_date");
  const endDate = readText(formData, "end_date");
  const sortOrder = readNumber(formData.get("sort_order"), null);

  if (!nameEn || !nameAr || !eventType) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("events").insert({
    name_en: nameEn,
    name_ar: nameAr,
    slug: toSlug(slugInput || nameEn || nameAr),
    event_type: eventType,
    description_en: descriptionEn || null,
    description_ar: descriptionAr || null,
    icon_url: iconUrl || null,
    banner_url: bannerUrl || null,
    start_date: startDate || null,
    end_date: endDate || null,
    sort_order: sortOrder !== null && sortOrder >= 0 ? sortOrder : null,
  });

  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
  revalidatePath("/products");
  redirectTo(token, "eventCreated");
}

export async function updateEvent(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const id = readText(formData, "event_id");
  const nameEn = readText(formData, "name_en");
  const nameAr = readText(formData, "name_ar");
  const eventType = readText(formData, "event_type");
  const descriptionEn = readText(formData, "description_en");
  const descriptionAr = readText(formData, "description_ar");
  const iconUrl = readText(formData, "icon_url");
  const bannerUrl = readText(formData, "banner_url");
  const startDate = readText(formData, "start_date");
  const endDate = readText(formData, "end_date");
  const isActive = readBoolean(formData, "is_active", true);
  const sortOrder = readNumber(formData.get("sort_order"), null);

  if (!id) {
    redirectTo(token, "missingData");
  }

  const updates: Record<string, unknown> = {};
  if (nameEn) updates.name_en = nameEn;
  if (nameAr) updates.name_ar = nameAr;
  if (eventType) updates.event_type = eventType;
  if (descriptionEn) updates.description_en = descriptionEn;
  if (descriptionAr) updates.description_ar = descriptionAr;
  if (iconUrl) updates.icon_url = iconUrl;
  if (bannerUrl) updates.banner_url = bannerUrl;
  if (startDate) updates.start_date = startDate;
  if (endDate) updates.end_date = endDate;
  if (formData.has("is_active")) updates.is_active = isActive;
  if (sortOrder !== null && sortOrder >= 0) updates.sort_order = sortOrder;

  if (!Object.keys(updates).length) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("events").update(updates).eq("id", id);
  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
  revalidatePath("/products");
  redirectTo(token, "eventUpdated");
}

export async function deleteEvent(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();
  const id = readText(formData, "event_id");

  if (!id) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
  revalidatePath("/products");
  redirectTo(token, "eventDeleted");
}

export async function updateCategory(formData: FormData) {
  const token = requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  const id = readText(formData, "category_id");
  const nameEn = readText(formData, "name_en");
  const nameAr = readText(formData, "name_ar");
  const type = readText(formData, "type");
  const parentCategoryId = readText(formData, "parent_category_id");
  const descriptionEn = readText(formData, "description_en");
  const descriptionAr = readText(formData, "description_ar");
  const iconUrl = readText(formData, "icon_url");
  const isActive = readBoolean(formData, "is_active", true);
  const sortOrder = readNumber(formData.get("sort_order"), null);

  if (!id) {
    redirectTo(token, "missingData");
  }

  const updates: Record<string, unknown> = {};
  if (nameEn) updates.name_en = nameEn;
  if (nameAr) updates.name_ar = nameAr;
  if (type) updates.type = type;
  if (parentCategoryId) updates.parent_category_id = parentCategoryId;
  else if (formData.has("parent_category_id")) updates.parent_category_id = null;
  if (descriptionEn) updates.description_en = descriptionEn;
  if (descriptionAr) updates.description_ar = descriptionAr;
  if (iconUrl) updates.icon_url = iconUrl;
  if (formData.has("is_active")) updates.is_active = isActive;
  if (sortOrder !== null && sortOrder >= 0) updates.sort_order = sortOrder;

  if (!Object.keys(updates).length) {
    redirectTo(token, "missingData");
  }

  const { error } = await supabase.from("categories").update(updates).eq("id", id);
  if (error) {
    redirectTo(token, "actionFailed");
  }

  revalidatePath(siteConfig.adminRoute);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/rolling");
  redirectTo(token, "categoryUpdated");
}
