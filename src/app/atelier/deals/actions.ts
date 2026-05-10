"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function getFlashUrl(token: string, flashCode: string) {
  const params = new URLSearchParams();
  params.set("admin_token", token);
  params.set("flash", flashCode);
  const kind = flashCode === "actionFailed" || flashCode === "missingData" ? "error" : "success";
  params.set("kind", kind);
  return `/atelier/deals?${params.toString()}`;
}

function readText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function readNumber(input: FormDataEntryValue | null, fallback: number | null = null) {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readBoolean(formData: FormData, name: string, fallback = false) {
  const values = formData.getAll(name).map((value) => String(value).trim().toLowerCase());
  if (values.length === 0) {
    return fallback;
  }
  return values.some((value) => value === "true" || value === "on" || value === "1");
}

export async function requireAdmin(formData: FormData): Promise<string> {
  const token = formData.get("admin_token");
  if (!token || typeof token !== "string") {
    redirect("/atelier?flash=actionFailed&kind=error");
  }
  return token;
}

export async function createDeal(formData: FormData) {
  const token = await requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  try {
    const dealType = readText(formData, "deal_type");
    const triggerProductIds = formData.getAll("trigger_product_ids").map(String);
    const applicableProductIds = formData.getAll("applicable_product_ids").map(String);
    const buyQuantity = readNumber(formData.get("buy_quantity"));
    const freeQuantity = readNumber(formData.get("free_quantity"));
    const isActive = readBoolean(formData, "is_active");
    const nameEn = readText(formData, "name_en");
    const nameAr = readText(formData, "name_ar");

    if (!dealType || !nameEn || !nameAr || !buyQuantity || !freeQuantity) {
      redirect(getFlashUrl(token, "missingData"));
    }

    if (dealType === "buy_x_of_product_get_y_free" && triggerProductIds.length === 0) {
      redirect(getFlashUrl(token, "missingData"));
    }

    if (applicableProductIds.length === 0) {
      redirect(getFlashUrl(token, "missingData"));
    }

    const { error } = await supabase.from("deals").insert({
      deal_type: dealType,
      trigger_product_ids: dealType === "buy_x_of_product_get_y_free" ? triggerProductIds : null,
      applicable_product_ids: applicableProductIds,
      buy_quantity: buyQuantity,
      free_quantity: freeQuantity,
      is_active: isActive,
      name_en: nameEn,
      name_ar: nameAr,
    });

    if (error) {
      redirect(getFlashUrl(token, "actionFailed"));
    }

    revalidatePath("/cart");
    revalidatePath("/atelier/deals");
    redirect(getFlashUrl(token, "dealCreated"));
  } catch {
    redirect(getFlashUrl(token, "actionFailed"));
  }
}

export async function updateDeal(formData: FormData) {
  const token = await requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  try {
    const dealId = readText(formData, "deal_id");
    const dealType = readText(formData, "deal_type");
    const triggerProductIds = formData.getAll("trigger_product_ids").map(String);
    const applicableProductIds = formData.getAll("applicable_product_ids").map(String);
    const buyQuantity = readNumber(formData.get("buy_quantity"));
    const freeQuantity = readNumber(formData.get("free_quantity"));
    const isActive = readBoolean(formData, "is_active");
    const nameEn = readText(formData, "name_en");
    const nameAr = readText(formData, "name_ar");

    if (!dealId || !dealType || !nameEn || !nameAr || !buyQuantity || !freeQuantity) {
      redirect(getFlashUrl(token, "missingData"));
    }

    if (dealType === "buy_x_of_product_get_y_free" && triggerProductIds.length === 0) {
      redirect(getFlashUrl(token, "missingData"));
    }

    if (applicableProductIds.length === 0) {
      redirect(getFlashUrl(token, "missingData"));
    }

    const { error } = await supabase
      .from("deals")
      .update({
        deal_type: dealType,
        trigger_product_ids: dealType === "buy_x_of_product_get_y_free" ? triggerProductIds : null,
        applicable_product_ids: applicableProductIds,
        buy_quantity: buyQuantity,
        free_quantity: freeQuantity,
        is_active: isActive,
        name_en: nameEn,
        name_ar: nameAr,
      })
      .eq("id", dealId);

    if (error) {
      redirect(getFlashUrl(token, "actionFailed"));
    }

    revalidatePath("/cart");
    revalidatePath("/atelier/deals");
    redirect(getFlashUrl(token, "dealUpdated"));
  } catch {
    redirect(getFlashUrl(token, "actionFailed"));
  }
}

export async function deleteDeal(formData: FormData) {
  const token = await requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  try {
    const dealId = readText(formData, "deal_id");

    if (!dealId) {
      redirect(getFlashUrl(token, "missingData"));
    }

    const { error } = await supabase.from("deals").delete().eq("id", dealId);

    if (error) {
      redirect(getFlashUrl(token, "actionFailed"));
    }

    revalidatePath("/cart");
    revalidatePath("/atelier/deals");
    redirect(getFlashUrl(token, "dealDeleted"));
  } catch {
    redirect(getFlashUrl(token, "actionFailed"));
  }
}

export async function toggleDealStatus(formData: FormData) {
  const token = await requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  try {
    const dealId = readText(formData, "deal_id");
    const isActive = readBoolean(formData, "is_active");

    if (!dealId) {
      redirect(getFlashUrl(token, "missingData"));
    }

    const { error } = await supabase
      .from("deals")
      .update({ is_active: !isActive })
      .eq("id", dealId);

    if (error) {
      redirect(getFlashUrl(token, "actionFailed"));
    }

    revalidatePath("/cart");
    revalidatePath("/atelier/deals");
    redirect(getFlashUrl(token, "dealToggled"));
  } catch {
    redirect(getFlashUrl(token, "actionFailed"));
  }
}
