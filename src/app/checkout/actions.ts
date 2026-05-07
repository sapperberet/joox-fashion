"use server";

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createBostaDelivery } from "@/lib/bosta";
import { calculateLineTotal } from "@/lib/cart";
import { siteConfig } from "@/lib/site-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CartCoupon, CartItem } from "@/lib/types";

type SubmittedItem = {
  id: string;
  quantity: number;
};

function parseSubmittedItems(raw: string): SubmittedItem[] {
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }

  const items: SubmittedItem[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const id = String((entry as { id?: unknown }).id ?? "").trim();
    const quantity = Number((entry as { quantity?: unknown }).quantity ?? 0);
    if (!id || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }
    items.push({ id, quantity: Math.floor(quantity) });
  }

  return items;
}

function normalizeQuantity(item: CartItem, nextQty: number) {
  const safe = Number.isFinite(nextQty) ? Math.floor(nextQty) : 1;
  return Math.max(safe, 1);
}

async function resolveCoupon(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  code: string | null,
  subtotal: number,
): Promise<{ coupon: CartCoupon | null; couponDiscount: number }> {
  if (!code) {
    return { coupon: null, couponDiscount: 0 };
  }

  const now = new Date();
  const { data, error } = await supabase
    .from("coupons")
    .select("code, type, value, min_subtotal, max_uses, used_count, starts_at, expires_at, is_active")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return { coupon: null, couponDiscount: 0 };
  }

  if (typeof data.max_uses === "number" && (data.used_count ?? 0) >= data.max_uses) {
    return { coupon: null, couponDiscount: 0 };
  }

  if (data.starts_at && new Date(data.starts_at) > now) {
    return { coupon: null, couponDiscount: 0 };
  }

  if (data.expires_at && new Date(data.expires_at) < now) {
    return { coupon: null, couponDiscount: 0 };
  }

  const coupon: CartCoupon = {
    code: data.code,
    type: data.type,
    value: Number(data.value ?? 0),
    min_subtotal: data.min_subtotal ?? null,
  };

  const minSubtotal = coupon.min_subtotal ?? 0;
  if (subtotal < minSubtotal) {
    return { coupon: null, couponDiscount: 0 };
  }

  let couponDiscount = 0;
  if (coupon.type === "percent") {
    couponDiscount = (subtotal * coupon.value) / 100;
  } else if (coupon.type === "fixed") {
    couponDiscount = coupon.value;
  }

  couponDiscount = Math.max(0, Math.min(couponDiscount, subtotal));
  return { coupon, couponDiscount };
}

export async function createOrder(formData: FormData) {
  const supabase = getSupabaseAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const landmark = String(formData.get("landmark") ?? "").trim();
  const buildingNumber = String(formData.get("building_number") ?? "").trim();
  const floor = String(formData.get("floor") ?? "").trim();
  const apartment = String(formData.get("apartment") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const paymentMethod =
    (formData.get("payment_method") as "cod" | "wallet" | null) ?? "cod";

  if (!name || !phone || !city || !district || !address) {
    return { success: false, error: "Missing required customer details." };
  }

  const rawCartItems = String(formData.get("cart_items_json") ?? "").trim();
  const submittedItems = parseSubmittedItems(rawCartItems);
  const singleProductId = String(formData.get("product_id") ?? "").trim();
  const singleQuantity = Number(formData.get("quantity") ?? 1);

  const inputItems: SubmittedItem[] =
    submittedItems.length > 0
      ? submittedItems
      : singleProductId
        ? [{ id: singleProductId, quantity: Math.max(1, Math.floor(singleQuantity)) }]
        : [];

  if (inputItems.length === 0) {
    return { success: false, error: "No items in order." };
  }

  const productIds = Array.from(new Set(inputItems.map((item) => item.id)));
  const { data: dbProducts, error: productsError } = await supabase
    .from("products")
    .select("id, slug, name_en, name_ar, price, image_url")
    .in("id", productIds);

  if (productsError) {
    return { success: false, error: productsError.message };
  }

  const productMap = new Map((dbProducts ?? []).map((product) => [product.id, product]));

  const cartItems: CartItem[] = [];
  for (const entry of inputItems) {
    const dbProduct = productMap.get(entry.id);
    if (!dbProduct) {
      return { success: false, error: "A product in your order no longer exists." };
    }

    const item: CartItem = {
      id: dbProduct.id,
      slug: dbProduct.slug,
      name_en: dbProduct.name_en,
      name_ar: dbProduct.name_ar,
      price: Number(dbProduct.price ?? 0),
      image_url: dbProduct.image_url,
      quantity: entry.quantity,
      stock_qty: null,
      min_order_qty: null,
      max_order_qty: null,
      order_multiple: null,
      bundle_qty: null,
      bundle_price: null,
    };

    const normalizedQty = normalizeQuantity(item, entry.quantity);
    item.quantity = normalizedQty;

    cartItems.push(item);
  }

  const lineBreakdown = cartItems.map((item) => ({ item, line: calculateLineTotal(item) }));
  const subtotal = lineBreakdown.reduce((sum, entry) => sum + entry.line.total, 0);
  const walletDiscount = paymentMethod === "wallet" ? subtotal * siteConfig.walletDiscount : 0;

  const submittedCouponCode = String(formData.get("coupon_code") ?? "").trim() || null;
  const { coupon, couponDiscount } = await resolveCoupon(
    supabase,
    submittedCouponCode,
    subtotal,
  );

  const total = Math.max(subtotal - walletDiscount - couponDiscount, 0);
  const orderId = randomUUID();

  const receiptFile = formData.get("receipt") as File | null;
  let receiptUrl: string | null = null;

  if (receiptFile && receiptFile.size > 0) {
    const ext = receiptFile.name.split(".").pop() || "jpg";
    const filePath = `orders/${orderId}/receipt.${ext}`;
    const buffer = Buffer.from(await receiptFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, buffer, {
        contentType: receiptFile.type,
        upsert: true,
      });

    if (!uploadError) {
      const { data } = supabase.storage.from("receipts").getPublicUrl(filePath);
      receiptUrl = data.publicUrl;
    }
  }

  const orderItems = lineBreakdown.map(({ item, line }) => ({
    product_id: item.id,
    name_en: item.name_en,
    name_ar: item.name_ar,
    quantity: item.quantity,
    unit_price: item.price,
    line_total: line.total,
  }));

  const { error: insertError } = await supabase.from("orders").insert({
    id: orderId,
    customer_name: name,
    phone,
    city,
    district,
    address,
    notes,
    payment_method: paymentMethod,
    subtotal,
    discount: walletDiscount,
    total,
    items: orderItems,
    status: "new",
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Stock updates and coupon tracking disabled - columns don't exist yet
  // TODO: Add stock_qty, coupon_code columns to orders table, then re-enable

  if (bostaDelivery) {
    // Shipping updates disabled - columns don't exist yet
    // TODO: Add shipping columns to orders table, then re-enable
  }

  revalidatePath("/atelier");
  revalidatePath("/cart");
  revalidatePath("/products");

  return { success: true, orderId };
}
