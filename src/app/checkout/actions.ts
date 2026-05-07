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
  const minQty = Math.max(item.min_order_qty ?? 1, 1);
  const orderMultiple = Math.max(item.order_multiple ?? 1, 1);
  const maxQty = item.max_order_qty ?? item.stock_qty ?? null;

  const safe = Number.isFinite(nextQty) ? Math.floor(nextQty) : minQty;
  let quantity = Math.max(safe, minQty);

  if (orderMultiple > 1) {
    const remainder = (quantity - minQty) % orderMultiple;
    if (remainder !== 0) {
      quantity = quantity - remainder + orderMultiple;
    }
  }

  if (maxQty !== null) {
    quantity = Math.min(quantity, maxQty);
  }

  return quantity;
}

async function resolveCoupon(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  code: string | null,
  subtotal: number,
): Promise<{ coupon: (CartCoupon & { max_uses?: number | null; used_count?: number | null }) | null; couponDiscount: number }> {
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

  const coupon: (CartCoupon & { max_uses?: number | null; used_count?: number | null }) = {
    code: data.code,
    type: data.type,
    value: Number(data.value ?? 0),
    min_subtotal: data.min_subtotal ?? null,
    max_uses: data.max_uses ?? null,
    used_count: data.used_count ?? null,
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
    .select("id, slug, name_en, name_ar, price, image_url, stock_qty, min_order_qty, max_order_qty, order_multiple, bundle_qty, bundle_price")
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
      stock_qty: dbProduct.stock_qty,
      min_order_qty: dbProduct.min_order_qty,
      max_order_qty: dbProduct.max_order_qty,
      order_multiple: dbProduct.order_multiple,
      bundle_qty: dbProduct.bundle_qty,
      bundle_price: dbProduct.bundle_price,
    };

    const normalizedQty = normalizeQuantity(item, entry.quantity);
    item.quantity = normalizedQty;
    const stockQty = item.stock_qty ?? null;

    if (stockQty !== null && stockQty <= 0) {
      return { success: false, error: `${item.name_en} is out of stock.` };
    }

    if (stockQty !== null && item.quantity > stockQty) {
      return { success: false, error: `Insufficient stock for ${item.name_en}.` };
    }

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

  // If a coupon is being applied, try to reserve/increment its usage atomically before creating the order
  if (coupon?.code) {
    try {
      if (typeof coupon.max_uses === "number") {
        // only increment if used_count < max_uses
        const { data: updated, error: updateError } = await supabase
          .from("coupons")
          .update({ used_count: (coupon.used_count ?? 0) + 1 })
          .eq("code", coupon.code)
          .lte("used_count", (coupon.max_uses as number) - 1)
          .select("id");

        if (updateError || !updated?.length) {
          return { success: false, error: "Coupon is no longer available." };
        }
      } else {
        await supabase
          .from("coupons")
          .update({ used_count: (coupon.used_count ?? 0) + 1 })
          .eq("code", coupon.code);
      }
    } catch (err) {
      return { success: false, error: "Failed to reserve coupon." };
    }
  }

  const { error: insertError } = await supabase.from("orders").insert({
    id: orderId,
    customer_name: name,
    phone,
    address,
    city,
    district,
    landmark: landmark || null,
    building_number: buildingNumber || null,
    floor: floor || null,
    apartment: apartment || null,
    notes,
    payment_method: paymentMethod,
    payment_status: "pending",
    receipt_url: receiptUrl,
    subtotal,
    discount: walletDiscount,
    coupon_code: coupon?.code ?? null,
    coupon_discount: couponDiscount,
    total,
    items: orderItems,
    status: "new",
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  for (const item of cartItems) {
    const stockQty = item.stock_qty ?? null;
    if (stockQty !== null) {
      const nextStock = Math.max(stockQty - item.quantity, 0);
      await supabase.from("products").update({ stock_qty: nextStock }).eq("id", item.id);
    }
  }

  // coupon usage already reserved above before inserting the order

  const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const itemsDescription = cartItems
    .map((item) => `${item.name_en} x${item.quantity}`)
    .join(", ");

  const codAmount = paymentMethod === "cod" ? total : 0;
  const bostaDelivery = await createBostaDelivery({
    orderId,
    customerName: name,
    phone,
    notes,
    codAmount,
    goodsValue: subtotal,
    itemsCount,
    itemsDescription,
    address: {
      city,
      district,
      firstLine: address,
      secondLine: landmark || null,
      buildingNumber: buildingNumber || null,
      floor: floor || null,
      apartment: apartment || null,
    },
  });

  if (bostaDelivery) {
    const shippingState = bostaDelivery.error ? "failed" : bostaDelivery.state || null;
    await supabase
      .from("orders")
      .update({
        shipping_provider: "bosta",
        shipping_tracking_number: bostaDelivery.trackingNumber || null,
        shipping_reference: bostaDelivery.businessReference || null,
        shipping_state: shippingState,
        shipping_error: bostaDelivery.error || null,
      })
      .eq("id", orderId);
  }

  revalidatePath("/atelier");
  revalidatePath("/cart");
  revalidatePath("/products");

  return { success: true, orderId };
}
