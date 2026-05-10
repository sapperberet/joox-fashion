"use server";

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createBostaDelivery } from "@/lib/bosta";
import { calculateDealsDiscount, calculateLineTotal } from "@/lib/cart";
import { getVariantPrice } from "@/lib/product-display";
import { siteConfig } from "@/lib/site-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CartCoupon, CartItem, Deal, ProductVariant } from "@/lib/types";

type SubmittedItem = {
  id: string;
  quantity: number;
  cart_key?: string;
  unit_price?: number;
  variant?: ProductVariant | null;
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
    const cart_key = String((entry as { cart_key?: unknown }).cart_key ?? "").trim();
    const unit_price = Number((entry as { unit_price?: unknown }).unit_price ?? NaN);
    const variant = parseVariant((entry as { variant?: unknown }).variant ?? null);
    if (!id || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }
    items.push({
      id,
      quantity: Math.floor(quantity),
      cart_key: cart_key || undefined,
      unit_price: Number.isFinite(unit_price) ? unit_price : undefined,
      variant,
    });
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

function parseVariant(input: unknown): ProductVariant | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const variant = input as Record<string, unknown>;
  const textValue = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
  const numberValue = (value: unknown) => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    id: textValue(variant.id),
    color: textValue(variant.color),
    size: textValue(variant.size),
    label_en: textValue(variant.label_en),
    label_ar: textValue(variant.label_ar),
    price: numberValue(variant.price),
    sale_price: numberValue(variant.sale_price),
    sale_percent: numberValue(variant.sale_percent),
    image_url: textValue(variant.image_url),
    stock_qty: numberValue(variant.stock_qty),
    sku: textValue(variant.sku),
  };
}

async function resolveCoupon(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  code: string | null,
  subtotal: number,
  customerEmail: string | null,
): Promise<{
  coupon: (CartCoupon & { id?: string; max_uses?: number | null; used_count?: number | null }) | null;
  couponDiscount: number;
  requiresClaim: boolean;
}> {
  if (!code) {
    return { coupon: null, couponDiscount: 0, requiresClaim: false };
  }

  const now = new Date();
  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, type, value, min_subtotal, max_uses, used_count, starts_at, expires_at, is_active")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return { coupon: null, couponDiscount: 0, requiresClaim: false };
  }

  if (typeof data.max_uses === "number" && (data.used_count ?? 0) >= data.max_uses) {
    return { coupon: null, couponDiscount: 0, requiresClaim: false };
  }

  if (data.starts_at && new Date(data.starts_at) > now) {
    return { coupon: null, couponDiscount: 0, requiresClaim: false };
  }

  if (data.expires_at && new Date(data.expires_at) < now) {
    return { coupon: null, couponDiscount: 0, requiresClaim: false };
  }

  const { data: requirement } = await supabase
    .from("coupon_requirements")
    .select("min_score, min_spend")
    .eq("coupon_id", data.id)
    .maybeSingle();

  if (requirement) {
    if (!customerEmail) {
      return { coupon: null, couponDiscount: 0, requiresClaim: true };
    }

    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("points, score")
      .eq("email", customerEmail)
      .maybeSingle();

    const score = Number(profile?.score ?? 0);
    const spend = Number(profile?.points ?? 0) * 10;
    const minScore = Number(requirement.min_score ?? 0);
    const minSpend = Number(requirement.min_spend ?? 0);

    if (score < minScore || spend < minSpend) {
      return { coupon: null, couponDiscount: 0, requiresClaim: true };
    }
  }

  if (customerEmail) {
    const { data: claim } = await supabase
      .from("customer_coupon_claims")
      .select("id, used")
      .eq("coupon_id", data.id)
      .eq("email", customerEmail)
      .maybeSingle();

    if (!claim || claim.used) {
      return { coupon: null, couponDiscount: 0, requiresClaim: true };
    }
  }

  const coupon: (CartCoupon & { max_uses?: number | null; used_count?: number | null }) = {
    id: data.id,
    code: data.code,
    type: data.type,
    value: Number(data.value ?? 0),
    min_subtotal: data.min_subtotal ?? null,
    max_uses: data.max_uses ?? null,
    used_count: data.used_count ?? null,
    min_score: requirement?.min_score ?? 0,
    min_spend: requirement?.min_spend ?? 0,
    requires_claim: true,
  };

  const minSubtotal = coupon.min_subtotal ?? 0;
  if (subtotal < minSubtotal) {
    return { coupon: null, couponDiscount: 0, requiresClaim: Boolean(requirement) };
  }

  let couponDiscount = 0;
  if (coupon.type === "percent") {
    couponDiscount = (subtotal * coupon.value) / 100;
  } else if (coupon.type === "fixed") {
    couponDiscount = coupon.value;
  }

  couponDiscount = Math.max(0, Math.min(couponDiscount, subtotal));
  return { coupon, couponDiscount, requiresClaim: true };
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
  const customerEmail = String(formData.get("customer_email") ?? "").trim().toLowerCase() || null;

  const paymentMethod =
    (formData.get("payment_method") as "cod" | "wallet" | "instapay" | null) ?? "cod";

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
    .select("*")
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

    const selectedVariant = entry.variant ?? null;
    const selectedPrice =
      typeof entry.unit_price === "number" && Number.isFinite(entry.unit_price)
        ? entry.unit_price
        : getVariantPrice(dbProduct as never, selectedVariant as never);

    const item: CartItem = {
      id: dbProduct.id,
      cart_key: entry.cart_key || dbProduct.id,
      slug: dbProduct.slug,
      name_en: dbProduct.name_en,
      name_ar: dbProduct.name_ar,
      price: selectedPrice,
      image_url: selectedVariant?.image_url ?? dbProduct.image_url,
      variant: selectedVariant,
      variant_label: selectedVariant?.color || selectedVariant?.size ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ") : null,
      variant_color: selectedVariant?.color ?? null,
      variant_size: selectedVariant?.size ?? null,
      variant_image_url: selectedVariant?.image_url ?? null,
      variant_price: selectedVariant?.price ?? null,
      variant_sale_price: selectedVariant?.sale_price ?? null,
      variant_sale_percent: selectedVariant?.sale_percent ?? null,
      variant_sku: selectedVariant?.sku ?? null,
      quantity: entry.quantity,
      stock_qty: selectedVariant?.stock_qty ?? dbProduct.stock_qty,
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
  const { data: activeDeals } = await supabase
    .from("deals")
    .select("id, name_en, name_ar, deal_type, trigger_product_ids, applicable_product_ids, buy_quantity, free_quantity, is_active")
    .eq("is_active", true);

  const deals = (activeDeals ?? []) as Deal[];
  const dealDiscount = Math.min(calculateDealsDiscount(cartItems, deals), subtotal);
  const discountedSubtotal = Math.max(subtotal - dealDiscount, 0);

  const walletDiscount = paymentMethod === "wallet" ? discountedSubtotal * siteConfig.walletDiscount : 0;

  const submittedCouponCode = String(formData.get("coupon_code") ?? "").trim() || null;
  const { coupon, couponDiscount, requiresClaim } = await resolveCoupon(
    supabase,
    submittedCouponCode,
    discountedSubtotal,
    customerEmail,
  );

  if (submittedCouponCode && !coupon) {
    return {
      success: false,
      error: requiresClaim
        ? "Coupon claim or requirements are not valid for this account."
        : "Coupon is invalid or unavailable.",
    };
  }

  const total = Math.max(discountedSubtotal - walletDiscount - couponDiscount, 0);
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
    cart_key: item.cart_key,
    name_en: item.name_en,
    name_ar: item.name_ar,
    quantity: item.quantity,
    unit_price: item.price,
    line_total: line.total,
    variant: item.variant ?? null,
    image_url: item.variant_image_url ?? item.image_url,
  }));

  if (coupon?.code) {
    try {
      if (typeof coupon.max_uses === "number") {
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

    if (customerEmail && coupon.id) {
      await supabase
        .from("customer_coupon_claims")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("coupon_id", coupon.id)
        .eq("email", customerEmail)
        .eq("used", false);
    }
  }

  const { error: insertError } = await supabase.from("orders").insert({
    id: orderId,
    customer_name: name,
    customer_email: customerEmail,
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
    discount: walletDiscount + dealDiscount,
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

  const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const itemsDescription = cartItems
    .map((item) => `${item.name_en} x${item.quantity}`)
    .join(", ");

  if (paymentMethod === "cod") {
    const codAmount = total;
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
  }

  revalidatePath("/atelier");
  revalidatePath("/cart");
  revalidatePath("/products");

  return { success: true, orderId };
}
