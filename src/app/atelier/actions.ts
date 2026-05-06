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
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!nameEn || !slug) {
    return;
  }

  await supabase.from("categories").insert({
    name_en: nameEn,
    name_ar: nameAr,
    slug,
    season: season || null,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : null,
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
  const price = Number(formData.get("price") ?? 0);
  const image = formData.get("image") as File | null;

  if (!nameEn || !slug || !price) {
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
    price: Number.isFinite(price) ? price : 0,
    image_url: imageUrl,
    season: season || null,
    is_active: true,
    featured: false,
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
