"use server";

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/site-config";
import { createBostaDelivery } from "@/lib/bosta";

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
  const quantity = Number(formData.get("quantity") ?? 1);
  const productId = String(formData.get("product_id") ?? "");
  const estimatedTotal = Number(formData.get("estimated_total") ?? 0);
  const itemsDetail = String(formData.get("items_detail") ?? "").trim();

  if (!name || !phone || !city || !district || !address) {
    throw new Error("Missing required customer details.");
  }

  const orderId = randomUUID();
  let productData: {
    id: string;
    name_en: string;
    name_ar: string;
    price: number;
  } | null = null;

  if (productId) {
    const { data } = await supabase
      .from("products")
      .select("id, name_en, name_ar, price")
      .eq("id", productId)
      .single();
    if (data) {
      productData = data;
    }
  }

  if (!productData && (!itemsDetail || estimatedTotal <= 0)) {
    throw new Error("Missing order details.");
  }

  const subtotal = productData
    ? productData.price * Math.max(quantity, 1)
    : Math.max(estimatedTotal, 0);
  const discount =
    paymentMethod === "wallet" ? subtotal * siteConfig.walletDiscount : 0;
  const total = Math.max(subtotal - discount, 0);

  const items = productData
    ? [
        {
          product_id: productData.id,
          name_en: productData.name_en,
          name_ar: productData.name_ar,
          quantity: Math.max(quantity, 1),
          price: productData.price,
        },
      ]
    : [
        {
          custom: true,
          details: itemsDetail,
        },
      ];

  const itemsCount = productData ? Math.max(quantity, 1) : 1;
  const itemsDescription = productData
    ? `${productData.name_en} x${itemsCount}`
    : itemsDetail;

  let receiptUrl: string | null = null;
  const receiptFile = formData.get("receipt") as File | null;

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

  const { error } = await supabase.from("orders").insert({
    id: orderId,
    customer_name: name,
    phone,
    city,
    district,
    address,
    landmark: landmark || null,
    building_number: buildingNumber || null,
    floor: floor || null,
    apartment: apartment || null,
    notes,
    payment_method: paymentMethod,
    payment_status: "pending",
    receipt_url: receiptUrl,
    subtotal,
    discount,
    total,
    items,
    status: "new",
  });

  if (error) {
    throw new Error(error.message);
  }

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
    const shippingState = bostaDelivery.error
      ? "failed"
      : bostaDelivery.state || null;
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
  redirect(`/thank-you?order=${orderId}`);
}
